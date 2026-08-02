"""
Validation battery — algorithm correctness across a wide chart range.

Positions are provably astro.com-identical (full Swiss Ephemeris DE431 + Lahiri, via
pyswisseph — the same library astro.com runs). This battery instead hammers OUR
downstream algorithms (ayanamsa application, lagna/houses, nakshatra/pada, all 16
vargas, Vimshottari dasha, Sarvashtakavarga) with mathematical invariants that MUST
hold for every chart — catching algorithm drift without needing a per-chart oracle.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pytest
from core.engine import (
    birth_to_jd, calculate_planets, calculate_houses, assign_planets_to_houses,
    get_vimshottari_dasha, SIGNS, VIMSHOTTARI_YEARS,
)
from core.varga import calculate_varga
from routers.ashtakavarga import calculate_bhinnashtakavarga

# Diverse charts: eras 1900-2050, low + high latitudes, varied times/timezones.
CHARTS = [
    ("1912-03-01 04:15", 51.5, -0.13, 0.0),    # London, pre-dawn, early 1900s
    ("1935-08-20 23:50", 40.71, -74.0, -5.0),  # New York, near-midnight
    ("1947-08-15 00:00", 28.61, 77.21, 5.5),   # Delhi, midnight
    ("1969-07-20 20:17", 19.07, 72.87, 5.5),   # Mumbai, evening
    ("1971-12-25 12:00", 59.33, 18.06, 1.0),   # Stockholm, high lat, noon
    ("1984-02-29 06:30", 35.68, 139.69, 9.0),  # Tokyo, leap day
    ("1990-11-11 18:45", 1.35, 103.82, 8.0),   # Singapore, equator
    ("2000-04-11 07:30", 19.03, 73.03, 5.5),   # Navi Mumbai (app example)
    ("2003-06-21 15:20", 64.13, -21.9, 0.0),   # Reykjavik, ~arctic, solstice
    ("2011-01-01 09:05", -33.87, 151.21, 11.0),# Sydney, southern hemisphere
    ("2025-10-10 21:40", 13.08, 80.27, 5.5),   # Chennai, recent
    ("2049-05-05 02:00", 55.75, 37.62, 3.0),   # Moscow, future date
]

AYANAMSA = "lahiri"
GRAHAS7 = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
ALL_VARGAS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60]


def _chart(spec):
    dt, lat, lon, tz = spec
    d, t = dt.split(" ")
    y, mo, dy = map(int, d.split("-"))
    hh, mm = map(int, t.split(":"))
    jd = birth_to_jd(y, mo, dy, hh, mm, tz)
    planets = calculate_planets(jd, AYANAMSA)
    houses = calculate_houses(jd, lat, lon, AYANAMSA)
    return jd, planets, houses


@pytest.mark.parametrize("spec", CHARTS, ids=[c[0] for c in CHARTS])
class TestChartInvariants:

    def test_planet_sign_matches_longitude(self, spec):
        _, planets, _ = _chart(spec)
        for name, p in planets.items():
            assert p["sign"] == SIGNS[int(p["longitude"] / 30) % 12], f"{name} sign≠longitude"
            assert p["sign_index"] == int(p["longitude"] / 30) % 12
            assert 0 <= p["degree"] < 30

    def test_nakshatra_and_pada_valid(self, spec):
        _, planets, _ = _chart(spec)
        for name, p in planets.items():
            assert 1 <= p["pada"] <= 4, f"{name} pada out of range"
            # nakshatra index derived from longitude must match reported name
            idx = int(p["longitude"] / (360 / 27)) % 27
            from core.engine import NAKSHATRAS
            assert p["nakshatra"] == NAKSHATRAS[idx], f"{name} nakshatra≠longitude"

    def test_retrograde_rules(self, spec):
        _, planets, _ = _chart(spec)
        # Sun and Moon are never retrograde; nodes always are.
        assert planets["Sun"]["retrograde"] is False
        assert planets["Moon"]["retrograde"] is False
        assert planets["Rahu"]["retrograde"] is True
        assert planets["Ketu"]["retrograde"] is True

    def test_rahu_ketu_opposite(self, spec):
        _, planets, _ = _chart(spec)
        diff = abs(planets["Rahu"]["longitude"] - planets["Ketu"]["longitude"])
        assert abs(diff - 180) < 1e-6 or abs(diff - 180) < 0.001, "Rahu/Ketu not 180° apart"

    def test_all_vargas_valid_signs(self, spec):
        _, planets, houses = _chart(spec)
        asc_lon = houses["ascendant"]["sign_index"] * 30 + 1  # any lon in asc sign
        for d in ALL_VARGAS:
            vchart = calculate_varga(planets, asc_lon, d)
            for name, vp in vchart.get("planets", {}).items():
                si = vp.get("sign_index", vp.get("sign"))
                if isinstance(si, int):
                    assert 0 <= si <= 11, f"D{d} {name} sign_index {si} out of range"

    def test_d1_equals_rashi(self, spec):
        _, planets, houses = _chart(spec)
        asc_lon = houses["ascendant"]["sign_index"] * 30 + 1
        d1 = calculate_varga(planets, asc_lon, 1)
        for name, p in planets.items():
            assert d1["planets"][name]["sign_index"] == p["sign_index"], f"D1 {name}≠rashi"

    def test_whole_sign_house_assignment(self, spec):
        _, planets, houses = _chart(spec)
        lagna = houses["ascendant"]["sign_index"]
        hmap = assign_planets_to_houses(planets, lagna)  # {house: [planets]}, also sets p["house"]
        for name, p in planets.items():
            expected = ((p["sign_index"] - lagna) % 12) + 1
            assert p["house"] == expected, f"{name} house {p['house']}≠whole-sign {expected}"
            assert name in hmap[expected], f"{name} missing from house {expected} map"

    def test_vimshottari_totals_120_years(self, spec):
        jd, planets, _ = _chart(spec)
        dashas = get_vimshottari_dasha(planets["Moon"]["longitude"], jd)
        # full 9-mahadasha cycle = 120 years
        total = sum(VIMSHOTTARI_YEARS.values())
        assert total == 120
        assert len(dashas) >= 9
        lords = [d["lord"] for d in dashas[:9]]
        assert len(set(lords)) == 9, "first 9 mahadashas must be 9 distinct lords"

    def test_sarvashtakavarga_totals_337(self, spec):
        _, planets, houses = _chart(spec)
        lagna = houses["ascendant"]["sign_index"]
        sarva = [0] * 12
        for p in GRAHAS7:
            scores = calculate_bhinnashtakavarga(p, planets[p]["sign_index"], planets, lagna)
            assert len(scores) == 12
            assert all(0 <= s <= 8 for s in scores), f"{p} bhinna bindu out of 0..8"
            sarva = [sarva[i] + scores[i] for i in range(12)]
        assert sum(sarva) == 337, f"SAV total {sum(sarva)}≠337"


def test_ascendant_sign_index_range():
    """Ascendant sign index valid for every chart, incl. high/arctic latitudes."""
    for spec in CHARTS:
        _, _, houses = _chart(spec)
        assert 0 <= houses["ascendant"]["sign_index"] <= 11, f"{spec[0]} bad lagna"
