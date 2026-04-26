// East Indian (Bengali/Odiya) chart — 4x4 grid, Aries at top-left, clockwise
// Layout:
//   Aries(0)  | Taurus(1) | Gemini(2) | Cancer(3)
//   Pisces(11)|   [mid]   |   [mid]   | Leo(4)
//   Aquarius(10)|  [mid]  |   [mid]   | Virgo(5)
//   Capricorn(9)| Sagit(8)| Scorpio(7)| Libra(6)
import { useLang } from '../contexts/LanguageContext'

interface Planet { sign: string; sign_index: number; degree: number; retrograde: boolean; status?: string }
interface Ascendant { sign: string; sign_index: number; degree: number }
interface Props {
  ascendant: Ascendant
  planets: Record<string, Planet>
  planetHouseMap: Record<string, string[]>
  size?: number
  title?: string
}

const PLANET_SYMBOL: Record<string, string> = {
  Sun:'☀', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋',
}
const PLANET_COLORS: Record<string, string> = {
  Sun:'#D97706', Moon:'#0891B2', Mars:'#DC2626', Mercury:'#16A34A',
  Jupiter:'#B45309', Venus:'#7C3AED', Saturn:'#2563EB', Rahu:'#57534E', Ketu:'#9CA3AF',
}

// East Indian: Aries top-left, going right across top, down right side, across bottom right-to-left, up left side
const SIGN_GRID: [number, number][] = [
  [0, 0], // Aries(0) top-left
  [0, 1], // Taurus(1)
  [0, 2], // Gemini(2)
  [0, 3], // Cancer(3) top-right
  [1, 3], // Leo(4)
  [2, 3], // Virgo(5)
  [3, 3], // Libra(6) bottom-right
  [3, 2], // Scorpio(7)
  [3, 1], // Sagittarius(8)
  [3, 0], // Capricorn(9) bottom-left
  [2, 0], // Aquarius(10)
  [1, 0], // Pisces(11)
]

const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
const SIGN_SHORT_HI: Record<string, string> = {
  Aries:'मेष', Taurus:'वृष', Gemini:'मिथु', Cancer:'कर्क',
  Leo:'सिंह', Virgo:'कन्या', Libra:'तुला', Scorpio:'वृश्च',
  Sagittarius:'धनु', Capricorn:'मकर', Aquarius:'कुम्भ', Pisces:'मीन',
}

export default function EastIndianChart({ ascendant, planets, size = 400, title }: Props) {
  const { lang } = useLang()
  const cell = Math.floor(size / 4)
  const asc = ascendant.sign_index

  // Build sign → planets
  const signPlanets: Record<number, string[]> = {}
  for (const [name, p] of Object.entries(planets)) {
    const idx = p.sign_index
    if (!signPlanets[idx]) signPlanets[idx] = []
    signPlanets[idx].push(name + (p.retrograde ? '(R)' : ''))
  }

  const getSignLabel = (sign: string) => {
    if (lang === 'en') return sign.slice(0, 3)
    return SIGN_SHORT_HI[sign] || sign.slice(0, 3)
  }

  return (
    <svg width={size} height={size + (title ? 24 : 0)} style={{ fontFamily: 'var(--font)', display: 'block' }}>
      {title && <text x={size / 2} y={16} textAnchor="middle" fontSize={11} fontWeight="700" fill="var(--text3)">{title}</text>}
      <g transform={title ? 'translate(0,24)' : ''}>
        {/* Outer border */}
        <rect x={0} y={0} width={size} height={size} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.5} rx={4} />
        {/* Center label */}
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" fontSize={10} fill="var(--text3)" fontWeight="600">East Indian</text>
        <text x={size / 2} y={size / 2 + 8} textAnchor="middle" fontSize={10} fill="var(--text3)">Bengali Style</text>

        {SIGN_NAMES.map((sign, signIdx) => {
          const [row, col] = SIGN_GRID[signIdx]
          const x = col * cell
          const y = row * cell
          const isAsc = signIdx === asc
          const planetsHere = signPlanets[signIdx] || []
          const houseNum = ((signIdx - asc + 12) % 12) + 1

          return (
            <g key={signIdx}>
              <rect x={x} y={y} width={cell} height={cell}
                fill={isAsc ? 'var(--accent)18' : 'transparent'}
                stroke="var(--border)" strokeWidth={1} />
              {/* House number */}
              <text x={x + 4} y={y + 13} fontSize={9} fontWeight="700" fill="var(--text3)">{houseNum}</text>
              {/* Sign label */}
              <text x={x + cell / 2} y={y + 24} textAnchor="middle" fontSize={9} fontWeight="600" fill={isAsc ? 'var(--accent)' : 'var(--text3)'}>
                {getSignLabel(sign)}
              </text>
              {isAsc && <text x={x + cell - 4} y={y + 13} textAnchor="end" fontSize={8} fontWeight="800" fill="var(--accent)">Asc</text>}
              {/* Planets */}
              {planetsHere.map((pStr, pi) => {
                const pName = pStr.replace('(R)', '')
                const color = PLANET_COLORS[pName] || '#888'
                const sym = PLANET_SYMBOL[pName] || pName.slice(0, 2)
                return (
                  <text key={pi} x={x + cell / 2} y={y + 38 + pi * 13} textAnchor="middle" fontSize={10} fill={color} fontWeight="600">
                    {sym}{pStr.includes('(R)') ? 'ᴿ' : ''}
                  </text>
                )
              })}
            </g>
          )
        })}

        {/* Inner grid lines to separate middle 2×2 */}
        <line x1={cell} y1={cell} x2={3 * cell} y2={cell} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="4,4" />
        <line x1={cell} y1={3 * cell} x2={3 * cell} y2={3 * cell} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="4,4" />
        <line x1={cell} y1={cell} x2={cell} y2={3 * cell} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="4,4" />
        <line x1={3 * cell} y1={cell} x2={3 * cell} y2={3 * cell} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="4,4" />
      </g>
    </svg>
  )
}
