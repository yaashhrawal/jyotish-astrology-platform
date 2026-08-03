"""
Factor model + engine: collect → weight → rank → group conflicts.
Pure functions, fully deterministic (snapshot-testable).
"""
from dataclasses import dataclass, field, asdict


@dataclass
class Factor:
    subject: str                 # "Sun", "10th lord", "Venus (karaka)"
    claim: str                   # base English statement (template-key friendly)
    polarity: int                # -1 harmful, 0 neutral/mixed, +1 supportive
    strength: float              # 0..5 how loud this factor is
    topics: list                 # ["career", ...]
    source: str                  # "BPHS 3.x" | "rule:functional_malefic" | ...
    conditions: list = field(default_factory=list)   # why it fired (dignity, aspect, ...)
    dasha_active: bool = False   # planet running now → relevance boost
    weight: float = 0.0          # computed by the engine

    def to_dict(self):
        return asdict(self)


# Relevance multiplier when the factor's planet is in the active dasha/antardasha.
DASHA_BOOST = 1.6


def rank(factors: list) -> list:
    """Assign weight = strength × dasha-relevance, sort loudest first (stable)."""
    for f in factors:
        f.weight = round(f.strength * (DASHA_BOOST if f.dasha_active else 1.0), 3)
    # stable sort: weight desc, then |polarity| desc (decisive before neutral), then subject
    return sorted(factors, key=lambda f: (-f.weight, -abs(f.polarity), f.subject))


def group_conflicts(factors: list) -> list:
    """
    Group ranked factors into topic clusters and flag polarity tension.
    Returns [{topic, net, tension, factors:[...]}] — 'tension' True when both
    supportive and harmful factors are present (do NOT average them away).
    """
    by_topic = {}
    for f in factors:
        for t in f.topics:
            by_topic.setdefault(t, []).append(f)
    out = []
    for topic, fs in by_topic.items():
        fs = rank(fs)
        pos = sum(f.weight for f in fs if f.polarity > 0)
        neg = sum(f.weight for f in fs if f.polarity < 0)
        out.append({
            "topic": topic,
            "net": round(pos - neg, 3),
            "support": round(pos, 3),
            "harm": round(neg, 3),
            "tension": pos > 0 and neg > 0,
            "factors": fs,
        })
    out.sort(key=lambda c: -(c["support"] + c["harm"]))
    return out
