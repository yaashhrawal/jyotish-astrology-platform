"""
Career (10th house / Karma bhava) rule catalog — emits Factors from a computed chart.
Deterministic + sourced. Reuses engine dignity + Parashari aspects. No LLM.

Sources: BPHS Ch.11 (Bhavaviveka), Ch.21 (Karmajiva/10th results), Ch.40 (Dashamsha),
BPHS 3.12-3.14 (karakas — Sun/Saturn/Mercury/Jupiter as karma significators).
"""
from core.engine import SIGNS, SIGN_LORDS
from .factors import Factor
from .polarity import get_provider, _house_of_sign

TOPIC = "career"


def _ord(n: int) -> str:
    return f"{n}{'th' if 11 <= n % 100 <= 13 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')}"
# Natural significators of profession (karma karakas).
KARMA_KARAKAS = {
    "Sun": "authority, government, leadership, visibility",
    "Saturn": "service, labor, discipline, long-haul work",
    "Mercury": "commerce, communication, skilled/analytical work",
    "Jupiter": "advisory, teaching, law, ethics-led work",
}
# dignity → strength band (0..5) and polarity nudge
_DIGNITY_STRENGTH = {"exalted": 4.5, "own_sign": 3.8, "moolatrikona": 4.0,
                     "neutral": 2.5, "debilitated": 1.2}
_DIGNITY_POLARITY = {"exalted": +1, "own_sign": +1, "moolatrikona": +1,
                     "neutral": 0, "debilitated": -1}
_NATURE_POLARITY = {"yogakaraka": +1, "benefic": +1, "neutral": 0,
                    "malefic": -1, "functional_malefic": -1}
_NATURE_LABEL = {"yogakaraka": "yogakāraka (a top functional benefic)",
                 "benefic": "functional benefic", "neutral": "functionally neutral",
                 "malefic": "functional malefic", "functional_malefic": "strong functional malefic"}
_BENEFICS = {"Jupiter", "Venus", "Mercury", "Moon"}


def _lord_of_house(house_num: int, lagna_idx: int) -> str:
    sign_idx = (lagna_idx + house_num - 1) % 12
    return SIGN_LORDS[SIGNS[sign_idx]]


def _house_of_planet(planet: str, planets: dict, lagna_idx: int) -> int:
    return _house_of_sign(planets[planet]["sign_index"], lagna_idx)


# Jaimini chara karakas from the 7-planet scheme: highest degree-in-sign = Atmakaraka,
# 2nd = Amatyakaraka (the career/profession karaka).
_CHARA7 = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]


def _amatyakaraka(planets: dict) -> str:
    ranked = sorted(_CHARA7, key=lambda p: planets[p]["longitude"] % 30, reverse=True)
    return ranked[1] if len(ranked) > 1 else ranked[0]


def career_factors(planets: dict, lagna_idx: int, d10_planets: dict,
                   active_lords: set, aspects_on_10th: list = None,
                   sav_10th: int = None, scheme: str = "parashari") -> list:
    """Return the list of career Factors for a chart. All inputs precomputed & pure."""
    prov = get_provider(scheme)
    aspects_on_10th = aspects_on_10th or []
    F = []

    def dignity(p):
        return planets[p]["status"]

    # ── 1. 10th-house occupants ────────────────────────────────────────────
    tenth_sign_idx = (lagna_idx + 9) % 12
    for p, pd in planets.items():
        if pd["sign_index"] == tenth_sign_idx:
            dg = dignity(p)
            base = _DIGNITY_STRENGTH.get(dg, 2.5)
            pol = _DIGNITY_POLARITY.get(dg, 0)
            if pol == 0:
                pol = +1 if p in _BENEFICS else -1
            F.append(Factor(
                subject=f"{p} in 10th", topics=[TOPIC],
                claim=f"{p} occupies the 10th house ({dg})",
                polarity=pol, strength=round(base, 2),
                source="BPHS Ch.21 — Karma bhava results",
                conditions=[f"dignity:{dg}", "house:10"],
                dasha_active=p in active_lords,
            ))

    # ── 2. 10th lord — placement + dignity + functional nature ─────────────
    l10 = _lord_of_house(10, lagna_idx)
    l10_house = _house_of_planet(l10, planets, lagna_idx)
    l10_dig = dignity(l10)
    nat = prov.nature(l10, lagna_idx, planets)
    # placement quality: 10th lord in kendra/trikona = strong career; in dusthana = struggle
    place_pol = +1 if l10_house in {1, 4, 5, 7, 9, 10, 11} else (-1 if l10_house in {6, 8, 12} else 0)
    strength = _DIGNITY_STRENGTH.get(l10_dig, 2.5)
    F.append(Factor(
        subject="10th lord", topics=[TOPIC],
        claim=f"the 10th lord ({l10}) sits in the {_ord(l10_house)} house ({l10_dig})",
        polarity=place_pol if place_pol != 0 else _DIGNITY_POLARITY.get(l10_dig, 0),
        strength=round(strength + (0.5 if l10_house in {1, 10} else 0), 2),
        source="BPHS Ch.11 — house-lord placement",
        conditions=[f"lord_of:10", f"in_house:{l10_house}", f"dignity:{l10_dig}"],
        dasha_active=l10 in active_lords,
    ))
    F.append(Factor(
        subject="10th lord (nature)", topics=[TOPIC],
        claim=f"the 10th lord {l10} is a {_NATURE_LABEL.get(nat['nature'], nat['nature'])}",
        polarity=_NATURE_POLARITY.get(nat["nature"], 0),
        strength=3.5 if nat["nature"] == "yogakaraka" else 2.6,
        source=nat["source"], conditions=[f"functional:{nat['nature']}"],
        dasha_active=l10 in active_lords,
    ))

    # ── 3. Karma karakas (Sun/Saturn/Mercury/Jupiter) ─────────────────────
    for k, meaning in KARMA_KARAKAS.items():
        dg = dignity(k)
        base = _DIGNITY_STRENGTH.get(dg, 2.5)
        pol = _DIGNITY_POLARITY.get(dg, 0)
        F.append(Factor(
            subject=f"{k} (karaka)", topics=[TOPIC],
            claim=f"career-significator {k} is {dg} — {meaning}",
            polarity=pol, strength=round(base * 0.8, 2),   # karaka slightly below direct 10th factors
            source="BPHS 3.12-3.14 — graha karakatva",
            conditions=[f"karaka:career", f"dignity:{dg}"],
            dasha_active=k in active_lords,
        ))

    # ── 4. Dashamsha (D10) — the career divisional ────────────────────────
    if d10_planets:
        for k in dict.fromkeys(["Sun", "Saturn", l10]):   # dedupe if l10 is Sun/Saturn
            if k in d10_planets:
                d10_sign = SIGNS[d10_planets[k]["sign_index"]]
                F.append(Factor(
                    subject=f"{k} in D10", topics=[TOPIC],
                    claim=f"in the Dashamsha, {k} falls in {d10_sign}",
                    polarity=0, strength=2.2,
                    source="BPHS Ch.40 — Dashamsha (career divisional)",
                    conditions=["varga:D10"], dasha_active=k in active_lords,
                ))

    # ── 5. Aspects on the 10th house ──────────────────────────────────────
    # An aspect is supportive if the aspecting planet is the 10th lord (aspecting its
    # own house), functionally benefic/yogakaraka, or a natural benefic — else harmful.
    for asp in aspects_on_10th:
        p = asp.get("planet")
        if not p:
            continue
        p_nat = prov.nature(p, lagna_idx, planets)["nature"] if p not in ("Rahu", "Ketu") else "neutral"
        supportive = (p == l10) or (p_nat in ("benefic", "yogakaraka")) or (p in _BENEFICS)
        why = ("as the 10th lord aspecting its own house" if p == l10
               else ("a functional benefic" if p_nat in ("benefic", "yogakaraka")
                     else ("a natural benefic" if p in _BENEFICS else "a malefic influence")))
        F.append(Factor(
            subject=f"{p} aspect on 10th", topics=[TOPIC],
            claim=f"{p} casts its aspect on the 10th house ({why})",
            polarity=+1 if supportive else -1, strength=2.4 + (0.4 if p == l10 else 0),
            source="BPHS — graha drishti on karma bhava",
            conditions=["aspect:10th", f"planet:{p}", f"functional:{p_nat}"],
            dasha_active=p in active_lords,
        ))

    # ── 6. Amala yoga — benefic in the 10th from lagna or Moon → clean fame ─
    for p, pd in planets.items():
        if p in _BENEFICS and pd["sign_index"] == tenth_sign_idx:
            F.append(Factor(
                subject="Amala yoga", topics=[TOPIC],
                claim=f"a benefic ({p}) in the 10th forms Amala yoga — lasting good repute",
                polarity=+1, strength=3.2,
                source="Phaladeepika — Amala yoga",
                conditions=["yoga:amala"], dasha_active=p in active_lords,
            ))
            break

    # ── 7. Amatyakaraka (Jaimini career karaka) ───────────────────────────
    amk = _amatyakaraka(planets)
    amk_house = _house_of_planet(amk, planets, lagna_idx)
    amk_dig = dignity(amk)
    F.append(Factor(
        subject="Amatyakaraka", topics=[TOPIC],
        claim=f"the Amatyakaraka (career karaka) is {amk}, in the {_ord(amk_house)} house ({amk_dig})",
        polarity=_DIGNITY_POLARITY.get(amk_dig, 0) or (+1 if amk_house in {1, 10, 5, 9} else 0),
        strength=round(_DIGNITY_STRENGTH.get(amk_dig, 2.5) * 0.9, 2),
        source="Jaimini Sutras — chara karaka (Amatyakaraka = profession)",
        conditions=[f"jaimini:amatyakaraka", f"in_house:{amk_house}", f"dignity:{amk_dig}"],
        dasha_active=amk in active_lords,
    ))

    # ── 8. 10th from the Moon — career seen from the mind/public ──────────
    moon_idx = planets["Moon"]["sign_index"]
    tenth_from_moon = (moon_idx + 9) % 12
    l10_moon = SIGN_LORDS[SIGNS[tenth_from_moon]]
    for p, pd in planets.items():
        if pd["sign_index"] == tenth_from_moon and p not in ("Rahu", "Ketu"):
            F.append(Factor(
                subject=f"{p} in 10th-from-Moon", topics=[TOPIC],
                claim=f"{p} sits in the 10th from the Moon — corroborates a {('supportive' if p in _BENEFICS else 'demanding')} work theme",
                polarity=+1 if p in _BENEFICS else -1, strength=1.8,
                source="Parashari — chandra lagna cross-check",
                conditions=["from_moon:10"], dasha_active=p in active_lords,
            ))

    # ── 9. Parivartana (mutual exchange) involving the 10th lord ──────────
    l10_sign_idx = planets[l10]["sign_index"]
    disp = SIGN_LORDS[SIGNS[l10_sign_idx]]           # lord of the sign the 10th-lord sits in
    if disp != l10 and planets[disp]["sign_index"] == (lagna_idx + 9) % 12:
        # 10th lord in disp's sign AND disp in the 10th sign → mutual exchange
        F.append(Factor(
            subject="Parivartana (10th)", topics=[TOPIC],
            claim=f"a parivartana (exchange) links the 10th lord {l10} and {disp} — a strong, self-reinforcing career yoga",
            polarity=+1, strength=3.6,
            source="Phaladeepika — parivartana yoga",
            conditions=["yoga:parivartana"],
            dasha_active=(l10 in active_lords) or (disp in active_lords),
        ))

    # ── 10. Argala (intervention) on the 10th from 2nd/4th/11th from it ───
    argala_houses = {(9 + off) % 12 for off in (1, 3, 10)}  # 11th,1st,8th from lagna = 2/4/11 from 10th
    argala_planets = [p for p, pd in planets.items()
                      if pd["sign_index"] in {(lagna_idx + h) % 12 for h in argala_houses}]
    if argala_planets:
        benefic_argala = [p for p in argala_planets if p in _BENEFICS]
        if benefic_argala:
            F.append(Factor(
                subject="Argala on 10th", topics=[TOPIC],
                claim=f"benefic argala on the 10th from {', '.join(benefic_argala)} — supportive intervention on career",
                polarity=+1, strength=2.0,
                source="Jaimini — argala (intervention)",
                conditions=["argala:benefic"],
                dasha_active=any(p in active_lords for p in benefic_argala),
            ))

    # ── 11. Ashtakavarga strength of the 10th (optional) ───────────────────
    if sav_10th is not None:
        # SAV per house avg ~28; >30 strong, <25 weak
        pol = +1 if sav_10th >= 30 else (-1 if sav_10th <= 24 else 0)
        F.append(Factor(
            subject="10th SAV bindus", topics=[TOPIC],
            claim=f"the 10th house holds {sav_10th} Sarvashtakavarga bindus",
            polarity=pol, strength=2.0 + max(0, (sav_10th - 28)) * 0.1,
            source="BPHS — Sarvashtakavarga house strength",
            conditions=[f"sav:{sav_10th}"],
        ))

    return F
