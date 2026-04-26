/**
 * Transit Wheel — dual-ring zodiac chart.
 * Inner ring: natal planets. Outer ring: transiting planets.
 * Planets positioned by actual ecliptic longitude.
 * Pure SVG.
 */

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
}
const PLANET_COLORS: Record<string, string> = {
  Sun: '#f59e0b', Moon: '#8b5cf6', Mars: '#ef4444',
  Mercury: '#10b981', Jupiter: '#f97316', Venus: '#ec4899',
  Saturn: '#3b82f6', Rahu: '#64748b', Ketu: '#84cc16',
}

const SIGN_GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']

const CX = 200, CY = 200
const OUTER_RING_R = 170   // transit planet dots
const SIGN_RING_R  = 148   // zodiac sign labels
const SIGN_LINE_R  = 134   // sign division lines
const NATAL_RING_R = 108   // natal planet dots
const INNER_R      = 72    // inner circle

function lonToXY(lon: number, r: number): [number, number] {
  // 0° Aries = top (−90°), clockwise
  const angle = ((lon - 90) * Math.PI) / 180
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]
}

function spreadOverlap(planets: [string, number][], r: number, spreadDeg = 10): [string, number, number, number][] {
  // Returns [name, lon, x, y] with slight angular spread to avoid overlap
  const sorted = [...planets].sort((a, b) => a[1] - b[1])
  const result: [string, number, number, number][] = []
  let lastAngle = -999
  for (const [name, lon] of sorted) {
    let angle = lon
    if (Math.abs(angle - lastAngle) < spreadDeg) {
      angle = lastAngle + spreadDeg
    }
    const [x, y] = lonToXY(angle, r)
    result.push([name, lon, x, y])
    lastAngle = angle
  }
  return result
}

interface Props {
  natalPlanets: Record<string, { longitude: number; sign?: string }>
  transitPlanets: Record<string, { longitude: number; sign?: string }>
  ascendantLon?: number
}

export default function TransitWheel({ natalPlanets, transitPlanets, ascendantLon }: Props) {
  const natalEntries = Object.entries(natalPlanets).map(([n, d]) => [n, d.longitude] as [string, number])
  const transitEntries = Object.entries(transitPlanets).map(([n, d]) => [n, d.longitude] as [string, number])

  const spreadNatal   = spreadOverlap(natalEntries, NATAL_RING_R, 8)
  const spreadTransit = spreadOverlap(transitEntries, OUTER_RING_R, 8)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={400} height={400} viewBox="0 0 400 400">
        {/* Outermost background */}
        <circle cx={CX} cy={CY} r={OUTER_RING_R + 22} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />

        {/* Transit ring background */}
        <circle cx={CX} cy={CY} r={OUTER_RING_R + 16} fill="none" stroke="#1e293b" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={SIGN_LINE_R} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />

        {/* Zodiac sign segments */}
        {Array.from({ length: 12 }, (_, i) => {
          const startDeg = i * 30
          const midDeg   = startDeg + 15
          // Division line
          const [lx1, ly1] = lonToXY(startDeg, SIGN_LINE_R)
          const [lx2, ly2] = lonToXY(startDeg, SIGN_RING_R + 14)
          // Sign label
          const [sx, sy] = lonToXY(midDeg, (SIGN_LINE_R + SIGN_RING_R + 16) / 2)
          return (
            <g key={i}>
              <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke="#334155" strokeWidth={1} />
              <text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#64748b">
                {SIGN_GLYPHS[i]}
              </text>
            </g>
          )
        })}

        {/* Natal ring */}
        <circle cx={CX} cy={CY} r={NATAL_RING_R + 16} fill="none" stroke="#1e293b" strokeWidth={0.5} />
        <circle cx={CX} cy={CY} r={NATAL_RING_R - 16} fill="none" stroke="#1e293b" strokeWidth={0.5} />

        {/* Ascendant line */}
        {ascendantLon !== undefined && (() => {
          const [x1, y1] = lonToXY(ascendantLon, INNER_R)
          const [x2, y2] = lonToXY(ascendantLon, OUTER_RING_R + 16)
          return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.7} />
        })()}

        {/* Lines connecting natal to transit same planet */}
        {spreadNatal.map(([name, _nLon, nx, ny]) => {
          const transit = spreadTransit.find(([tn]) => tn === name)
          if (!transit) return null
          const [, , tx, ty] = transit
          const c = PLANET_COLORS[name] || '#64748b'
          return <line key={name + '_line'} x1={nx} y1={ny} x2={tx} y2={ty} stroke={c} strokeWidth={0.6} opacity={0.3} strokeDasharray="3,3" />
        })}

        {/* Natal planet dots (inner ring) */}
        {spreadNatal.map(([name, _lon, x, y]) => {
          const c = PLANET_COLORS[name] || '#64748b'
          return (
            <g key={name + '_natal'}>
              <circle cx={x} cy={y} r={13} fill="#0f172a" stroke={c} strokeWidth={1.5} />
              <text x={x} y={y - 1} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill={c} fontWeight={700}>
                {PLANET_SYMBOLS[name] || name[0]}
              </text>
              <text x={x} y={y + 8} textAnchor="middle" dominantBaseline="middle" fontSize={6} fill={c} opacity={0.7}>
                {name.slice(0,3)}
              </text>
            </g>
          )
        })}

        {/* Transit planet dots (outer ring) */}
        {spreadTransit.map(([name, _lon, x, y]) => {
          const c = PLANET_COLORS[name] || '#64748b'
          return (
            <g key={name + '_transit'}>
              <circle cx={x} cy={y} r={13} fill="#1e293b" stroke={c} strokeWidth={2} />
              <text x={x} y={y - 1} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill={c} fontWeight={700}>
                {PLANET_SYMBOLS[name] || name[0]}
              </text>
              <text x={x} y={y + 8} textAnchor="middle" dominantBaseline="middle" fontSize={6} fill={c} opacity={0.8}>
                {name.slice(0,3)}
              </text>
            </g>
          )
        })}

        {/* Inner circle */}
        <circle cx={CX} cy={CY} r={INNER_R} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />
        <text x={CX} y={CY - 8} textAnchor="middle" fontSize={11} fill="#475569" fontWeight={700}>Transit</text>
        <text x={CX} y={CY + 6} textAnchor="middle" fontSize={9} fill="#334155">outer ring</text>
        <text x={CX} y={CY + 18} textAnchor="middle" fontSize={9} fill="#334155">Natal = inner</text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, fontSize: 11, flexWrap: 'wrap', justifyContent: 'center', color: '#94a3b8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={24} height={16}>
            <circle cx={12} cy={8} r={7} fill="#0f172a" stroke="#3b82f6" strokeWidth={1.5} />
          </svg>
          Natal (inner)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={24} height={16}>
            <circle cx={12} cy={8} r={7} fill="#1e293b" stroke="#3b82f6" strokeWidth={2} />
          </svg>
          Transit (outer)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={24} height={16}>
            <line x1={2} y1={8} x2={22} y2={8} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,3" />
          </svg>
          Ascendant
        </div>
      </div>
    </div>
  )
}
