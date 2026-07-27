/**
 * Ashtakavarga 12-sign circular wheel.
 * Shows Sarvashtakavarga bindus as arc segments with color intensity.
 * Also shows Bhinnashtakavarga for a selected planet.
 */

import { useLang } from '../contexts/LanguageContext'

const SIGNS_SHORT = ['Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis']
const SIGNS_FULL  = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
const CX = 180, CY = 180, OUTER_R = 155, INNER_R = 80, LABEL_R = 170

function arcPath(cx: number, cy: number, r1: number, r2: number, startAngle: number, endAngle: number): string {
  const toRad = (d: number) => (d - 90) * Math.PI / 180
  const s1 = toRad(startAngle), e1 = toRad(endAngle)
  const s2 = toRad(startAngle), e2 = toRad(endAngle)
  const x1 = cx + r2 * Math.cos(s1), y1 = cy + r2 * Math.sin(s1)
  const x2 = cx + r2 * Math.cos(e1), y2 = cy + r2 * Math.sin(e1)
  const x3 = cx + r1 * Math.cos(e2), y3 = cy + r1 * Math.sin(e2)
  const x4 = cx + r1 * Math.cos(s2), y4 = cy + r1 * Math.sin(s2)
  const lg = endAngle - startAngle > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r2} ${r2} 0 ${lg} 1 ${x2} ${y2} L ${x3} ${y3} A ${r1} ${r1} 0 ${lg} 0 ${x4} ${y4} Z`
}

function bindusToColor(val: number, max: number, alpha = 1): string {
  const pct = val / max
  if (pct >= 0.75) return `rgba(34,197,94,${alpha})`   // green
  if (pct >= 0.5)  return `rgba(59,130,246,${alpha})`  // blue
  if (pct >= 0.35) return `rgba(234,179,8,${alpha})`   // yellow
  return `rgba(239,68,68,${alpha})`                    // red
}

interface Props {
  sarva: Record<string, number>        // sign → total bindus (max 56)
  bhinnashtaka?: Record<string, Record<string, number>>  // planet → sign → bindus
  selectedPlanet?: string | null
  ascendantSign?: string
}

export default function AshtakavargaWheel({ sarva, bhinnashtaka, selectedPlanet, ascendantSign }: Props) {
  const { t } = useLang()
  const sourceData = (selectedPlanet && bhinnashtaka?.[selectedPlanet])
    ? bhinnashtaka[selectedPlanet]
    : sarva

  const values = SIGNS_FULL.map(sign => {
    const full = sourceData[sign] ?? sourceData[SIGNS_SHORT[SIGNS_FULL.indexOf(sign)]] ?? 0
    return Number(full)
  })
  const maxVal = selectedPlanet ? 8 : 56

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={360} height={360} viewBox="0 0 360 360">
        {/* Background circle */}
        <circle cx={CX} cy={CY} r={OUTER_R + 5} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />

        {/* Segments */}
        {SIGNS_FULL.map((sign, i) => {
          const startDeg = i * 30
          const endDeg   = startDeg + 30
          const val      = values[i]
          const fillH    = INNER_R + ((OUTER_R - INNER_R) * val / maxVal)
          const col      = bindusToColor(val, maxVal, 0.85)
          const colDim   = bindusToColor(val, maxVal, 0.15)
          const isAsc    = sign === ascendantSign

          return (
            <g key={sign}>
              {/* Dim background arc (full height) */}
              <path d={arcPath(CX, CY, INNER_R, OUTER_R, startDeg, endDeg)}
                fill={colDim} stroke="#1e293b" strokeWidth={1} />
              {/* Filled arc proportional to bindus */}
              <path d={arcPath(CX, CY, INNER_R, fillH, startDeg, endDeg)}
                fill={col} stroke="#1e293b" strokeWidth={1} />
              {/* Ascendant marker */}
              {isAsc && (
                <path d={arcPath(CX, CY, OUTER_R + 2, OUTER_R + 8, startDeg, endDeg)}
                  fill="#f59e0b" />
              )}
            </g>
          )
        })}

        {/* Sign labels */}
        {SIGNS_FULL.map((sign, i) => {
          const midDeg = (i * 30 + 15 - 90) * Math.PI / 180
          const lx = CX + LABEL_R * Math.cos(midDeg)
          const ly = CY + LABEL_R * Math.sin(midDeg)
          const val = values[i]
          return (
            <g key={sign + '_label'}>
              <text x={lx} y={ly - 6} textAnchor="middle" dominantBaseline="middle"
                fontSize={9} fill="#64748b" fontWeight={600}>
                {SIGNS_SHORT[i]}
              </text>
              <text x={lx} y={ly + 6} textAnchor="middle" dominantBaseline="middle"
                fontSize={11} fill={bindusToColor(val, maxVal, 1)} fontWeight={800}>
                {val}
              </text>
            </g>
          )
        })}

        {/* Inner center */}
        <circle cx={CX} cy={CY} r={INNER_R - 2} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />

        {/* Center text */}
        <text x={CX} y={CY - 10} textAnchor="middle" fontSize={11} fill="#94a3b8" fontWeight={600}>
          {selectedPlanet || t('Sarva')}
        </text>
        <text x={CX} y={CY + 8} textAnchor="middle" fontSize={22} fill="#f1f5f9" fontWeight={800}>
          {values.reduce((a, b) => a + b, 0)}
        </text>
        <text x={CX} y={CY + 24} textAnchor="middle" fontSize={10} fill="#64748b">
          {t('total bindus')}
        </text>

        {/* Ascendant label */}
        {ascendantSign && (
          <text x={CX} y={CY + 40} textAnchor="middle" fontSize={9} fill="#f59e0b">
            ▲ {t('Lagna')}: {ascendantSign}
          </text>
        )}
      </svg>

      {/* Color legend */}
      <div style={{ display: 'flex', gap: 12, fontSize: 11, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { color: '#ef4444', label: `${t('Weak')} (<${Math.round(maxVal * 0.35)})` },
          { color: '#eab308', label: `${t('Average')} (${Math.round(maxVal * 0.35)}–${Math.round(maxVal * 0.5)})` },
          { color: '#3b82f6', label: `${t('Good')} (${Math.round(maxVal * 0.5)}–${Math.round(maxVal * 0.75)})` },
          { color: '#22c55e', label: `${t('Excellent')} (${Math.round(maxVal * 0.75)}+)` },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block' }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}
