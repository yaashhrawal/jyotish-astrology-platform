import { useState } from 'react'
import { ashtakavargaApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'
import AshtakavargaWheel from './AshtakavargaWheel'

function exportAVtoCSV(result: any, chartName: string) {
  const SIGNS_FULL = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
  const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']
  const rows: string[][] = []

  rows.push([`Ashtakavarga — ${chartName}`])
  rows.push([])
  rows.push(['Bhinnashtakavarga (per planet)'])
  rows.push(['Planet', ...SIGNS_FULL, 'Total'])

  for (const planet of PLANETS) {
    const row = result.bhinnashtakavarga?.[planet]
    if (!row) continue
    const vals = SIGNS_FULL.map(s => row[s] ?? row[s.slice(0,3)] ?? '')
    const total = vals.reduce((a: number, v: any) => a + (+v || 0), 0)
    rows.push([planet, ...vals.map(String), String(total)])
  }

  rows.push([])
  rows.push(['Sarvashtakavarga (total benefic points per sign)'])
  rows.push(['Sign', 'Points'])
  for (const s of SIGNS_FULL) {
    const val = result.sarvashtakavarga?.[s] ?? result.sarvashtakavarga?.[s.slice(0,3)] ?? ''
    rows.push([s, String(val)])
  }

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `ashtakavarga_${chartName.replace(/\s+/g, '_')}.csv`
  a.click(); URL.revokeObjectURL(url)
}

const SIGNS = ['Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis']
const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626',
  Mercury: '#16A34A', Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB',
}

function bindColor(n: number): string {
  if (n >= 7) return '#16A34A'
  if (n >= 5) return '#0891B2'
  if (n >= 4) return '#D97706'
  return '#DC2626'
}

function bindBg(n: number): string {
  if (n >= 7) return '#F0FDF4'
  if (n >= 5) return '#EFF6FF'
  if (n >= 4) return '#FFFBEB'
  return '#FFF5F5'
}

const label: React.CSSProperties = {
  fontSize: '11px', fontWeight: '600', color: 'var(--text3)',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px',
}
const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-m)', padding: '18px',
}

interface Props { chart: any }

export default function AshtakavargaPanel({ chart }: Props) {
  const { t } = useLang()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wheelPlanet, setWheelPlanet] = useState<string | null>(null)

  async function calculate() {
    setLoading(true); setError('')
    try {
      const birthParts = chart.birth?.split(' ') || []
      const [bd, bt] = [birthParts[0] || '1990-01-01', birthParts[1] || '12:00']
      const [by, bm, bdd] = bd.split('-').map(Number)
      const [bh, bmin] = bt.split(':').map(Number)
      const data = await ashtakavargaApi.get({
        year: by, month: bm, day: bdd,
        hour: bh, minute: bmin, tz_offset: 5.5,
        latitude: chart.latitude || 28.6, longitude: chart.longitude || 77.2,
        ayanamsa: chart.ayanamsa || 'lahiri',
      })
      setResult(data)
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally { setLoading(false) }
  }

  const signFull: Record<string, string> = {
    Aries:'Ari',Taurus:'Tau',Gemini:'Gem',Cancer:'Can',Leo:'Leo',Virgo:'Vir',
    Libra:'Lib',Scorpio:'Sco',Sagittarius:'Sag',Capricorn:'Cap',Aquarius:'Aqu',Pisces:'Pis',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header + trigger */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Ashtakavarga Analysis')}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
            Bhinnashtakavarga (per planet) + {t('Sarvashtakavarga')} (total {t('Benefic Points')} per sign)
          </div>
        </div>
        <button onClick={calculate} disabled={loading} style={{
          padding: '8px 20px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
          cursor: 'pointer', opacity: loading ? 0.7 : 1,
        }}>{loading ? t('Calculating…') : t('Calculate')}</button>
        {result && (
          <button onClick={() => exportAVtoCSV(result, chart.name || 'chart')} style={{
            padding: '8px 16px', background: 'transparent', color: 'var(--accent)',
            border: '1px solid var(--accent)', borderRadius: '8px', fontSize: '12px',
            fontWeight: '600', cursor: 'pointer',
          }}>⬇ Export CSV</button>
        )}
        {error && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', flexWrap: 'wrap' }}>
        {[
          { color: '#DC2626', bg: '#FFF5F5', label: '1–3 Weak' },
          { color: '#D97706', bg: '#FFFBEB', label: '4 Average' },
          { color: '#0891B2', bg: '#EFF6FF', label: '5–6 Good' },
          { color: '#16A34A', bg: '#F0FDF4', label: '7–8 Excellent' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: l.bg, border: `1px solid ${l.color}`, display: 'inline-block' }} />
            <span style={{ color: 'var(--text3)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {result && (
        <>
          {/* Ashtakavarga Wheel */}
          <div style={card}>
            <div style={label}>Ashtakavarga Wheel — click planet below to show its bindus</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <AshtakavargaWheel
                sarva={result.sarvashtakavarga || {}}
                bhinnashtaka={result.bhinnashtakavarga || {}}
                selectedPlanet={wheelPlanet}
                ascendantSign={result.ascendant_sign}
              />
              {/* Planet selector */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => setWheelPlanet(null)}
                  style={{ padding: '3px 12px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: !wheelPlanet ? 'var(--accent)' : 'transparent', color: !wheelPlanet ? '#fff' : 'var(--text3)' }}>
                  Sarva
                </button>
                {PLANETS.map(p => (
                  <button key={p} onClick={() => setWheelPlanet(wheelPlanet === p ? null : p)}
                    style={{ padding: '3px 12px', borderRadius: 20, border: `1px solid ${PLANET_COLORS[p]}44`, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: wheelPlanet === p ? PLANET_COLORS[p] + '28' : 'transparent', color: PLANET_COLORS[p] }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sarvashtakavarga bar chart */}
          <div style={card}>
            <div style={label}>{t('Sarvashtakavarga')} — Total {t('Benefic Points')} per Sign</div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '80px' }}>
              {SIGNS.map(s => {
                const fullSign = Object.keys(signFull).find(k => signFull[k] === s) || s
                const val = result.sarvashtakavarga?.[fullSign] ?? result.sarvashtakavarga?.[s] ?? 0
                const maxVal = 56
                const h = Math.max(4, (val / maxVal) * 70)
                const c = bindColor(val / 7) // normalize to per-planet scale
                return (
                  <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: c }}>{val}</span>
                    <div style={{ width: '100%', height: `${h}px`, background: c, borderRadius: '3px 3px 0 0', opacity: 0.8 }} />
                    <span style={{ fontSize: '9px', color: 'var(--text4)', textAlign: 'center' }}>{s}</span>
                  </div>
                )
              })}
            </div>
            {/* Transit strength hint */}
            <div style={{ marginTop: '12px', fontSize: '11.5px', color: 'var(--text3)', lineHeight: 1.6 }}>
              Signs with 30+ bindus are strong for transits. Below 25 = weak transit results.
            </div>
          </div>

          {/* Bhinnashtakavarga per planet */}
          <div style={card}>
            <div style={label}>Bhinnashtakavarga — Bindus per Planet (max 8 per sign)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', width: '90px' }}>Planet</th>
                    {SIGNS.map(s => (
                      <th key={s} style={{ padding: '6px 4px', textAlign: 'center', color: 'var(--text3)', fontSize: '10px', minWidth: '32px' }}>{s}</th>
                    ))}
                    <th style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--text3)', fontSize: '10px' }}>Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANETS.map(planet => {
                    const row = result.bhinnashtakavarga?.[planet] || {}
                    const pos = result.planet_positions?.[planet] || ''
                    const scores: number[] = SIGNS.map(s => {
                      const fullSign = Object.keys(signFull).find(k => signFull[k] === s) || s
                      return row[fullSign] ?? row[s] ?? 0
                    })
                    const total = scores.reduce((a, b) => a + b, 0)
                    return (
                      <tr key={planet} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '700', color: PLANET_COLORS[planet], fontSize: '12.5px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(planet)}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text4)' }}>Σ {total}</span>
                          </div>
                        </td>
                        {scores.map((val, i) => (
                          <td key={i} style={{ padding: '4px 2px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block', width: '24px', height: '24px',
                              lineHeight: '24px', textAlign: 'center',
                              borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                              background: bindBg(val), color: bindColor(val),
                            }}>{val}</span>
                          </td>
                        ))}
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text2)', fontWeight: '600' }}>
                            {signFull[pos] || pos.slice(0, 3)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Classical interpretation guide */}
          <div style={{ ...card, background: 'var(--surface2)' }}>
            <div style={label}>Classical Rules (BPHS)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', fontSize: '12px', color: 'var(--text2)' }}>
              {[
                'Saturn transit in sign with 3+ own bindus gives good results despite malefic nature',
                'Jupiter transit in own bhinnashtakavarga sign with 5+ bindus is highly auspicious',
                'Sun transit in signs with 4+ Sun bindus gives authority and recognition',
                'Sarvashtakavarga: 30+ bindus = auspicious for all matters; below 25 = avoid new ventures',
                'Moon sign + houses 1,4,7,10 from Moon: transiting planets must have sufficient bindus',
                'Planets in their natal sign at transit time are strongest (own sign + bindus)',
              ].map((r, i) => (
                <div key={i} style={{ padding: '10px 12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', lineHeight: 1.6 }}>
                  {r}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
