import { useState, useEffect } from 'react'
import { dashaApi } from '../api/client'

interface Pratyantardasha { lord: string; start: string; end: string; years: number }
interface Antardasha { lord: string; start: string; end: string; years: number; pratyantardashas?: Pratyantardasha[] }
interface Dasha { lord: string; start: string; end: string; years: number; antardashas?: Antardasha[] }

const PLANET_COLORS: Record<string, string> = {
  Sun: '#f59e0b', Moon: '#a78bfa', Mars: '#ef4444',
  Mercury: '#10b981', Jupiter: '#f97316', Venus: '#ec4899',
  Saturn: '#6366f1', Rahu: '#64748b', Ketu: '#84cc16',
}

function isNow(start: string, end: string) {
  const n = new Date(); return new Date(start) <= n && n <= new Date(end)
}
function isPast(end: string) { return new Date(end) < new Date() }
function fmtDate(s: string) { return s?.slice(0, 7) || '' }

function PlanetBadge({ lord, sm = false }: { lord: string; sm?: boolean }) {
  const c = PLANET_COLORS[lord] || '#94a3b8'
  return (
    <span style={{ padding: sm ? '1px 6px' : '2px 8px', borderRadius: 20, fontSize: sm ? 10 : 12, fontWeight: 700, background: c + '22', color: c, border: `1px solid ${c}44` }}>
      {lord}
    </span>
  )
}

const colStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
  overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 500,
}
const colHeader = (color: string): React.CSSProperties => ({
  padding: '8px 12px', borderBottom: '1px solid var(--border)',
  fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0,
})

export default function DashaTriColumn({ birthData }: { birthData: any }) {
  const [dashas, setDashas] = useState<Dasha[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMaha, setSelectedMaha] = useState<number | null>(null)
  const [selectedAntar, setSelectedAntar] = useState<number | null>(null)

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    dashaApi.get(birthData).then(data => {
      const d: Dasha[] = data.dashas || []
      setDashas(d)
      const mahaIdx = d.findIndex(x => isNow(x.start, x.end))
      if (mahaIdx >= 0) {
        setSelectedMaha(mahaIdx)
        const antarList = d[mahaIdx].antardashas || []
        const antarIdx = antarList.findIndex(a => isNow(a.start, a.end))
        if (antarIdx >= 0) setSelectedAntar(antarIdx)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [birthData])

  if (!birthData) return <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>Enter birth data to view dasha tri-column.</div>
  if (loading) return <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>Loading dashas…</div>

  const activeMaha = selectedMaha !== null ? dashas[selectedMaha] : null
  const antarList = activeMaha?.antardashas || []
  const activeAntar = selectedAntar !== null ? antarList[selectedAntar] : null
  const pratyaList = activeAntar?.pratyantardashas || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>Dasha — 3-Level View</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Mahadasha · Antardasha · Pratyantardasha simultaneously</div>
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text3)' }}>
        {[['#f59e0b', 'Active now'], ['var(--text4)', 'Past'], ['var(--text3)', 'Future']].map(([c, l]) => (
          <span key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c as string, display: 'inline-block' }} />
            {l}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {/* Column 1: Mahadashas */}
        <div style={colStyle}>
          <div style={colHeader('#f59e0b')}>Mahadasha</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {dashas.map((d, i) => {
              const active = isNow(d.start, d.end)
              const past = isPast(d.end)
              const selected = selectedMaha === i
              return (
                <button key={i} onClick={() => { setSelectedMaha(i); setSelectedAntar(null) }} style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  borderBottom: '1px solid var(--border)', borderLeft: selected ? '2px solid #f59e0b' : '2px solid transparent',
                  background: selected ? '#f59e0b10' : 'transparent',
                  cursor: 'pointer', opacity: past && !selected ? 0.5 : 1,
                  display: 'block',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <PlanetBadge lord={d.lord} sm />
                    {active && <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>NOW</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{fmtDate(d.start)} – {fmtDate(d.end)}</div>
                  <div style={{ fontSize: 10, color: 'var(--text4)' }}>{d.years}y</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Column 2: Antardashas */}
        <div style={colStyle}>
          <div style={colHeader('#60a5fa')}>
            Antardasha {activeMaha && <span style={{ fontWeight: 400, color: 'var(--text3)' }}>/ {activeMaha.lord}</span>}
          </div>
          {!activeMaha ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text4)' }}>Select a Mahadasha</div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {antarList.map((a, i) => {
                const active = isNow(a.start, a.end)
                const past = isPast(a.end)
                const selected = selectedAntar === i
                return (
                  <button key={i} onClick={() => setSelectedAntar(i)} style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px',
                    borderBottom: '1px solid var(--border)', borderLeft: selected ? '2px solid #60a5fa' : '2px solid transparent',
                    background: selected ? '#60a5fa10' : 'transparent',
                    cursor: 'pointer', opacity: past && !selected ? 0.5 : 1,
                    display: 'block',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <PlanetBadge lord={a.lord} sm />
                      {active && <span style={{ fontSize: 10, color: '#60a5fa', fontWeight: 700 }}>NOW</span>}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>{fmtDate(a.start)} – {fmtDate(a.end)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text4)' }}>{a.years.toFixed(2)}y</div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Column 3: Pratyantardashas */}
        <div style={colStyle}>
          <div style={colHeader('#22c55e')}>
            Pratyantardasha {activeAntar && <span style={{ fontWeight: 400, color: 'var(--text3)' }}>/ {activeAntar.lord}</span>}
          </div>
          {!activeAntar ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text4)' }}>Select an Antardasha</div>
          ) : pratyaList.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text4)' }}>Loading sub-periods…</div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {pratyaList.map((p, i) => {
                const active = isNow(p.start, p.end)
                const past = isPast(p.end)
                return (
                  <div key={i} style={{
                    padding: '10px 12px', borderBottom: '1px solid var(--border)',
                    borderLeft: active ? '2px solid #22c55e' : '2px solid transparent',
                    background: active ? '#22c55e10' : 'transparent',
                    opacity: past && !active ? 0.5 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <PlanetBadge lord={p.lord} sm />
                      {active && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>NOW</span>}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>{fmtDate(p.start)} – {fmtDate(p.end)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text4)' }}>{p.years.toFixed(3)}y</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Current period summary */}
      {activeMaha && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Mahadasha</div>
            <PlanetBadge lord={activeMaha.lord} />
          </div>
          {activeAntar && (
            <>
              <span style={{ color: 'var(--text4)', fontSize: 18 }}>→</span>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Antardasha</div>
                <PlanetBadge lord={activeAntar.lord} />
              </div>
            </>
          )}
          {activeAntar && pratyaList.filter(p => isNow(p.start, p.end)).map(p => (
            <span key={p.lord}>
              <span style={{ color: 'var(--text4)', fontSize: 18, marginRight: 16 }}>→</span>
              <div style={{ display: 'inline-block' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Pratyantardasha</div>
                <PlanetBadge lord={p.lord} />
              </div>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
