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
        "{topic} is a real strength in this chart.",
        "{topic} is well-placed — the chart supports this part of life.",
    ],
    ("pos", True): [
        "{topic} is mostly positive, with a few real challenges.",
        "{topic} leans good overall, but there are some genuine hurdles.",
    ],
    ("neg", False): [
        "{topic} takes patience — results here come through steady effort.",
        "{topic} is something you build over time rather than get easily.",
    ],
    ("neg", True): [
        "{topic} is a mixed, demanding area — strong pushes both ways.",
        "{topic} has clear support but equally real difficulties.",
    ],
    ("neu", False): [
        "{topic} is balanced — neither strongly helped nor blocked.",
        "{topic} is fairly neutral in this chart.",
    ],
    ("neu", True): [
        "{topic} is finely balanced — help and difficulty roughly even.",
        "{topic} is mixed, with no clear winner either way.",
    ],
}

_CLOSERS = {
    "pos": "Good timing and a supportive chart — a fine area to lean into.",
    "neg": "Patience and steady effort go a long way here.",
    "neu": "Clear choices matter more than force in this area.",
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

    support = [f for f in factors if f.polarity > 0][:6]
    harm = [f for f in factors if f.polarity < 0][:6]

    # Each statement: plain 'what it means' (text) + the placement (detail) + the source rule.
    statements = []   # [{kind, text, detail, rule}]

    def add(kind, text, detail, rule):
        statements.append({"kind": kind, "text": text, "detail": detail, "rule": rule})

    add("headline", headline, "", f"Overall score {net:+.1f} across {len(factors)} factors"
        + (" — with real pushes both ways" if tension else ""))

    def _pick_distinct(pool, n=2):
        out, seen = [], set()
        for f in pool:
            key = (f.effect or _clause(f))
            if key in seen:
                continue
            seen.add(key); out.append(f)
            if len(out) >= n:
                break
        return out

    if support:
        add("group", "What helps here:", "", "")
        for f in _pick_distinct(support):
            add("support", f.effect or _clause(f), _clause(f), f.source)
    if harm:
        add("group", "What makes it harder:", "", "")
        for f in _pick_distinct(harm):
            add("harm", f.effect or _clause(f), _clause(f), f.source)

    if tension:
        add("note", "So this area has ups and downs — steady effort matters more than luck, and things improve as you keep at it.",
            "", "Both helping and hurting factors sit in the same house")

    if active_lords:
        planets = sorted(active_lords)
        add("timing", f"This part of life is active right now — {', '.join(planets)} "
            f"{'is' if len(planets) == 1 else 'are'} running in the current daśā (planetary period), "
            "so it's a good time to focus here.",
            "", "A significator's Vimśottarī daśā is running")

    add("closer", _CLOSERS[sign], "", "Overall direction of the chart here")

    paras = [f"{s['text']}" + (f"  ({s['detail']})" if s['detail'] else "")
             + (f"  —［{s['rule']}］" if s['rule'] else "") for s in statements]

    drivers = [{"claim": f.claim, "effect": f.effect, "source": f.source,
                "weight": f.weight, "polarity": f.polarity} for f in factors[:6]]

    return {"headline": headline, "statements": statements,
            "paragraphs": paras, "drivers": drivers}
