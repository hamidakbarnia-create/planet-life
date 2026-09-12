# Pathfinder geometry spike — Sun MC/IC only

## Purpose

Experimental backend spike that turns one public UTC instant into two
constant-longitude meridians: Sun MC and Sun IC. It exists so the mathematical
trace can be inspected before any ASC/DSC, other bodies, API, or map work.

## Non-production status

This is not production-validated astrocartography. It must not be described as
a shipped Pathfinder map, a Discovery ranking input, or a replacement for
relocation analysis. `status` is `experimental` and
`provenance.production_validated` is `false`.

## Mathematical convention (versioned, not locked)

- `schema_version = 1`
- `calculation_version = 1`
- Input: timezone-aware UTC datetime only. Naive datetimes and non-UTC offsets
  are rejected. They are not silently converted from a civil timezone.
- `JD_UT` from `swe.julday` with `GREG_CAL`.
- Greenwich apparent sidereal time: `GAST_hours = swe.sidtime(JD_UT)`,
  `GAST_deg = 15 × GAST_hours`.
- Sun position: `swe.calc_ut(JD_UT, SUN, requested_flags)`.
- Requested flags: `FLG_SWIEPH | FLG_EQUATORIAL` (apparent, geocentric,
  equatorial). `FLG_TRUEPOS` is not requested.
- Exact formulas:

```
longitude_mc = normalize(ra_deg - gast_deg)
longitude_ic = normalize(longitude_mc + 180)
```

- East-positive geographic longitude.
- Normalize into `(-180, 180]`. `-180` becomes `+180`.
- Finite RA/GAST values outside `0..360` are accepted; only their difference
  is normalized. Non-finite values (`NaN`, `±Inf`) are rejected before modulo.
- GeoJSON coordinates are `[longitude, latitude]`.

## Sign convention

Swiss Ephemeris geographic longitude is east-positive. The spike uses the same
sign. This is not the relocated ecliptic Midheaven.

## Requested versus actual ephemeris

The implementation records both requested flags and the flags Swiss Ephemeris
actually returned. It does not rewrite returned flags.

If `FLG_SWIEPH` is requested and the returned flags include `MOSEPH` or
`JPLEPH`, the result stays usable for this spike and records a fallback
warning. Returned flags are authoritative. Do not claim `SWIEPH` provenance
when the actual flags say otherwise.

This module does **not** call `swe.set_ephe_path`, `swe.close`, or any other
process-global Swiss Ephemeris configuration. It consumes whatever
configuration the process already has. Local snapshots may therefore show
MOSEPH when Swiss Ephemeris data files are absent. Production ephemeris
choice remains an owner decision.

## GAST versus GMST

`swe.sidtime(JD_UT)` is treated as Greenwich *apparent* sidereal time. An
independent IAU 1982 / Meeus *mean* GMST path is not used in this module. A
prior correction audit measured about `0.0044°` of longitude difference between
GAST and that mean formula at the public test instant. That residual is a
convention gap, not a hidden correction applied here.

## Apparent versus true position

The spike requests apparent geocentric equatorial coordinates (no
`FLG_TRUEPOS`). True-position RA differs and would move λ_MC. The two
conventions must be compared like-with-like in a later validation pass.

## Relocated ecliptic MC is not geographic MC

`swe.houses(...).ascmc[1]` is the ecliptic longitude of the Midheaven at one
Earth point. This spike never calls house functions. Geographic MC is the
meridian where local sidereal time equals the Sun's right ascension.

## Birthplace coordinates are not inputs when UTC is fixed

Global Sun MC/IC meridians at a known UTC depend on `JD_UT`, GAST, and solar
RA only. Birth latitude and longitude are not accepted. Changing birthplace
inside the same UTC instant does not change these meridians.

Street-level birth selection remains a separate profile and natal-house
concern, and a timezone-boundary risk when UTC is derived from a civil clock
plus a geocoded city. It is not a requirement of this spike.

## GeoJSON limits

Each line is a two-point `LineString` at latitudes `±89.999999` with constant
longitude. No intermediate curve points. No antimeridian stitching. Longitude
is not treated as meaningful at the exact poles.

## Limitations and validation still required

- Sun only; MC and IC only.
- One public test instant: `2020-06-21T12:00:00Z`.
- Local snapshot tolerances are for this pinned Python / pyswisseph build.
  They are not external astronomical validation and not cross-engine accuracy.
- The pure `(RA, GAST) → (MC, IC)` helper is an independent *transform* check,
  not an independent ephemeris.
- AstroClick Travel and Astro-Seek are not numerical proof for this spike.

## Explicitly excluded from the first checkpoint

Moon and other bodies, paran lines, natal birthplace UI, location ranking,
Discovery, Analyze, Best Times, frontend rendering, HTTP endpoints,
persistence, caching, and production rollout. ASC/DSC exist only as a second
experimental local function in this module.

## Sun ASC/DSC — experimental, not wired

`compute_sun_asc_dsc` is a separate function. It must not change
`compute_sun_mc_ic` output. `calculation_version` for ASC/DSC is `2`.
Line IDs are `spike.v1.sun.ASC` and `spike.v1.sun.DSC`.

This remains local experimental work. Swiss Ephemeris licensing is unresolved.
No ASC/DSC geometry may be deployed publicly pending owner licensing clearance.

### Horizon derivation

Geometric altitude:

```
sin(h) = sin(φ) sin(δ) + cos(φ) cos(δ) cos(H)
```

Provisional convention: `geometric_geocentric_altitude_zero` (`h = 0`).
No refraction, semidiameter, observer elevation, or topocentric parallax.

```
x = -tan(φ) tan(δ)
H0 = acos(x)          # radians internally; stored in degrees
```

Hour angle `H` is west-positive from the meridian (`H = LST − α`).
`LST = α + H`. East-positive longitude:

```
λ = normalize(α + H − GAST)
```

At `H = 0` this is the existing MC formula.

### Sign proof

At `h = 0`, `dh/dH = −cos(φ) cos(δ) sin(H)`. For ordinary latitudes
`cos(φ) cos(δ) > 0`:

- ASC uses `H = −H0` so `dh/dH > 0` (rising as time advances).
- DSC uses `H = +H0` so `dh/dH < 0` (setting as time advances).

A small earlier hour angle places the ASC body below the horizon and the DSC
body above it. The reverse holds slightly later. This is independent of
Swiss Ephemeris `azalt`.

### Critical latitudes and tangents

For nonzero declination, `φ_crit = 90° − |δ|`. `|x| = 1` at `φ = ±φ_crit`.
Those tangent solutions are included as curve endpoints unless they would be
an exact geographic pole.

Positive declination:

- northern tangent coincides with IC;
- southern tangent coincides with MC.

Negative declination reverses that pairing.

`|x| > 1 + 10⁻¹²` is not clamped. It is classified as continuously above or
continuously below from the meridian / lower-culmination altitudes.

`acos` is clamped only when `abs(abs(x) − 1) <= 1e-12`.

Exact geographic poles are excluded. If declination is so close to zero that
`φ_crit` would reach a pole, endpoints use the interior limit
`±89.999999` and a polar-endpoint warning is recorded.

### Adaptive sampling

Sampling is deterministic adaptive subdivision, not fixed latitude bands.

- Seeds (mandatory, never dropped by the interior budget): southern
  tangent endpoint, equator if interior, northern tangent endpoint.
- `max_points` is a **total vertex** budget. Mandatory seeds are reserved
  first. Only leftover slots are optional interior refinement vertices.
  A budget smaller than the mandatory count is rejected before geometry
  is emitted.
- Antimeridian cut endpoints are added after the unsplit curve and are
  not removed by interior-point accounting. Dedup cannot collapse a
  `+180/−180` pair at the same latitude.
- Order: south to north; south half of an interval is refined first.
- Refinement acceptance uses internal probes at **25%, 50%, and 75%** of
  each candidate latitude interval. Each probe compares the true horizon
  longitude with the longitude implied by the candidate edge using
  `wrapped_longitude_geographic_deg`. Errors are not averaged. The interval
  is accepted only when **every** probe is within `0.05°`.
- When any probe exceeds tolerance, the interval is split at the midpoint.
  Join: `left interiors + midpoint + right interiors`. The midpoint is
  kept exactly once.
- After the unsplit curve is assembled, a denser post-validation runs at
  **1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8** of every edge, wrap-safe, before
  antimeridian splitting. The result records probe count, maximum error,
  over-tolerance count, and the latitude/edge of the maximum.
- This finite probe set is the experimental **rendering** validation
  contract. It is not a formal mathematical proof of a global maximum
  interpolation error, and `0.05°` is not an exact line-distance or orb.
- Dedup removes only genuinely duplicate consecutive coordinates.

`geometry_complete` is true only when all of the following hold:

- no recursion-depth or point-budget limit was hit;
- every required endpoint/seed is present in the vertices;
- post-validation finds zero probes above `0.05°`;
- antimeridian segmentation succeeds;
- no invalid or empty segment is emitted.

Otherwise `geometry_complete` is false, a specific warning names the
failure, and the geometry is not described as tolerance-compliant.
Forced limits still keep both tangents and the equator, preserve
south-to-north order, and name only the limit that actually fired.

### Antimeridian root solving

When consecutive normalized longitudes jump more than 180°, the crossing
latitude is found by bracketed bisection of the actual ASC/DSC longitude
function. Linear longitude interpolation is not used as the crossing
definition.

Segment cuts use a separate convention that allows both `-180` and `+180` at
the same latitude. Interior vertices still follow `(-180, 180]`. This prevents
a false world-spanning bridge.

Output is a stable list of GeoJSON `LineString` segments per angle. Duplicate
consecutive vertices, one-point segments, and zero-length segments are omitted.

### Hard EQUATORIAL requirement

Before RA and declination are used for ASC/DSC:

- returned flags must include `EQUATORIAL`;
- RA and declination must be finite;
- declination must lie in `[-90°, +90°]`;
- actual ephemeris provenance must decode.

Missing `EQUATORIAL` or unresolved ephemeris is a hard failure. A
SWIEPH→MOSEPH fallback may remain an explicit warning when the returned
coordinates are still equatorial.

The module still does not call `set_ephe_path`, `close`, or `houses`.

### Limitations

- Sun only.
- Geometric horizon only.
- Finite 25/50/75 and 1/8 probe validation is a rendering contract, not a
  global-error proof and not an exact proximity/orb.
- Local snapshot / same-build SWE values, not external astronomical validation.
- AstroClick and similar maps are visual comparison only.
- Not production-validated astrocartography.
- Licensing hold: do not deploy this function on a public service.
