"""
Dasha prediction engine — reads a Vimshottari mahadasha (+ antardasha) with the same
rule-based factor model. A period's results come from its lord's condition: the houses
it rules (areas that activate), the house it sits in, its dignity/functional nature,
its company/aspects/karakatva, and — for the sub-period — the antardasha lord's own
condition and its relationship to the mahadasha lord (the 'combination').

Deterministic + sourced. Sources: BPHS Ch.46-49 (Dasha effects), classical dasha-phala.
"""
from core.engine import SIGNS, SIGN_LORDS
from .factors import Factor, rank
from .polarity import get_provider
from .topic_engine import _ord, _house_of_planet, _neecha_bhanga, _MKS, _COMBUST_ORB, _BENEFICS, _NATURE_LABEL
from .narrative import compose, TOPIC_LABEL
from .topics import get_topic

# house → life-area label (for "activates your ___")
_HOUSE_TOPIC = {1: "self", 2: "wealth", 3: "courage", 4: "home", 5: "children", 6: "health",
                7: "marriage", 8: "longevity", 9: "fortune", 10: "career", 11: "gains", 12: "moksha"}

# planetary friendship (natural) — for the maha↔antar combination
_FRIENDS = {
    "Sun": {"f": ["Moon", "Mars", "Jupiter"], "e": ["Venus", "Saturn"]},
    "Moon": {"f": ["Sun", "Mercury"], "e": []},
    "Mars": {"f": ["Sun", "Moon", "Jupiter"], "e": ["Mercury"]},
    "Mercury": {"f": ["Sun", "Venus"], "e": ["Moon"]},
    "Jupiter": {"f": ["Sun", "Moon", "Mars"], "e": ["Mercury", "Venus"]},
    "Venus": {"f": ["Mercury", "Saturn"], "e": ["Sun", "Moon"]},
    "Saturn": {"f": ["Mercury", "Venus"], "e": ["Sun", "Moon", "Mars"]},
    "Rahu": {"f": ["Venus", "Saturn"], "e": ["Sun", "Moon", "Mars"]},
    "Ketu": {"f": ["Mars", "Venus", "Saturn"], "e": ["Sun", "Moon"]},
}
_DIGNITY_STRENGTH = {"exalted": 4.5, "own_sign": 3.8, "moolatrikona": 4.0, "neutral": 2.5, "debilitated": 1.2}
_DIGNITY_POLARITY = {"exalted": +1, "own_sign": +1, "moolatrikona": +1, "neutral": 0, "debilitated": -1}
_NATURE_POLARITY = {"yogakaraka": +1, "benefic": +1, "neutral": 0, "malefic": -1, "functional_malefic": -1}
_KARAKATVA = {
    "Sun": "authority, father, vitality, recognition",
    "Moon": "mind, mother, emotions, public life",
    "Mars": "energy, courage, property, conflict, siblings",
    "Mercury": "intellect, communication, trade, learning",
    "Jupiter": "wisdom, children, wealth, dharma, fortune",
    "Venus": "spouse, love, comforts, arts, vehicles",
    "Saturn": "discipline, work, delay, longevity, service",
    "Rahu": "ambition, foreign, sudden change, obsession",
    "Ketu": "detachment, spirituality, loss, past-life karma",
}


def _owned_houses(planet, lagna_idx):
    return sorted({((SIGNS.index(s) - lagna_idx) % 12) + 1
                   for s, lord in SIGN_LORDS.items() if lord == planet})


def _lord_factors(L, planets, lagna_idx, scheme, prefix, wmul=1.0, dasha_active=True):
    """Condition factors for a dasha lord L (used for both maha and antar)."""
    prov = get_provider(scheme)
    F = []
    if L not in planets:
        return F
    dg = planets[L]["status"]
    lh = _house_of_planet(L, planets, lagna_idx)
    nat = prov.nature(L, lagna_idx, planets)

    # areas this lord activates (houses it rules)
    for h in _owned_houses(L, lagna_idx):
        tkey = _HOUSE_TOPIC.get(h)
        try:
            lbl = get_topic(tkey)["label"] if tkey else f"the {_ord(h)} house"
        except Exception:
            lbl = f"the {_ord(h)} house"
        F.append(Factor(subject=f"{prefix}: rules {_ord(h)}", topics=["dasha"],
            claim=f"{L} rules the {_ord(h)} house, so this period activates {lbl.lower()}",
            effect=f"{lbl} comes into focus during this period.",
            polarity=_NATURE_POLARITY.get(nat["nature"], 0),
            strength=round(2.6 * wmul, 2), source="BPHS Ch.46-49 — dasha of a house lord",
            conditions=[f"rules:{h}"], dasha_active=dasha_active))

    # house it sits in → that area comes forward
    F.append(Factor(subject=f"{prefix}: in {_ord(lh)}", topics=["dasha"],
        claim=f"{L} sits in the {_ord(lh)} house — its affairs come forward now",
        effect=f"Matters of the {_ord(lh)} house are prominent this period.",
        polarity=+1 if lh in {1,4,5,7,9,10,11} else (-1 if lh in {6,8,12} else 0),
        strength=round(2.4*wmul,2), source="BPHS — dasha lord's bhava placement",
        conditions=[f"in_house:{lh}"], dasha_active=dasha_active))

    # dignity → quality of the period
    F.append(Factor(subject=f"{prefix}: dignity", topics=["dasha"],
        claim=f"{L} is {dg} — colours the overall quality of the period",
        effect=("A strong, fruitful stretch." if dg in ("exalted","own_sign","moolatrikona")
                else "A demanding stretch that needs care." if dg=="debilitated" else "A mixed, workable stretch."),
        polarity=_DIGNITY_POLARITY.get(dg,0), strength=round(_DIGNITY_STRENGTH.get(dg,2.5)*wmul,2),
        source="BPHS — dignity of the dasha lord", conditions=[f"dignity:{dg}"], dasha_active=dasha_active))

    # functional nature
    F.append(Factor(subject=f"{prefix}: nature", topics=["dasha"],
        claim=f"{L} is a {_NATURE_LABEL.get(nat['nature'], nat['nature'])} for this ascendant",
        effect=("A naturally supportive period." if _NATURE_POLARITY.get(nat['nature'],0)>0
                else "A naturally testing period." if _NATURE_POLARITY.get(nat['nature'],0)<0 else "A neutral period."),
        polarity=_NATURE_POLARITY.get(nat['nature'],0), strength=round(2.6*wmul,2),
        source=nat["source"], conditions=[f"functional:{nat['nature']}"], dasha_active=dasha_active))

    # karakatva themes
    F.append(Factor(subject=f"{prefix}: themes", topics=["dasha"],
        claim=f"{L} naturally signifies {_KARAKATVA.get(L,'')}",
        effect=f"Expect themes around {_KARAKATVA.get(L,'')}.",
        polarity=0, strength=round(1.6*wmul,2), source="BPHS 3.12-3.14 — graha karakatva",
        conditions=["karakatva"], dasha_active=dasha_active))

    # modifiers: combust / retro / neecha-bhanga / MKS
    if L not in ("Sun","Rahu","Ketu"):
        orb = abs(((planets[L]["longitude"] - planets["Sun"]["longitude"] + 180) % 360) - 180)
        if orb < _COMBUST_ORB.get(L, 10):
            F.append(Factor(subject=f"{prefix}: combust", topics=["dasha"],
                claim=f"{L} is combust — its results are dimmed during the period",
                effect="Its good effects are somewhat weakened.", polarity=-1, strength=round(2.0*wmul,2),
                source="BPHS — astaṅgata", conditions=["combust"], dasha_active=dasha_active))
    if planets[L].get("retrograde"):
        F.append(Factor(subject=f"{prefix}: retro", topics=["dasha"],
            claim=f"{L} is retrograde — results come in an unconventional, delayed way",
            effect="Results arrive in their own time, not the usual way.", polarity=0, strength=round(1.8*wmul,2),
            source="Classical — vakri graha", conditions=["retrograde"], dasha_active=dasha_active))
    if _neecha_bhanga(L, planets, lagna_idx):
        F.append(Factor(subject=f"{prefix}: neecha-bhanga", topics=["dasha"],
            claim=f"{L}'s debilitation is cancelled — a slow start turning into real rise",
            effect="Tough at first, then genuinely rewarding.", polarity=+1, strength=round(3.2*wmul,2),
            source="BPHS — Neecha Bhanga", conditions=["neecha_bhanga"], dasha_active=dasha_active))
    if _house_of_planet(L, planets, lagna_idx) == _MKS.get(L):
        F.append(Factor(subject=f"{prefix}: MKS", topics=["dasha"],
            claim=f"{L} sits in its Marana Karaka Sthana — a notably weak period for its themes",
            effect="A low-energy stretch for this planet's matters.", polarity=-1, strength=round(2.6*wmul,2),
            source="Jaimini/classical — Marana Karaka Sthana", conditions=["mks"], dasha_active=dasha_active))
    return F


def _combination(maha, antar, planets, lagna_idx):
    """Maha↔Antar relationship — the sub-period flavour."""
    F = []
    if antar not in planets or maha not in planets:
        return F
    rel = _FRIENDS.get(maha, {})
    if antar in rel.get("f", []):
        pol, txt = +1, f"{antar} is a friend of {maha} — the sub-period runs smoothly with the main theme."
    elif antar in rel.get("e", []):
        pol, txt = -1, f"{antar} is an enemy of {maha} — friction between the sub-period and the main theme."
    else:
        pol, txt = 0, f"{antar} is neutral to {maha} — the sub-period neither strongly helps nor hurts."
    F.append(Factor(subject="combination: friendship", topics=["dasha"],
        claim=txt, effect=("Sub-period and main period pull together." if pol>0
                           else "Sub-period and main period pull apart." if pol<0 else "Sub-period is independent of the main theme."),
        polarity=pol, strength=2.8, source="Classical — dasha/antardasha lord relationship",
        conditions=["combo:friendship"], dasha_active=True))
    # antar's house-distance from maha (6/8/12 = difficult; 1/5/9/11 = supportive)
    dist = ((planets[antar]["sign_index"] - planets[maha]["sign_index"]) % 12) + 1
    if dist in (6, 8, 12):
        F.append(Factor(subject="combination: distance", topics=["dasha"],
            claim=f"the sub-lord {antar} sits {_ord(dist)} from the main lord {maha} — a stressful angle",
            effect="Expect obstacles or health/finance strain in this sub-period.",
            polarity=-1, strength=2.6, source="Classical — antardasha house-distance",
            conditions=[f"combo:dist{dist}"], dasha_active=True))
    elif dist in (1, 5, 9, 11):
        F.append(Factor(subject="combination: distance", topics=["dasha"],
            claim=f"the sub-lord {antar} sits {_ord(dist)} from the main lord {maha} — a supportive angle",
            effect="A favourable, productive sub-period.",
            polarity=+1, strength=2.4, source="Classical — antardasha house-distance",
            conditions=[f"combo:dist{dist}"], dasha_active=True))
    return F


def dasha_reading(planets, lagna_idx, maha, antar=None, scheme="parashari"):
    """Full reading for the running mahadasha (+ optional antardasha)."""
    F = _lord_factors(maha, planets, lagna_idx, scheme, prefix=f"{maha} MD", wmul=1.0)
    if antar and antar != maha:
        F += _lord_factors(antar, planets, lagna_idx, scheme, prefix=f"{antar} AD", wmul=0.7)
        F += _combination(maha, antar, planets, lagna_idx)
    ranked = rank(F)
    label = f"{maha} Mahādaśā" + (f" · {antar} Antardaśā" if antar and antar != maha else "")
    TOPIC_LABEL["dasha"] = label
    merged = {"topic": "dasha",
              "net": round(sum(f.weight * f.polarity for f in ranked), 3),
              "support": round(sum(f.weight for f in ranked if f.polarity > 0), 3),
              "harm": round(sum(f.weight for f in ranked if f.polarity < 0), 3),
              "tension": any(f.polarity > 0 for f in ranked) and any(f.polarity < 0 for f in ranked),
              "factors": ranked}
    return {
        "maha": maha, "antar": antar, "label": label,
        "net": merged["net"], "tension": merged["tension"],
        "narrative": compose("dasha", merged, active_lords=None),
        "factors": [f.to_dict() for f in ranked],
    }
