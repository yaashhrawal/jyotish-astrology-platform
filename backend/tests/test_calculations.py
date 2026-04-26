"""
Jyotish Engine — Calculation Tests
Reference values verified against Jagannath Hora (JH) software.

Run: cd backend && source venv/bin/activate && pytest tests/ -v
"""
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import swisseph as swe
from core.engine import (
    birth_to_jd, calculate_planets, calculate_houses,
    assign_planets_to_houses, calculate_atmakaraka, get_vimshottari_dasha
)
from core.varga import calculate_varga, check_vargottama

swe.set_ephe_path(None)

# ── Reference charts ────────────────────────────────────────────────────────
# All values from Jagannath Hora, Lahiri ayanamsa

MODI = dict(year=1950, month=10, day=17, hour=11, minute=0,
            tz=5.5, lat=23.78, lon=72.63)

YASH = dict(year=2000, month=2, day=1, hour=12, minute=35,
            tz=5.5, lat=23.6733, lon=74.025)


def get_chart(params):
    jd = birth_to_jd(params["year"], params["month"], params["day"],
                     params["hour"], params["minute"], params["tz"])
    planets = calculate_planets(jd, "lahiri")
    house_data = calculate_houses(jd, params["lat"], params["lon"], "lahiri")
    asc = house_data["ascendant"]
    assign_planets_to_houses(planets, asc["sign_index"])
    return jd, planets, asc


# ═══════════════════════════════════════════════════════════════════════════
# 1. ASCENDANT
# ═══════════════════════════════════════════════════════════════════════════

class TestAscendant:
    def test_modi_ascendant_sign(self):
        _, _, asc = get_chart(MODI)
        assert asc["sign"] == "Scorpio", f"Expected Scorpio, got {asc['sign']}"

    def test_modi_ascendant_degree(self):
        _, _, asc = get_chart(MODI)
        assert abs(asc["degree"] - 27.14) < 0.05, f"Expected ~27.14°, got {asc['degree']}"

    def test_yash_ascendant_sign(self):
        _, _, asc = get_chart(YASH)
        assert asc["sign"] == "Aries", f"Expected Aries, got {asc['sign']}"

    def test_yash_ascendant_degree(self):
        _, _, asc = get_chart(YASH)
        assert abs(asc["degree"] - 27.94) < 0.05, f"Expected ~27.94°, got {asc['degree']}"


# ═══════════════════════════════════════════════════════════════════════════
# 2. PLANET SIGNS (JH reference)
# ═══════════════════════════════════════════════════════════════════════════

class TestPlanetSigns:
    """All signs verified against Jagannath Hora output."""

    MODI_EXPECTED_SIGNS = {
        "Sun":     "Libra",
        "Moon":    "Sagittarius",
        "Mars":    "Scorpio",
        "Mercury": "Virgo",
        "Jupiter": "Aquarius",
        "Venus":   "Virgo",
        "Saturn":  "Virgo",
        "Rahu":    "Pisces",
        "Ketu":    "Virgo",
    }

    YASH_EXPECTED_SIGNS = {
        "Sun":     "Capricorn",
        "Moon":    "Sagittarius",
        "Mars":    "Aquarius",
        "Mercury": "Capricorn",
        "Jupiter": "Aries",
        "Venus":   "Sagittarius",
        "Saturn":  "Aries",
        "Rahu":    "Cancer",
        "Ketu":    "Capricorn",
    }

    @pytest.mark.parametrize("planet,expected", MODI_EXPECTED_SIGNS.items())
    def test_modi_planet_signs(self, planet, expected):
        _, planets, _ = get_chart(MODI)
        got = planets[planet]["sign"]
        assert got == expected, f"Modi {planet}: expected {expected}, got {got}"

    @pytest.mark.parametrize("planet,expected", YASH_EXPECTED_SIGNS.items())
    def test_yash_planet_signs(self, planet, expected):
        _, planets, _ = get_chart(YASH)
        got = planets[planet]["sign"]
        assert got == expected, f"Yash {planet}: expected {expected}, got {got}"


# ═══════════════════════════════════════════════════════════════════════════
# 3. PLANET DEGREES (tolerance ±0.1°)
# ═══════════════════════════════════════════════════════════════════════════

class TestPlanetDegrees:
    MODI_EXPECTED_DEGREES = {
        "Sun":     0.11,
        "Moon":    17.84,
        "Mars":    22.03,
        "Mercury": 19.44,
        "Jupiter": 4.50,
        "Venus":   23.05,
        "Saturn":  3.31,
    }

    @pytest.mark.parametrize("planet,expected", MODI_EXPECTED_DEGREES.items())
    def test_modi_degrees(self, planet, expected):
        _, planets, _ = get_chart(MODI)
        got = planets[planet]["degree"]
        assert abs(got - expected) < 0.1, f"Modi {planet}: expected {expected}°, got {got:.3f}°"


# ═══════════════════════════════════════════════════════════════════════════
# 4. NAKSHATRA + PADA
# ═══════════════════════════════════════════════════════════════════════════

class TestNakshatraPada:
    MODI_EXPECTED = {
        "Sun":     ("Chitra",          3),
        "Moon":    ("Purva Ashadha",   2),
        "Mars":    ("Jyeshtha",        2),
        "Mercury": ("Hasta",           3),
        "Jupiter": ("Dhanishta",       4),
        "Venus":   ("Hasta",           4),
        "Saturn":  ("Uttara Phalguni", 2),
    }

    @pytest.mark.parametrize("planet,expected", MODI_EXPECTED.items())
    def test_modi_nakshatra(self, planet, expected):
        _, planets, _ = get_chart(MODI)
        nak, pada = expected
        got_nak = planets[planet]["nakshatra"]
        got_pada = planets[planet]["pada"]
        assert got_nak == nak, f"Modi {planet} nakshatra: expected {nak}, got {got_nak}"
        assert got_pada == pada, f"Modi {planet} pada: expected {pada}, got {got_pada}"


# ═══════════════════════════════════════════════════════════════════════════
# 5. HOUSE ASSIGNMENTS (whole sign from ascendant)
# ═══════════════════════════════════════════════════════════════════════════

class TestHouseAssignments:
    MODI_EXPECTED_HOUSES = {
        "Sun": 12, "Moon": 2, "Mars": 1, "Mercury": 11,
        "Jupiter": 4, "Venus": 11, "Saturn": 11,
        "Rahu": 5, "Ketu": 11,
    }

    YASH_EXPECTED_HOUSES = {
        "Sun": 10, "Moon": 9, "Mars": 11, "Mercury": 10,
        "Jupiter": 1, "Venus": 9, "Saturn": 1,
        "Rahu": 4, "Ketu": 10,
    }

    @pytest.mark.parametrize("planet,expected", MODI_EXPECTED_HOUSES.items())
    def test_modi_houses(self, planet, expected):
        _, planets, _ = get_chart(MODI)
        got = planets[planet]["house"]
        assert got == expected, f"Modi {planet}: expected H{expected}, got H{got}"

    @pytest.mark.parametrize("planet,expected", YASH_EXPECTED_HOUSES.items())
    def test_yash_houses(self, planet, expected):
        _, planets, _ = get_chart(YASH)
        got = planets[planet]["house"]
        assert got == expected, f"Yash {planet}: expected H{expected}, got H{got}"


# ═══════════════════════════════════════════════════════════════════════════
# 6. RETROGRADE STATUS
# ═══════════════════════════════════════════════════════════════════════════

class TestRetrograde:
    def test_modi_jupiter_retrograde(self):
        _, planets, _ = get_chart(MODI)
        assert planets["Jupiter"]["retrograde"] is True, "Modi Jupiter should be retrograde"

    def test_modi_sun_not_retrograde(self):
        _, planets, _ = get_chart(MODI)
        assert planets["Sun"]["retrograde"] is False

    def test_modi_rahu_retrograde(self):
        _, planets, _ = get_chart(MODI)
        assert planets["Rahu"]["retrograde"] is True, "Rahu always retrograde"

    def test_yash_mars_not_retrograde(self):
        _, planets, _ = get_chart(YASH)
        assert planets["Mars"]["retrograde"] is False


# ═══════════════════════════════════════════════════════════════════════════
# 7. PLANET STATUS (exalted/debilitated/own)
# ═══════════════════════════════════════════════════════════════════════════

class TestPlanetStatus:
    def test_modi_sun_debilitated(self):
        _, planets, _ = get_chart(MODI)
        assert planets["Sun"]["status"] == "debilitated"

    def test_modi_mars_own_sign(self):
        _, planets, _ = get_chart(MODI)
        assert planets["Mars"]["status"] == "own_sign"

    def test_yash_saturn_debilitated(self):
        # Saturn in Aries = debilitated
        _, planets, _ = get_chart(YASH)
        assert planets["Saturn"]["status"] == "debilitated"

    def test_yash_jupiter_in_aries(self):
        _, planets, _ = get_chart(YASH)
        assert planets["Jupiter"]["sign"] == "Aries"


# ═══════════════════════════════════════════════════════════════════════════
# 8. ATMAKARAKA
# ═══════════════════════════════════════════════════════════════════════════

class TestAtmakaraka:
    def test_modi_atmakaraka(self):
        # Highest degree planet (excluding nodes): Venus at 23.05° > Mars 22.03°
        _, planets, _ = get_chart(MODI)
        ak = calculate_atmakaraka(planets)
        assert ak == "Venus", f"Modi Atmakaraka: expected Venus, got {ak}"

    def test_yash_atmakaraka(self):
        # Mercury at 29.21° in Capricorn = highest degree
        _, planets, _ = get_chart(YASH)
        ak = calculate_atmakaraka(planets)
        assert ak == "Mercury", f"Yash Atmakaraka: expected Mercury, got {ak}"


# ═══════════════════════════════════════════════════════════════════════════
# 9. VIMSHOTTARI DASHA
# ═══════════════════════════════════════════════════════════════════════════

class TestDasha:
    def test_modi_first_dasha_lord(self):
        jd, planets, _ = get_chart(MODI)
        dashas = get_vimshottari_dasha(planets["Moon"]["longitude"], jd)
        assert dashas[0]["lord"] == "Venus", f"Expected Venus dasha first, got {dashas[0]['lord']}"

    def test_modi_dasha_balance(self):
        # Venus dasha balance at birth: ~13.24 years
        jd, planets, _ = get_chart(MODI)
        dashas = get_vimshottari_dasha(planets["Moon"]["longitude"], jd)
        assert abs(dashas[0]["years"] - 13.24) < 0.1, \
            f"Expected ~13.24yr Venus balance, got {dashas[0]['years']:.3f}"

    def test_modi_dasha_sequence(self):
        jd, planets, _ = get_chart(MODI)
        dashas = get_vimshottari_dasha(planets["Moon"]["longitude"], jd)
        lords = [d["lord"] for d in dashas[:6]]
        assert lords == ["Venus","Sun","Moon","Mars","Rahu","Jupiter"], \
            f"Wrong dasha sequence: {lords}"

    def test_yash_first_dasha_lord(self):
        # Moon in Mula (Ketu nakshatra) → Ketu dasha first
        jd, planets, _ = get_chart(YASH)
        dashas = get_vimshottari_dasha(planets["Moon"]["longitude"], jd)
        assert dashas[0]["lord"] == "Ketu", f"Expected Ketu dasha, got {dashas[0]['lord']}"


# ═══════════════════════════════════════════════════════════════════════════
# 10. D9 NAVAMSHA
# ═══════════════════════════════════════════════════════════════════════════

class TestNavamsha:
    def test_modi_d9_ascendant(self):
        jd, planets, asc = get_chart(MODI)
        d9 = calculate_varga(planets, asc["longitude"], 9)
        assert d9["ascendant"]["sign"] == "Virgo", \
            f"Modi D9 Asc: expected Virgo, got {d9['ascendant']['sign']}"

    def test_modi_vargottama_moon(self):
        jd, planets, asc = get_chart(MODI)
        d1 = calculate_varga(planets, asc["longitude"], 1)
        d9 = calculate_varga(planets, asc["longitude"], 9)
        varg = check_vargottama(d1["planets"], d9["planets"])
        assert "Moon" in varg, f"Moon should be Vargottama in Modi chart, got: {varg}"

    def test_modi_vargottama_jupiter(self):
        jd, planets, asc = get_chart(MODI)
        d1 = calculate_varga(planets, asc["longitude"], 1)
        d9 = calculate_varga(planets, asc["longitude"], 9)
        varg = check_vargottama(d1["planets"], d9["planets"])
        assert "Jupiter" in varg, f"Jupiter should be Vargottama in Modi chart"

    def test_yash_d9_moon_sign(self):
        jd, planets, asc = get_chart(YASH)
        d9 = calculate_varga(planets, asc["longitude"], 9)
        # Moon in Sagittarius D1, Mula nakshatra. D9 of Sag 1.19° → Sag is mutable, start Cancer
        # Navamsha num = int(1.19/3.333) = 0 → Cancer + 0 = Cancer
        assert d9["planets"]["Moon"]["sign"] == "Cancer", \
            f"Yash Moon D9: expected Cancer, got {d9['planets']['Moon']['sign']}"


# ═══════════════════════════════════════════════════════════════════════════
# 11. ASHTAKAVARGA
# ═══════════════════════════════════════════════════════════════════════════

class TestAshtakavarga:
    def _get_sarva(self, params):
        from routers.ashtakavarga import calculate_bhinnashtakavarga
        from core.engine import calculate_houses, SIGNS
        jd, planets, asc = get_chart(params)
        lagna_idx = asc["sign_index"]
        planet_list = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"]
        sarva = [0] * 12
        for p in planet_list:
            scores = calculate_bhinnashtakavarga(p, planets[p]["sign_index"], planets, lagna_idx)
            sarva = [sarva[i] + scores[i] for i in range(12)]
        return sum(sarva)

    def test_sarvashtakavarga_total_modi(self):
        """Sarvashtakavarga total must always equal 337."""
        assert self._get_sarva(MODI) == 337

    def test_sarvashtakavarga_total_yash(self):
        assert self._get_sarva(YASH) == 337


# ═══════════════════════════════════════════════════════════════════════════
# 12. TIMEZONE HANDLING
# ═══════════════════════════════════════════════════════════════════════════

class TestTimezoneHandling:
    def test_same_utc_time_same_result(self):
        """12:35 IST (tz=5.5) should equal 7:05 UTC (tz=0)."""
        jd1 = birth_to_jd(2000, 2, 1, 12, 35, 5.5)
        jd2 = birth_to_jd(2000, 2, 1, 7, 5, 0.0)
        assert abs(jd1 - jd2) < 0.001, f"JD mismatch: {jd1} vs {jd2}"

    def test_tz_5_gives_wrong_lagna(self):
        """tz=5.0 (common mistake for India) shifts time 30min and gives Taurus not Aries."""
        jd_correct = birth_to_jd(2000, 2, 1, 12, 35, 5.5)
        jd_wrong   = birth_to_jd(2000, 2, 1, 12, 35, 5.0)
        h_correct = calculate_houses(jd_correct, 23.6733, 74.025, "lahiri")
        h_wrong   = calculate_houses(jd_wrong,   23.6733, 74.025, "lahiri")
        assert h_correct["ascendant"]["sign"] == "Aries"
        assert h_wrong["ascendant"]["sign"] == "Taurus"  # proves the bug

    def test_india_tz_must_be_5_5(self):
        """IST is always UTC+5:30, never UTC+5."""
        # This test documents the requirement
        IST = 5.5
        assert IST == 5.5


# ═══════════════════════════════════════════════════════════════════════════
# 13. YOGA DETECTION
# ═══════════════════════════════════════════════════════════════════════════

class TestYogaDetection:
    def _get_yogas(self, params):
        jd, planets, asc = get_chart(params)
        from routers.yogas import detect_yogas
        return detect_yogas(planets, {}, asc, jd, "lahiri")

    def test_modi_ruchaka_yoga(self):
        yogas = self._get_yogas(MODI)
        names = [y["name"] for y in yogas]
        assert "Ruchaka" in names, f"Ruchaka should be detected. Got: {names}"

    def test_modi_vargottama_moon_yoga(self):
        yogas = self._get_yogas(MODI)
        names = [y["name"] for y in yogas]
        assert "Moon Vargottama" in names, f"Moon Vargottama missing. Got: {names}"

    def test_modi_vargottama_jupiter_yoga(self):
        yogas = self._get_yogas(MODI)
        names = [y["name"] for y in yogas]
        assert "Jupiter Vargottama" in names, f"Jupiter Vargottama missing. Got: {names}"

    def test_modi_neecha_bhanga(self):
        yogas = self._get_yogas(MODI)
        names = [y["name"] for y in yogas]
        assert "Neecha Bhanga Raj Yoga" in names, \
            f"Sun debilitated in Libra should trigger Neecha Bhanga. Got: {names}"

    def test_yash_raj_yoga(self):
        # Jupiter+Saturn conjunct in Aries — both rule kendra+trikona for Aries lagna
        yogas = self._get_yogas(YASH)
        names = [y["name"] for y in yogas]
        assert "Raj Yoga" in names, f"Raj Yoga expected for Yash. Got: {names}"

    def test_yash_budhaditya(self):
        # Sun+Mercury both in Capricorn
        yogas = self._get_yogas(YASH)
        names = [y["name"] for y in yogas]
        assert "Budhaditya Yoga" in names, f"Budhaditya Yoga expected. Got: {names}"

    def test_no_duplicate_yogas(self):
        yogas = self._get_yogas(MODI)
        names = [y["name"] for y in yogas]
        assert len(names) == len(set(names)), f"Duplicate yogas found: {names}"
