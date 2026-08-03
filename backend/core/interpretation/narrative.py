"""
Seeker-facing NLG — turns ranked Factors into short, non-robotic prose.
Deterministic (no LLM). Composes: verdict opener → support → harm → tension
reconcile → timing. Connects factors with glue rather than listing them.

English base here; the finite template set is translated to hi/sa via the same
workflow used for the i18n sweep (keys are stable). compose(..., lang=) selects tongue.
"""

# ── intensity ladder from a factor's weight ─────────────────────────────────
def _intensity(w: float) -> str:
    if w >= 3.8: return "strongly"
    if w >= 2.8: return "clearly"
    if w >= 1.8: return "moderately"
    return "mildly"


def _clause(f) -> str:
    """A short mid-sentence clause from a factor: lowercase the leading article only,
    preserving proper nouns (planet names) elsewhere."""
    c = f.claim
    if c[:4].lower() == "the ":
        return "the " + c[4:]
    if c[:2].lower() == "a ":
        return "a " + c[2:]
    if c[:7].lower() == "in the ":
        return "in the " + c[7:]
    # else lowercase just the first character if it's not a proper noun start
    return c[0].lower() + c[1:] if not c.split()[0].istitle() else c


TOPIC_LABEL = {"career": "Career and profession"}

# Verdict openers keyed by (sign of net, tension?) — several variants each, chosen
# deterministically per chart so different charts read differently (no randomness).
_OPENERS = {
    ("pos", False): [
        "{topic} is a genuine strength in this chart.",
        "{topic} stands on firm ground here — the chart backs this area.",
        "This is a chart that supports {topic_l}.",
    ],
    ("pos", True): [
        "{topic} is well-supported overall, though not without friction.",
        "{topic} leans favourable, but there are real headwinds to work with.",
        "On balance the chart favours {topic_l} — with some genuine obstacles in the mix.",
    ],
    ("neg", False): [
        "{topic} asks for patience — the chart leans toward effort over ease.",
        "{topic} is a build-it-yourself area: results come through sustained work.",
        "The chart makes {topic_l} an earned area rather than a given.",
    ],
    ("neg", True): [
        "{topic} carries real tension — strong pulls in both directions.",
        "{topic} is a battleground of opposing forces in this chart.",
        "{topic} is hard-won here: meaningful support, met by equally real resistance.",
    ],
    ("neu", False): [
        "{topic} is balanced — neither strongly favoured nor blocked.",
        "{topic} sits in neutral territory in this chart.",
    ],
    ("neu", True): [
        "{topic} is finely balanced, support and obstacle roughly matched.",
        "{topic} is mixed — the chart pulls both ways without a clear winner.",
    ],
}

_CLOSERS = {
    "pos": "Lean into it — the timing and the chart are on your side.",
    "neg": "Steady, patient effort pays off here far more than bold leaps.",
    "neu": "Direction matters more than force — choose deliberately and commit.",
}


def _pick(variants: list, seed: int) -> str:
    return variants[seed % len(variants)]


def compose(topic: str, group: dict, active_lords=None, lang: str = "en") -> dict:
    """
    group = one entry from factors.group_conflicts(): {topic, net, support, harm, tension, factors}
    Returns {headline, paragraphs:[...], drivers:[...]} — the seeker narrative.
    (lang currently renders English; hi/sa templates plug in here once translated.)
    """
    factors = group["factors"]
    net = group["net"]
    tension = group["tension"]
    label = TOPIC_LABEL.get(topic, topic.capitalize())

    sign = "pos" if net > 1.0 else ("neg" if net < -1.0 else "neu")
    # deterministic per-chart seed from the factor set (stable, not random)
    seed = int(sum(f.weight * (i + 1) for i, f in enumerate(factors)) * 10)
    headline = _pick(_OPENERS[(sign, tension)], seed).format(topic=label, topic_l=label[0].lower() + label[1:])

    support = [f for f in factors if f.polarity > 0][:3]
    harm = [f for f in factors if f.polarity < 0][:3]
    paras = []

    _SUP_LEAD = ["What carries it", "In its favour", "The chart's support here"]
    _HARM_LEAD = ["What weighs against it", "The resistance", "Working against it"]

    if support:
        s = f"{_pick(_SUP_LEAD, seed)}: {_clause(support[0])}"
        if len(support) > 1:
            s += f", and {_clause(support[1])}"
        paras.append(s + ".")

    if harm:
        s = f"{_pick(_HARM_LEAD, seed + 1)}: {_clause(harm[0])}"
        if len(harm) > 1:
            s += f", and {_clause(harm[1])}"
        paras.append(s + ".")

    if tension:
        paras.append(
            "These pull against each other — expect real progress interleaved with "
            "setbacks rather than a smooth climb. The chart rewards persistence over speed."
        )

    if active_lords:
        planets = sorted(active_lords)
        paras.append(
            f"This theme is live right now: {', '.join(planets)} "
            f"{'is' if len(planets) == 1 else 'are'} running in the current daśā, "
            "so the area is actively unfolding — a period to engage, not defer."
        )

    paras.append(_CLOSERS[sign])

    drivers = [{"claim": f.claim, "source": f.source, "weight": f.weight,
                "polarity": f.polarity} for f in factors[:5]]

    return {"headline": headline, "paragraphs": paras, "drivers": drivers}
