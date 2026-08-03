"""
Golden snapshot regression tests.

Freezes the FULL computed output (lagna, every planet's sign/degree/nakshatra/retro,
whole-sign houses, D9 signs, first 3 Vimshottari dashas, Sarvashtakavarga) for a set of
reference charts into golden_snapshot.json. Any code change that silently alters a result
fails here with an exact diff — the primary defense against regressions in the calculation
software, not just the raw ephemeris.

To intentionally update after a *reviewed* change:  REGEN_GOLDEN=1 pytest tests/test_golden_snapshot.py
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pytest
from core.engine import (
    birth_to_jd, calculate_planets, calculate_houses,
    assign_planets_to_houses, get_vimshottari_dasha,
)
from core.varga import calculate_varga
from routers.ashtakavarga import calculate_bhinnashtakavarga

SNAP_PATH = os.path.join(os.path.dirname(__file__), "golden_snapshot.json")

# Reference charts (name, date, time, lat, lon, tz). Stable set — don't edit casually.
REFERENCE = {
    "delhi_indep_1947":  ("1947-08-15 00:00", 28.61, 77.21, 5.5),
    "navi_mumbai_2000":  ("2000-04-11 07:30", 19.03, 73.03, 5.5),
    "london_1912":       ("1912-03-01 04:15", 51.50, -0.13, 0.0),
    "sydney_2011":       ("2011-01-01 09:05", -33.87, 151.21, 11.0),
    "chennai_2025":      ("2025-10-10 21:40", 13.08, 80.27, 5.5),
}
GRAHAS7 = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]


def _snapshot(spec):
    dt, lat, lon, tz = spec
    d, t = dt.split(" ")
    y, mo, dy = map(int, d.split("-"))
    hh, mm = map(int, t.split(":"))
    jd = birth_to_jd(y, mo, dy, hh, mm, tz)
    planets = calculate_planets(jd, "lahiri")
    houses = calculate_houses(jd, lat, lon, "lahiri")
    lagna = houses["ascendant"]["sign_index"]
    assign_planets_to_houses(planets, lagna)
    d9 = calculate_varga(planets, lagna * 30 + 1, 9)
    dashas = get_vimshottari_dasha(planets["Moon"]["longitude"], jd)
    sav = [0] * 12
    for p in GRAHAS7:
        s = calculate_bhinnashtakavarga(p, planets[p]["sign_index"], planets, lagna)
        sav = [sav[i] + s[i] for i in range(12)]
    return {
        "lagna": houses["ascendant"]["sign"],
        "planets": {
            n: {
                "sign": p["sign"],
                "deg": round(p["degree"], 3),
                "nak": p["nakshatra"],
                "pada": p["pada"],
                "retro": p["retrograde"],
                "house": p["house"],
            } for n, p in planets.items()
        },
        "d9": {n: d9["planets"][n]["sign_index"] for n in planets if n in d9["planets"]},
        "dasha3": [d["lord"] for d in dashas[:3]],
        "sav_total": sum(sav),
    }


def _current():
    return {k: _snapshot(v) for k, v in REFERENCE.items()}


def test_golden_snapshot_matches():
    current = _current()
    if os.getenv("REGEN_GOLDEN") == "1" or not os.path.exists(SNAP_PATH):
        with open(SNAP_PATH, "w") as f:
            json.dump(current, f, indent=2, ensure_ascii=False)
        pytest.skip("golden snapshot (re)generated — commit golden_snapshot.json")
    with open(SNAP_PATH) as f:
        golden = json.load(f)
    # per-chart diff for readable failures
    for name in REFERENCE:
        assert current[name] == golden.get(name), (
            f"\nSNAPSHOT DRIFT for '{name}':\n"
            f"  expected: {json.dumps(golden.get(name), ensure_ascii=False)}\n"
            f"  got:      {json.dumps(current[name], ensure_ascii=False)}"
        )
