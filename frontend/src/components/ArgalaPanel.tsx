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

const STRENGTH_BG: Record<string, string> = {
  strong: '#16A34A18', afflicted: '#DC262618', weak: 'var(--surface2)',
}
const STRENGTH_BORDER: Record<string, string> = {
  strong: '#16A34A44', afflicted: '#DC262644', weak: 'var(--border)',
}
const STRENGTH_COLOR: Record<string, string> = {
  strong: '#16A34A', afflicted: '#DC2626', weak: 'var(--text3)',
}

export default function ArgalaPanel({ birthData }: { birthData: BirthData | null }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedHouse, setExpandedHouse] = useState<number | null>(1)
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid')

  const compute = async () => {
    if (!birthData) return
    setLoading(true); setError('')
    try {
      const res = await apiPost('/api/calc/argala', birthData)
      setData(res)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Computation failed')
    } finally { setLoading(false) }
  }

  if (!birthData) return <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>Enter birth data to compute Argala.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f97316' }}>Argala & Virodha Argala</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Jaimini Sutras 1.4 — House Interventions</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'detail' : 'grid')} style={{
            padding: '7px 14px', background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text2)',
          }}>{viewMode === 'grid' ? 'Detail View' : 'Grid View'}</button>
          <button onClick={compute} disabled={loading} style={{
            padding: '8px 20px', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>{loading ? 'Computing…' : 'Compute'}</button>
        </div>
      </div>

      {error && <div style={{ padding: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>}

      {data && (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Supported Houses', key: 'strongly_supported', color: '#16A34A' },
              { label: 'Afflicted Houses', key: 'afflicted', color: '#DC2626' },
              { label: 'Independent', key: 'independent', color: 'var(--text3)' },
            ].map(({ label, key, color }) => (
              <div key={key} style={{ ...card, textAlign: 'center', background: color + '10', borderColor: color + '33' }}>
                <div style={{ fontSize: 11, color, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color }}>
                  {(data.summary[key] || []).join(', ') || '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Grid view */}
          {viewMode === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => {
                const house = data.houses[h]
                if (!house) return null
                const s = house.verdict.strength
                const bg = STRENGTH_BG[s] || 'var(--surface2)'
                const bc = STRENGTH_BORDER[s] || 'var(--border)'
                const tc = STRENGTH_COLOR[s] || 'var(--text3)'
                return (
                  <div key={h} onClick={() => { setExpandedHouse(h); setViewMode('detail') }}
                    style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${bc}`, background: bg, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: tc }}>{ORDINALS[h]} House</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{house.sign}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {house.signification.split(',')[0]}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {Object.values(house.argala_analysis as any[]).filter((a: any) => a.effective).map((a: any) => (
                        <span key={a.argala_house} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'var(--surface3)', color: a.argala_nature === 'benefic' ? '#16A34A' : '#DC2626' }}>
                          +{a.argala_house}H
                        </span>
                      ))}
                    </div>
                    {house.planets_in_house.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                        {house.planets_in_house.map((p: string) => (
                          <span key={p} style={{ fontSize: 11, fontWeight: 700, color: PLANET_COLORS[p] || 'var(--text)' }}>{p.slice(0, 2)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Detail view */}
          {viewMode === 'detail' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                  <button key={h} onClick={() => setExpandedHouse(h)} style={{
                    padding: '4px 10px', fontSize: 12, borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: expandedHouse === h ? 'var(--accent)' : 'var(--surface2)',
                    color: expandedHouse === h ? '#fff' : 'var(--text3)', fontWeight: expandedHouse === h ? 700 : 400,
                  }}>H{h}</button>
                ))}
              </div>

              {expandedHouse && data.houses[expandedHouse] && (() => {
                const house = data.houses[expandedHouse]
                const s = house.verdict.strength
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ ...card, background: STRENGTH_BG[s], borderColor: STRENGTH_BORDER[s] }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#f97316' }}>{ORDINALS[house.house]} House</div>
                          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{house.sign}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Signifies</div>
                          <div style={{ fontSize: 13 }}>{house.signification}</div>
                        </div>
                        <div style={{ padding: '4px 12px', borderRadius: 8, border: `1px solid ${STRENGTH_BORDER[s]}`, color: STRENGTH_COLOR[s], fontSize: 12, fontWeight: 700 }}>
                          {house.verdict.strength}
                        </div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text2)', fontStyle: 'italic' }}>{house.verdict.verdict}</div>
                    </div>

                    {Object.entries(house.argala_analysis).map(([key, a]: [string, any]) => (
                      <div key={key} style={{ ...card, opacity: a.effective ? 1 : 0.6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: a.type === 'primary' ? '#f9731618' : 'var(--surface2)', color: a.type === 'primary' ? '#f97316' : 'var(--text3)', fontWeight: 600 }}>
                            {a.type}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>+{a.argala_house}H Argala ({a.nature_of_house})</span>
                          {a.is_cancelled && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#DC2626', fontWeight: 700 }}>✗ CANCELLED</span>}
                          {a.effective && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: a.argala_nature === 'benefic' ? '#16A34A' : '#DC2626' }}>
                            ✓ {a.argala_nature.toUpperCase()}
                          </span>}
                          {!a.effective && !a.is_cancelled && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text4)' }}>no planets</span>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          {[
                            { label: `Argala from ${a.argala_sign}`, planets: a.argala_planets },
                            { label: `Virodha from ${a.virodha_sign}`, planets: a.virodha_planets },
                          ].map(({ label, planets }) => (
                            <div key={label}>
                              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{label}</div>
                              {planets.length > 0 ? (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {planets.map((p: string) => (
                                    <span key={p} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: PLANET_COLORS[p] + '22', color: PLANET_COLORS[p] }}>{p}</span>
                                  ))}
                                </div>
                              ) : <span style={{ fontSize: 11, color: 'var(--text4)' }}>empty</span>}
                            </div>
                          ))}
                        </div>
                        {a.cancel_reason && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>{a.cancel_reason}</div>}
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}
        </>
      )}
    </div>
  )
}
