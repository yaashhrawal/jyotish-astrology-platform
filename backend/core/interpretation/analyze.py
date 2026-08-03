"""
Context builder + runner for the interpretation engine.

analyze() takes a computed chart and a topic key, assembles the rule inputs
(authoritative varga, graha-dṛṣṭi on the house, Sarvāṣṭakavarga bindus, active daśā
lords), runs the generic engine, ranks + groups, and composes the seeker narrative.
Handles composite (multi-house) topics by running each house and merging factors.

This is the single entry point the API endpoint calls.
"""
from core.engine import get_vimshottari_dasha
from core.varga import calculate_varga
from routers.ashtakavarga import calculate_bhinnashtakavarga
from .topics import get_topic
from .topic_engine import topic_factors
from .factors import rank, group_conflicts
from .narrative import compose, TOPIC_LABEL

_SPECIAL_ASPECTS = {"Mars": [4, 8], "Jupiter": [5, 9], "Saturn": [3, 10]}
_GRAHAS7 = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]


def _house_of(p, planets, lagna_idx):
    return ((planets[p]["sign_index"] - lagna_idx) % 12) + 1


def _aspects_on_house(planets, lagna_idx, house):
    """Planets casting graha dṛṣṭi on the given house (7th always; special 4/8, 5/9, 3/10)."""
    out = []
    for p in planets:
        ph = _house_of(p, planets, lagna_idx)
        targets = {((ph - 1 + 6) % 12) + 1}
        for off in _SPECIAL_ASPECTS.get(p, []):
            targets.add(((ph - 1 + off - 1) % 12) + 1)
        if house in targets:
            out.append({"planet": p})
    return out


def _sav_house(planets, lagna_idx, house):
    sign = (lagna_idx + house - 1) % 12
    total = 0
    for p in _GRAHAS7:
        total += calculate_bhinnashtakavarga(p, planets[p]["sign_index"], planets, lagna_idx)[sign]
    return total


def _active_lords(planets, birth_jd, asof_jd):
    dashas = get_vimshottari_dasha(planets["Moon"]["longitude"], birth_jd)
    return set(d["lord"] for d in dashas if d["start_jd"] <= asof_jd < d["end_jd"])


def _factors_for_house(cfg, house, planets, lagna_idx, active, scheme):
    """Run the engine for one house using the topic's karakas/varga/sources."""
    sub = dict(cfg); sub["house"] = house
    primary = cfg.get("primary_varga", 1)
    dvarga = None
    if primary and primary != 1:
        try:
            dvarga = calculate_varga(planets, lagna_idx * 30 + 1, primary)["planets"]
        except (ValueError, KeyError):
            dvarga = None  # divisional not implemented — skip the varga factor gracefully
    asp = _aspects_on_house(planets, lagna_idx, house)
    sav = _sav_house(planets, lagna_idx, house)
    return topic_factors(sub, planets, lagna_idx, dvarga_planets=dvarga,
                         active_lords=active, aspects_on_house=asp, sav_house=sav, scheme=scheme)


def analyze(topic_key, planets, lagna_idx, birth_jd, asof_jd, scheme="parashari"):
    cfg = get_topic(topic_key)
    active = _active_lords(planets, birth_jd, asof_jd)
    houses = cfg.get("houses") or [cfg["house"]]

    factors = []
    seen = set()
    for h in houses:
        for f in _factors_for_house(cfg, h, planets, lagna_idx, active, scheme):
            k = (f.subject, f.claim)
            if k not in seen:
                seen.add(k); factors.append(f)

    ranked = rank(factors)
    groups = group_conflicts(ranked)
    # narrative for this topic's merged group
    TOPIC_LABEL[topic_key] = cfg["label"]
    merged = {"topic": topic_key,
              "net": round(sum(f.weight * f.polarity for f in ranked), 3),
              "support": round(sum(f.weight for f in ranked if f.polarity > 0), 3),
              "harm": round(sum(f.weight for f in ranked if f.polarity < 0), 3),
              "tension": any(f.polarity > 0 for f in ranked) and any(f.polarity < 0 for f in ranked),
              "factors": ranked}
    narrative = compose(topic_key, merged, active)

    return {
        "topic": topic_key, "label": cfg["label"], "houses": houses,
        "net": merged["net"], "tension": merged["tension"],
        "narrative": narrative,
        "factors": [f.to_dict() for f in ranked],
        "active_dasha": sorted(active),
    }
