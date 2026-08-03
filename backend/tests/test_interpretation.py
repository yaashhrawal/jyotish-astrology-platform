"""
Interpretation-engine regression: freeze the Career factor set for reference charts.
Deterministic → any change in rules/weights that alters output fails with a diff.
REGEN_GOLDEN=1 pytest tests/test_interpretation.py  to update after a reviewed change.
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pytest
from core.engine import (birth_to_jd, calculate_planets, calculate_houses,
                         assign_planets_to_houses, get_vimshottari_dasha, SIGNS)
from core.varga import calculate_varga
from routers.ashtakavarga import calculate_bhinnashtakavarga
from core.interpretation.career import career_factors
from core.interpretation.factors import rank, group_conflicts
from core.interpretation.narrative import compose

SNAP = os.path.join(os.path.dirname(__file__), "golden_interpretation.json")
CHARTS = {
    "delhi_1947": (1947, 8, 15, 0, 0, 5.5, 28.61, 77.21),
    "navi_mumbai_2000": (2000, 4, 11, 7, 30, 5.5, 19.03, 73.03),
    "sydney_2011": (2011, 1, 1, 9, 5, 11.0, -33.87, 151.21),
}
SPECIAL = {"Mars": [4, 8], "Jupiter": [5, 9], "Saturn": [3, 10]}
ASOF = (2026, 1, 1, 0, 0, 0)


def _career(spec):
    y, mo, d, h, mi, tz, lat, lon = spec
    jd = birth_to_jd(y, mo, d, h, mi, tz)
    P = calculate_planets(jd, "lahiri")
    H = calculate_houses(jd, lat, lon, "lahiri")
    L = H["ascendant"]["sign_index"]
    assign_planets_to_houses(P, L)
    d10 = calculate_varga(P, L * 30 + 1, 10)["planets"]
    D = get_vimshottari_dasha(P["Moon"]["longitude"], jd)
    asof = birth_to_jd(*ASOF)
    active = set(x["lord"] for x in D if x["start_jd"] <= asof < x["end_jd"])

    def ho(p): return ((P[p]["sign_index"] - L) % 12) + 1
    asp = []
    for p in P:
        ph = ho(p); tg = {((ph - 1 + 6) % 12) + 1}
        for off in SPECIAL.get(p, []): tg.add(((ph - 1 + off - 1) % 12) + 1)
        if 10 in tg: asp.append({"planet": p})
    ts = (L + 9) % 12; sav = [0] * 12
    for p in ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]:
        s = calculate_bhinnashtakavarga(p, P[p]["sign_index"], P, L)
        sav = [sav[i] + s[i] for i in range(12)]
    F = rank(career_factors(P, L, d10, active, asp, sav[ts]))
    g = group_conflicts(F)[0]
    return {
        "net": g["net"], "tension": g["tension"],
        "factors": [{"subject": f.subject, "polarity": f.polarity, "weight": f.weight}
                    for f in F],
        "headline": compose("career", g, active)["headline"],
    }


def _all():
    return {k: _career(v) for k, v in CHARTS.items()}


def test_career_interpretation_snapshot():
    cur = _all()
    if os.getenv("REGEN_GOLDEN") == "1" or not os.path.exists(SNAP):
        json.dump(cur, open(SNAP, "w"), indent=2, ensure_ascii=False)
        pytest.skip("interpretation snapshot (re)generated — commit golden_interpretation.json")
    golden = json.load(open(SNAP))
    for name in CHARTS:
        assert cur[name] == golden.get(name), f"interpretation drift for {name}"


ALL_SNAP = os.path.join(os.path.dirname(__file__), "golden_all_topics.json")


def _all_topics_reading(spec):
    from core.interpretation.analyze import analyze
    from core.interpretation.topics import all_topics
    y, mo, d, h, mi, tz, lat, lon = spec
    jd = birth_to_jd(y, mo, d, h, mi, tz)
    P = calculate_planets(jd, "lahiri")
    H = calculate_houses(jd, lat, lon, "lahiri")
    L = H["ascendant"]["sign_index"]
    assign_planets_to_houses(P, L)
    asof = birth_to_jd(*ASOF)
    out = {}
    for tk in all_topics() + ["love", "family", "travel"]:
        r = analyze(tk, P, L, jd, asof)
        out[tk] = {"net": r["net"], "tension": r["tension"],
                   "n_factors": len(r["factors"]), "headline": r["narrative"]["headline"]}
    return out


def test_all_topics_snapshot():
    """Locks every life-area (12 houses + composites) for the reference chart."""
    cur = _all_topics_reading(CHARTS["navi_mumbai_2000"])
    if os.getenv("REGEN_GOLDEN") == "1" or not os.path.exists(ALL_SNAP):
        json.dump(cur, open(ALL_SNAP, "w"), indent=2, ensure_ascii=False)
        pytest.skip("all-topics snapshot (re)generated — commit golden_all_topics.json")
    golden = json.load(open(ALL_SNAP))
    for tk in cur:
        assert cur[tk] == golden.get(tk), f"topic drift for '{tk}': {cur[tk]} != {golden.get(tk)}"


def test_every_topic_produces_sourced_factors():
    """No topic may emit an uncited prediction."""
    from core.interpretation.analyze import analyze
    from core.interpretation.topics import all_topics
    spec = CHARTS["navi_mumbai_2000"]
    y, mo, d, h, mi, tz, lat, lon = spec
    jd = birth_to_jd(y, mo, d, h, mi, tz)
    P = calculate_planets(jd, "lahiri"); H = calculate_houses(jd, lat, lon, "lahiri")
    L = H["ascendant"]["sign_index"]; assign_planets_to_houses(P, L)
    asof = birth_to_jd(*ASOF)
    for tk in all_topics() + ["love", "family", "travel"]:
        r = analyze(tk, P, L, jd, asof)
        assert r["factors"], f"{tk} produced no factors"
        for f in r["factors"]:
            assert f["source"] and len(f["source"]) > 3, f"{tk}: unsourced {f['subject']}"


def test_every_factor_is_sourced():
    """Non-negotiable: every prediction must cite a rule (no uncited output)."""
    for spec in CHARTS.values():
        y, mo, d, h, mi, tz, lat, lon = spec
        jd = birth_to_jd(y, mo, d, h, mi, tz)
        P = calculate_planets(jd, "lahiri")
        H = calculate_houses(jd, lat, lon, "lahiri")
        L = H["ascendant"]["sign_index"]
        assign_planets_to_houses(P, L)
        for f in career_factors(P, L, {}, set()):
            assert f.source and len(f.source) > 3, f"unsourced factor: {f.subject}"
