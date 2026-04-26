import { useState } from 'react'
import { apiPost } from '../api/client'

interface BirthData {
  year: number; month: number; day: number
  hour: number; minute: number; tz_offset: number
  latitude: number; longitude: number; ayanamsa: string
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#f59e0b', Moon: '#a78bfa', Mars: '#ef4444',
  Mercury: '#10b981', Jupiter: '#f97316', Venus: '#ec4899',
  Saturn: '#6366f1', Rahu: '#64748b', Ketu: '#84cc16',
}

const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px',
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 65 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 10, background: 'var(--surface2)', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: 5 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}/100</span>
    </div>
  )
}

export default function VarnadaPanel({ birthData }: { birthData: BirthData | null }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPeriods, setShowPeriods] = useState(false)

  const compute = async () => {
    if (!birthData) return
    setLoading(true); setError('')
    try {
      const res = await apiPost('/api/calc/varnada', birthData)
      setData(res)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Computation failed')
    } finally { setLoading(false) }
  }

  if (!birthData) return <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>Enter birth data to compute Varnada Lagna.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>Varnada Lagna</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Jaimini Longevity & Life Timing</div>
        </div>
        <button onClick={compute} disabled={loading} style={{
          marginLeft: 'auto', padding: '8px 20px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}>{loading ? 'Computing…' : 'Compute'}</button>
      </div>

      {error && <div style={{ padding: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>}

      {data && (
        <>
          {/* Header stats */}
          <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
              {[
                { label: 'Varnada Lagna', val: data.varnada_lagna?.sign, sub: ORDINALS[data.varnada_lagna?.house_in_d1] + ' house', color: '#10b981' },
                { label: 'VL Lord', val: data.varnada_lagna?.lord, sub: `in ${data.vl_lord_analysis?.sign} (${ORDINALS[data.vl_lord_analysis?.house]}H)`, color: PLANET_COLORS[data.varnada_lagna?.lord] || 'var(--accent)' },
                { label: 'Birth Type', val: data.computation?.day_birth ? '☀ Day' : '🌙 Night', sub: `${data.computation?.hours_from_sunrise?.toFixed(1)}h from sunrise`, color: 'var(--text)' },
                { label: 'Hora Lagna', val: data.hora_lagna?.sign, sub: '', color: 'var(--text2)' },
              ].map(({ label, val, sub, color }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text4)' }}>{sub}</div>
                </div>
              ))}
            </div>
            <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>Longevity Assessment</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{data.longevity?.longevity}</span>
              </div>
              <ScoreBar score={data.longevity?.score || 0} />
              <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>Estimated span: {data.longevity?.span}</div>
            </div>
          </div>

          {/* Computation */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 12 }}>Computation (Jaimini Sutras 1.1.28–31)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                [`Count ${data.computation?.day_birth ? 'Aries→Lagna' : 'Lagna→Aries'}`, data.computation?.count_lagna],
                [`Count ${data.computation?.day_birth ? 'Aries→Hora Lagna' : 'Hora Lagna→Aries'}`, data.computation?.count_hl],
              ].map(([label, val]) => (
                <div key={label as string} style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{val}</div>
                </div>
              ))}
              <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8, gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
                  Sum = {data.computation?.total} → Varnada Lagna
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>{data.varnada_lagna?.sign}</div>
              </div>
            </div>
          </div>

          {/* VL theme */}
          {data.vl_theme?.theme && (
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>Life Theme — VL in {data.varnada_lagna?.sign}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{data.vl_theme.theme}</div>
            </div>
          )}

          {/* VL lord + 8th */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 10 }}>VL Lord — {data.vl_lord_analysis?.planet}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
                {[['Sign', data.vl_lord_analysis?.sign], ['House', ORDINALS[data.vl_lord_analysis?.house]], ['Dignity', (data.vl_lord_analysis?.status || '').replace('_', ' ')]].map(([l, v]) => (
                  <div key={l as string}>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{l}</div>
                    <div style={{ fontSize: 12, textTransform: 'capitalize', color: l === 'Sign' ? PLANET_COLORS[data.vl_lord_analysis?.planet] || 'var(--text)' : 'var(--text2)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f97316', marginBottom: 6 }}>8th from VL — {data.eighth_from_vl?.sign}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Maraka house from VL</div>
              {data.eighth_from_vl?.planets?.length > 0 ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {data.eighth_from_vl.planets.map((p: string) => (
                    <span key={p} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: PLANET_COLORS[p] + '22', color: PLANET_COLORS[p] }}>{p}</span>
                  ))}
                </div>
              ) : <span style={{ fontSize: 12, color: 'var(--text4)' }}>No planets — favorable for longevity</span>}
              {data.eighth_from_vl?.planets?.some((p: string) => ['Saturn','Mars','Rahu','Ketu'].includes(p)) && (
                <div style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>⚠ Malefics in 8th from VL — longevity factor reduced</div>
              )}
            </div>
          </div>

          {/* Planets in VL */}
          {data.planets_in_vl?.length > 0 && (
            <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>Planets in VL:</span>
              {data.planets_in_vl.map((p: string) => (
                <span key={p} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: PLANET_COLORS[p] + '22', color: PLANET_COLORS[p] }}>{p}</span>
              ))}
            </div>
          )}

          {/* Varnada periods */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <button onClick={() => setShowPeriods(!showPeriods)} style={{
              width: '100%', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text)',
            }}>
              <span>Varnada Periods (Life Stage Timing)</span>
              <span style={{ color: 'var(--text3)' }}>{showPeriods ? '▲' : '▼'}</span>
            </button>
            {showPeriods && (
              <div style={{ overflowX: 'auto', borderTop: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface2)' }}>
                      {['#', 'Sign', 'Lord', 'Age', 'Theme'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.varnada_periods?.map((p: any) => (
                      <tr key={p.period} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '7px 14px', color: 'var(--text3)', fontSize: 11 }}>{p.period}</td>
                        <td style={{ padding: '7px 14px', fontWeight: 600 }}>{p.sign}</td>
                        <td style={{ padding: '7px 14px', color: PLANET_COLORS[p.lord] || 'var(--text)', fontWeight: 600 }}>{p.lord}</td>
                        <td style={{ padding: '7px 14px', color: 'var(--text3)', fontSize: 11 }}>{p.age_range}y</td>
                        <td style={{ padding: '7px 14px', color: 'var(--text3)', fontSize: 11 }}>{p.theme?.split(';')[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ ...card, fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text2)' }}>Source:</strong> Jaimini Sutras 1.1.28–31. Varnada Lagna differs for day/night births by counting from Aries to Lagna and Hora Lagna, then summing. Used for longevity and life-stage timing.
          </div>
        </>
      )}
    </div>
  )
}
