# Jyotish Shloka Feature — Research Method & Roadmap

**Goal:** Show direct classical verses (shlokas) + plain-language breakdown in the kundli/varga
analysis, trilingual (EN/HI/SA). **Hard rule: NO fabrication of verses or citations.**

## Anti-fabrication pipeline (followed for every verse)
1. **Sanskrit = verbatim, never authored.** Parse the mula text from the public-domain
   ITRANS edition on sanskritdocuments.org, then transliterate **deterministically** with the
   `indic_transliteration` Python library (ITRANS → Devanagari + IAST). An LLM never writes,
   guesses, or "reconstructs" Sanskrit.
2. **Translation + breakdown = our own faithful rendering** (derivative, not copied from any
   copyrighted edition e.g. Santhanam/Sharma — those stay on archive.org, never bulk-copied).
   Authored in EN, then translated to HI/SA (Claude), stored `{en,hi,sa}`.
3. **Citation** = exact BPHS `chapter.verse` (from the .itx `|| N||` markers) + `sourceUrl`.
4. **Verification** = the extracted ITRANS must be an exact substring of the fetched `.itx`.

## Sources (verified real, free, fetchable)
- BPHS Sanskrit (ITRANS): `sanskritdocuments.org/doc_z_misc_sociology_astrology/par<NN><MM>.itx`
  ranges: par0110, par1120, par2130, par3140, par4145, par4650, par5160, par6170, par7180,
  par8190, par9197. Format: verses end `|| N||`, chapters `\section{name || N||}`.
- English (partial HTML): only Eng34-45 on that site; full Santhanam on archive.org (copyright — do NOT copy).
- Tooling: `pip3 install indic-transliteration`; `transliterate(itx, ITRANS, DEVANAGARI/IAST)`.

## Chapter map (BPHS)
- Ch.3 grahaguṇasvarūpa — planet natures/karakas/dignity (par0110 lines ~117-267)
- Ch.4 rāśisvarūpa — signs; Ch.6 ṣoḍaśavarga, Ch.7 vargaviveka — divisionals
- Ch.11 bhāvaviveka; Ch.12-23 bhāvaphala — house results (12=1st,13=2nd,... in par1120/par2130)

## Status
- **Batch 1 — DONE & LIVE** (commit 7acd02f): BPHS 3.12,3.13,3.14 (karaka), 3.22 (guna),
  3.49,3.50 (exaltation/debilitation). `frontend/src/data/shlokas.ts` + `ShlokaCard.tsx`,
  wired into VargaAnalysisDrawer + PlanetInterpretation. Held 3.51/3.52 (mūlatrikoṇa) —
  intricate, needs careful gloss.

## Next batches (planned)
- **Batch 2:** 3.51/3.52 (mūlatrikoṇa + own signs, exact) + Ch.4 sign natures.
- **Batch 3:** House results Ch.12-23 (bhāvaphala) — map to house sections in drawer.
- **Batch 4:** Navamsha/divisional (Ch.6/7) — map to varga domain sections.
- **Batch 5:** Flagship yogas (Phaladeepika/Saravali if verbatim source found; else BPHS yoga chapters).

## Data shape (`shlokas.ts`)
`{ ref, source, sourceUrl, topics[], devanagari, iast, translation{en,hi,sa}, breakdown{en,hi,sa} }`
`getShlokas(tags)` filters by topic. ShlokaCard shows verse (Devanagari) + IAST + translation +
breakdown in chosen language + citation. Topics used: karaka, guna, dignity, exaltation,
debilitation, planet names.
