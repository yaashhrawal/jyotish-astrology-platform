"""
Panchanga accuracy tests — reference values verified against Drik Panchang
(drikpanchang.com) for 15 January 2024, New Delhi (28.6139, 77.2090, IST +5:30).

Drik reference for that day/place:
  Sunrise 07:15 · Monday · Shukla Panchami
  Nakshatra Shatabhisha (till 08:07) · Yoga Variyana (till 23:11) · Karana Bava (till 15:35)
  Hora at 12:00 noon = Venus (Monday → Chaldean from Moon)
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import swisseph as swe
from core.engine import birth_to_jd
from routers.panchanga import (
    get_tithi, get_nakshatra_pada, get_yoga, get_karana, get_vara_sunrise,
    get_hora_schedule, _sun_rise_set, _sun_moon_sid_at, _next_transition, _jd_to_local_hm,
)


# 15 Jan 2024, New Delhi
Y, M, D, TZ = 2024, 1, 15, 5.5
LAT, LON = 28.6139, 77.2090
AZ = "lahiri"

def _sunrise_jd():
    return _sun_rise_set(birth_to_jd(Y, M, D, 0, 0, TZ), LAT, LON)[0]

def _at_sunrise():
    return _sun_moon_sid_at(_sunrise_jd(), AZ)


def _mm(hhmm):  # "08:07" -> minutes
    h, m = map(int, hhmm.split(":")); return h * 60 + m


class TestPanchangaVsDrik:
    def test_sunrise(self):
        t = _jd_to_local_hm(_sunrise_jd(), TZ)
        assert abs(_mm(t) - _mm("07:15")) <= 2, f"sunrise {t}, expected ~07:15"

    def test_vara_monday(self):
        vara, _ = get_vara_sunrise(Y, M, D, TZ, LAT, LON, birth_to_jd(Y, M, D, 12, 0, TZ))
        assert vara == "Monday", f"expected Monday, got {vara}"

    def test_tithi(self):
        s, m = _at_sunrise()
        _, name, paksha = get_tithi(s, m)
        assert (name, paksha) == ("Panchami", "Shukla"), f"got {paksha} {name}"

    def test_nakshatra_and_end(self):
        s, m = _at_sunrise()
        nak, _lord, _idx, _pada = get_nakshatra_pada(m)
        assert nak == "Shatabhisha", f"got {nak}"
        ends = _next_transition(_sunrise_jd(), AZ, lambda su, mo: mo % 360, 360/27, TZ)
        assert abs(_mm(ends) - _mm("08:07")) <= 2, f"nakshatra ends {ends}, expected ~08:07"

    def test_yoga_and_end(self):
        s, m = _at_sunrise()
        name, _ = get_yoga(s, m)
        assert name == "Variyan", f"got {name}"
        ends = _next_transition(_sunrise_jd(), AZ, lambda su, mo: (su + mo) % 360, 360/27, TZ)
        assert abs(_mm(ends) - _mm("23:11")) <= 3, f"yoga ends {ends}, expected ~23:11"

    def test_karana_and_end(self):
        s, m = _at_sunrise()
        name, _ = get_karana(s, m)
        assert name == "Bava", f"got {name}"
        ends = _next_transition(_sunrise_jd(), AZ, lambda su, mo: (mo - su) % 360, 6, TZ)
        assert abs(_mm(ends) - _mm("15:35")) <= 3, f"karana ends {ends}, expected ~15:35"

    def test_hora_noon_is_venus(self):
        jd_noon = birth_to_jd(Y, M, D, 12, 0, TZ)
        lord, _sched, _sun = get_hora_schedule(Y, M, D, TZ, LAT, LON, jd_noon)
        assert lord == "Venus", f"noon hora {lord}, expected Venus"

    def test_hora_first_of_day_is_moon(self):
        # Monday's first (sunrise) hora is ruled by the Moon (weekday lord).
        jd_sr = _sunrise_jd() + 1/1440  # 1 min after sunrise
        lord, _sched, _sun = get_hora_schedule(Y, M, D, TZ, LAT, LON, jd_sr)
        assert lord == "Moon", f"first hora {lord}, expected Moon"
