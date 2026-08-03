"""
Planet-centric reading — synthesizes one planet's whole situation into a combined
prediction: its sign + house + dignity + functional nature + conjunctions + aspects
(received) + the houses it rules + nakshatra + NB/MKS/combust/retro. Same factor model,
so every line is sourced and gets a plain-language 'what this means'. Works in any varga.

The classical text (planet-in-sign / planet-in-house verbatim) is shown by the frontend
BELOW this synthesis — this engine produces the synthesized combination reading.
"""
from core.engine import SIGNS, SIGN_LORDS
from .factors import Factor, rank, group_conflicts
from .polarity import get_provider
from .topic_engine import (_ord, _house_of_planet, _neecha_bhanga, _plain_effect,
                           _MKS, _COMBUST_ORB, _BENEFICS, _NATURE_LABEL, _amatyakaraka)
from .narrative import compose, TOPIC_LABEL

_DS = {"exalted": 4.5, "own_sign": 3.8, "moolatrikona": 4.0, "neutral": 2.5, "debilitated": 1.2}
_DP = {"exalted": +1, "own_sign": +1, "moolatrikona": +1, "neutral": 0, "debilitated": -1}
_NP = {"yogakaraka": +1, "benefic": +1, "neutral": 0, "malefic": -1, "functional_malefic": -1}
_HOUSE_THEME = {1: "self & body", 2: "wealth & speech", 3: "courage & siblings", 4: "home & mother",
                5: "children & intellect", 6: "health & enemies", 7: "marriage & partnership",
                8: "longevity & upheaval", 9: "fortune & dharma", 10: "career & status",
                11: "gains & desires", 12: "loss & liberation"}


def _owned_houses(planet, lagna_idx):
    return sorted({((SIGNS.index(s) - lagna_idx) % 12) + 1 for s, l in SIGN_LORDS.items() if l == planet})


def planet_reading(planet, planets, lagna_idx, scheme="parashari",
                   aspects_on_planet=None, varga_num=1, varga_name=""):
    prov = get_provider(scheme)
    aspects_on_planet = aspects_on_planet or []
    pd = planets[planet]
    sign = pd["sign"]
    house = _house_of_planet(planet, planets, lagna_idx)
    dg = pd["status"]
    T = f"planet:{planet}"
    F = []

    def add(subj, claim, pol, strength, source, conds):
        F.append(Factor(subject=subj, claim=claim, polarity=pol, strength=strength,
                        topics=[T], source=source, conditions=conds, dasha_active=False))

    # sign + house (the core placement)
    add(f"{planet} in {sign}", f"{planet} is in {sign} in the {_ord(house)} house ({_HOUSE_THEME.get(house,'')}) — {dg}",
        _DP.get(dg, 0) or (+1 if planet in _BENEFICS else -1), _DS.get(dg, 2.5),
        "BPHS Ch.20-33 — planet in sign & bhava", [f"sign:{sign}", f"house:{house}", f"dignity:{dg}"])

    # functional nature
    nat = prov.nature(planet, lagna_idx, planets)
    add(f"{planet} nature", f"{planet} is a {_NATURE_LABEL.get(nat['nature'], nat['nature'])} for this ascendant",
        _NP.get(nat["nature"], 0), 2.8 if nat["nature"] == "yogakaraka" else 2.4, nat["source"],
        [f"functional:{nat['nature']}"])

    # what it rules → what it activates
    for h in _owned_houses(planet, lagna_idx):
        add(f"{planet} rules {_ord(h)}", f"{planet} rules the {_ord(h)} house, so it carries {_HOUSE_THEME.get(h,'')} into wherever it sits",
            _NP.get(nat["nature"], 0), 2.2, "BPHS Ch.11 — house-lordship", [f"rules:{h}"])

    # conjunctions (same sign)
    for p2, p2d in planets.items():
        if p2 != planet and p2d["sign_index"] == pd["sign_index"]:
            ben = p2 in _BENEFICS
            add(f"{planet}+{p2}", f"{planet} is conjunct {p2} — its results are coloured by {'supportive' if ben else 'demanding'} {p2} energy",
                +1 if ben else -1, 2.3, "BPHS Ch.11 — planetary conjunction (yuti)", [f"conjunct:{p2}"])

    # aspects received
    for asp in aspects_on_planet:
        a = asp.get("planet")
        if not a or a == planet:
            continue
        a_nat = prov.nature(a, lagna_idx, planets)["nature"] if a not in ("Rahu", "Ketu") else "neutral"
        good = (a_nat in ("benefic", "yogakaraka")) or (a in _BENEFICS)
        add(f"{a} aspects {planet}", f"{planet} is aspected by {a} ({'benefic' if good else 'malefic'} gaze)",
            +1 if good else -1, 2.2, "BPHS — graha drishti", [f"aspected_by:{a}"])

    # modifiers
    if planet not in ("Sun", "Rahu", "Ketu"):
        orb = abs(((pd["longitude"] - planets["Sun"]["longitude"] + 180) % 360) - 180)
        if orb < _COMBUST_ORB.get(planet, 10):
            add(f"{planet} combust", f"{planet} is combust (within {orb:.1f}° of the Sun) — its good results are dimmed",
                -1, 2.3, "BPHS — astaṅgata (combustion)", ["combust"])
    if pd.get("retrograde"):
        add(f"{planet} retrograde", f"{planet} is retrograde — it gives results in an unconventional, delayed, inward way",
            0, 2.0, "Classical — vakri graha", ["retrograde"])
    if _neecha_bhanga(planet, planets, lagna_idx):
        add(f"{planet} neecha-bhanga", f"{planet}'s debilitation is cancelled (neecha-bhanga) — early struggle turns into real rise",
            +1, 3.2, "BPHS — Neecha Bhanga", ["neecha_bhanga"])
    if house == _MKS.get(planet):
        add(f"{planet} in MKS", f"{planet} sits in its Marana Karaka Sthana (the {_ord(house)}) — a weak, under-delivering placement",
            -1, 2.6, "Jaimini/classical — Marana Karaka Sthana", ["mks"])

    # nakshatra
    if pd.get("nakshatra"):
        add(f"{planet} nakshatra", f"{planet} is in {pd['nakshatra']} nakshatra (lord {pd.get('nakshatra_lord','')})",
            0, 1.4, "BPHS Ch.3 — Nakshatra", ["nakshatra"])

    area = f"{planet} in {sign}" + (f" · {varga_name}" if varga_num != 1 and varga_name else "")
    for f in F:
        if not f.effect:
            f.effect = _plain_effect(f, f"{planet}'s effect on {_HOUSE_THEME.get(house,'this area')}")
    ranked = rank(F)
    merged = {"topic": T, "net": round(sum(f.weight * f.polarity for f in ranked), 3),
              "support": round(sum(f.weight for f in ranked if f.polarity > 0), 3),
              "harm": round(sum(f.weight for f in ranked if f.polarity < 0), 3),
              "tension": any(f.polarity > 0 for f in ranked) and any(f.polarity < 0 for f in ranked),
              "factors": ranked}
    TOPIC_LABEL[T] = f"{planet} in {sign} — {_ord(house)} house"
    return {
        "planet": planet, "sign": sign, "house": house, "dignity": dg,
        "label": f"{planet} in {sign} · {_ord(house)} house",
        "net": merged["net"], "tension": merged["tension"],
        "narrative": compose(T, merged, active_lords=None),
        "factors": [f.to_dict() for f in ranked],
    }
