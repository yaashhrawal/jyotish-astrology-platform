"""
Verification against known reference values.
Run: source venv/bin/activate && python3 verify_calculations.py

Reference: Jagannatha Hora / astro-seek.com (Lahiri ayanamsa)
"""
import swisseph as swe
from core.engine import birth_to_jd, calculate_planets, calculate_houses, get_vimshottari_dasha, jd_to_datetime

swe.set_ephe_path(None)

# ── Test 1: Narendra Modi ──────────────────────────────────────
# Born: 17 Sep 1950, 11:00 AM IST, Vadnagar (23.78N, 72.63E)
# Reference (Lahiri): Sun=Leo, Moon=Scorpio (Anuradha), Asc=Libra
print("=" * 60)
print("TEST 1: Narendra Modi (17 Sep 1950, 11:00 IST, Vadnagar)")
print("=" * 60)

jd = birth_to_jd(1950, 9, 17, 11, 0, 5.5)
planets = calculate_planets(jd, "lahiri")
houses = calculate_houses(jd, 23.7835, 72.6369, "lahiri", "whole_sign")

print(f"Sun:     {planets['Sun']['sign']} {planets['Sun']['degree']:.2f}° (expect: Leo ~28°)")
print(f"Moon:    {planets['Moon']['sign']} {planets['Moon']['degree']:.2f}° (expect: Scorpio, Anuradha)")
print(f"Mars:    {planets['Mars']['sign']}")
print(f"Mercury: {planets['Mercury']['sign']}")
print(f"Jupiter: {planets['Jupiter']['sign']}")
print(f"Venus:   {planets['Venus']['sign']}")
print(f"Saturn:  {planets['Saturn']['sign']}")
print(f"Rahu:    {planets['Rahu']['sign']}")
print(f"Ketu:    {planets['Ketu']['sign']}")
print(f"Asc:     {houses['ascendant']['sign']} {houses['ascendant']['degree']:.2f}° (expect: Libra/Scorpio)")
print()

# ── Test 2: Albert Einstein ────────────────────────────────────
# Born: 14 Mar 1879, 11:30 AM, Ulm Germany (UTC+1)
# Reference (Lahiri): Sun=Aquarius, Moon=Sagittarius, Asc=Cancer
print("=" * 60)
print("TEST 2: Albert Einstein (14 Mar 1879, 11:30 LMT, Ulm)")
print("=" * 60)

jd2 = birth_to_jd(1879, 3, 14, 11, 30, 1.0)
planets2 = calculate_planets(jd2, "lahiri")
houses2 = calculate_houses(jd2, 48.4011, 10.0, "lahiri", "whole_sign")

print(f"Sun:     {planets2['Sun']['sign']} {planets2['Sun']['degree']:.2f}° (expect: Pisces ~29° tropical, Aquarius sidereal)")
print(f"Moon:    {planets2['Moon']['sign']} {planets2['Moon']['degree']:.2f}° (expect: Sagittarius)")
print(f"Asc:     {houses2['ascendant']['sign']} {houses2['ascendant']['degree']:.2f}° (expect: Cancer)")
print()

# ── Test 3: Ayanamsa spot check ────────────────────────────────
print("=" * 60)
print("TEST 3: Ayanamsa value spot check")
print("=" * 60)

swe.set_sid_mode(swe.SIDM_LAHIRI)
# J2000.0 epoch
jd_2000 = swe.julday(2000, 1, 1, 12.0)
ayan_2000 = swe.get_ayanamsa_ut(jd_2000)
print(f"Lahiri ayanamsa at J2000.0: {ayan_2000:.6f}° (expect: ~23.853°)")

jd_now = swe.julday(2024, 1, 1, 0.0)
ayan_now = swe.get_ayanamsa_ut(jd_now)
print(f"Lahiri ayanamsa at 2024-01-01: {ayan_now:.6f}° (expect: ~24.13°)")
print()

# ── Test 4: Vimshottari dasha sequence ────────────────────────
print("=" * 60)
print("TEST 4: Vimshottari dasha for Modi")
print("=" * 60)

dashas = get_vimshottari_dasha(planets['Moon']['longitude'], jd)
print("First 5 dashas:")
for d in dashas[:5]:
    start = jd_to_datetime(d['start_jd'])
    end = jd_to_datetime(d['end_jd'])
    print(f"  {d['lord']:8s} {d['years']:.2f}y  {start} → {end}")
print("(Moon in Anuradha = Shani/Saturn dasha start)")
print()

# ── Test 5: Nakshatra placement ───────────────────────────────
print("=" * 60)
print("TEST 5: Nakshatra consistency check")
print("=" * 60)
for name, p in planets.items():
    print(f"  {name:8s} {p['sign']:12s} {p['degree']:6.2f}°  {p['nakshatra']:20s} ({p['nakshatra_lord']}) pada {p['pada']}")

