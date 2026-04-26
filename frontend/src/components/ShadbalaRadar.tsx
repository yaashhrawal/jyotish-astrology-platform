/**
 * Shadbala Spider/Radar Chart — 6 axes (balas), 7 planets overlaid.
 * Pure SVG, no external deps.
 */

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
const PLANET_COLORS: Record<string, string> = {
  Sun: '#f59e0b', Moon: '#8b5cf6', Mars: '#ef4444',
  Mercury: '#10b981', Jupiter: '#f97316', Venus: '#ec4899', Saturn: '#3b82f6',
}

const AXES = [
  { key: 'sthana_bala', label: 'Sthana', max: 60 },
  { key: 'dig_bala',    label: 'Dig',    max: 60 },
  { key: 'kala_bala',   label: 'Kala',   max: 60 },
  { key: 'naisargika_bala', label: 'Naisargika', max: 60 },
  { key: 'drik_bala',   label: 'Drik',   max: 30 },
  { key: 'total_rupas', label: 'Total',  max: 20 },  // normalize to ratio
]

const N = AXES.length
const CX = 160
const CY = 160
const R = 120
const LEVELS = 4

function polarToXY(angle: number, r: number): [number, number] {
  const a = angle - Math.PI / 2
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
}

function axisAngle(i: number): number {
  return (2 * Math.PI * i) / N
}

interface Props {
  data: Record<string, any>  // planet → shadbala object
  selected?: string | null
  onSelect?: (p: string | null) => void
}

export default function ShadbalaRadar({ data, selected, onSelect }: Props) {
  // Normalize each value 0→1 relative to max per axis
  function normalizedValue(planet: string, axisIdx: number): number {
    const ax = AXES[axisIdx]
    const raw = data[planet]?.[ax.key] ?? 0
    if (ax.key === 'total_rupas') {
      const required = data[planet]?.required_rupas ?? 10
      return Math.min(1, raw / (required * 1.5))
    }
    return Math.min(1, raw / ax.max)
  }

  function planetPath(planet: string): string {
    const points = AXES.map((_, i) => {
      const angle = axisAngle(i)
      const r = normalizedValue(planet, i) * R
      return polarToXY(angle, r)
    })
    return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <svg width={320} height={320} viewBox="0 0 320 320" style={{ fontFamily: 'system-ui, sans-serif' }}>
        {/* Grid circles */}
        {Array.from({ length: LEVELS }, (_, li) => {
          const r = R * ((li + 1) / LEVELS)
          return (
            <circle key={li} cx={CX} cy={CY} r={r} fill="none"
              stroke="#334155" strokeWidth={li === LEVELS - 1 ? 1.5 : 0.8}
              strokeDasharray={li < LEVELS - 1 ? '3,3' : undefined}
            />
          )
        })}

        {/* Axis lines + labels */}
        {AXES.map((ax, i) => {
          const angle = axisAngle(i)
          const [x1, y1] = polarToXY(angle, 0)
          const [x2, y2] = polarToXY(angle, R)
          const [lx, ly] = polarToXY(angle, R + 22)
          return (
            <g key={ax.key}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth={1} />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fontSize={10} fill="#94a3b8" fontWeight={600}>
                {ax.label}
              </text>
            </g>
          )
        })}

        {/* Planet polygons */}
        {PLANETS.map(planet => {
          const isSelected = selected === planet
          const isUnselected = selected && selected !== planet
          const c = PLANET_COLORS[planet]
          return (
            <g key={planet}
              style={{ cursor: 'pointer', opacity: isUnselected ? 0.1 : 1, transition: 'opacity 0.2s' }}
              onClick={() => onSelect?.(isSelected ? null : planet)}
            >
              <path d={planetPath(planet)} fill={c + '28'} stroke={c}
                strokeWidth={isSelected ? 2.5 : 1.5} />
              {/* Vertex dots */}
              {AXES.map((_, i) => {
                const angle = axisAngle(i)
                const r = normalizedValue(planet, i) * R
                const [px, py] = polarToXY(angle, r)
                return <circle key={i} cx={px} cy={py} r={3} fill={c} />
              })}
            </g>
          )
        })}

        {/* Center dot */}
        <circle cx={CX} cy={CY} r={3} fill="#475569" />

        {/* Level labels (25%, 50%, 75%, 100%) */}
        {Array.from({ length: LEVELS }, (_, li) => {
          const r = R * ((li + 1) / LEVELS)
          const [x, y] = polarToXY(axisAngle(0), r)
          return (
            <text key={li} x={x + 4} y={y} fontSize={8} fill="#64748b">
              {Math.round(((li + 1) / LEVELS) * 100)}%
            </text>
          )
        })}
      </svg>

      {/* Planet legend */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {PLANETS.map(p => {
          const c = PLANET_COLORS[p]
          const isSelected = selected === p
          const sufficient = data[p]?.sufficient
          return (
            <button key={p}
              onClick={() => onSelect?.(isSelected ? null : p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20, border: `1px solid ${c}44`,
                background: isSelected ? c + '28' : 'transparent',
                cursor: 'pointer', fontSize: 11, fontWeight: 700, color: c,
                opacity: selected && !isSelected ? 0.4 : 1,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block' }} />
              {p}
              {sufficient !== undefined && (
                <span style={{ fontSize: 9, color: sufficient ? '#22c55e' : '#ef4444' }}>
                  {sufficient ? '✓' : '✗'}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
