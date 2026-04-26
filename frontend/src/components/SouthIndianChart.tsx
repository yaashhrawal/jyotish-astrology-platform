// South Indian chart — fixed sign grid (Aries top-row-second from left, clockwise)
// Signs are fixed; ascendant and planets placed by sign
import { useLang } from '../contexts/LanguageContext'
import { PLANETS as PLANET_DICT, SIGNS as SIGN_DICT } from '../i18n/terms'

interface Planet {
  sign: string; sign_index: number; degree: number
  retrograde: boolean; house: number; status?: string
}
interface Ascendant { sign: string; sign_index: number; degree: number }

interface Props {
  ascendant: Ascendant
  planets: Record<string, Planet>
  planetHouseMap: Record<string, string[]>
  size?: number
  title?: string
  onHouseSelect?: (house: number | null) => void
}

const SIGNS = [
  'Aries','Taurus','Gemini','Cancer',
  'Leo','Virgo','Libra','Scorpio',
  'Sagittarius','Capricorn','Aquarius','Pisces',
]

// South Indian fixed grid layout — sign index -> [row, col] (0-indexed, 4x4 grid, center 4 cells empty)
// Row 0: Pisces(11), Aries(0), Taurus(1), Gemini(2)
// Row 1: Aquarius(10), [empty], [empty], Cancer(3)
// Row 2: Capricorn(9), [empty], [empty], Leo(4)
// Row 3: Sagittarius(8), Scorpio(7), Libra(6), Virgo(5)
const SIGN_GRID: [number, number][] = [
  [0, 1], // Aries
  [0, 2], // Taurus
  [0, 3], // Gemini
  [1, 3], // Cancer
  [2, 3], // Leo
  [3, 3], // Virgo
  [3, 2], // Libra
  [3, 1], // Scorpio
  [3, 0], // Sagittarius
  [2, 0], // Capricorn
  [1, 0], // Aquarius
  [0, 0], // Pisces
]

const PLANET_SYMBOL: Record<string, string> = {
  Sun: '☀', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
}
const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#9CA3AF',
}

export default function SouthIndianChart({ ascendant, planets, size = 400, title, onHouseSelect }: Props) {
  const { lang } = useLang()
  const cell = Math.floor(size / 4)
  const ascSignIdx = ascendant.sign_index
  const PLANET_SYMBOLS_DEVA: Record<string, string> = {
    Sun: 'रवि', Moon: 'चं', Mars: 'मं', Mercury: 'बु',
    Jupiter: 'गु', Venus: 'शु', Saturn: 'श', Rahu: 'रा', Ketu: 'के'
  }
  const getPlanetLabel = (name: string) => lang === 'en'
    ? (PLANET_SYMBOL[name] || name.slice(0, 2))
    : (PLANET_SYMBOLS_DEVA[name] || name.slice(0, 2))
  const getSignLabel = (sign: string) => {
    if (lang === 'en') return sign.slice(0, 3)
    const shortForms: Record<string, { hi: string; sa: string }> = {
      Aries: { hi: 'मेष', sa: 'मेष' }, Taurus: { hi: 'वृष', sa: 'वृष' },
      Gemini: { hi: 'मिथु', sa: 'मिथु' }, Cancer: { hi: 'कर्क', sa: 'कर्क' },
      Leo: { hi: 'सिंह', sa: 'सिंह' }, Virgo: { hi: 'कन्या', sa: 'कन्या' },
      Libra: { hi: 'तुला', sa: 'तुला' }, Scorpio: { hi: 'वृश्च', sa: 'वृश्च' },
      Sagittarius: { hi: 'धनु', sa: 'धनु' }, Capricorn: { hi: 'मकर', sa: 'मकर' },
      Aquarius: { hi: 'कुम्भ', sa: 'कुम्भ' }, Pisces: { hi: 'मीन', sa: 'मीन' },
    }
    return shortForms[sign]?.[lang] || (SIGN_DICT[sign]?.[lang] || sign).slice(0, 4)
  }

  // Build sign -> planet list
  const signPlanets: Record<number, { name: string; planet: Planet }[]> = {}
  for (const [name, p] of Object.entries(planets)) {
    const idx = p.sign_index
    if (!signPlanets[idx]) signPlanets[idx] = []
    signPlanets[idx].push({ name, planet: p })
  }

  const isCenter = (r: number, c: number) => r >= 1 && r <= 2 && c >= 1 && c <= 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {title && (
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</div>
      )}
      <svg width={size} height={size} style={{ fontFamily: 'inherit' }}>
        {/* Outer border */}
        <rect x={0} y={0} width={size} height={size} fill="var(--surface)" stroke="var(--border2)" strokeWidth={1.5} rx={4} />

        {/* Grid cells */}
        {Array.from({ length: 4 }, (_, row) =>
          Array.from({ length: 4 }, (_, col) => {
            if (isCenter(row, col)) return null

            // Find which sign is at this cell
            const signIdx = SIGN_GRID.findIndex(([r, c]) => r === row && c === col)
            if (signIdx < 0) return null

            const house = ((signIdx - ascSignIdx + 12) % 12) + 1
            const planetsInSign = signPlanets[signIdx] || []
            const isAsc = signIdx === ascSignIdx
            const x = col * cell
            const y = row * cell

            return (
              <g key={`${row}-${col}`} onClick={() => onHouseSelect?.(house)} style={{ cursor: 'pointer' }}>
                {/* Cell background */}
                <rect x={x} y={y} width={cell} height={cell}
                  fill={isAsc ? 'rgba(87,70,175,.06)' : 'var(--surface)'}
                  stroke="var(--border)" strokeWidth={1}
                />

                {/* Sign label (top-left, fixed) */}
                <text x={x + 5} y={y + 13} fontSize={9} fill="var(--text4)" fontWeight="500" fontFamily="'Noto Sans Devanagari',sans-serif">
                  {getSignLabel(SIGNS[signIdx])}
                </text>

                {/* House number */}
                <text x={x + cell - 5} y={y + 13} fontSize={8} fill="var(--text4)" textAnchor="end">
                  {house}
                </text>

                {/* Ascendant mark */}
                {isAsc && (
                  <text x={x + 5} y={y + 24} fontSize={8} fill="var(--accent)" fontWeight="700" fontFamily="'Noto Sans Devanagari',sans-serif">
                    {lang === 'en' ? 'Asc' : lang === 'hi' ? 'लग्न' : 'लग्नम्'}
                  </text>
                )}

                {/* Planets */}
                {planetsInSign.map(({ name, planet }, pi) => {
                  const col2 = pi % 2
                  const row2 = Math.floor(pi / 2)
                  const px = x + 6 + col2 * (cell / 2 - 4)
                  const py = y + (isAsc ? 34 : 22) + row2 * 18
                  return (
                    <g key={name}>
                      <text x={px} y={py} fontSize={11} fill={PLANET_COLORS[name] || 'var(--text)'} fontWeight="700" fontFamily="'Noto Sans Devanagari',sans-serif">
                        {getPlanetLabel(name)}
                      </text>
                      <text x={px} y={py + 10} fontSize={8} fill={PLANET_COLORS[name] || 'var(--text3)'} fontFamily="'Noto Sans Devanagari',sans-serif">
                        {lang === 'en' ? name.slice(0, 2) : (PLANET_DICT[name]?.[lang]?.slice(0, 2) || name.slice(0, 2))}{planet.retrograde ? 'ᴿ' : ''} {planet.degree.toFixed(0)}°
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })
        )}

        {/* Center box — chart name */}
        <rect x={cell} y={cell} width={cell * 2} height={cell * 2} fill="var(--surface2)" stroke="var(--border)" strokeWidth={1} />
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" fontSize={11} fill="var(--text2)" fontWeight="600" fontFamily="'Noto Sans Devanagari',sans-serif">
          {SIGN_DICT[ascendant.sign]?.[lang] || ascendant.sign}
        </text>
        <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fontSize={9} fill="var(--text4)" fontFamily="'Noto Sans Devanagari',sans-serif">
          {lang === 'en' ? 'Lagna' : lang === 'hi' ? 'लग्न' : 'लग्नम्'} {ascendant.degree.toFixed(1)}°
        </text>
        <text x={size / 2} y={size / 2 + 18} textAnchor="middle" fontSize={8} fill="var(--text4)">
          South Indian
        </text>
      </svg>
    </div>
  )
}
