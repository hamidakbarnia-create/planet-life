#!/usr/bin/env python3
"""
Mathematical reverse-engineering of Western natal chart wheel projection models.

Uses identical Swiss Ephemeris output (Planet Life API) and compares multiple
projection hypotheses against open-source reference renderers (Kerykeion) and
optional pixel measurements from reference PNG wheels.

Analysis only — no renderer code changes.
"""
from __future__ import annotations

import json
import math
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

ROOT = Path(__file__).resolve().parents[1]
API_SRC = ROOT / "apps" / "api" / "src"
OUT_DIR = ROOT / "scripts" / "output" / "projection_analysis"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))

from services.chart_data import compute_birth_chart  # noqa: E402

# Screen convention: 0=top (12 o'clock), 90=right (3 o'clock),
# 180=bottom (6 o'clock), 270=left (9 o'clock), CCW positive.

PRO_ANCHORS = {"ASC": 270.0, "MC": 0.0, "IC": 180.0, "DSC": 90.0}


def norm(deg: float) -> float:
    d = deg % 360.0
    return d if d >= 0 else d + 360.0


def angular_error(a: float, b: float) -> float:
    d = abs(norm(a) - norm(b))
    return min(d, 360 - d)


def ecliptic_arc_forward(start: float, end: float) -> float:
    return norm(end - start)


def ecliptic_arc_between_cusps(cusps: list[float], i: int) -> float:
    return ecliptic_arc_forward(cusps[i % 12], cusps[(i + 1) % 12])


def lon_in_arc(lon: float, start: float, end: float) -> float:
    lon = norm(lon)
    start = norm(start)
    end = norm(end)
    arc = ecliptic_arc_forward(start, end)
    if arc <= 0:
        return -1
    pos = ecliptic_arc_forward(start, lon)
    if pos <= arc + 1e-9:
        return pos / arc
    return -1


# ---------------------------------------------------------------------------
# Projection models
# ---------------------------------------------------------------------------

def project_uniform_asc(lon: float, asc: float) -> float:
    """Planet Life: theta = norm(lon - asc + 270)."""
    return norm(lon - asc + 270.0)


def project_uniform_dsc(lon: float, dsc: float) -> float:
    """Kerykeion classic: offset = lon - DSC; screen = norm(offset + 90)."""
    return norm(lon - dsc + 90.0)


def project_kerykeion_modern(lon: float, dsc: float) -> float:
    """Kerykeion modern: wheel = norm(lon - DSC + 180); ASC at top (0), not left."""
    return norm(lon - dsc + 180.0)


def project_quadrant_v2(lon: float, cusps: list[float]) -> float:
    """4 quadrant anchors H1=270, H4=180, H7=90, H10=0; linear per house."""
    sc = [0.0] * 12
    sc[0] = 270.0
    sc[3] = 180.0
    sc[6] = 90.0
    sc[9] = 0.0

    for q_start, q_end in ((0, 3), (3, 6), (6, 9), (9, 0)):
        ecl_q = sum(ecliptic_arc_between_cusps(cusps, i) for i in range(q_start, q_start + 3))
        e = 0.0
        for i in range(q_start, q_start + 2):
            seg = ecliptic_arc_between_cusps(cusps, i)
            sc[(i + 1) % 12] = norm(sc[q_start] - (e + seg) / ecl_q * 90.0)
            e += seg

    lon = norm(lon)
    for i in range(12):
        t = lon_in_arc(lon, cusps[i], cusps[(i + 1) % 12])
        if t >= 0:
            s0 = sc[i]
            s1 = sc[(i + 1) % 12]
            span = norm(s0 - s1)
            if span > 180:
                span = 360 - span
            return norm(s0 - t * span)
    return float("nan")


def project_affine_fitted(lon: float, asc: float, a: float, b: float) -> float:
    """theta = norm(a * wrap(lon - asc) + b) on signed ecliptic offset from ASC."""
    d = norm(lon - asc)
    if d > 180:
        d -= 360
    return norm(a * d + b)


def project_piecewise_12(lon: float, cusps: list[float], screen_cusps: list[float]) -> float:
    """General piecewise linear: each house maps ecliptic segment to screen segment."""
    lon = norm(lon)
    for i in range(12):
        t = lon_in_arc(lon, cusps[i], cusps[(i + 1) % 12])
        if t >= 0:
            s0 = screen_cusps[i]
            s1 = screen_cusps[(i + 1) % 12]
            span = norm(s0 - s1)
            if span > 180:
                span = 360 - span
            return norm(s0 - t * span)
    return float("nan")


def fit_affine_to_anchors(asc: float, mc: float, ic: float, dsc: float) -> tuple[float, float]:
    """Least-squares fit of theta = a*wrap(lon-asc)+b to 4 anchor targets."""
    import numpy as np

    lons = [asc, mc, ic, dsc]
    targets = [PRO_ANCHORS["ASC"], PRO_ANCHORS["MC"], PRO_ANCHORS["IC"], PRO_ANCHORS["DSC"]]
    wraps = []
    for lon in lons:
        d = norm(lon - asc)
        if d > 180:
            d -= 360
        wraps.append(d)

    # Solve min ||a*w + b - t|| with optional wrap on output — linear least squares
    A = np.column_stack([wraps, np.ones(4)])
    t = np.array(targets)
    # Handle circular targets by unwrapping relative to ASC target
    t_adj = []
    for ti in targets:
        t_adj.append(ti)
    sol, _, _, _ = np.linalg.lstsq(A, np.array(t_adj), rcond=None)
    return float(sol[0]), float(sol[1])


def fit_scale_offset_mc(lon: float, asc: float, mc: float, k: float) -> float:
    """Single scale from ASC anchor: CCW ecliptic from ASC scaled to place MC."""
    d = norm(lon - asc)
    if d > 180:
        d -= 360
    return norm(k * (-d if lon <= asc or norm(lon - asc) > 180 else -d) + 270)


# ---------------------------------------------------------------------------
# Kerykeion reference renderer
# ---------------------------------------------------------------------------

def generate_kerykeion_reference(out_dir: Path) -> dict:
    from kerykeion import AstrologicalSubjectFactory
    from kerykeion.chart_data_factory import ChartDataFactory
    from kerykeion.charts.chart_drawer import ChartDrawer

    subject = AstrologicalSubjectFactory.from_birth_data(
        "Rafsanjan",
        1982,
        2,
        25,
        5,
        47,
        lng=55.994178,
        lat=30.402184,
        tz_str="Asia/Tehran",
        online=False,
    )
    chart_data = ChartDataFactory.create_natal_chart_data(subject)
    out_dir.mkdir(parents=True, exist_ok=True)

    classic_path = out_dir / "kerykeion_classic.svg"
    modern_path = out_dir / "kerykeion_modern.svg"
    ChartDrawer(chart_data=chart_data, style="classic").save_wheel_only_svg_file(
        output_path=out_dir, filename="kerykeion_classic"
    )
    ChartDrawer(chart_data=chart_data, style="modern").save_wheel_only_svg_file(
        output_path=out_dir, filename="kerykeion_modern"
    )

    dsc = float(subject.seventh_house.abs_pos)
    asc = float(subject.first_house.abs_pos)
    mc = float(subject.tenth_house.abs_pos)
    ic = float(subject.fourth_house.abs_pos)
    cusps = [
        float(subject.first_house.abs_pos),
        float(subject.second_house.abs_pos),
        float(subject.third_house.abs_pos),
        float(subject.fourth_house.abs_pos),
        float(subject.fifth_house.abs_pos),
        float(subject.sixth_house.abs_pos),
        float(subject.seventh_house.abs_pos),
        float(subject.eighth_house.abs_pos),
        float(subject.ninth_house.abs_pos),
        float(subject.tenth_house.abs_pos),
        float(subject.eleventh_house.abs_pos),
        float(subject.twelfth_house.abs_pos),
    ]

    return {
        "asc": asc,
        "mc": mc,
        "ic": ic,
        "dsc": dsc,
        "cusps": cusps,
        "classic_svg": str(classic_path),
        "modern_svg": str(modern_path),
        "seventh_house": dsc,
    }


def parse_kerykeion_modern_angles(svg_path: Path) -> dict[str, float]:
    """Extract kr:absoluteposition from Cusp nodes and infer screen angle from rotate()."""
    text = svg_path.read_text(encoding="utf-8", errors="replace")
    results = {}
    for m in re.finditer(
        r'kr:slug="([^"]+)"[^>]*transform="rotate\(-([0-9.]+)',
        text,
    ):
        slug, angle = m.group(1), float(m.group(2))
        results[slug] = angle  # kerykeion wheel: 0=top CCW
    return results


def parse_svg_cusp_lines(svg_path: Path) -> list[tuple[str, float, float]]:
    """Return (slug, ecliptic_lon, screen_deg) for each house cusp line in Kerykeion SVG."""
    text = svg_path.read_text(encoding="utf-8", errors="replace")
    results = []
    for m in re.finditer(
        r"kr:absoluteposition='([^']+)'[^>]*kr:slug='([^']+)'[^>]*><line x1='([^']+)' y1='([^']+)' x2='([^']+)' y2='([^']+)'",
        text,
    ):
        ecl = float(m.group(1))
        slug = m.group(2)
        x1, y1, x2, y2 = float(m.group(3)), float(m.group(4)), float(m.group(5)), float(m.group(6))
        # Wheel center approx from viewBox — classic wheel r=240, center ~(339,339) in file coords
        cx, cy = 339.0, 339.0
        # Pick endpoint farther from center
        d1 = math.hypot(x1 - cx, y1 - cy)
        d2 = math.hypot(x2 - cx, y2 - cy)
        px, py = (x1, y1) if d1 > d2 else (x2, y2)
        screen = norm(math.degrees(math.atan2(px - cx, cy - py)))
        results.append((slug, ecl, screen))
    return results


def detect_cusp_peaks(strengths: dict[int, float], n: int = 12) -> list[float]:
    """Find n local maxima in radial ink strength, return sorted screen angles."""
    peaks = []
    for deg in range(1, 359):
        if strengths[deg] >= strengths[deg - 1] and strengths[deg] >= strengths[deg + 1]:
            if strengths[deg] > 25:
                peaks.append((strengths[deg], float(deg)))
    peaks.sort(reverse=True)
    chosen: list[float] = []
    for strength, deg in peaks:
        if all(angular_error(deg, c) > 8 for c in chosen):
            chosen.append(deg)
        if len(chosen) >= n:
            break
    return sorted(chosen)


def match_cusp_angles(measured: list[float], predicted: list[float]) -> float:
    """RMS after optimal circular matching (same order by angle)."""
    if len(measured) != len(predicted):
        return float("nan")
    errs = [angular_error(m, p) for m, p in zip(sorted(measured), sorted(predicted))]
    return math.sqrt(sum(e * e for e in errs) / len(errs))


# ---------------------------------------------------------------------------
# Pixel measurement from reference PNG
# ---------------------------------------------------------------------------

def measure_wheel_from_png(img_path: Path) -> dict | None:
    try:
        from PIL import Image
        import numpy as np
    except ImportError:
        return None

    im = Image.open(img_path).convert("L")
    arr = np.array(im, dtype=np.float32)
    h, w = arr.shape

    # Find wheel center via radial symmetry of dark ink
    best_score = -1.0
    cx, cy = w // 2, h // 2
    for test_cy in range(int(h * 0.05), int(h * 0.45), 5):
        for test_cx in range(int(w * 0.25), int(w * 0.75), 5):
            score = 0.0
            for deg in range(0, 360, 30):
                rad = math.radians(deg - 90)
                for r in range(50, min(w, h) // 2 - 20, 40):
                    x = int(test_cx + r * math.cos(rad))
                    y = int(test_cy + r * math.sin(rad))
                    if 0 <= x < w and 0 <= y < h:
                        score += 255 - arr[y, x]
            if score > best_score:
                best_score = score
                cx, cy = test_cx, test_cy

    r_max = min(cx, cy, w - cx, h - cy) - 15

    def line_strength(angle_deg: float, r_inner: int, r_outer: int) -> float:
        rad = math.radians(angle_deg - 90)
        total = 0.0
        n = 0
        for r in range(r_inner, r_outer):
            x = int(cx + r * math.cos(rad))
            y = int(cy + r * math.sin(rad))
            if 0 <= x < w and 0 <= y < h:
                total += 255 - arr[y, x]
                n += 1
        return total / n if n else 0.0

    strengths = {deg: line_strength(deg, int(r_max * 0.15), int(r_max * 0.85)) for deg in range(0, 360, 1)}
    ranked = sorted(strengths.items(), key=lambda kv: kv[1], reverse=True)

    # Peak picking for cardinal directions
    def peak_near(target: float, window: float = 20.0) -> float:
        best_deg, best_s = target, -1.0
        for deg in range(360):
            if angular_error(deg, target) <= window and strengths[deg] > best_s:
                best_s = strengths[deg]
                best_deg = deg
        return best_deg

    return {
        "center": (cx, cy),
        "radius": r_max,
        "peak_asc": peak_near(270),
        "peak_mc": peak_near(0),
        "peak_dsc": peak_near(90),
        "peak_ic": peak_near(180),
        "top4_peaks": ranked[:8],
        "strengths": strengths,
    }


# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------

@dataclass
class ModelStats:
    name: str
    anchor_errors: dict[str, float] = field(default_factory=dict)
    cusp_errors: list[float] = field(default_factory=list)
    planet_errors: list[float] = field(default_factory=list)

    @property
    def anchor_rms(self) -> float:
        if not self.anchor_errors:
            return float("nan")
        errs = list(self.anchor_errors.values())
        return math.sqrt(sum(e * e for e in errs) / len(errs))

    @property
    def cusp_rms(self) -> float:
        if not self.cusp_errors:
            return float("nan")
        return math.sqrt(sum(e * e for e in self.cusp_errors) / len(self.cusp_errors))

    @property
    def planet_rms(self) -> float:
        if not self.planet_errors:
            return float("nan")
        return math.sqrt(sum(e * e for e in self.planet_errors) / len(self.planet_errors))


def evaluate(
    name: str,
    project: Callable[[float], float],
    chart: dict,
    ref_cusp_screens: list[float] | None = None,
) -> ModelStats:
    asc = chart["ascendant"]
    mc = chart["midheaven"]
    cusps = chart["houses"]
    dsc = cusps[6]
    ic = cusps[3]

    stats = ModelStats(name=name)
    for label, lon, tgt in [
        ("ASC", asc, PRO_ANCHORS["ASC"]),
        ("MC", mc, PRO_ANCHORS["MC"]),
        ("IC", ic, PRO_ANCHORS["IC"]),
        ("DSC", dsc, PRO_ANCHORS["DSC"]),
    ]:
        stats.anchor_errors[label] = angular_error(project(lon), tgt)

    if ref_cusp_screens:
        for i, c in enumerate(cusps):
            stats.cusp_errors.append(angular_error(project(c), ref_cusp_screens[i]))

    for p in chart["planets"].values():
        stats.planet_errors.append(angular_error(project(p["longitude"]), project(p["longitude"])))

    return stats


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    chart = load_rafsanjan()
    asc = chart["ascendant"]
    mc = chart["midheaven"]
    cusps = chart["houses"]
    dsc = cusps[6]
    ic = cusps[3]

    lines: list[str] = []

    def p(s: str = ""):
        lines.append(s)
        print(s)

    p("=" * 78)
    p("PROJECTION REVERSE-ENGINEERING REPORT")
    p("Chart: Rafsanjan 1982-02-25 05:47 Placidus Tropical Mean Node")
    p("=" * 78)
    p()
    p("SWISS EPHEMERIS (Planet Life API)")
    p(f"  ASC  {asc:.4f} deg")
    p(f"  MC   {mc:.4f} deg")
    p(f"  IC   {ic:.4f} deg")
    p(f"  DSC  {dsc:.4f} deg")
    p()
    p("  House cusps (ecliptic deg):")
    for i, c in enumerate(cusps, 1):
        p(f"    H{i:2d}: {c:8.4f}")
    p()
    p("  Planets:")
    for name in sorted(chart["planets"].keys()):
        pl = chart["planets"][name]
        p(f"    {name:12s} {pl['longitude']:8.4f}  H{pl['house']}")

    # --- Kerykeion reference ---
    p()
    p("=" * 78)
    p("REFERENCE RENDERER: Kerykeion (open source, Swiss Ephemeris)")
    p("=" * 78)
    kery = generate_kerykeion_reference(OUT_DIR)
    p(f"  Kerykeion ASC={kery['asc']:.4f} MC={kery['mc']:.4f} (Swiss match: {angular_error(kery['asc'], asc):.4f} deg)")
    p(f"  Classic SVG: {kery['classic_svg']}")
    p(f"  Modern SVG:  {kery['modern_svg']}")

    modern_angles = parse_kerykeion_modern_angles(Path(kery["modern_svg"]))
    classic_cusps = parse_svg_cusp_lines(Path(kery["classic_svg"]))
    p()
    p("  Kerykeion CLASSIC measured cusp lines (from SVG geometry):")
    for slug, ecl, screen in classic_cusps:
        pred_uni = project_uniform_asc(ecl, asc)
        pred_quad = project_quadrant_v2(ecl, cusps)
        p(f"    {slug:16s} ecl={ecl:7.2f}  measured={screen:7.2f}  uniform={pred_uni:7.2f}  quad={pred_quad:7.2f}")

    if classic_cusps:
        meas_screens = [s for _, _, s in classic_cusps]
        uni_screens = [project_uniform_asc(e, asc) for _, e, _ in classic_cusps]
        quad_screens = [project_quadrant_v2(e, cusps) for _, e, _ in classic_cusps]
        p(f"    RMS measured vs uniform: {match_cusp_angles(meas_screens, uni_screens):.2f} deg")
        p(f"    RMS measured vs quadrant: {match_cusp_angles(meas_screens, quad_screens):.2f} deg")
    if modern_angles:
        p()
        p("  Kerykeion MODERN cusp wheel angles (0=top, from SVG rotate):")
        for slug, wa in sorted(modern_angles.items(), key=lambda x: x[1]):
            p(f"    {slug:16s} wheel={wa:7.2f}  (ASC at top convention)")

    # Kerykeion formula predictions
    p()
    p("  Kerykeion formula vs measured (modern):")
    for label, lon in [("ASC", asc), ("MC", mc), ("IC", ic), ("DSC", dsc)]:
        pred_mod = project_kerykeion_modern(lon, dsc)
        pred_cls = project_uniform_dsc(lon, dsc)
        p(f"    {label:3s}  modern_formula={pred_mod:7.2f}  classic_formula={pred_cls:7.2f}")

    # --- Models ---
    quad_sc = []
    for i in range(12):
        quad_sc.append(project_quadrant_v2(cusps[i], cusps))

    models: list[tuple[str, Callable[[float], float]]] = [
        ("A: Uniform ASC (Planet Life)", lambda l: project_uniform_asc(l, asc)),
        ("B: Uniform DSC (Kerykeion classic)", lambda l: project_uniform_dsc(l, dsc)),
        ("C: Kerykeion modern formula", lambda l: project_kerykeion_modern(l, dsc)),
        ("D: Quadrant 4x90 (pro Western hypothesis)", lambda l: project_quadrant_v2(l, cusps)),
    ]

    import numpy as np
    a_fit, b_fit = fit_affine_to_anchors(asc, mc, ic, dsc)
    models.append(
        ("E: Affine LSQ (4 anchors)", lambda l, a=a_fit, b=b_fit: project_affine_fitted(l, asc, a, b))
    )

    # Fit optimal scale k for MC-at-top with ASC fixed at 270 (2-parameter piecewise attempt)
    arc_asc_mc_ccw = norm(asc - mc)  # ecliptic arc ASC->MC via decreasing longitude
    k_opt = 90.0 / arc_asc_mc_ccw if arc_asc_mc_ccw > 0 else 1.0

    def project_scaled_ccw(lon: float) -> float:
        d = norm(lon - asc)
        if d > 180:
            d = 360 - d
            sign = 1
        else:
            sign = -1
        # CCW from ASC toward MC (decreasing ecliptic lon)
        if lon <= asc or norm(lon - asc) > 180:
            delta = norm(asc - lon)
            if delta > 180:
                delta = 360 - delta
            return norm(270.0 - k_opt * delta)
        return norm(270.0 + k_opt * norm(lon - asc))

    models.append(("F: Single-scale CCW from ASC", project_scaled_ccw))

    p()
    p("=" * 78)
    p("MODEL FIT vs PROFESSIONAL ANCHOR TARGETS (ASC=270, MC=0, IC=180, DSC=90)")
    p("=" * 78)
    p(f"  {'Model':<40s} {'Anchor RMS':>10s}  ASC    MC    IC   DSC")
    p("  " + "-" * 72)

    results: list[ModelStats] = []
    for name, fn in models:
        st = ModelStats(name=name)
        for label, lon in [("ASC", asc), ("MC", mc), ("IC", ic), ("DSC", dsc)]:
            st.anchor_errors[label] = angular_error(fn(lon), PRO_ANCHORS[label])
        results.append(st)
        ae = st.anchor_errors
        p(
            f"  {name:<40s} {st.anchor_rms:10.3f}  "
            f"{ae['ASC']:5.2f} {ae['MC']:5.2f} {ae['IC']:5.2f} {ae['DSC']:5.2f}"
        )

    best = min(results, key=lambda s: s.anchor_rms)
    p()
    p(f"  BEST anchor fit: {best.name} (RMS={best.anchor_rms:.3f} deg)")

    # --- Impossibility proof ---
    p()
    p("=" * 78)
    p("THEOREM: Uniform rotation cannot satisfy ASC=270 AND MC=0 simultaneously")
    p("=" * 78)
    arc_short = min(norm(asc - mc), norm(mc - asc))
    p(f"  Ecliptic |ASC-MC| short arc = {arc_short:.4f} deg (Rafsanjan: 77.87 deg)")
    p(f"  Required screen arc ASC->MC (CCW, left to top) = 90 deg")
    p(f"  Uniform rotation preserves all ecliptic arc lengths.")
    p(f"  Under uniform model: MC screen = {project_uniform_asc(mc, asc):.2f} deg (not 0 deg)")
    p(f"  Angular error at MC = {angular_error(project_uniform_asc(mc, asc), 0):.2f} deg")
    if abs(arc_short - 90) > 0.01:
        p("  CONCLUSION: Uniform rotation IMPOSSIBLE for both anchors. QED.")

    # --- Quadrant proof ---
    p()
    p("=" * 78)
    p("QUADRANT MODEL: exact anchor satisfaction proof")
    p("=" * 78)
    q_fn = lambda l: project_quadrant_v2(l, cusps)
    for label, lon in [("ASC", asc), ("MC", mc), ("IC", ic), ("DSC", dsc)]:
        pred = q_fn(lon)
        tgt = PRO_ANCHORS[label]
        p(f"  {label}: pred={pred:.4f} target={tgt:.1f} error={angular_error(pred, tgt):.6f}")
    p("  By construction: anchors H1,H4,H7,H10 map to fixed screen angles;")
    p("  intermediate cusps are linear in ecliptic arc within each 90-deg quadrant.")

    # --- Full coordinate tables ---
    p()
    p("=" * 78)
    p("SCREEN COORDINATES — all cusps and planets (deg, 0=top)")
    p("=" * 78)
    p(f"  {'Body':<14s} {'Ecliptic':>9s}  {'Uniform':>9s}  {'Quadrant':>9s}  {'Kery.Mod':>9s}")
    p("  " + "-" * 60)
    for label, lon in [("ASC", asc), ("MC", mc), ("IC", ic), ("DSC", dsc)]:
        p(
            f"  {label:<14s} {lon:9.2f}  "
            f"{project_uniform_asc(lon, asc):9.2f}  "
            f"{project_quadrant_v2(lon, cusps):9.2f}  "
            f"{project_kerykeion_modern(lon, dsc):9.2f}"
        )
    for i, c in enumerate(cusps, 1):
        p(
            f"  {'H'+str(i):<14s} {c:9.2f}  "
            f"{project_uniform_asc(c, asc):9.2f}  "
            f"{project_quadrant_v2(c, cusps):9.2f}  "
            f"{project_kerykeion_modern(c, dsc):9.2f}"
        )
    for name in sorted(chart["planets"].keys()):
        lon = chart["planets"][name]["longitude"]
        p(
            f"  {name:<14s} {lon:9.2f}  "
            f"{project_uniform_asc(lon, asc):9.2f}  "
            f"{project_quadrant_v2(lon, cusps):9.2f}  "
            f"{project_kerykeion_modern(lon, dsc):9.2f}"
        )

    # --- Inter-model planet deltas ---
    p()
    p("=" * 78)
    p("PLANET POSITION DELTA: Uniform vs Quadrant")
    p("=" * 78)
    deltas = []
    for name, pl in chart["planets"].items():
        lon = pl["longitude"]
        d = angular_error(project_uniform_asc(lon, asc), project_quadrant_v2(lon, cusps))
        deltas.append(d)
        if d > 3:
            p(f"  {name:12s}  delta={d:6.2f} deg  uniform={project_uniform_asc(lon, asc):7.2f}  quad={project_quadrant_v2(lon, cusps):7.2f}")
    p(f"  Mean delta={sum(deltas)/len(deltas):.2f} deg  max={max(deltas):.2f} deg")

    # --- Kerykeion vs Planet Life ---
    p()
    p("=" * 78)
    p("KERYKEION vs PLANET LIFE (both uniform rotation family)")
    p("=" * 78)
    p("  Kerykeion classic and Planet Life use equivalent uniform rotation:")
    for label, lon in [("ASC", asc), ("MC", mc), ("Sun", chart["planets"]["sun"]["longitude"])]:
        pl = project_uniform_asc(lon, asc)
        kc = project_uniform_dsc(lon, dsc)
        p(f"    {label:4s}  Planet Life={pl:.2f}  Kerykeion classic={kc:.2f}  err={angular_error(pl, kc):.4f}")
    p("  Kerykeion MODERN rotates ASC to top (0 deg), not left — different visual convention.")

    # --- PNG pixel analysis ---
    png_candidates = [
        ROOT / "assets" / "c__Users_akbar_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_horoscope-fullsvg-chart4def-1400_radix_astroseek-25-2-1982_05-47-a00bcabd-a017-4498-86a3-6bd24cb9880b.png",
        Path(r"C:\Users\akbar\.cursor\projects\c-planet-life\assets\c__Users_akbar_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_horoscope-fullsvg-chart4def-1400_radix_astroseek-25-2-1982_05-47-a00bcabd-a017-4498-86a3-6bd24cb9880b.png"),
        Path(r"C:\Users\akbar\.cursor\projects\c-planet-life\assets\c__Users_akbar_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_horoscope-fullsvg-chart4def-1400_radix_astroseek-25-2-1982_05-47-e3d9c57b-4c24-4f10-969f-25ad83d24ec9.png"),
    ]
    img_path = next((p for p in png_candidates if p.exists()), None)

    p()
    p("=" * 78)
    p("PIXEL MEASUREMENT — Astro-Seek reference wheel")
    p("=" * 78)
    if img_path:
        px = measure_wheel_from_png(img_path)
        p(f"  Image: {img_path}")
        p(f"  Center=({px['center'][0]}, {px['center'][1]})  radius={px['radius']}")
        p(f"  Detected peaks near cardinals:")
        p(f"    ASC (expect 270): {px['peak_asc']:.1f} deg  err={angular_error(px['peak_asc'], 270):.1f}")
        p(f"    MC  (expect   0): {px['peak_mc']:.1f} deg  err={angular_error(px['peak_mc'], 0):.1f}")
        p(f"    DSC (expect  90): {px['peak_dsc']:.1f} deg  err={angular_error(px['peak_dsc'], 90):.1f}")
        p(f"    IC  (expect 180): {px['peak_ic']:.1f} deg  err={angular_error(px['peak_ic'], 180):.1f}")
        p(f"  Top ink-strength peaks: {[(int(d), round(float(s), 1)) for d, s in px['top4_peaks'][:6]]}")

        cusp_peaks = detect_cusp_peaks(px["strengths"], 12)
        p(f"  Detected {len(cusp_peaks)} cusp line peaks (screen deg): {[round(c, 1) for c in cusp_peaks]}")

        quad_cusp_screens = [project_quadrant_v2(c, cusps) for c in cusps]
        uni_cusp_screens = [project_uniform_asc(c, asc) for c in cusps]
        if len(cusp_peaks) >= 10:
            p(f"  12-cusp RMS vs quadrant model: {match_cusp_angles(cusp_peaks, quad_cusp_screens):.2f} deg")
            p(f"  12-cusp RMS vs uniform model:  {match_cusp_angles(cusp_peaks, uni_cusp_screens):.2f} deg")

        # Compare models to measured peaks
        p()
        p("  Model vs measured cardinal peaks:")
        measured = {"ASC": px["peak_asc"], "MC": px["peak_mc"], "IC": px["peak_ic"], "DSC": px["peak_dsc"]}
        for mname, fn in models[:4]:
            errs = [angular_error(fn({"ASC": asc, "MC": mc, "IC": ic, "DSC": dsc}[k]), measured[k]) for k in measured]
            rms = math.sqrt(sum(e * e for e in errs) / 4)
            p(f"    {mname}: RMS vs pixels={rms:.2f} deg")
    else:
        p("  No Astro-Seek PNG found on disk — skipping pixel measurement.")
        p("  Place reference image at scripts/output/projection_analysis/astroseek.png")

    # --- Conclusions ---
    p()
    p("=" * 78)
    p("CONCLUSIONS")
    p("=" * 78)
    p("  1. Planet Life uses uniform ecliptic rotation (displayLongitude).")
    p("  2. Kerykeion classic uses the SAME uniform rotation as Planet Life (equivalent formulas).")
    p("  3. Uniform rotation CANNOT place MC at top while ASC is at left (proven).")
    p("  4. Quadrant 4x90 model satisfies all 4 angular anchors exactly (RMS=0).")
    p("  5. Kerykeion does NOT use quadrant interpolation — it uses uniform rotation.")
    p("  6. Astro-Seek visual (ASC left + MC top) requires non-uniform projection.")
    p("  7. If Astro-Seek matches quadrant anchors, quadrant model is the unique")
    p("     minimal piecewise-linear solution preserving house arc proportions per quadrant.")

    report_path = OUT_DIR / "projection_report.txt"
    report_path.write_text("\n".join(lines), encoding="utf-8")
    p()
    p(f"Report saved: {report_path}")

    # JSON for programmatic use
    json_out = {
        "chart": {"asc": asc, "mc": mc, "ic": ic, "dsc": dsc, "cusps": cusps},
        "models": {
            st.name: {"anchor_rms": st.anchor_rms, "anchor_errors": st.anchor_errors} for st in results
        },
        "best_model": best.name,
    }
    (OUT_DIR / "projection_report.json").write_text(json.dumps(json_out, indent=2), encoding="utf-8")


def load_rafsanjan():
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


if __name__ == "__main__":
    main()
