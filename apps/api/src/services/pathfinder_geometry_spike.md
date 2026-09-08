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

## Explicitly excluded

ASC, DSC, Moon and other bodies, paran lines, natal birthplace UI, location
ranking, Discovery, Analyze, Best Times, frontend rendering, HTTP endpoints,
persistence, caching, and production rollout.
