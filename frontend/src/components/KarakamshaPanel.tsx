import { useState } from 'react'
import { apiPost } from '../api/client'

interface BirthData {
  year: number; month: number; day: number
  hour: number; minute: number; tz_offset: number
  latitude: number; longitude: number; ayanamsa: string
}

interface KarakamshaResult {
  atmakaraka: string
  karakamsha_sign: string
  karakamsha_house_in_d1: number
  swamsha: boolean
  karakas: Array<{ planet: string; karaka: string; degree_in_sign: number; sign: string; navamsha_sign: string }>
  ak_sign_interpretation: { soul_purpose: string; career: string; spirituality: string; traits: string }
  planets_in_kl: Array<{ planet: string; result: string; career: string; effect: string }>
  house_breakdown: Array<{ house: number; sign: string; signification: string; planets: string[] }>
  karakamsha_yogas: Array<{ name: string; desc: string; source: string; effect: string; category: string }>
  d9_planets: Record<string, { sign: string; sign_index: number; longitude: number; status: string }>
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#f59e0b', Moon: '#a78bfa', Mars: '#ef4444',
  Mercury: '#10b981', Jupiter: '#f97316', Venus: '#ec4899',
  Saturn: '#6366f1', Rahu: '#64748b', Ketu: '#84cc16',
}

const EFFECT_COLOR: Record<string, string> = {
  positive: '#22c55e', negative: '#ef4444', mixed: '#f59e0b',
  spiritual: '#a78bfa', neutral: '#94a3b8'
}

const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px',
}

export default function KarakamshaPanel({ birthData }: { birthData: BirthData | null }) {
  const [data, setData] = useState<KarakamshaResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'overview' | 'houses' | 'yogas' | 'karakas'>('overview')

  const compute = async () => {
    if (!birthData) return
    setLoading(true); setError('')
    try {
      const res = await apiPost('/api/calc/karakamsha', birthData)
      setData(res)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Computation failed')
    } finally { setLoading(false) }
  }

  if (!birthData) return <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>Enter birth data to compute Karakamsha.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>Karakamsha Chart</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Atmakaraka in Navamsa · Jaimini</div>
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
          {/* Header card */}
          <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Atmakaraka</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: PLANET_COLORS[data.atmakaraka] }}>{data.atmakaraka}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Karakamsha Lagna</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{data.karakamsha_sign}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>In D1 House</div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{ORDINALS[data.karakamsha_house_in_d1]}</div>
            </div>
            {data.swamsha && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#f59e0b18', border: '1px solid #f59e0b44', borderRadius: 10 }}>
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>Swamsha</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>KL = D1 Lagna</span>
              </div>
            )}
            {data.planets_in_kl.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Planets in KL</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {data.planets_in_kl.map(p => (
                    <span key={p.planet} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: PLANET_COLORS[p.planet] + '22', color: PLANET_COLORS[p.planet] }}>
                      {p.planet}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {(['overview', 'houses', 'yogas', 'karakas'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 16px', fontSize: 13, border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0',
                background: tab === t ? 'var(--surface)' : 'transparent',
                color: tab === t ? 'var(--text)' : 'var(--text3)',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                fontWeight: tab === t ? 700 : 400,
              }}>
                {t === 'karakas' ? 'Chara Karakas' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.ak_sign_interpretation && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 12 }}>Soul Purpose — AK in {data.karakamsha_sign}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                      ['Core Purpose', data.ak_sign_interpretation.soul_purpose],
                      ['Career Dharma', data.ak_sign_interpretation.career],
                      ['Spiritual Path', data.ak_sign_interpretation.spirituality],
                      ['Soul Traits', data.ak_sign_interpretation.traits],
                    ].map(([label, val]) => (
                      <div key={label as string}>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.planets_in_kl.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 12 }}>Planets in Karakamsha Lagna</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.planets_in_kl.map(p => (
                      <div key={p.planet} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, minWidth: 64, textAlign: 'center', background: PLANET_COLORS[p.planet] + '22', color: PLANET_COLORS[p.planet] }}>
                          {p.planet}
                        </span>
                        <div>
                          <div style={{ fontSize: 13, color: EFFECT_COLOR[p.effect] || 'var(--text2)' }}>{p.result}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{p.career}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 12 }}>D9 Navamsa Planets</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {Object.entries(data.d9_planets).map(([name, pd]) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, width: 60, color: PLANET_COLORS[name] }}>{name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{pd.sign}</span>
                      <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 'auto' }}>{pd.status?.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Houses from KL */}
          {tab === 'houses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.house_breakdown.map(h => (
                <div key={h.house} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: h.planets.length > 0 ? 'var(--surface)' : 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', width: 24, flexShrink: 0 }}>{h.house}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, width: 90, flexShrink: 0 }}>{h.sign}</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)', flex: 1 }}>{h.signification}</span>
                  {h.planets.length > 0 && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {h.planets.map(p => (
                        <span key={p} style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: PLANET_COLORS[p] + '22', color: PLANET_COLORS[p] }}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Yogas */}
          {tab === 'yogas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.karakamsha_yogas.length === 0 && (
                <div style={{ padding: 16, color: 'var(--text3)', fontSize: 13 }}>No special Karakamsha yogas detected.</div>
              )}
              {data.karakamsha_yogas.map((y, i) => (
                <div key={i} style={{ ...card }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 14 }}>{y.name}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 600 }}>{y.category}</span>
                  </div>
                  <div style={{ fontSize: 13, color: EFFECT_COLOR[y.effect] || 'var(--text2)', marginBottom: 4 }}>{y.desc}</div>
                  <div style={{ fontSize: 11, color: 'var(--text4)' }}>Source: {y.source}</div>
                </div>
              ))}
            </div>
          )}

          {/* Chara Karakas */}
          {tab === 'karakas' && (
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {['Planet', 'Karaka', 'Degree', 'D1 Sign', 'D9 Sign'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.karakas.map((k, i) => (
                    <tr key={k.planet} style={{ borderBottom: '1px solid var(--border)', background: i === 0 ? '#f59e0b10' : 'transparent' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: PLANET_COLORS[k.planet] }}>{k.planet}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>{k.karaka}</span>
                        {i === 0 && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text4)' }}>← Atmakaraka</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>{k.degree_in_sign.toFixed(2)}°</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{k.sign}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{k.navamsha_sign}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
