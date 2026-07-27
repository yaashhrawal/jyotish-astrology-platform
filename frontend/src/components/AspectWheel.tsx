/**
 * Aspect Web Wheel — planets on a circle, lines for aspects.
 * Supports both Parashari (sign-based) and Western (degree-based) aspects.
 */

import { useLang } from '../contexts/LanguageContext'

const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
}
const PLANET_COLORS: Record<string, string> = {
  Sun: '#f59e0b', Moon: '#8b5cf6', Mars: '#ef4444',
  Mercury: '#10b981', Jupiter: '#f97316', Venus: '#ec4899',
  Saturn: '#3b82f6', Rahu: '#64748b', Ketu: '#84cc16',
}

const ASPECT_COLORS: Record<string, string> = {
  'Conjunction': '#f59e0b',
  'Trine':       '#22c55e',
  'Sextile':     '#3b82f6',
  'Square':      '#ef4444',
  'Opposition':  '#8b5cf6',
  'Quincunx':    '#64748b',
  'Semi-Sextile':'#94a3b8',
  // Parashari
  'Full Aspect': '#22c55e',
  '3/4 Aspect':  '#3b82f6',
  '1/2 Aspect':  '#f59e0b',
  '1/4 Aspect':  '#ef4444',
}

const ASPECT_DASH: Record<string, string | undefined> = {
  'Trine':       undefined,
  'Full Aspect': undefined,
  'Square':      '5,3',
  'Opposition':  undefined,
  'Sextile':     '8,4',
  '3/4 Aspect':  '8,4',
  '1/2 Aspect':  '5,3',
  '1/4 Aspect':  '3,3',
}

const CX = 185, CY = 185, R = 145, DOT_R = 16

function planetPos(idx: number, total: number): [number, number] {
  const angle = ((idx / total) * 360 - 90) * Math.PI / 180
  return [CX + R * Math.cos(angle), CY + R * Math.sin(angle)]
}

interface WesternAspect {
  planet1: string; planet2: string; type: string; angle: number; strength: number; orb: number
}
interface ParashariAspect {
  aspector: string; aspected_planets: string[]; type: string; strength: number
}

interface Props {
  westernAspects?: WesternAspect[]
  parashariAspects?: ParashariAspect[]
  mode?: 'parashari' | 'western'
  planetLongitudes?: Record<string, number>  // for ordering planets by zodiac position
}

export default function AspectWheel({ westernAspects = [], parashariAspects = [], mode = 'western', planetLongitudes }: Props) {
  const { t } = useLang()
  // Order planets by zodiac position if available, else fixed order
  const orderedPlanets = planetLongitudes
    ? [...PLANETS].sort((a, b) => (planetLongitudes[a] ?? 0) - (planetLongitudes[b] ?? 0))
    : PLANETS

  const planetIdx = Object.fromEntries(orderedPlanets.map((p, i) => [p, i]))

  // Build aspect lines
  const lines: { x1: number; y1: number; x2: number; y2: number; color: string; dash?: string; strength: number; label: string }[] = []

  if (mode === 'western') {
    for (const asp of westernAspects) {
      const i1 = planetIdx[asp.planet1]
      const i2 = planetIdx[asp.planet2]
      if (i1 === undefined || i2 === undefined) continue
      const [x1, y1] = planetPos(i1, orderedPlanets.length)
      const [x2, y2] = planetPos(i2, orderedPlanets.length)
      const col = ASPECT_COLORS[asp.type] || '#64748b'
      lines.push({ x1, y1, x2, y2, color: col, dash: ASPECT_DASH[asp.type], strength: asp.strength, label: asp.type })
    }
  } else {
    for (const asp of parashariAspects) {
      const i1 = planetIdx[asp.aspector]
      if (i1 === undefined) continue
      const [x1, y1] = planetPos(i1, orderedPlanets.length)
      for (const target of (asp.aspected_planets || [])) {
        const i2 = planetIdx[target]
        if (i2 === undefined) continue
        const [x2, y2] = planetPos(i2, orderedPlanets.length)
        const col = ASPECT_COLORS[asp.type] || '#22c55e'
        lines.push({ x1, y1, x2, y2, color: col, dash: ASPECT_DASH[asp.type], strength: asp.strength, label: asp.type })
      }
    }
  }

  // Sort lines by strength (weakest first so strongest is on top)
  lines.sort((a, b) => a.strength - b.strength)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={370} height={370} viewBox="0 0 370 370">
        {/* Background */}
        <circle cx={CX} cy={CY} r={R + 22} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />

        {/* Zodiac ring */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1e293b" strokeWidth={1} />

        {/* Aspect lines */}
        {lines.map((l, i) => (
          <line key={i}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={l.color}
            strokeWidth={Math.max(0.5, l.strength * 2.5)}
            strokeDasharray={l.dash}
            opacity={0.5 + l.strength * 0.5}
          />
        ))}

        {/* Planet dots */}
        {orderedPlanets.map((planet, i) => {
          const [px, py] = planetPos(i, orderedPlanets.length)
          const c = PLANET_COLORS[planet]
          return (
            <g key={planet}>
              <circle cx={px} cy={py} r={DOT_R} fill="#0f172a" stroke={c} strokeWidth={2} />
              <text x={px} y={py - 2} textAnchor="middle" dominantBaseline="middle"
                fontSize={12} fill={c} fontWeight={700}>
                {PLANET_SYMBOLS[planet] || planet[0]}
              </text>
              <text x={px} y={py + 8} textAnchor="middle" dominantBaseline="middle"
                fontSize={7} fill={c} opacity={0.8}>
                {planet.slice(0, 3)}
              </text>
            </g>
          )
        })}

        {/* Center */}
        <circle cx={CX} cy={CY} r={30} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#475569" fontWeight={600}>
          {lines.length}
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#475569">
          {t('aspects')}
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', fontSize: 11 }}>
        {(mode === 'western'
          ? ['Conjunction','Trine','Sextile','Square','Opposition','Quincunx']
          : ['Full Aspect','3/4 Aspect','1/2 Aspect','1/4 Aspect']
        ).map(type => {
          const c = ASPECT_COLORS[type] || '#64748b'
          const count = lines.filter(l => l.label === type).length
          if (count === 0) return null
          return (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8' }}>
              <svg width={20} height={10}>
                <line x1={0} y1={5} x2={20} y2={5} stroke={c} strokeWidth={2}
                  strokeDasharray={ASPECT_DASH[type]} />
              </svg>
              <span style={{ color: c, fontWeight: 600 }}>{type}</span>
              <span style={{ color: '#475569' }}>×{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
