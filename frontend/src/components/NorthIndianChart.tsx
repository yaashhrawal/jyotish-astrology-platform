import { useState } from 'react'
import type { Planet } from '../api/jyotish'
import { useLang } from '../contexts/LanguageContext'
import { PLANETS as PLANET_DICT, SIGNS as SIGN_DICT, NAKSHATRAS as NAKSHATRA_DICT } from '../i18n/terms'

interface BhavaMadhyaEntry { house: number; madhya_sign: string; madhya_degree: number }

interface Props {
  ascendant: { sign: string; sign_index: number; degree: number }
  planets: Record<string, Planet>
  planetHouseMap: Record<string, string[]>
  size?: number
  title?: string
  onHouseSelect?: (house: number | null) => void
  onPlanetSelect?: (planet: string) => void
  compact?: boolean          // board mode: responsive width, no inline side panel
  bhavaMadhya?: BhavaMadhyaEntry[]
}

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke'
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const HOUSE_MEANINGS: Record<number, string> = {
  1: 'Self, body, personality, health',
  2: 'Wealth, family, speech, food',
  3: 'Courage, siblings, communication',
  4: 'Home, mother, property, comforts',
  5: 'Children, intelligence, creativity',
  6: 'Health, enemies, debts, service',
  7: 'Marriage, partnerships, business',
  8: 'Longevity, secrets, transformation',
  9: 'Dharma, father, luck, higher learning',
  10: 'Career, status, authority, action',
  11: 'Gains, friends, desires, social circle',
  12: 'Loss, liberation, expenses, foreign'
}

const SIGNS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
]

// North Indian: H1 top, counterclockwise order
const HOUSES: Record<number, { pts: string; cx: number; cy: number }> = {
  1:  { pts: "200,0 300,100 200,200 100,100",   cx: 200, cy: 100 },
  2:  { pts: "0,0 200,0 100,100",               cx: 100, cy: 50  },
  3:  { pts: "0,0 100,100 0,200",               cx: 30,  cy: 130 },
  4:  { pts: "0,200 100,100 200,200 100,300",   cx: 100, cy: 200 },
  5:  { pts: "0,400 0,200 100,300",             cx: 30,  cy: 270 },
  6:  { pts: "200,400 0,400 100,300",           cx: 100, cy: 360 },
  7:  { pts: "200,400 300,300 200,200 100,300", cx: 200, cy: 300 },
  8:  { pts: "400,400 200,400 300,300",         cx: 300, cy: 360 },
  9:  { pts: "400,200 400,400 300,300",         cx: 370, cy: 270 },
  10: { pts: "400,200 300,100 200,200 300,300", cx: 300, cy: 200 },
  11: { pts: "400,0 400,200 300,100",           cx: 370, cy: 130 },
  12: { pts: "200,0 400,0 300,100",             cx: 300, cy: 50  },
}

// ── Vedic aspect (drishti) rules ─────────────────────────────────────────────
// Returns list of houses aspected by a planet in `fromHouse`
function aspectedHouses(fromHouse: number, planetName: string): number[] {
  const h = fromHouse
  const wrap = (n: number) => ((n - 1 + 12) % 12) + 1
  const houses = [wrap(h + 6)] // 7th aspect — all planets
  if (planetName === 'Mars')    { houses.push(wrap(h + 3), wrap(h + 7)) }
  if (planetName === 'Jupiter') { houses.push(wrap(h + 4), wrap(h + 8)) }
  if (planetName === 'Saturn')  { houses.push(wrap(h + 2), wrap(h + 9)) }
  return houses
}

// For a selected house, which planets cast drishti on it?
function getPlanetsAspecting(houseNum: number, planets: Record<string, Planet>): { planet: string; fromHouse: number; aspectType: string }[] {
  const result: { planet: string; fromHouse: number; aspectType: string }[] = []
  for (const [name, p] of Object.entries(planets)) {
    const ph = p.house
    if (!ph) continue
    const wrap = (n: number) => ((n - 1 + 12) % 12) + 1

    // 7th aspect
    if (wrap(ph + 6) === houseNum) result.push({ planet: name, fromHouse: ph, aspectType: '7th' })
    // Mars 4th & 8th
    if (name === 'Mars') {
      if (wrap(ph + 3) === houseNum) result.push({ planet: name, fromHouse: ph, aspectType: '4th' })
      if (wrap(ph + 7) === houseNum) result.push({ planet: name, fromHouse: ph, aspectType: '8th' })
    }
    // Jupiter 5th & 9th
    if (name === 'Jupiter') {
      if (wrap(ph + 4) === houseNum) result.push({ planet: name, fromHouse: ph, aspectType: '5th' })
      if (wrap(ph + 8) === houseNum) result.push({ planet: name, fromHouse: ph, aspectType: '9th' })
    }
    // Saturn 3rd & 10th
    if (name === 'Saturn') {
      if (wrap(ph + 2) === houseNum) result.push({ planet: name, fromHouse: ph, aspectType: '3rd' })
      if (wrap(ph + 9) === houseNum) result.push({ planet: name, fromHouse: ph, aspectType: '10th' })
    }
  }
  return result
}

// Houses highlighted when a planet is hovered (shows its rays of influence)
function getAspectHighlights(hoveredPlanet: string | null, planets: Record<string, Planet>): Set<number> {
  if (!hoveredPlanet) return new Set()
  const p = planets[hoveredPlanet]
  if (!p?.house) return new Set()
  return new Set(aspectedHouses(p.house, hoveredPlanet))
}

export default function NorthIndianChart({ ascendant, planets, planetHouseMap, size = 420, title, onHouseSelect, onPlanetSelect, compact, bhavaMadhya }: Props) {
  const { lang } = useLang()
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null)
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null)

  // Planet abbreviation: in Sanskrit/Hindi use Devanagari, else latin
  const PLANET_SYMBOLS_DEVA: Record<string, string> = {
    Sun: 'सू', Moon: 'चं', Mars: 'मं', Mercury: 'बु',
    Jupiter: 'गु', Venus: 'शु', Saturn: 'श', Rahu: 'रा', Ketu: 'के'
  }
  const getPlanetSym = (p: string) => lang === 'en'
    ? (PLANET_SYMBOLS[p] || p.slice(0, 2))
    : (PLANET_SYMBOLS_DEVA[p] || p.slice(0, 2))

  const getSignLabel = (sign: string) => {
    const entry = SIGN_DICT[sign]
    if (!entry) return sign.slice(0, 3)
    const translated = entry[lang]
    // For Devanagari, use full short form — signs have natural short names (मेष/वृष/मिथु etc)
    if (lang === 'en') return translated.slice(0, 3)
    // Use predefined short forms for Devanagari
    const shortForms: Record<string, { hi: string; sa: string }> = {
      Aries: { hi: 'मेष', sa: 'मेष' }, Taurus: { hi: 'वृष', sa: 'वृष' },
      Gemini: { hi: 'मिथु', sa: 'मिथु' }, Cancer: { hi: 'कर्क', sa: 'कर्क' },
      Leo: { hi: 'सिंह', sa: 'सिंह' }, Virgo: { hi: 'कन्या', sa: 'कन्या' },
      Libra: { hi: 'तुला', sa: 'तुला' }, Scorpio: { hi: 'वृश्च', sa: 'वृश्च' },
      Sagittarius: { hi: 'धनु', sa: 'धनु' }, Capricorn: { hi: 'मकर', sa: 'मकर' },
      Aquarius: { hi: 'कुम्भ', sa: 'कुम्भ' }, Pisces: { hi: 'मीन', sa: 'मीन' },
    }
    return shortForms[sign]?.[lang] || translated.slice(0, 4)
  }

  const getHouseSign = (h: number) => SIGNS[(ascendant.sign_index + h - 1) % 12]
  const getPlanetsInHouse = (h: number): string[] => planetHouseMap[h] || []
  const aspectHighlights = getAspectHighlights(hoveredPlanet, planets)

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap', width: compact ? '100%' : undefined }}>
      <div style={{ flexShrink: compact ? 1 : 0, width: compact ? '100%' : undefined }}>
        {title && (
          <div style={{
            fontSize: '10.5px', fontWeight: '600', letterSpacing: '1.5px',
            textAlign: 'center', marginBottom: '8px',
            color: 'var(--text3)', textTransform: 'uppercase',
          }}>{title}</div>
        )}
        <svg
          width={compact ? '100%' : size} height={compact ? undefined : size} viewBox="0 0 400 400"
          style={{
            border: '1px solid var(--border)', borderRadius: '10px',
            background: 'var(--surface)', boxShadow: 'var(--shadow-m)', display: 'block',
            width: compact ? '100%' : size, height: compact ? 'auto' : size, aspectRatio: compact ? '1' : undefined,
          }}
        >
          {/* Grid lines */}
          <line x1="0" y1="0" x2="400" y2="400" stroke="#ECEAE4" strokeWidth="1" />
          <line x1="400" y1="0" x2="0" y2="400" stroke="#ECEAE4" strokeWidth="1" />
          <line x1="200" y1="0" x2="400" y2="200" stroke="#ECEAE4" strokeWidth="1" />
          <line x1="400" y1="200" x2="200" y2="400" stroke="#ECEAE4" strokeWidth="1" />
          <line x1="200" y1="400" x2="0" y2="200" stroke="#ECEAE4" strokeWidth="1" />
          <line x1="0" y1="200" x2="200" y2="0" stroke="#ECEAE4" strokeWidth="1" />
          <polygon points="200,0 400,200 200,400 0,200" fill="none" stroke="#D4D1C9" strokeWidth="1.5" />

          {/* Lagna center */}
          <text x="200" y="193" textAnchor="middle" fill="var(--accent)" fontSize="10" fontFamily="'Noto Sans Devanagari',Inter,sans-serif" fontWeight="600" letterSpacing="0.5">
            {getSignLabel(ascendant.sign).toUpperCase()}
          </text>
          <text x="200" y="206" textAnchor="middle" fill="var(--text3)" fontSize="8" fontFamily="Inter,sans-serif">
            {ascendant.degree.toFixed(1)}°
          </text>
          <text x="200" y="218" textAnchor="middle" fill="var(--accent)" fontSize="8" fontFamily="'Noto Sans Devanagari',Inter,sans-serif" fontWeight="600">
            {lang === 'en' ? 'Asc' : lang === 'hi' ? 'लग्न' : 'लग्नम्'}
          </text>

          {/* Houses */}
          {Object.entries(HOUSES).map(([hNum, cell]) => {
            const h = parseInt(hNum)
            const housePlanets = getPlanetsInHouse(h)
            const isSelected = selectedHouse === h
            const isAspectTarget = aspectHighlights.has(h)
            const isKendra = [1,4,7,10].includes(h)
            const sign = getHouseSign(h)

            let fillColor = 'var(--surface)'
            if (isSelected) fillColor = '#EEF0FB'
            else if (isAspectTarget) fillColor = '#FFF7ED'
            else if (isKendra) fillColor = '#FAFAF8'

            return (
              <g key={h} onClick={() => { if (compact) { onHouseSelect?.(h); return } const next = isSelected ? null : h; setSelectedHouse(next); onHouseSelect?.(next) }} style={{ cursor: 'pointer' }}>
                <polygon
                  points={cell.pts}
                  fill={fillColor}
                  stroke={isSelected ? 'var(--accent)' : isAspectTarget ? '#D97706' : 'var(--border)'}
                  strokeWidth={isSelected || isAspectTarget ? 1.5 : 1}
                  style={{ transition: 'fill .2s, stroke .2s' }}
                />
                {/* Rashi (sign) number — traditional North Indian convention */}
                <text x={cell.cx} y={cell.cy - 9} textAnchor="middle" fill="#C4C0B8" fontSize="8" fontFamily="Inter,sans-serif">
                  {SIGNS.indexOf(sign) + 1}
                </text>
                {/* Sign */}
                <text x={cell.cx} y={cell.cy + 3} textAnchor="middle" fill="#A8A29E" fontSize="9" fontFamily="'Noto Sans Devanagari',Inter,sans-serif" fontWeight="500">
                  {getSignLabel(sign)}
                </text>
                {/* Bhava Madhya midpoint */}
                {bhavaMadhya && (() => {
                  const bm = bhavaMadhya.find(b => b.house === h)
                  return bm ? (
                    <text x={cell.cx} y={cell.cy + 14} textAnchor="middle" fill="#7C3AED" fontSize="7.5" fontFamily="Inter,sans-serif" opacity="0.75">
                      ◆{bm.madhya_sign.slice(0,3)} {bm.madhya_degree.toFixed(0)}°
                    </text>
                  ) : null
                })()}
                {/* Aspect indicator dot */}
                {isAspectTarget && !isSelected && (
                  <circle cx={cell.cx + 14} cy={cell.cy - 12} r="3" fill="#D97706" opacity="0.7" />
                )}
                {/* Planets */}
                {housePlanets.map((planet, i) => (
                  <text
                    key={planet}
                    x={cell.cx}
                    y={cell.cy + 16 + i * 13}
                    textAnchor="middle"
                    fill={PLANET_COLORS[planet] || 'var(--accent)'}
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="'Noto Sans Devanagari',Inter,sans-serif"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => { e.stopPropagation(); setHoveredPlanet(planet) }}
                    onMouseLeave={() => setHoveredPlanet(null)}
                    onClick={e => { e.stopPropagation(); onPlanetSelect?.(planet) }}
                  >
                    {getPlanetSym(planet)}
                    {planets[planet]?.retrograde ? 'ᴿ' : ''}
                  </text>
                ))}
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        {hoveredPlanet && (
          <div style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--text3)', textAlign: 'center' }}>
            <span style={{ color: PLANET_COLORS[hoveredPlanet] || 'var(--accent)', fontWeight: '600', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
              {lang === 'en' ? hoveredPlanet : (PLANET_DICT[hoveredPlanet]?.[lang] || hoveredPlanet)}
            </span>
            {lang === 'en' ? "'s drishti highlighted in " : lang === 'hi' ? ' की दृष्टि ' : ' दृष्टिः '}
            <span style={{ color: '#D97706' }}>{lang === 'en' ? 'amber' : 'चिह्नित'}</span>
          </div>
        )}
      </div>

      {/* House detail panel */}
      {!compact && selectedHouse !== null && (
        <div className="anim-scale-in" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '18px', minWidth: '240px', maxWidth: '280px',
          boxShadow: 'var(--shadow-m)',
        }}>
          {/* House header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent)', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                {lang === 'en' ? `House ${selectedHouse}` : lang === 'hi' ? `भाव ${selectedHouse}` : `भावः ${selectedHouse}`}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '500', marginTop: '2px', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                {SIGN_DICT[getHouseSign(selectedHouse)]?.[lang] || getHouseSign(selectedHouse)}
              </div>
            </div>
            <button onClick={() => setSelectedHouse(null)} style={{
              width: '26px', height: '26px', border: 'none', borderRadius: '50%',
              background: 'var(--surface2)', color: 'var(--text3)', cursor: 'pointer',
              fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>

          <div style={{
            fontSize: '11.5px', color: 'var(--text3)', lineHeight: 1.5,
            padding: '8px 10px', background: 'var(--surface2)',
            borderRadius: '6px', marginBottom: '14px',
          }}>
            {HOUSE_MEANINGS[selectedHouse]}
          </div>

          {/* Planets in this house */}
          {getPlanetsInHouse(selectedHouse).length > 0 && (
            <>
              <div style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '7px' }}>
                Planets here
              </div>
              {getPlanetsInHouse(selectedHouse).map(name => {
                const p = planets[name]
                if (!p) return null
                return (
                  <div key={name} style={{
                    padding: '9px 11px', borderRadius: '7px', marginBottom: '5px',
                    background: 'var(--surface2)',
                    borderLeft: `3px solid ${PLANET_COLORS[name] || 'var(--accent)'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: PLANET_COLORS[name] || 'var(--accent)', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                        {lang === 'en' ? name : (PLANET_DICT[name]?.[lang] || name)} {p.retrograde ? <span style={{ color: 'var(--red)', fontSize: '10px' }}>(वक्र)</span> : ''}
                      </span>
                      {p.status && p.status !== 'normal' && (
                        <span style={{
                          fontSize: '10px', padding: '1px 6px', borderRadius: '20px', fontWeight: '600',
                          background: p.status === 'exalted' ? 'var(--green-bg)' : p.status === 'debilitated' ? 'var(--red-bg)' : 'var(--accent-bg)',
                          color: p.status === 'exalted' ? 'var(--green)' : p.status === 'debilitated' ? 'var(--red)' : 'var(--accent)',
                        }}>
                          {p.status === 'exalted' ? '↑' : p.status === 'debilitated' ? '↓' : '◈'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text2)', marginTop: '3px', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                      {p.degree.toFixed(2)}° {SIGN_DICT[p.sign]?.[lang] || p.sign}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                      {lang === 'en' ? p.nakshatra : (p.nakshatra ? (NAKSHATRA_DICT[p.nakshatra]?.[lang] || p.nakshatra) : '')} · {lang === 'en' ? 'Pada' : 'पाद'} {p.pada}
                    </div>
                  </div>
                )
              })}
              <div style={{ height: '10px' }} />
            </>
          )}

          {/* Drishti — planets aspecting this house */}
          {(() => {
            const aspecting = getPlanetsAspecting(selectedHouse, planets)
            return (
              <>
                <div style={{
                  fontSize: '10.5px', fontWeight: '600', color: 'var(--text3)',
                  letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '7px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
                  Drishti (aspects on this house)
                </div>
                {aspecting.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text4)', fontStyle: 'italic', padding: '6px 0' }}>
                    No planets aspect this house
                  </div>
                ) : (
                  aspecting.map(({ planet, fromHouse, aspectType }) => (
                    <div key={`${planet}-${aspectType}`} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 10px', borderRadius: '6px', marginBottom: '4px',
                      background: '#FFF7ED', border: '1px solid #FDE68A',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: PLANET_COLORS[planet] || 'var(--text3)', display: 'block', flexShrink: 0 }} />
                        <span style={{ fontSize: '12.5px', fontWeight: '600', color: PLANET_COLORS[planet] || 'var(--text)' }}>
                          {planet}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>from H{fromHouse}</span>
                      </div>
                      <span style={{
                        fontSize: '10.5px', fontWeight: '600', padding: '1px 7px',
                        borderRadius: '20px', background: '#FEF3C7', color: '#B45309',
                      }}>
                        {aspectType} aspect
                      </span>
                    </div>
                  ))
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
