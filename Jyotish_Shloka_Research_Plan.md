# Jyotish — Shloka Sourcing & Analysis Deepening (Research Plan)

_Goal: replace chapter-level citations ("BPHS Ch. 24") in the analysis drawer with the **actual classical verse (shloka)** + a word/line **breakdown** underneath — sourced from real texts, nothing fabricated._

---

## Why this is a separate, careful project
A wrong Sanskrit verse or wrong verse-number in a Jyotish product destroys credibility. So shlokas are **not** AI-guessed. Each verse must trace to a **verified edition**. This plan is the disciplined path to do that.

---

## Data model (what each analysis point will carry)
```
{
  rule: "Sun in the 10th house",
  shloka: "…देवनागरी verse…",          // exact, from a verified edition
  iast:   "…IAST transliteration…",     // for pronunciation
  pada_breakdown: [                      // word/phrase → meaning
    { word: "…", meaning_en: "…", meaning_hi: "…", meaning_sa: "…" }
  ],
  translation: { en, hi, sa },           // plain-language meaning
  source: { text: "BPHS", chapter: 24, verse: 12, edition: "…", translator: "…" }
}
```
- `source.edition` + `translator` are mandatory — the provenance IS the credibility.

## Canonical sources (priority order)
1. **BPHS** (Brihat Parashara Hora Shastra) — R. Santhanam edition (2 vols) — the primary for planets-in-signs/houses, yogas, vargas.
2. **Phaladeepika** (Mantreswara) — G.S. Kapoor edition — concise phala verses.
3. **Saravali** (Kalyana Varma) — planet-in-sign/house effects.
4. **Jataka Parijata**, **Uttara Kalamrita** — supplementary.
5. Cross-check digital: GRETIL / sanskritdocuments.org for verse text; **verify against print edition** before shipping.

## Method (per rule)
1. Identify the exact chapter/verse in BPHS/Phaladeepika/Saravali for that placement.
2. Pull the **Devanagari** verse from a verified edition; generate IAST.
3. Do the **pada (word) breakdown** with meanings.
4. Write plain translation (en → then hi/sa).
5. Record provenance (edition + translator + verse no.).
6. **Two-source rule**: verse text confirmed in ≥2 sources (or 1 print edition) before it's marked `verified: true`. Unverified stays hidden.

## Scope & phasing (it's large — do it in tranches)
- **Tranche 1 (highest visibility):** the 9 planets × 12 houses = 108 (BPHS effects-in-bhavas chapters). These show most often.
- **Tranche 2:** 9 planets × 12 signs = 108 (effects-in-rashis chapters).
- **Tranche 3:** key yogas + varga-specific dictums (D9/D10) + nakshatra deities.
- Each tranche: research → verify → fill data → ship behind a `verified` flag.

## Effort estimate
- ~216 core verses (signs + houses). Realistically weeks of careful sourcing, not a single session.
- Recommend: run as a **dedicated deep-research workflow** (fan-out per chapter, adversarial verify each verse against sources) once you green-light — this is exactly the kind of thing to do slowly and correctly.

## Interim (until verses are sourced)
- Keep the current **chapter-level citations** ("BPHS Ch. 24–33 — Effects of planets in the Bhavas"). Honest and useful.
- Add a "shloka coming" placeholder only where we've *started* a tranche.

## Guardrail
- No verse ships without `source.edition` + `verified: true`. AI may *format/transliterate* verified text, never *invent* it.
