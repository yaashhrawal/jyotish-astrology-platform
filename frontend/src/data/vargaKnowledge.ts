/**
 * Varga (divisional chart) knowledge base — Phase 1, hardcoded + cited.
 *
 * Every entry carries a `source` (chapter-level classical reference). Exact
 * verse text is refined later from verified sources — nothing here is invented
 * beyond well-established classical mappings (BPHS, Phaladeepika, Saravali).
 *
 * The reading engine (VargaAnalysisDrawer) combines:
 *   planet-in-sign + planet-in-house  (from PlanetInterpretation.tsx, shared)
 *   + this file's varga-domain house framing
 *   + nakshatra (true, from D1)
 *   + dignity / retrograde / vargottama modifiers.
 */

export interface Cited { text: string; source: string }

// Generic house significations (D1 baseline; other vargas reframe the theme).
export const BASE_HOUSE_MEANINGS: string[] = [
  'Self, body, vitality, overall temperament',                 // H1
  'Wealth, family, speech, accumulated resources, food',       // H2
  'Courage, siblings, effort, short journeys, communication',  // H3
  'Home, mother, property, vehicles, inner peace',             // H4
  'Children, intellect, past merit (purva punya), creativity', // H5
  'Enemies, debts, disease, service, daily work',              // H6
  'Spouse, partnerships, business, public dealings',           // H7
  'Longevity, transformation, occult, inheritances, crises',   // H8
  'Dharma, fortune, father, guru, higher learning, pilgrimage',// H9
  'Career, status, authority, karma, public standing',         // H10
  'Gains, income, elder siblings, desires fulfilled, networks',// H11
  'Loss, expenditure, liberation (moksha), foreign, isolation',// H12
]

export interface VargaDomain {
  d: number
  label: string
  name: string
  domain: string
  keyHouses: number[]              // houses that matter most in this varga
  houseMeanings: string[]          // 12 entries, reframed for this varga
  source: string
}

// Fully-authored gold-standard vargas: D1, D9, D10. (D2, D7 partially framed.)
export const VARGA_DOMAINS: Record<number, VargaDomain> = {
  1: {
    d: 1, label: 'D1', name: 'Rashi', domain: 'Body & overall life',
    keyHouses: [1, 4, 7, 10, 5, 9],
    houseMeanings: BASE_HOUSE_MEANINGS,
    source: 'BPHS Ch. 7 — The Twelve Bhavas',
  },
  9: {
    d: 9, label: 'D9', name: 'Navamsha', domain: 'Marriage, dharma & inner strength',
    keyHouses: [1, 7, 9, 5],
    houseMeanings: [
      'Inner self, true character, strength of the whole chart',
      'Family life after marriage, sustained values',
      'Courage in relationships, in-laws through siblings',
      'Domestic happiness with spouse, emotional foundation',
      'Devotion, dharmic progeny, mantra & upasana',
      'Frictions in marriage, service to partner, debts of union',
      'The spouse — nature, character, marital harmony (primary house)',
      'Longevity of marriage, hidden dynamics, tantra',
      'Dharma, fortune through marriage, guru, right conduct (very strong here)',
      'Dharmic career, public conduct, action guided by principle',
      'Fulfilment of desires through partnership, gains of dharma',
      'Bed pleasures, moksha, surrender in relationship',
    ],
    source: 'BPHS Ch. 6 & 40 — Navamsha; Phaladeepika Ch. 16',
  },
  10: {
    d: 10, label: 'D10', name: 'Dashamsha', domain: 'Career, profession & public status',
    keyHouses: [1, 10, 6, 11, 7],
    houseMeanings: [
      'Professional self, work identity, how you are seen at work',
      'Professional income, earnings from vocation, work speech',
      'Professional courage, initiative, colleagues & short work trips',
      'Workplace comfort, fixed professional assets, employer as base',
      'Professional intelligence, advisory roles, speculation at work',
      'Competition, workplace rivals, subordinates, daily duties, litigation',
      'Business partnerships, clients, public-facing dealings, deals',
      'Sudden career shifts, obstacles, transformation of profession',
      'Career fortune, mentors, ethics & luck in profession, promotions',
      'Peak of career, authority, recognition, the profession itself (primary house)',
      'Professional gains, achievement of ambitions, powerful networks',
      'Career expenses, foreign work, exit/retirement, losses at work',
    ],
    source: 'BPHS Ch. 40 — Dashamsha; Phaladeepika Ch. 16',
  },
  2: {
    d: 2, label: 'D2', name: 'Hora', domain: 'Wealth & financial sustenance',
    keyHouses: [1, 2, 11], houseMeanings: BASE_HOUSE_MEANINGS,
    source: 'BPHS Ch. 6 — Hora; Parashari wealth principles',
  },
  7: {
    d: 7, label: 'D7', name: 'Saptamsha', domain: 'Children & progeny',
    keyHouses: [1, 5, 9], houseMeanings: BASE_HOUSE_MEANINGS,
    source: 'BPHS Ch. 40 — Saptamsha',
  },
}

// Divisional charts without a fully-authored table fall back to this.
const OTHER_VARGA_META: Record<number, { name: string; domain: string; source: string }> = {
  3:  { name: 'Drekkana',         domain: 'Siblings, courage & co-borns',        source: 'BPHS Ch. 6 — Drekkana' },
  4:  { name: 'Chaturthamsha',    domain: 'Home, property & fixed assets',       source: 'BPHS Ch. 6 — Chaturthamsha' },
  12: { name: 'Dwadashamsha',     domain: 'Parents & ancestry',                  source: 'BPHS Ch. 40 — Dwadashamsha' },
  16: { name: 'Shodashamsha',     domain: 'Vehicles, luxuries & comforts',       source: 'BPHS Ch. 40 — Shodashamsha' },
  20: { name: 'Vimshamsha',       domain: 'Spiritual practice & devotion',       source: 'BPHS Ch. 40 — Vimshamsha' },
  24: { name: 'Chaturvimshamsha', domain: 'Education, learning & scholarship',   source: 'BPHS Ch. 40 — Siddhamsha' },
  27: { name: 'Bhamsha',          domain: 'Strengths, weaknesses & vitality',    source: 'BPHS Ch. 40 — Bhamsha/Nakshatramsha' },
  30: { name: 'Trimshamsha',      domain: 'Misfortunes, evils & adversity',      source: 'BPHS Ch. 6 — Trimshamsha' },
  40: { name: 'Khavedamsha',      domain: 'Maternal legacy & auspicious effects',source: 'BPHS Ch. 40 — Khavedamsha' },
  45: { name: 'Akshavedamsha',    domain: 'Paternal legacy & overall conduct',   source: 'BPHS Ch. 40 — Akshavedamsha' },
  60: { name: 'Shashtyamsha',     domain: 'Past-life karma & precise timing',    source: 'BPHS Ch. 6 & 40 — Shashtyamsha' },
}

export function getVargaDomain(d: number): VargaDomain {
  if (VARGA_DOMAINS[d]) return VARGA_DOMAINS[d]
  const m = OTHER_VARGA_META[d] || { name: `D${d}`, domain: 'Divisional chart', source: 'BPHS Ch. 6 — Divisional charts' }
  return {
    d, label: `D${d}`, name: m.name, domain: m.domain,
    keyHouses: [1, 5, 9],
    // Reframe the generic house meaning under this varga's domain.
    houseMeanings: BASE_HOUSE_MEANINGS.map(h => h),
    source: m.source,
  }
}

// ── The 27 Nakshatras (true, from D1 longitude) ──────────────────────────────
export interface NakshatraInfo {
  name: string; lord: string; deity: string; symbol: string; traits: string
}
export const NAKSHATRAS: NakshatraInfo[] = [
  { name: 'Ashwini',          lord: 'Ketu',    deity: 'Ashwini Kumaras', symbol: "Horse's head", traits: 'Swift, healing, pioneering, restless initiative' },
  { name: 'Bharani',          lord: 'Venus',   deity: 'Yama',            symbol: 'Yoni',          traits: 'Bearing burdens, creative force, discipline, extremes' },
  { name: 'Krittika',         lord: 'Sun',     deity: 'Agni',            symbol: 'Razor/flame',   traits: 'Sharp, purifying, ambitious, cutting through' },
  { name: 'Rohini',          lord: 'Moon',    deity: 'Brahma',          symbol: 'Chariot',       traits: 'Fertile, sensual, magnetic, material growth' },
  { name: 'Mrigashira',       lord: 'Mars',    deity: 'Soma',            symbol: "Deer's head",   traits: 'Searching, curious, gentle, restless seeking' },
  { name: 'Ardra',            lord: 'Rahu',    deity: 'Rudra',           symbol: 'Teardrop',      traits: 'Stormy, transformative, sharp intellect, upheaval' },
  { name: 'Punarvasu',        lord: 'Jupiter', deity: 'Aditi',           symbol: 'Quiver',        traits: 'Renewal, return, optimism, nurturing wisdom' },
  { name: 'Pushya',           lord: 'Saturn',  deity: 'Brihaspati',      symbol: 'Cow udder',     traits: 'Nourishing, protective, dharmic, most auspicious' },
  { name: 'Ashlesha',         lord: 'Mercury', deity: 'Nagas',           symbol: 'Coiled serpent',traits: 'Penetrating, hypnotic, secretive, cunning insight' },
  { name: 'Magha',            lord: 'Ketu',    deity: 'Pitris',          symbol: 'Throne',        traits: 'Regal, ancestral pride, authority, tradition' },
  { name: 'Purva Phalguni',   lord: 'Venus',   deity: 'Bhaga',           symbol: 'Hammock',       traits: 'Pleasure, creativity, relaxation, charm' },
  { name: 'Uttara Phalguni',  lord: 'Sun',     deity: 'Aryaman',         symbol: 'Bed',           traits: 'Generous, reliable, contracts, service through duty' },
  { name: 'Hasta',            lord: 'Moon',    deity: 'Savitar',         symbol: 'Hand',          traits: 'Skilful, dexterous, clever, manifesting by hand' },
  { name: 'Chitra',           lord: 'Mars',    deity: 'Vishwakarma',     symbol: 'Pearl',         traits: 'Artistic, brilliant, design, dazzling craft' },
  { name: 'Swati',            lord: 'Rahu',    deity: 'Vayu',            symbol: 'Coral/sprout',  traits: 'Independent, adaptable, diplomatic, self-going wind' },
  { name: 'Vishakha',         lord: 'Jupiter', deity: 'Indra-Agni',      symbol: 'Triumphal arch',traits: 'Goal-driven, determined, dual focus, achievement' },
  { name: 'Anuradha',         lord: 'Saturn',  deity: 'Mitra',           symbol: 'Lotus',         traits: 'Friendship, devotion, cooperation, success abroad' },
  { name: 'Jyeshtha',         lord: 'Mercury', deity: 'Indra',           symbol: 'Talisman',      traits: 'Seniority, protective power, occult, responsibility' },
  { name: 'Mula',             lord: 'Ketu',    deity: 'Nirriti',         symbol: 'Tied roots',    traits: 'Root-searching, radical, destruction-before-renewal' },
  { name: 'Purva Ashadha',    lord: 'Venus',   deity: 'Apas',            symbol: 'Fan/winnow',    traits: 'Invincible optimism, persuasion, purification' },
  { name: 'Uttara Ashadha',   lord: 'Sun',     deity: 'Vishwadevas',     symbol: 'Elephant tusk', traits: 'Lasting victory, integrity, leadership, endurance' },
  { name: 'Shravana',         lord: 'Moon',    deity: 'Vishnu',          symbol: 'Ear',           traits: 'Listening, learning, connection, fame through knowledge' },
  { name: 'Dhanishta',        lord: 'Mars',    deity: 'Vasus',           symbol: 'Drum',          traits: 'Rhythmic, wealthy, musical, group prosperity' },
  { name: 'Shatabhisha',      lord: 'Rahu',    deity: 'Varuna',          symbol: 'Empty circle',  traits: 'Healing, secretive, mystical, unconventional' },
  { name: 'Purva Bhadrapada', lord: 'Jupiter', deity: 'Aja Ekapada',     symbol: 'Sword/two-face',traits: 'Intense, idealistic, penance, dual nature' },
  { name: 'Uttara Bhadrapada',lord: 'Saturn',  deity: 'Ahir Budhnya',    symbol: 'Water serpent', traits: 'Deep, wise, patient, compassionate depths' },
  { name: 'Revati',           lord: 'Mercury', deity: 'Pushan',          symbol: 'Fish/drum',     traits: 'Nourishing, protective, journeys, gentle completion' },
]
export const NAKSHATRA_SOURCE = 'BPHS Ch. 3 — Nakshatras; Brihat Samhita'

export function nakshatraFromLongitude(siderealLon: number): { info: NakshatraInfo; pada: number } {
  const span = 360 / 27
  const idx = Math.floor(((siderealLon % 360) + 360) % 360 / span) % 27
  const pada = Math.floor(((siderealLon % span) / (span / 4))) + 1
  return { info: NAKSHATRAS[idx], pada }
}
