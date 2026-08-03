"""
Functional benefic/malefic (polarity) providers — pluggable so Parashari and KP
schemes drive the same factor engine. Each provider maps (planet, chart) → nature.

Nature values: 'yogakaraka' | 'benefic' | 'neutral' | 'malefic' | 'functional_malefic'
"""
from core.engine import SIGNS, SIGN_LORDS

TRIKONA = {1, 5, 9}
KENDRA = {1, 4, 7, 10}
DUSTHANA = {6, 8, 12}
NATURAL_BENEFIC = {"Jupiter", "Venus", "Mercury", "Moon"}
NATURAL_MALEFIC = {"Sun", "Mars", "Saturn", "Rahu", "Ketu"}


def _house_of_sign(sign_idx: int, lagna_idx: int) -> int:
    return ((sign_idx - lagna_idx) % 12) + 1


def _owned_houses(planet: str, lagna_idx: int) -> list:
    """Houses (from lagna) that this planet's own signs fall in."""
    owned = [s for s, lord in SIGN_LORDS.items() if lord == planet]
    return [_house_of_sign(SIGNS.index(s), lagna_idx) for s in owned]


class ParashariPolarity:
    """Classical lagna-based functional nature (BPHS / BV Raman lines)."""
    scheme = "parashari"

    # Per-house contribution to functional nature (Parashari / BV Raman lines).
    # trikona strongly good; lagna good; dusthana bad; trishadaya (3,11) mildly bad;
    # kendra = kendradhipati: neutral, and *blemished* for a natural benefic.
    _HOUSE_SCORE = {1: +2, 5: +2, 9: +2,        # trikona / lagna
                    4: 0, 7: 0, 10: 0,          # kendra (see kendradhipati adj below)
                    6: -2, 8: -2, 12: -2,       # dusthana
                    3: -1, 11: -1,              # trishadaya (upachaya but functionally mild-malefic)
                    2: +0.5}                     # dhana / secondary maraka

    @classmethod
    def nature(cls, planet: str, lagna_idx: int, planets: dict = None) -> dict:
        houses = sorted(set(_owned_houses(planet, lagna_idx)))
        if not houses:  # Rahu/Ketu own no sign — resolved by house/dispositor elsewhere
            return {"nature": "neutral", "houses": [], "score": 0,
                    "reason": "no rulership (node)", "source": "rule:parashari_functional"}

        has_trikona = any(h in TRIKONA for h in houses)
        has_kendra = any(h in KENDRA and h != 1 for h in houses)

        # Yogakaraka: rules both a kendra and a trikona (e.g. Saturn for Taurus/Libra).
        if has_trikona and has_kendra:
            return {"nature": "yogakaraka", "houses": houses, "score": 5,
                    "reason": f"rules a kendra and a trikona {houses}",
                    "source": "rule:parashari_functional"}

        score = 0.0
        for h in houses:
            s = cls._HOUSE_SCORE.get(h, 0)
            # kendradhipati dosha: a natural benefic owning a kendra is blemished (mild -)
            if h in (4, 7, 10) and planet in NATURAL_BENEFIC:
                s -= 1
            score += s

        if score >= 2:
            nat = "benefic"
        elif score <= -2:
            nat = "functional_malefic"
        elif score < 0:
            nat = "malefic"
        else:
            nat = "neutral"

        return {"nature": nat, "houses": houses, "score": round(score, 1),
                "reason": f"lord of {houses} → functional score {round(score,1)}",
                "source": "rule:parashari_functional"}


# Registry — add KPPolarity here later (same .nature signature).
PROVIDERS = {"parashari": ParashariPolarity}


def get_provider(scheme: str = "parashari"):
    return PROVIDERS.get(scheme, ParashariPolarity)
