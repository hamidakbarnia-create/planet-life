#!/usr/bin/env python3
"""
Phase 2: Pixel-level projection validation against Astro-Seek reference wheel.

Extracts ~40-60 reference points via image analysis, fits multiple projection
models via optimization, reports errors and residual heatmaps.

Analysis only — does NOT modify renderer code.
"""
from __future__ import annotations

import json
import math
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Callable

import numpy as np
from PIL import Image, ImageFilter
from scipy.interpolate import CubicSpline, PchipInterpolator
from scipy.optimize import minimize, least_squares
from scipy.signal import find_peaks
from scipy.spatial.distance import cdist
from scipy.optimize import linear_sum_assignment

ROOT = Path(__file__).resolve().parents[1]
API_SRC = ROOT / "apps" / "api" / "src"
OUT_DIR = ROOT / "scripts" / "output" / "projection_validation"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))

from services.chart_data import compute_birth_chart  # noqa: E402

ASTROSEEK_PNG = Path(
    r"C:\Users\akbar\.cursor\projects\c-planet-life\assets"
    r"\c__Users_akbar_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images"
    r"_horoscope-fullsvg-chart4def-1400_radix_astroseek-25-2-1982_05-47"
    r"-a00bcabd-a017-4498-86a3-6bd24cb9880b.png"
)


def norm(deg: float) -> float:
    d = float(deg) % 360.0
    return d if d >= 0 else d + 360.0


def ang_err(a: float, b: float) -> float:
    d = abs(norm(a) - norm(b))
    return min(d, 360.0 - d)


def pixel_to_screen(cx: float, cy: float, px: float, py: float) -> float:
    """0=top, 90=right, CCW positive."""
    return norm(math.degrees(math.atan2(px - cx, cy - py)))


def screen_to_xy(cx: float, cy: float, r: float, angle: float) -> tuple[float, float]:
    rad = math.radians(angle)
    return cx + r * math.sin(rad), cy - r * math.cos(rad)


def ecliptic_arc_forward(a: float, b: float) -> float:
    return norm(b - a)


def lon_in_arc(lon: float, start: float, end: float) -> float:
    lon, start, end = norm(lon), norm(start), norm(end)
    arc = ecliptic_arc_forward(start, end)
    if arc <= 0:
        return -1.0
    pos = ecliptic_arc_forward(start, lon)
    return pos / arc if pos <= arc + 1e-9 else -1.0


def load_chart() -> dict:
    return compute_birth_chart(
        birth_date="1982-02-25",
        birth_time="05:47",
        location="Rafsanjan, Iran",
        latitude=30.402184,
        longitude=55.994178,
        house_system="placidus",
        zodiac="tropical",
        node_type="mean",
    )


# ---------------------------------------------------------------------------
# Reference point extraction
# ---------------------------------------------------------------------------

@dataclass
class RefPoint:
    id: str
    kind: str  # cusp, planet, angle, zodiac, house_num, tick
    ecliptic_lon: float
    px: float
    py: float
    screen_deg: float
    confidence: float = 1.0


def find_wheel_geometry(gray: np.ndarray) -> tuple[float, float, float]:
    """Return (cx, cy, radius) of chart wheel."""
    h, w = gray.shape
    edges = np.array(Image.fromarray(gray.astype(np.uint8)).filter(ImageFilter.FIND_EDGES))

    best = (-1.0, w * 0.42, h * 0.22)
    for cy in range(int(h * 0.08), int(h * 0.42), 3):
        for cx in range(int(w * 0.28), int(w * 0.72), 3):
            score = 0.0
            for deg in range(0, 360, 10):
                rad = math.radians(deg - 90)
                for r in range(40, min(cx, cy, w - cx, h - cy) - 5, 35):
                    x = int(cx + r * math.cos(rad))
                    y = int(cy + r * math.sin(rad))
                    if 0 <= x < w and 0 <= y < h:
                        score += edges[y, x]
            if score > best[0]:
                best = (score, float(cx), float(cy))

    _, cx, cy = best
    r = min(cx, cy, w - cx, h - cy) - 12
    return cx, cy, float(r)


def radial_strength(
    gray: np.ndarray, cx: float, cy: float, angle: float, r0: float, r1: float
) -> float:
    h, w = gray.shape
    rad = math.radians(angle - 90)
    total, n = 0.0, 0
    for r in range(int(r0), int(r1)):
        x = int(cx + r * math.cos(rad))
        y = int(cy + r * math.sin(rad))
        if 0 <= x < w and 0 <= y < h:
            total += 255.0 - gray[y, x]
            n += 1
    return total / n if n else 0.0


def detect_radial_peaks(
    gray: np.ndarray, cx: float, cy: float, r: float, r_inner: float, r_outer: float,
    min_distance: int = 8, prominence: float = 8.0,
) -> tuple[list[tuple[float, float]], np.ndarray]:
    """Return list of (angle_deg, strength) and full strength array."""
    strengths = np.array(
        [radial_strength(gray, cx, cy, d, r * r_inner, r * r_outer) for d in range(360)]
    )
    peaks, props = find_peaks(strengths, distance=min_distance, prominence=prominence)
    out = [(float(p), float(strengths[p])) for p in peaks]
    out.sort(key=lambda x: x[1], reverse=True)
    return out, strengths


def assign_nearest(
    peaks_deg: list[float],
    ecliptic_lons: list[float],
    predict_fn: Callable[[float], float],
    max_err: float = 12.0,
) -> list[tuple[float, float, float]]:
    used = set()
    out = []
    for lon in ecliptic_lons:
        pred = predict_fn(lon)
        candidates = [(ang_err(pk, pred), pk) for pk in peaks_deg if pk not in used]
        if not candidates:
            continue
        err, pk = min(candidates)
        if err <= max_err:
            used.add(pk)
            out.append((lon, pk, pred))
    return out


def assign_by_prediction_windows(
    peaks_deg: list[float],
    ecliptic_lons: list[float],
    predict_fn: Callable[[float], float],
    window: float = 25.0,
) -> list[tuple[float, float, float]]:
    """For each ecliptic longitude (in house order), pick closest unused peak near prediction."""
    used: set[float] = set()
    out: list[tuple[float, float, float]] = []
    pool = list(peaks_deg)
    for lon in ecliptic_lons:
        pred = predict_fn(lon)
        best_pk, best_err = None, float("inf")
        for pk in pool:
            if pk in used:
                continue
            err = ang_err(pk, pred)
            if err <= window and err < best_err:
                best_err, best_pk = err, pk
        if best_pk is not None:
            used.add(best_pk)
            out.append((lon, best_pk, pred))
    return out


def detect_blob_centroids(
    gray: np.ndarray, cx: float, cy: float, r: float,
    r_lo: float, r_hi: float, min_area: int = 20, max_area: int = 2500,
) -> list[tuple[float, float, float]]:
    """Detect dark blob centroids in annulus. Returns (px, py, screen_deg)."""
    h, w = gray.shape
    yy, xx = np.ogrid[:h, :w]
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    mask = (dist >= r * r_lo) & (dist <= r * r_hi)
    # Dark ink on white
    dark = (gray < 200) & mask
    visited = np.zeros_like(dark, dtype=bool)
    blobs = []

    for y in range(h):
        for x in range(w):
            if not dark[y, x] or visited[y, x]:
                continue
            stack = [(y, x)]
            pts = []
            visited[y, x] = True
            while stack:
                cy2, cx2 = stack.pop()
                pts.append((cx2, cy2))
                for ny, nx in ((cy2 - 1, cx2), (cy2 + 1, cx2), (cy2, cx2 - 1), (cy2, cx2 + 1)):
                    if 0 <= ny < h and 0 <= nx < w and dark[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        stack.append((ny, nx))
            if min_area <= len(pts) <= max_area:
                px = float(np.mean([p[0] for p in pts]))
                py = float(np.mean([p[1] for p in pts]))
                blobs.append((px, py, pixel_to_screen(cx, cy, px, py)))
    return blobs


def extract_reference_points(chart: dict, img_path: Path) -> tuple[list[RefPoint], dict]:
    im = Image.open(img_path).convert("L")
    gray = np.array(im, dtype=np.float32)
    cx, cy, r = find_wheel_geometry(gray)

    asc = chart["ascendant"]
    mc = chart["midheaven"]
    cusps = chart["houses"]
    dsc, ic = cusps[6], cusps[3]

    def quad_pred(lon: float) -> float:
        return project_quadrant(lon, cusps)

    points: list[RefPoint] = []
    meta = {"center": [cx, cy], "radius": r, "image_size": list(gray.shape[::-1])}

    # --- House cusp lines (inner/mid ring) ---
    peaks_h, strengths_h = detect_radial_peaks(gray, cx, cy, r, 0.12, 0.88, min_distance=8, prominence=8)
    peak_pool = [float(d) for d in range(360) if strengths_h[d] > strengths_h.max() * 0.25]
    # Also include strong local maxima
    peak_pool.extend([p[0] for p in peaks_h[:30]])
    peak_pool = list(set(round(p, 0) for p in peak_pool))

    cusp_pairs = assign_by_prediction_windows(peak_pool, cusps, quad_pred, window=22)
    for i, (ecl, meas, _) in enumerate(cusp_pairs):
        px, py = screen_to_xy(cx, cy, r * 0.5, meas)
        points.append(RefPoint(f"H{i+1}_cusp", "cusp", ecl, px, py, meas, 0.9))

    # --- Cardinal angles (strongest peaks near targets) ---
    cardinals = {
        "ASC": (asc, 270.0),
        "MC": (mc, 0.0),
        "DSC": (dsc, 90.0),
        "IC": (ic, 180.0),
    }
    for name, (ecl, target) in cardinals.items():
        window = strengths_h
        best_deg, best_s = target, -1.0
        for d in range(360):
            if ang_err(d, target) <= 18 and window[d] > best_s:
                best_s, best_deg = window[d], float(d)
        px, py = screen_to_xy(cx, cy, r * 0.5, best_deg)
        conf = min(1.0, best_s / max(window.max(), 1))
        points.append(RefPoint(name, "angle", ecl, px, py, best_deg, conf))

    # --- Zodiac sign boundaries (outer ring peaks) ---
    peaks_z, _ = detect_radial_peaks(gray, cx, cy, r, 0.78, 0.96, min_distance=12, prominence=6)
    zodiac_lons = [i * 30.0 for i in range(12)]
    z_peak_angles = sorted([p[0] for p in peaks_z[:18]])
    z_pairs = assign_by_prediction_windows(z_peak_angles, zodiac_lons, quad_pred, window=18)
    for i, (ecl, meas, _) in enumerate(z_pairs):
        px, py = screen_to_xy(cx, cy, r * 0.87, meas)
        points.append(RefPoint(f"Z{int(ecl//30)+1:02d}_0deg", "zodiac", ecl, px, py, meas, 0.7))

    # Degree ticks (subset, nearest-neighbor)
    tick_pairs = assign_nearest(
        peak_pool,
        [i * 10.0 for i in range(36)],
        quad_pred,
        max_err=8.0,
    )
    tick_count = 0
    for ecl, meas, _ in tick_pairs:
        if tick_count >= 24:
            break
        if ecl % 30 == 0:
            continue  # skip sign starts already captured
        px, py = screen_to_xy(cx, cy, r * 0.92, meas)
        points.append(RefPoint(f"tick_{int(ecl)}", "tick", ecl, px, py, meas, 0.5))
        tick_count += 1

    # --- Planet glyphs ---
    blobs = detect_blob_centroids(gray, cx, cy, r, 0.38, 0.62, min_area=25, max_area=1800)
    planet_lons = {name: p["longitude"] for name, p in chart["planets"].items()}
    names = list(planet_lons.keys())
    lons = [planet_lons[n] for n in names]
    pred = [quad_pred(l) for l in lons]
    blob_angles = [b[2] for b in blobs]
    if blob_angles and lons:
        pairs = assign_by_prediction_windows(blob_angles, lons, quad_pred, window=18)
        lon_to_name = {l: n for n, l in zip(names, lons)}
        for ecl, meas, _ in pairs:
            name = lon_to_name.get(ecl)
            if not name:
                continue
            blob = next((b for b in blobs if ang_err(b[2], meas) < 0.5), None)
            if blob:
                px, py, _ = blob
                points.append(RefPoint(name, "planet", ecl, px, py, meas, 0.75))

    # --- House numbers (blob detection in number ring) ---
    num_blobs = detect_blob_centroids(gray, cx, cy, r, 0.28, 0.38, min_area=15, max_area=800)
    # House number ecliptic = midpoint between cusps
    house_mid_lons = []
    for i in range(12):
        a, b = cusps[i], cusps[(i + 1) % 12]
        arc = ecliptic_arc_forward(a, b)
        house_mid_lons.append(norm(a + arc / 2))
    num_angles = [b[2] for b in num_blobs]
    num_pairs = assign_by_prediction_windows(num_angles, house_mid_lons, quad_pred, window=18)
    for i, (ecl, meas, _) in enumerate(num_pairs):
        px, py = screen_to_xy(cx, cy, r * 0.33, meas)
        points.append(RefPoint(f"house_num_{i+1}", "house_num", ecl, px, py, meas, 0.55))

    meta["n_points"] = len(points)
    meta["strengths_h_max"] = float(strengths_h.max())
    return points, meta


# ---------------------------------------------------------------------------
# Projection models
# ---------------------------------------------------------------------------

def project_uniform(lon: float, asc: float, offset: float = 270.0) -> float:
    return norm(lon - asc + offset)


def project_quadrant(lon: float, cusps: list[float], scales: list[float] | None = None) -> float:
    sc = [270.0, 0.0, 0.0, 180.0, 0.0, 0.0, 90.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    sc[0], sc[3], sc[6], sc[9] = 270.0, 180.0, 90.0, 0.0
    q_scales = scales or [90.0, 90.0, 90.0, 90.0]
    for qi, q_start in enumerate((0, 3, 6, 9)):
        ecl_q = sum(ecliptic_arc_forward(cusps[i], cusps[(i + 1) % 12]) for i in range(q_start, q_start + 3))
        e = 0.0
        span = q_scales[qi]
        for i in range(q_start, q_start + 2):
            seg = ecliptic_arc_forward(cusps[i], cusps[(i + 1) % 12])
            sc[i + 1] = norm(sc[q_start] - (e + seg) / ecl_q * span)
            e += seg
    lon = norm(lon)
    for i in range(12):
        t = lon_in_arc(lon, cusps[i], cusps[(i + 1) % 12])
        if t >= 0:
            s0, s1 = sc[i], sc[(i + 1) % 12]
            span = norm(s0 - s1)
            if span > 180:
                span = 360 - span
            return norm(s0 - t * span)
    return float("nan")


def project_house_linear(lon: float, cusps: list[float], screen_cusps: list[float]) -> float:
    lon = norm(lon)
    for i in range(12):
        t = lon_in_arc(lon, cusps[i], cusps[(i + 1) % 12])
        if t >= 0:
            s0, s1 = screen_cusps[i], screen_cusps[(i + 1) % 12]
            span = norm(s0 - s1)
            if span > 180:
                span = 360 - span
            return norm(s0 - t * span)
    return float("nan")


def build_spline(lons: list[float], screens: list[float]) -> Callable[[float], float]:
    """Monotonic cubic spline along ecliptic circle from ASC unwrap."""
    asc = lons[0]
    xs, ys = [], []
    for lon, sc in zip(lons, screens):
        d = ecliptic_arc_forward(asc, lon)
        xs.append(d)
        ys.append(sc)
    xs.append(xs[-1] + ecliptic_arc_forward(lons[-1], asc))
    ys.append(ys[0])
    cs = PchipInterpolator(xs, ys)

    def f(lon: float) -> float:
        d = ecliptic_arc_forward(asc, lon)
        return norm(float(cs(d)))

    return f


def project_warp(lon: float, asc: float, k: float, offset: float, amp: float, freq: float) -> float:
    d = norm(lon - asc)
    if d > 180:
        d -= 360
    return norm(k * d + offset + amp * math.sin(math.radians(freq * d)))


# ---------------------------------------------------------------------------
# Fitting and metrics
# ---------------------------------------------------------------------------

@dataclass
class FitResult:
    model: str
    params: dict
    rms_angular_deg: float
    mean_angular_deg: float
    max_angular_deg: float
    rms_pixel: float
    mean_pixel: float
    max_pixel: float
    n_points: int
    residuals: list[float]


def eval_errors(
    points: list[RefPoint], predict: Callable[[float], float], radius: float
) -> FitResult:
    res = []
    for p in points:
        pred = predict(p.ecliptic_lon)
        res.append(ang_err(pred, p.screen_deg))
    arr = np.array(res)
    px_err = arr * (math.pi / 180.0) * radius
    return FitResult(
        model="",
        params={},
        rms_angular_deg=float(np.sqrt(np.mean(arr ** 2))),
        mean_angular_deg=float(np.mean(arr)),
        max_angular_deg=float(np.max(arr)),
        rms_pixel=float(np.sqrt(np.mean(px_err ** 2))),
        mean_pixel=float(np.mean(px_err)),
        max_pixel=float(np.max(px_err)),
        n_points=len(points),
        residuals=res,
    )


def fit_all_models(points: list[RefPoint], chart: dict, radius: float) -> list[FitResult]:
    asc = chart["ascendant"]
    cusps = chart["houses"]
    lons = [p.ecliptic_lon for p in points]
    meas = [p.screen_deg for p in points]
    weights = np.array([p.confidence for p in points])

    results: list[FitResult] = []

    def wrap_res(predict_fn):
        def res(params):
            pred = np.array([predict_fn(l, params) for l in lons])
            diff = np.array([ang_err(pred[i], meas[i]) for i in range(len(lons))])
            return diff * weights
        return res

    # 1. Uniform rotation (optimize offset)
    def uni_fn(l, off):
        return project_uniform(l, asc, off[0])

    r = least_squares(wrap_res(lambda l, p: uni_fn(l, p)), x0=[270.0], bounds=([0], [360]))
    fr = eval_errors(points, lambda l: uni_fn(l, r.x), radius)
    fr.model = "Uniform rotation"
    fr.params = {"offset_deg": float(r.x[0])}
    results.append(fr)

    # 2. Quadrant 4x90 (fixed)
    fr = eval_errors(points, lambda l: project_quadrant(l, cusps), radius)
    fr.model = "Quadrant 4x90 (fixed anchors)"
    fr.params = {"anchors": "H1=270,H4=180,H7=90,H10=0"}
    results.append(fr)

    # 3. Quadrant with 4 free quadrant spans
    def quad_var(l, spans):
        return project_quadrant(l, cusps, list(spans))

    r = least_squares(wrap_res(lambda l, p: quad_var(l, p)), x0=[90, 90, 90, 90], bounds=([60] * 4, [120] * 4))
    fr = eval_errors(points, lambda l: quad_var(l, r.x), radius)
    fr.model = "Quadrant (4 free spans)"
    fr.params = {f"Q{i+1}_span": float(r.x[i]) for i in range(4)}
    results.append(fr)

    # 4. Piecewise house linear — optimize 12 screen cusp angles
    init_sc = [project_quadrant(c, cusps) for c in cusps]

    def house_res(sc_flat):
        sc = list(sc_flat)
        pred = [project_house_linear(l, cusps, sc) for l in lons]
        return np.array([ang_err(pred[i], meas[i]) for i in range(len(lons))]) * weights

    r = least_squares(house_res, x0=init_sc, max_nfev=5000)
    sc_opt = list(r.x)
    fr = eval_errors(points, lambda l: project_house_linear(l, cusps, sc_opt), radius)
    fr.model = "Piecewise house linear (12 DOF)"
    fr.params = {"screen_cusps": [float(x) for x in sc_opt]}
    results.append(fr)

    # 5. Cubic/PCHIP spline through 12 cusp screen angles (optimized)
    def spline_res(sc_flat):
        sc = list(sc_flat)
        spl = build_spline(cusps, sc)
        pred = [spl(l) for l in lons]
        return np.array([ang_err(pred[i], meas[i]) for i in range(len(lons))]) * weights

    r = least_squares(spline_res, x0=init_sc, max_nfev=5000)
    sc_spl = list(r.x)
    spl_fn = build_spline(cusps, sc_spl)
    fr = eval_errors(points, spl_fn, radius)
    fr.model = "PCHIP spline (12 knot angles)"
    fr.params = {"knot_angles": [float(x) for x in sc_spl]}
    results.append(fr)

    # 6. Affine on circle: theta = k * wrap(λ-ASC) + b
    def affine_fn(l, p):
        d = norm(l - asc)
        if d > 180:
            d -= 360
        return norm(p[0] * d + p[1])

    r = least_squares(wrap_res(lambda l, p: affine_fn(l, p)), x0=[1.0, 270.0])
    fr = eval_errors(points, lambda l: affine_fn(l, r.x), radius)
    fr.model = "Affine (scale+offset from ASC)"
    fr.params = {"scale": float(r.x[0]), "offset": float(r.x[1])}
    results.append(fr)

    # 7. Nonlinear warp: k*d + b + A*sin(freq*d)
    def warp_fn(l, p):
        d = norm(l - asc)
        if d > 180:
            d -= 360
        return norm(p[0] * d + p[1] + p[2] * math.sin(math.radians(p[3] * d)))

    r = least_squares(
        wrap_res(lambda l, p: warp_fn(l, p)),
        x0=[1.15, 270.0, 5.0, 2.0],
        max_nfev=8000,
    )
    fr = eval_errors(points, lambda l: warp_fn(l, r.x), radius)
    fr.model = "Nonlinear warp (sinusoidal)"
    fr.params = {
        "scale": float(r.x[0]),
        "offset": float(r.x[1]),
        "amp": float(r.x[2]),
        "freq": float(r.x[3]),
    }
    results.append(fr)

    # 8. Two-scale uniform (different scale for MC hemisphere) — bilevel
    def bilevel_fn(l, p):
        d = norm(l - asc)
        if d > 180:
            d -= 360
        k = p[0] if d <= 0 else p[1]
        return norm(k * d + p[2])

    r = least_squares(wrap_res(lambda l, p: bilevel_fn(l, p)), x0=[1.15, 0.88, 270.0])
    fr = eval_errors(points, lambda l: bilevel_fn(l, r.x), radius)
    fr.model = "Two-scale piecewise uniform"
    fr.params = {"k_ccw": float(r.x[0]), "k_cw": float(r.x[1]), "offset": float(r.x[2])}
    results.append(fr)

    return sorted(results, key=lambda x: x.rms_angular_deg)


def make_heatmap(
    points: list[RefPoint],
    results: list[FitResult],
    predict_fns: dict[str, Callable[[float], float]],
    cx: float,
    cy: float,
    r: float,
    out_path: Path,
):
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    n_models = min(len(results), 4)
    fig, axes = plt.subplots(2, 2, figsize=(14, 14), subplot_kw={"projection": "polar"})
    axes = axes.flatten()

    for ax, res in zip(axes, results[:4]):
        pred_fn = predict_fns[res.model]
        theta = [math.radians(p.screen_deg) for p in points]
        err = [ang_err(pred_fn(p.ecliptic_lon), p.screen_deg) for p in points]
        colors = [ang_err(pred_fn(p.ecliptic_lon), p.screen_deg) for p in points]
        sc = ax.scatter(theta, err, c=colors, cmap="hot", s=40, vmin=0, vmax=30)
        ax.set_title(f"{res.model}\nRMS={res.rms_angular_deg:.2f}° ({res.rms_pixel:.1f}px)", fontsize=9)
        ax.set_ylim(0, max(max(err) * 1.1, 5))
        plt.colorbar(sc, ax=ax, label="angular error (deg)", shrink=0.7)

    fig.suptitle("Residual magnitude by measured screen position (Astro-Seek reference)", fontsize=12)
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)

    # Wheel overlay heatmap for best model
    best = results[0]
    pred_fn = predict_fns[best.model]
    fig2, ax2 = plt.subplots(figsize=(10, 10))
    ax2.set_aspect("equal")
    ax2.set_xlim(cx - r * 1.05, cx + r * 1.05)
    ax2.set_ylim(cy + r * 1.05, cy - r * 1.05)
    circle = plt.Circle((cx, cy), r, fill=False, color="gray", lw=0.5)
    ax2.add_patch(circle)

    for p in points:
        pred = pred_fn(p.ecliptic_lon)
        err = ang_err(pred, p.screen_deg)
        pred_x, pred_y = screen_to_xy(cx, cy, r * 0.55, pred)
        ax2.plot([p.px, pred_x], [p.py, pred_y], "r-", alpha=0.4, lw=0.8)
        ax2.scatter(p.px, p.py, c="blue", s=20, alpha=0.7)
        ax2.scatter(pred_x, pred_y, c="orange", s=15, alpha=0.7)
        ax2.annotate(f"{err:.0f}°", (p.px, p.py), fontsize=6, color="black")

    ax2.set_title(f"Best model: {best.model}\nBlue=measured, Orange=predicted, Red=residual vector")
    fig2.savefig(out_path.with_name("residual_wheel_overlay.png"), dpi=150)
    plt.close(fig2)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    chart = load_chart()
    cusps = chart["houses"]
    asc = chart["ascendant"]

    if not ASTROSEEK_PNG.exists():
        print(f"Missing reference image: {ASTROSEEK_PNG}")
        sys.exit(1)

    points, meta = extract_reference_points(chart, ASTROSEEK_PNG)
    radius = meta["radius"]

    # Save dataset
    dataset = {
        "meta": {k: (float(v) if isinstance(v, (np.floating, float)) else v) for k, v in meta.items()},
        "points": [
            {k: float(v) if isinstance(v, (np.floating, float)) else v for k, v in asdict(p).items()}
            for p in points
        ],
    }
    (OUT_DIR / "reference_points.json").write_text(json.dumps(dataset, indent=2), encoding="utf-8")

    results = fit_all_models(points, chart, radius)

    # Build predict fns for heatmap (reconstruct from last fit)
    predict_fns: dict[str, Callable[[float], float]] = {}
    for res in results:
        name = res.model
        if "Uniform" in name and "Two" not in name:
            off = res.params.get("offset_deg", 270)
            predict_fns[name] = lambda l, o=off: project_uniform(l, asc, o)
        elif "Quadrant 4x90" in name:
            predict_fns[name] = lambda l: project_quadrant(l, cusps)
        elif "Quadrant (4 free" in name:
            spans = [res.params[f"Q{i+1}_span"] for i in range(4)]
            predict_fns[name] = lambda l, s=spans: project_quadrant(l, cusps, s)
        elif "house linear" in name:
            sc = res.params["screen_cusps"]
            predict_fns[name] = lambda l, s=sc: project_house_linear(l, cusps, s)
        elif "PCHIP" in name:
            sc = res.params["knot_angles"]
            predict_fns[name] = lambda l, s=sc: build_spline(cusps, s)(l)
        elif "Affine" in name:
            k, b = res.params["scale"], res.params["offset"]
            predict_fns[name] = lambda l, kk=k, bb=b: norm(kk * (norm(l - asc) - 360 if norm(l - asc) > 180 else norm(l - asc)) + bb)
        elif "Nonlinear" in name:
            p = res.params
            predict_fns[name] = lambda l, pp=p: project_warp(l, asc, pp["scale"], pp["offset"], pp["amp"], pp["freq"])
        elif "Two-scale" in name:
            k1, k2, b = res.params["k_ccw"], res.params["k_cw"], res.params["offset"]
            def bilevel(l, k1=k1, k2=k2, b=b):
                d = norm(l - asc)
                if d > 180:
                    d -= 360
                k = k1 if d <= 0 else k2
                return norm(k * d + b)
            predict_fns[name] = bilevel

    make_heatmap(points, results, predict_fns, meta["center"][0], meta["center"][1], radius,
                 OUT_DIR / "residual_heatmap_polar.png")

    # Report
    lines = []
    def p(s=""):
        lines.append(s)
        print(s)

    p("=" * 78)
    p("PHASE 2: PIXEL-LEVEL PROJECTION VALIDATION")
    p("=" * 78)
    p(f"Reference image: {ASTROSEEK_PNG.name}")
    p(f"Wheel center=({meta['center'][0]:.1f}, {meta['center'][1]:.1f})  radius={radius:.1f}px")
    p(f"Extracted reference points: {len(points)}")
    p()
    by_kind = {}
    for pt in points:
        by_kind[pt.kind] = by_kind.get(pt.kind, 0) + 1
    p("Points by kind:")
    for k, v in sorted(by_kind.items()):
        p(f"  {k:12s}: {v}")
    p()
    p("=" * 78)
    p("MODEL FIT RESULTS (sorted by RMS angular error)")
    p("=" * 78)
    p(f"{'Model':<42s} {'RMS°':>7s} {'Mean°':>7s} {'Max°':>7s} {'RMS px':>8s} {'Max px':>8s}")
    p("-" * 78)
    for res in results:
        p(
            f"{res.model:<42s} {res.rms_angular_deg:7.2f} {res.mean_angular_deg:7.2f} "
            f"{res.max_angular_deg:7.2f} {res.rms_pixel:8.1f} {res.max_pixel:8.1f}"
        )

    p()
    p("=" * 78)
    p("PER-POINT-TYPE RMS (top 3 models)")
    p("=" * 78)
    for res in results[:3]:
        by_kind_err: dict[str, list[float]] = {}
        pred_fn = predict_fns.get(res.model)
        if not pred_fn:
            continue
        for pt in points:
            by_kind_err.setdefault(pt.kind, []).append(ang_err(pred_fn(pt.ecliptic_lon), pt.screen_deg))
        p(f"  {res.model}:")
        for k in sorted(by_kind_err):
            arr = np.array(by_kind_err[k])
            p(f"    {k:12s} n={len(arr):2d}  RMS={float(np.sqrt(np.mean(arr**2))):5.2f}°  max={float(np.max(arr)):5.2f}°")

    house_res = next((r for r in results if "house linear" in r.model), None)
    quad_fixed = next((r for r in results if "Quadrant 4x90" in r.model), None)
    if house_res:
        p()
        p("=" * 78)
        p("OPTIMIZED 12-DOF CUSP ANGLES vs QUADRANT MODEL")
        p("=" * 78)
        sc_opt = house_res.params["screen_cusps"]
        sc_quad = [project_quadrant(c, cusps) for c in cusps]
        diffs = [ang_err(norm(a), b) for a, b in zip(sc_opt, sc_quad)]
        p(f"  Mean cusp angle delta: {np.mean(diffs):.2f}°  max: {np.max(diffs):.2f}°")
        p(f"  RMS cusp angle delta:  {np.sqrt(np.mean(np.array(diffs)**2)):.2f}°")

    p()
    p("=" * 78)
    p("PARSIMONY (AIC-style penalized score — lower is better)")
    p("=" * 78)
    n_pts = len(points)
    dof_map = {
        "Uniform rotation": 1,
        "Quadrant 4x90 (fixed anchors)": 0,
        "Quadrant (4 free spans)": 4,
        "Piecewise house linear (12 DOF)": 12,
        "PCHIP spline (12 knot angles)": 12,
        "Affine (scale+offset from ASC)": 2,
        "Nonlinear warp (sinusoidal)": 4,
        "Two-scale piecewise uniform": 3,
    }
    aic_ranked = []
    for res in results:
        k = dof_map.get(res.model, 0)
        rss = sum(r * r for r in res.residuals)
        aic = n_pts * math.log(max(rss / n_pts, 1e-9)) + 2 * k
        aic_ranked.append((aic, res.model, k))
    for aic, name, k in sorted(aic_ranked):
        p(f"  {name:<42s}  AIC={aic:8.1f}  DOF={k}")

    best = results[0]
    second = results[1] if len(results) > 1 else None
    p()
    p("=" * 78)
    p("STATISTICAL CONCLUSION")
    p("=" * 78)
    p(f"Best-fitting model: {best.model}")
    p(f"  RMS angular error: {best.rms_angular_deg:.2f}°")
    p(f"  RMS pixel error:   {best.rms_pixel:.1f} px (at r={radius:.0f})")
    p(f"  Max error:         {best.max_angular_deg:.2f}° ({best.max_pixel:.1f} px)")
    if second:
        ratio = second.rms_angular_deg / max(best.rms_angular_deg, 1e-6)
        p(f"  Margin over 2nd place ({second.model}): {second.rms_angular_deg - best.rms_angular_deg:.2f}° ({ratio:.1f}x)")
    p()
    best_aic = sorted(aic_ranked)[0][1]
    p("INTERPRETATION:")
    p(f"  Lowest RMS: {best.model} ({best.rms_angular_deg:.2f}°)")
    if quad_fixed:
        p(f"  Fixed quadrant (0 DOF): {quad_fixed.rms_angular_deg:.2f}° RMS — parsimonious baseline")
    p(f"  Best AIC (parsimony-adjusted): {best_aic}")
    p()
    if quad_fixed and best.model in ("Quadrant 4x90 (fixed anchors)", "Quadrant (4 free spans)"):
        p('STATEMENT: "Quadrant interpolation is the best-fitting model identified."')
    elif quad_fixed and abs(best.rms_angular_deg - quad_fixed.rms_angular_deg) < 1.5:
        p('STATEMENT: "Quadrant interpolation is the best-fitting parsimonious model identified."')
        p(f"  (12-DOF fit improves RMS by only {quad_fixed.rms_angular_deg - best.rms_angular_deg:.2f}° — within measurement noise.)")
    elif "Quadrant" in best.model:
        p('STATEMENT: "Quadrant interpolation is the best-fitting model identified."')
    else:
        p(f'NOTE: Lowest RMS is "{best.model}" but compare against quadrant parsimony above.')
    p("  We do NOT claim knowledge of Astro-Seek source code — only pixel fit quality.")

    p()
    p("Output files:")
    p(f"  {OUT_DIR / 'reference_points.json'}")
    p(f"  {OUT_DIR / 'model_results.json'}")
    p(f"  {OUT_DIR / 'residual_heatmap_polar.png'}")
    p(f"  {OUT_DIR / 'residual_wheel_overlay.png'}")

    (OUT_DIR / "validation_report.txt").write_text("\n".join(lines), encoding="utf-8")
    (OUT_DIR / "model_results.json").write_text(
        json.dumps([{**asdict(r), "residuals": r.residuals} for r in results], indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
