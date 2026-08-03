# Jyotish Engine — Backend API Specification

## Overview
FastAPI (Python) Vedic-astrology calculation engine. Swiss Ephemeris (sidereal, Lahiri
default). Base URL in dev: `http://localhost:8888`. Most calculation endpoints are public
(no auth); DB-backed endpoints (saved charts, CRM, profile) require a JWT Bearer token.

## Auth
- `POST /api/auth/register` — body {email, password, name, phone?, role?} → {token, user}
- `POST /api/auth/login` — body {email, password} → {token, user}
- Protected endpoints expect header `Authorization: Bearer <token>`.
- Business endpoints (CRM, profile, reports) require an active trial/paid plan (402 otherwise).

## Calculation engine (public, prefix /api/calc)
All accept POST JSON: {name, year, month, day, hour, minute, tz_offset, latitude, longitude, ayanamsa?}
- `POST /api/calc/chart` — natal chart: ascendant, 9 planets (sign, degree, nakshatra, pada, retrograde, dignity), house map. Sun for 2000-04-11 07:30 IST @19.03,73.03 → Pisces ~357.63°, Lagna Aries.
- `POST /api/calc/dasha` — Vimshottari mahadasha/antardasha (9 lords, 120-year cycle).
- `POST /api/calc/panchanga` — tithi, nakshatra, yoga, karana, vara, sunrise (sunrise-based).
- `POST /api/calc/ashtakavarga` — bhinna + sarvashtakavarga (SAV total always = 337).
- `POST /api/calc/varga` — divisional charts D1–D60.
- `POST /api/calc/yogas`, `/doshas`, `/compatibility`, `/synastry`, `/transit`, `/muhurta`, `/prashna`, and ~50 more classical routers.

## Expected behavior / invariants (correctness matters most)
- Planetary longitudes match reference software (Swiss Ephemeris) to arc-second.
- Sun and Moon are never retrograde; Rahu/Ketu always retrograde and exactly 180° apart.
- A planet's sign always equals floor(longitude / 30); nakshatra equals floor(longitude / 13.333°).
- Sarvashtakavarga total across 12 houses is always 337.
- Vimshottari mahadasha lords total 120 years; first 9 are 9 distinct lords.
- Rate limit: 60 calc requests/minute per IP → 429 when exceeded.
- Invalid/missing required fields → HTTP 422 with detail.

## Saved charts (auth required, prefix /api)
- `POST /api/charts/save` — persists a chart (requires Bearer). Free plan limited to 3 charts (403 beyond).
- `GET /api/charts/list` — user's charts (returns lat/long/tz/ayanamsa for correct reopen).
- `GET /api/charts/{id}`, `DELETE /api/charts/{id}`.

## Non-goals for this test run
- The rule-based interpretation engine (core/interpretation/) is not yet exposed via an
  endpoint — it is covered by the pytest suite, not the API surface.

## Success criteria
- Public calc endpoints return 200 with well-formed JSON for valid input, 422 for invalid.
- Auth flow issues a working JWT; protected endpoints reject missing/invalid tokens (401).
- Free-plan chart-save limit enforced (403 at the 4th chart).
