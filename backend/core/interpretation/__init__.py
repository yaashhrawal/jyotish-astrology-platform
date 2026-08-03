"""
Rule-based interpretation engine (deterministic, sourced, no LLM).

A `Factor` is one structured, cited claim emitted by a rule. Rule catalogs (one per
life-area) emit factors from a computed chart; the engine weights, ranks and groups
them (surfacing conflicts as tensions). Two renderers consume the ranked factors:
an astrologer table (raw factors) and a seeker narrative (template NLG).

Polarity (functional benefic/malefic) is pluggable so Parashari and KP schemes can
both drive the same factors.
"""
