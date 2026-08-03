"""
Generic topic (bhāva) engine — the 23 refined rules, parameterized by a topic config
(house + karakas + authoritative varga). Career and every other life-area are just
configs; the reasoning is identical. Runs on D1 or, in varga-mode, on any divisional
chart (D1-only rule families are gated off — see `varga_mode`).

Deterministic, fully sourced. No LLM.
"""
from core.engine import SIGNS, SIGN_LORDS
from .factors import Factor
from .polarity import get_provider, _house_of_sign

_BENEFICS = {"Jupiter", "Venus", "Mercury", "Moon"}
_COMBUST_ORB = {"Moon": 12, "Mars": 17, "Mercury": 14, "Jupiter": 11, "Venus": 10, "Saturn": 15}
_DIGNITY_STRENGTH = {"exalted": 4.5, "own_sign": 3.8, "moolatrikona": 4.0,
                     "neutral": 2.5, "debilitated": 1.2}
_DIGNITY_POLARITY = {"exalted": +1, "own_sign": +1, "moolatrikona": +1,
                     "neutral": 0, "debilitated": -1}
_NATURE_POLARITY = {"yogakaraka": +1, "benefic": +1, "neutral": 0,
                    "malefic": -1, "functional_malefic": -1}
_NATURE_LABEL = {"yogakaraka": "yogakāraka (a top functional benefic)",
                 "benefic": "functional benefic", "neutral": "functionally neutral",
                 "malefic": "functional malefic", "functional_malefic": "strong functional malefic"}
_EXALT_IDX = {"Sun": 0, "Moon": 1, "Mars": 9, "Mercury": 5, "Jupiter": 3, "Venus": 11, "Saturn": 6}
_MKS = {"Sun": 12, "Moon": 8, "Mars": 7, "Mercury": 7, "Jupiter": 3, "Venus": 6, "Saturn": 1}
_CHARA7 = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
_MANGLIK_HOUSES = {1, 2, 4, 7, 8, 12}


def _ord(n):
    return f"{n}{'th' if 11 <= n % 100 <= 13 else {1:'st',2:'nd',3:'rd'}.get(n % 10,'th')}"


def _lord_of_house(house_num, lagna_idx):
    return SIGN_LORDS[SIGNS[(lagna_idx + house_num - 1) % 12]]


def _house_of_planet(planet, planets, lagna_idx):
    return _house_of_sign(planets[planet]["sign_index"], lagna_idx)


def _amatyakaraka(planets):
    r = sorted(_CHARA7, key=lambda p: planets[p]["longitude"] % 30, reverse=True)
    return r[1] if len(r) > 1 else r[0]


def _in_kendra(planet, planets, ref):
    return (((planets[planet]["sign_index"] - ref) % 12) + 1) in (1, 4, 7, 10)


def _neecha_bhanga(planet, planets, lagna_idx):
    if planets[planet]["status"] != "debilitated":
        return False
    deb = planets[planet]["sign_index"]
    disp = SIGN_LORDS[SIGNS[deb]]
    exalt_lord = next((p for p, i in _EXALT_IDX.items() if i == deb), None)
    moon = planets["Moon"]["sign_index"]
    return any(c and c in planets and (_in_kendra(c, planets, lagna_idx) or _in_kendra(c, planets, moon))
               for c in (disp, exalt_lord))


def _plain_effect(f, area: str) -> str:
    """A short, layperson 'what this means' line derived from the factor.
    Plain English, no jargon — the reading should explain itself."""
    c = " ".join(f.conditions)
    a = area
    # strongest/most specific rules first
    if "neecha_bhanga" in c:
        return f"An early weakness here turns around — struggle early in life converts into real rise later."
    if "mks" in c:
        return f"This planet is very weak in this spot, so it under-delivers for your {a}."
    if "combust" in c:
        return f"Sitting too close to the Sun dims this planet's good effects for your {a}."
    if "yoga:parivartana" in c:
        return f"Two rulers trade places — a strong, self-reinforcing boost to your {a}."
    if "yoga:amala" in c:
        return f"Points to a clean reputation and a lasting good name in this area."
    if "manglik" in c:
        return f"Mars adds friction and delay to marriage — best balanced by a partner with a similar placement."
    if "functional:yogakaraka" in c:
        return f"One of the very best planets for your chart — it strongly lifts your {a}."
    if "functional:benefic" in c:
        return f"A naturally helpful ruler for your {a}."
    if "functional_malefic" in c or "functional:malefic" in c:
        return f"A demanding ruler — your {a} is earned through effort, not handed over."
    if "argala:benefic" in c:
        return f"Extra support flows into your {a} from helpful planets nearby."
    if "aspect" in c:
        return (f"A supportive gaze that protects your {a}." if f.polarity > 0
                else f"A hard gaze that pressures your {a}.")
    if "conjunct" in c:
        return (f"Good company refines this ruler's work on your {a}." if f.polarity > 0
                else f"Tense company complicates this ruler's work on your {a}.")
    if "retrograde" in c:
        return f"An unconventional, inward path — progress comes in its own way, not the usual one."
    if "from_moon" in c:
        return f"Seen from the mind/emotions, this echoes the same theme for your {a}."
    if "varga" in c:
        return f"Confirmed in the divisional chart that specifically governs your {a}."
    if "jaimini:amatyakaraka" in c:
        return f"Your natural career significator — its condition colours your professional life."
    if "sav" in c:
        return (f"This house is well-stocked with strength points." if f.polarity > 0
                else f"This house is low on strength points — a softer area." if f.polarity < 0
                else f"This house has an average amount of strength.")
    if "karaka" in c:
        if f.polarity > 0: return f"The natural significator of your {a} is strong — a good sign."
        if f.polarity < 0: return f"The natural significator of your {a} is weak — needs support."
        return f"The natural significator of your {a} is steady."
    # dignity of an occupant / lord
    if "exalted" in c: return f"At its best here — a clear strength for your {a}."
    if "own_sign" in c: return f"On home ground — solid and self-assured in your {a}."
    if "debilitated" in c: return f"Weakened here — this part of your {a} needs extra care."
    if f.polarity > 0: return f"A supportive influence on your {a}."
    if f.polarity < 0: return f"A challenging influence on your {a}."
    return f"A neutral, context-setting factor for your {a}."


def topic_factors(cfg, planets, lagna_idx, dvarga_planets=None, active_lords=None,
                  aspects_on_house=None, sav_house=None, scheme="parashari",
                  varga_mode=False, varga_num=1, d1_signs=None):
    """
    Emit the factor list for one topic. In varga_mode=True the chart passed IS the
    divisional; D1-only families (dāśā boost, SAV, combustion) are skipped.
    """
    house = cfg["house"]
    karakas = cfg["karakas"]
    label = cfg["label"]
    T = cfg.get("_key", "topic")
    active_lords = active_lords or set()
    aspects_on_house = aspects_on_house or []
    prov = get_provider(scheme)
    F = []

    def dignity(p): return planets[p]["status"]
    house_sign_idx = (lagna_idx + house - 1) % 12

    # varga framing: inside a divisional, house themes speak that varga's language
    from .varga_domains import varga_info, varga_house_meaning
    vinfo = varga_info(varga_num)
    def hmean(h):
        return varga_house_meaning(varga_num, h) if varga_mode else ""

    # 1. house occupants
    for p, pd in planets.items():
        if pd["sign_index"] == house_sign_idx:
            dg = dignity(p); base = _DIGNITY_STRENGTH.get(dg, 2.5)
            pol = _DIGNITY_POLARITY.get(dg, 0) or (+1 if p in _BENEFICS else -1)
            claim = (f"in the {vinfo['name']} (D{varga_num}), {p} sits in the {_ord(house)} — {hmean(house)} ({dg})"
                     if varga_mode else f"{p} occupies the {_ord(house)} house ({dg})")
            F.append(Factor(subject=f"{p} in {_ord(house)}", topics=[T],
                claim=claim,
                polarity=pol, strength=round(base, 2), source=cfg["house_source"],
                conditions=[f"dignity:{dg}", f"house:{house}"], dasha_active=p in active_lords))

    # 2. house lord — placement + functional nature
    lh = _lord_of_house(house, lagna_idx)
    lh_house = _house_of_planet(lh, planets, lagna_idx); lh_dig = dignity(lh)
    nat = prov.nature(lh, lagna_idx, planets)
    place_pol = +1 if lh_house in {1, 4, 5, 7, 9, 10, 11} else (-1 if lh_house in {6, 8, 12} else 0)
    F.append(Factor(subject=f"{_ord(house)} lord", topics=[T],
        claim=f"the {_ord(house)} lord ({lh}) sits in the {_ord(lh_house)} house ({lh_dig})",
        polarity=place_pol if place_pol != 0 else _DIGNITY_POLARITY.get(lh_dig, 0),
        strength=round(_DIGNITY_STRENGTH.get(lh_dig, 2.5) + (0.5 if lh_house in {1, house} else 0), 2),
        source="BPHS Ch.11 — house-lord placement",
        conditions=[f"lord_of:{house}", f"in_house:{lh_house}", f"dignity:{lh_dig}"],
        dasha_active=lh in active_lords))
    F.append(Factor(subject=f"{_ord(house)} lord (nature)", topics=[T],
        claim=f"the {_ord(house)} lord {lh} is a {_NATURE_LABEL.get(nat['nature'], nat['nature'])}",
        polarity=_NATURE_POLARITY.get(nat["nature"], 0),
        strength=3.5 if nat["nature"] == "yogakaraka" else 2.6,
        source=nat["source"], conditions=[f"functional:{nat['nature']}"], dasha_active=lh in active_lords))

    # 3. karakas
    for k, meaning in karakas.items():
        if k not in planets:
            continue
        dg = dignity(k); base = _DIGNITY_STRENGTH.get(dg, 2.5)
        F.append(Factor(subject=f"{k} (karaka)", topics=[T],
            claim=f"{k}, significator of {label.lower()}, is {dg} — {meaning}",
            polarity=_DIGNITY_POLARITY.get(dg, 0), strength=round(base * 0.8, 2),
            source="BPHS 3.12-3.14 — graha karakatva",
            conditions=[f"karaka:{T}", f"dignity:{dg}"], dasha_active=k in active_lords))

    # 4. authoritative divisional (skip in varga_mode — we're already in a varga)
    if dvarga_planets and not varga_mode:
        for k in dict.fromkeys(["Sun", lh] + list(karakas)):
            if k in dvarga_planets:
                F.append(Factor(subject=f"{k} in D{cfg['primary_varga']}", topics=[T],
                    claim=f"in the D{cfg['primary_varga']}, {k} falls in {SIGNS[dvarga_planets[k]['sign_index']]}",
                    polarity=0, strength=2.2, source=cfg["varga_source"],
                    conditions=[f"varga:D{cfg['primary_varga']}"], dasha_active=k in active_lords))

    # 5. aspects on the house (lordship-aware polarity)
    for asp in aspects_on_house:
        p = asp.get("planet")
        if not p:
            continue
        p_nat = prov.nature(p, lagna_idx, planets)["nature"] if p not in ("Rahu", "Ketu") else "neutral"
        supportive = (p == lh) or (p_nat in ("benefic", "yogakaraka")) or (p in _BENEFICS)
        why = ("as the house lord aspecting its own house" if p == lh
               else ("a functional benefic" if p_nat in ("benefic", "yogakaraka")
                     else ("a natural benefic" if p in _BENEFICS else "a malefic influence")))
        F.append(Factor(subject=f"{p} aspect on {_ord(house)}", topics=[T],
            claim=f"{p} casts its aspect on the {_ord(house)} house ({why})",
            polarity=+1 if supportive else -1, strength=2.4 + (0.4 if p == lh else 0),
            source="BPHS — graha drishti", conditions=[f"aspect:{house}", f"planet:{p}", f"functional:{p_nat}"],
            dasha_active=p in active_lords))

    # 6. Amala yoga — benefic in the house from lagna
    for p, pd in planets.items():
        if p in _BENEFICS and pd["sign_index"] == house_sign_idx and house in (10, 1):
            F.append(Factor(subject="Amala yoga", topics=[T],
                claim=f"a benefic ({p}) in the {_ord(house)} forms Amala yoga — lasting good repute",
                polarity=+1, strength=3.2, source="Phaladeepika — Amala yoga",
                conditions=["yoga:amala"], dasha_active=p in active_lords))
            break

    # 7. Amatyakaraka (Jaimini chara karaka — a D1 concept; skip in varga-mode)
    if house == 10 and not varga_mode:
        amk = _amatyakaraka(planets); amk_h = _house_of_planet(amk, planets, lagna_idx); amk_dig = dignity(amk)
        F.append(Factor(subject="Amatyakaraka", topics=[T],
            claim=f"the Amatyakaraka (career karaka) is {amk}, in the {_ord(amk_h)} house ({amk_dig})",
            polarity=_DIGNITY_POLARITY.get(amk_dig, 0) or (+1 if amk_h in {1, 10, 5, 9} else 0),
            strength=round(_DIGNITY_STRENGTH.get(amk_dig, 2.5) * 0.9, 2),
            source="Jaimini Sutras — chara karaka (Amatyakaraka = profession)",
            conditions=["jaimini:amatyakaraka", f"in_house:{amk_h}", f"dignity:{amk_dig}"],
            dasha_active=amk in active_lords))

    # 8. house-from-Moon cross-check
    moon_idx = planets["Moon"]["sign_index"]; hfm = (moon_idx + house - 1) % 12
    for p, pd in planets.items():
        if pd["sign_index"] == hfm and p not in ("Rahu", "Ketu"):
            F.append(Factor(subject=f"{p} in {_ord(house)}-from-Moon", topics=[T],
                claim=f"{p} sits in the {_ord(house)} from the Moon — corroborates a {'supportive' if p in _BENEFICS else 'demanding'} theme",
                polarity=+1 if p in _BENEFICS else -1, strength=1.8,
                source="Parashari — chandra lagna cross-check",
                conditions=[f"from_moon:{house}"], dasha_active=p in active_lords))

    # 9. parivartana with the house lord
    lh_sign = planets[lh]["sign_index"]; disp = SIGN_LORDS[SIGNS[lh_sign]]
    if disp != lh and planets[disp]["sign_index"] == house_sign_idx:
        F.append(Factor(subject=f"Parivartana ({_ord(house)})", topics=[T],
            claim=f"a parivartana (exchange) links the {_ord(house)} lord {lh} and {disp} — a strong, self-reinforcing yoga",
            polarity=+1, strength=3.6, source="Phaladeepika — parivartana yoga",
            conditions=["yoga:parivartana"], dasha_active=(lh in active_lords) or (disp in active_lords)))

    # 10. benefic argala on the house (from 2nd/4th/11th from it)
    argala_off = {(house - 1 + o) % 12 for o in (1, 3, 10)}
    argp = [p for p, pd in planets.items() if pd["sign_index"] in {(lagna_idx + h) % 12 for h in argala_off}]
    ben_argala = [p for p in argp if p in _BENEFICS]
    if ben_argala:
        F.append(Factor(subject=f"Argala on {_ord(house)}", topics=[T],
            claim=f"benefic argala on the {_ord(house)} from {', '.join(ben_argala)} — supportive intervention",
            polarity=+1, strength=2.0, source="Jaimini — argala (intervention)",
            conditions=["argala:benefic"], dasha_active=any(p in active_lords for p in ben_argala)))

    # 11. combustion (D1-only)
    if not varga_mode:
        sun_lon = planets["Sun"]["longitude"]
        for p in dict.fromkeys([lh] + list(karakas)):
            if p in ("Sun", "Rahu", "Ketu") or p not in planets:
                continue
            orb = abs(((planets[p]["longitude"] - sun_lon + 180) % 360) - 180)
            if orb < _COMBUST_ORB.get(p, 10):
                F.append(Factor(subject=f"{p} combust", topics=[T],
                    claim=f"{p} is combust (within {orb:.1f}° of the Sun) — its results are scorched/obscured",
                    polarity=-1, strength=2.3, source="BPHS — astaṅgata (combustion)",
                    conditions=[f"combust:{p}", f"orb:{orb:.1f}"], dasha_active=p in active_lords))

    # 12. retrograde house lord
    if planets[lh].get("retrograde"):
        F.append(Factor(subject=f"{_ord(house)} lord retrograde", topics=[T],
            claim=f"the {_ord(house)} lord {lh} is retrograde — an unconventional, non-linear path with strong inner drive",
            polarity=0, strength=2.1, source="Classical — vakri graha effects",
            conditions=[f"retrograde:{lh}"], dasha_active=lh in active_lords))

    # 13. conjunctions with the house lord
    for p, pd in planets.items():
        if p != lh and pd["sign_index"] == lh_sign and p not in ("Rahu", "Ketu"):
            ben = p in _BENEFICS
            F.append(Factor(subject=f"{lh}+{p} conjunction", topics=[T],
                claim=f"the {_ord(house)} lord {lh} is conjunct {p} — coloured by {'supportive' if ben else 'demanding'} {p} energy",
                polarity=+1 if ben else -1, strength=2.2, source="BPHS Ch.11 — planetary association (yuti)",
                conditions=[f"conjunct:{lh}+{p}"], dasha_active=(lh in active_lords) or (p in active_lords)))

    # 14. neecha bhanga for house lord + karakas
    for p in dict.fromkeys([lh] + list(karakas)):
        if p in planets and _neecha_bhanga(p, planets, lagna_idx):
            F.append(Factor(subject=f"{p} neecha-bhanga", topics=[T],
                claim=f"{p}'s debilitation is cancelled (neecha-bhanga) — early struggle converts to notable rise",
                polarity=+1, strength=3.4, source="BPHS — Neecha Bhanga (debilitation cancellation)",
                conditions=[f"neecha_bhanga:{p}"], dasha_active=p in active_lords))

    # 15. marana karaka sthana for house lord + karakas
    for p in dict.fromkeys([lh] + list(karakas)):
        if p in planets and _house_of_planet(p, planets, lagna_idx) == _MKS.get(p):
            F.append(Factor(subject=f"{p} in MKS", topics=[T],
                claim=f"{p} sits in its Marana Karaka Sthana (the {_ord(_MKS[p])}) — its significations are badly weakened",
                polarity=-1, strength=2.8, source="Jaimini / classical — Marana Karaka Sthana",
                conditions=[f"mks:{p}"], dasha_active=p in active_lords))

    # 16. Manglik / Kuja dosha (marriage only)
    if cfg.get("manglik"):
        mars_h = _house_of_planet("Mars", planets, lagna_idx)
        ven_ref = planets["Venus"]["sign_index"]
        mars_from_ven = ((planets["Mars"]["sign_index"] - ven_ref) % 12) + 1
        if mars_h in _MANGLIK_HOUSES or mars_from_ven in _MANGLIK_HOUSES:
            F.append(Factor(subject="Manglik (Kuja) dosha", topics=[T],
                claim=f"Mars in the {_ord(mars_h)} (from lagna) forms Kuja/Manglik dosha — friction, delay, need for a matching match",
                polarity=-1, strength=3.0, source="BPHS / Phaladeepika — Kuja dosha",
                conditions=[f"manglik:house{mars_h}"], dasha_active="Mars" in active_lords))

    # 17. SAV strength of the house (D1-only)
    if sav_house is not None and not varga_mode:
        pol = +1 if sav_house >= 30 else (-1 if sav_house <= 24 else 0)
        F.append(Factor(subject=f"{_ord(house)} SAV bindus", topics=[T],
            claim=f"the {_ord(house)} house holds {sav_house} Sarvashtakavarga bindus",
            polarity=pol, strength=2.0 + max(0, (sav_house - 28)) * 0.1,
            source="BPHS — Sarvashtakavarga house strength", conditions=[f"sav:{sav_house}"]))

    # Vargottama — planet in the same sign in D1 and this varga → as strong as exalted
    if varga_mode and d1_signs:
        for p, pd in planets.items():
            if p in d1_signs and pd["sign_index"] == d1_signs[p] and p not in ("Rahu", "Ketu"):
                F.append(Factor(subject=f"{p} vargottama", topics=[T],
                    claim=f"{p} is vargottama (same sign in D1 and this {vinfo['name']}) — a rock-solid, reliable result",
                    polarity=+1, strength=3.6, source="Classical — vargottama (doubled strength)",
                    conditions=[f"vargottama:{p}"], dasha_active=p in active_lords))

    # attach a plain-language "what this means" to every factor
    area = vinfo["domain"] if varga_mode else label.lower()
    for f in F:
        if not f.effect:
            f.effect = _plain_effect(f, area)
    return F
