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

const SYSTEM_KEYS = ['dwisaptati_sama', 'shodashottari', 'shatabdika', 'dwadasottari']
const SYSTEM_ACCENT: Record<string, string> = {
  dwisaptati_sama: '#6366f1', shodashottari: '#a78bfa', shatabdika: '#f59e0b', dwadasottari: '#10b981',
}

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px',
}

function formatDate(dt: string) { return dt?.slice(0, 10) || '' }

export default function ConditionalDashaPanel({ birthData }: { birthData: BirthData | null }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSystem, setActiveSystem] = useState<string>('dwisaptati_sama')
  const [showAll, setShowAll] = useState(false)

  const compute = async () => {
    if (!birthData) return
    setLoading(true); setError('')
    try {
      const res = await apiPost('/api/calc/conditional_dashas', birthData)
      setData(res)
      const first = SYSTEM_KEYS.find(k => res.dashas[k]?.condition_met)
      if (first) setActiveSystem(first)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Computation failed')
    } finally { setLoading(false) }
  }

  if (!birthData) return <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>Enter birth data to compute conditional dashas.</div>

  const active = data?.dashas[activeSystem]
  const displaySequence = active?.sequence.slice(0, showAll ? 999 : 12) || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#a78bfa' }}>Conditional Dashas</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Dwisaptati · Shodashottari · Shatabdika · Dwadasottari</div>
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
          {/* System status cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {SYSTEM_KEYS.map(key => {
              const sys = data.dashas[key]
              const accent = SYSTEM_ACCENT[key]
              const isActive = activeSystem === key
              return (
                <div key={key} onClick={() => setActiveSystem(key)} style={{
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  background: isActive ? accent + '18' : 'var(--surface)',
                  border: `1px solid ${isActive ? accent + '66' : 'var(--border)'}`,
                  transition: 'all .15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: sys.condition_met ? accent : 'var(--surface3)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? accent : 'var(--text2)' }}>{sys.name?.split(' ')[0]}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sys.total_years} years</div>
                  <div style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: sys.condition_met ? '#22c55e' : 'var(--text4)' }}>
                    {sys.condition_met ? '✓ Active' : '✗ Inactive'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Active system detail */}
          {active && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{active.name}</div>
                  <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, fontWeight: 600, background: active.condition_met ? '#16A34A20' : '#DC262620', color: active.condition_met ? '#16A34A' : '#DC2626' }}>
                    {active.condition_met ? '✓ Applicable' : '✗ Not Applicable'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Condition: {active.condition}</div>
                <div style={{ fontSize: 13, color: active.condition_met ? '#22c55e' : 'var(--text3)', lineHeight: 1.5 }}>{active.condition_reason}</div>
                {!active.condition_met && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 6, fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>
                    This dasha system does not apply for this chart. Sequence shown for reference only.
                  </div>
                )}
              </div>

              {/* Sequence table */}
              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Dasha Sequence</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{active.total_years}-year cycle</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)' }}>
                        {['#', 'Lord / Sign', 'Years', 'Start', 'End'].map(h => (
                          <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displaySequence.map((entry: any, i: number) => {
                        const label = entry.lord || entry.sign || '—'
                        const color = entry.lord ? PLANET_COLORS[entry.lord] : 'var(--text2)'
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '7px 14px', color: 'var(--text4)', fontSize: 11 }}>{i + 1}</td>
                            <td style={{ padding: '7px 14px', fontWeight: 600, color }}>{label}</td>
                            <td style={{ padding: '7px 14px', fontVariantNumeric: 'tabular-nums' }}>{typeof entry.years === 'number' ? entry.years.toFixed(2) : entry.years}</td>
                            <td style={{ padding: '7px 14px', color: 'var(--text3)', fontSize: 11 }}>{formatDate(entry.start)}</td>
                            <td style={{ padding: '7px 14px', color: 'var(--text3)', fontSize: 11 }}>{formatDate(entry.end)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {active.sequence?.length > 12 && (
                  <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)' }}>
                    <button onClick={() => setShowAll(!showAll)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showAll ? 'Show less' : `Show all ${active.sequence.length} periods`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={{ ...card, fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>About Conditional Dashas</div>
            <div><span style={{ color: '#6366f1' }}>Dwisaptati Sama (72yr)</span> — 8 lords × 9yr. Active when lagna lord in 7H or 7th lord in lagna.</div>
            <div><span style={{ color: '#a78bfa' }}>Shodashottari (116yr)</span> — 9 lords. Active when Moon occupies Hora Lagna. Rare, precise timing.</div>
            <div><span style={{ color: '#f59e0b' }}>Shatabdika (100yr)</span> — Sign-based, 8.33yr/sign from lagna. General life span mapping.</div>
            <div><span style={{ color: '#10b981' }}>Dwadasottari (112yr)</span> — 9 lords. Active when Venus in lagna or 7H. Excellent for relationships.</div>
          </div>
        </>
      )}
    </div>
  )
}
