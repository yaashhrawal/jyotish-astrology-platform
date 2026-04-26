import { useState, useEffect } from 'react'
import { avasthasApi } from '../api/client'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const BALADI_COLORS: Record<string, string> = {
  Bala: '#0891B2', Kumara: '#16A34A', Yuva: '#7C3AED', Vriddha: '#F59E0B', Mrita: '#DC2626'
}

const EFFECT_COLORS: Record<string, string> = {
  positive: '#16A34A', negative: '#DC2626', neutral: '#94A3B8'
}

const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']

interface Props { birthData: any }

export default function AvasthaPanel({ birthData }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [view, setView] = useState<'cards' | 'table'>('cards')

  useEffect(() => {
    if (!birthData) return
    setLoading(true); setErr('')
    avasthasApi.get(birthData)
      .then(setData)
      .catch(e => setErr(e?.message || 'Error'))
      .finally(() => setLoading(false))
  }, [birthData])

  if (!birthData) return <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>Load birth chart first.</div>
  if (loading) return <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>Computing avasthas…</div>
  if (err) return <div style={{ padding: 12, background: '#FEF2F2', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{err}</div>
  if (!data) return null

  const avasthas = data.avasthas || {}

  const ScoreBar = ({ score }: { score: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ flex: 1, height: '6px', background: 'var(--surface2)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', borderRadius: '3px', background: score >= 70 ? '#16A34A' : score >= 40 ? '#F59E0B' : '#DC2626' }} />
      </div>
      <span style={{ fontSize: '10px', color: 'var(--text3)', width: '26px', textAlign: 'right' }}>{score}</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '2px' }}>Avasthas — Planetary States</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Baladi · Jagradi · Lajjitadi · Deeptadi · Saptadhatu — BPHS Ch. 45–47</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['cards','table'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: view === v ? 'var(--accent)' : 'var(--surface)', color: view === v ? '#fff' : 'var(--text3)', fontSize: '12px', cursor: 'pointer' }}>
              {v === 'cards' ? 'Cards' : 'Table'}
            </button>
          ))}
        </div>
      </div>

      {/* Table view */}
      {view === 'table' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Planet','Sign','H','Baladi','Str%','Jagradi','Deeptadi','Score'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', color: 'var(--text3)', fontWeight: '700', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLANETS.map(p => {
                const av = avasthas[p]; if (!av) return null
                const c = PLANET_COLORS[p]
                const bc = BALADI_COLORS[av.baladi.state] || '#888'
                return (
                  <tr key={p} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 10px', fontWeight: '700', color: c }}>{p}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--text2)' }}>{av.sign}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--text3)' }}>H{av.house}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: bc + '18', color: bc, fontWeight: '700' }}>{av.baladi.state}</span>
                    </td>
                    <td style={{ padding: '7px 10px' }}><ScoreBar score={av.baladi.strength_percent} /></td>
                    <td style={{ padding: '7px 10px', color: 'var(--text2)', fontSize: '11px' }}>{av.jagradi.state}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--text2)', fontSize: '11px' }}>{av.deeptadi.state}</td>
                    <td style={{ padding: '7px 10px' }}><ScoreBar score={av.overall_score} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards view */}
      {view === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '10px' }}>
          {PLANETS.map(p => {
            const av = avasthas[p]; if (!av) return null
            const c = PLANET_COLORS[p]
            const bc = BALADI_COLORS[av.baladi.state] || '#888'
            const open = expanded === p
            return (
              <div key={p} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `4px solid ${c}`, borderRadius: 'var(--radius-m)', overflow: 'hidden' }}>
                {/* Card header */}
                <div onClick={() => setExpanded(open ? null : p)} style={{ padding: '12px 14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>{p.slice(0,2)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: c }}>{p}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{av.sign} · H{av.house} · {av.degree_in_sign}°</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: av.overall_score >= 70 ? '#16A34A' : av.overall_score >= 40 ? '#F59E0B' : '#DC2626' }}>{av.overall_score}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text4)' }}>score</div>
                    </div>
                  </div>

                  {/* Quick states row */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: bc + '18', color: bc, fontWeight: '700' }}>{av.baladi.state}</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'var(--surface2)', color: 'var(--text3)' }}>{av.jagradi.state}</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'var(--surface2)', color: 'var(--text3)' }}>{av.deeptadi.state}</span>
                    {av.lajjitadi.slice(0,1).map((lj: any) => (
                      <span key={lj.state} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: EFFECT_COLORS[lj.effect] + '18', color: EFFECT_COLORS[lj.effect], fontWeight: '600' }}>{lj.state} ({lj.meaning})</span>
                    ))}
                  </div>

                  {/* Score bar */}
                  <div style={{ marginTop: '8px' }}><ScoreBar score={av.overall_score} /></div>
                </div>

                {/* Expanded detail */}
                {open && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Baladi */}
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Baladi Avastha (Age State)</div>
                      <div style={{ padding: '8px 10px', background: bc + '10', borderRadius: '8px', border: `1px solid ${bc}30` }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: bc }}>{av.baladi.state} — {av.baladi.strength_percent}% strength</div>
                        <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '3px' }}>{av.baladi.description}</div>
                      </div>
                    </div>

                    {/* Jagradi */}
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Jagradi Avastha (Awakening State)</div>
                      <div style={{ padding: '8px 10px', background: 'var(--surface2)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)' }}>{av.jagradi.state} — {av.jagradi.strength}% strength</div>
                        <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '3px' }}>{av.jagradi.description}</div>
                      </div>
                    </div>

                    {/* Lajjitadi */}
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Lajjitadi Avastha (Emotional States)</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {av.lajjitadi.map((lj: any, i: number) => (
                          <div key={i} style={{ padding: '6px 10px', background: EFFECT_COLORS[lj.effect] + '10', borderRadius: '6px', border: `1px solid ${EFFECT_COLORS[lj.effect]}30` }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: EFFECT_COLORS[lj.effect] }}>{lj.state} — {lj.meaning}</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text2)', marginTop: '2px' }}>{lj.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deeptadi */}
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Deeptadi Avastha</div>
                      <div style={{ padding: '6px 10px', background: 'var(--surface2)', borderRadius: '6px', fontSize: '11px', color: 'var(--text2)' }}>
                        <strong>{av.deeptadi.state}</strong> — {av.deeptadi.description}
                      </div>
                    </div>

                    {/* Saptadhatu */}
                    {av.saptadhatu?.dhatu && (
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Saptadhatu (Body Tissue)</div>
                        <div style={{ padding: '8px 10px', background: c + '08', borderRadius: '8px', border: `1px solid ${c}20` }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: c }}>{av.saptadhatu.dhatu}</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text2)', marginTop: '2px' }}>Governs: {av.saptadhatu.body}</div>
                          <div style={{ fontSize: '10.5px', color: '#DC2626', marginTop: '2px' }}>If afflicted: {av.saptadhatu.disease_when_afflicted}</div>
                        </div>
                      </div>
                    )}

                    {/* Conjuncts */}
                    {av.conjunct_planets.length > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                        Conjunct: {av.conjunct_planets.map((cp: string) => (
                          <span key={cp} style={{ display: 'inline-block', margin: '0 4px 0 0', padding: '1px 7px', borderRadius: '20px', background: (PLANET_COLORS[cp] || '#888') + '18', color: PLANET_COLORS[cp] || '#888', fontWeight: '600' }}>{cp}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
