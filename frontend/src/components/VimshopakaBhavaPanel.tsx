import { useState, useEffect } from 'react'
import { vimshopakaBhavaApi } from '../api/client'

const PLANET_COLORS: Record<string, string> = {
  Sun:'#D97706', Moon:'#0891B2', Mars:'#DC2626', Mercury:'#16A34A',
  Jupiter:'#B45309', Venus:'#7C3AED', Saturn:'#2563EB', Rahu:'#57534E', Ketu:'#A8A29E',
}

interface Props { birthData: any }

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ height: '6px', borderRadius: '3px', background: 'var(--surface2)', overflow: 'hidden', marginTop: '4px' }}>
      <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: '3px', transition: 'width .3s' }} />
    </div>
  )
}

type View = 'vimshopaka' | 'bhava'

export default function VimshopakaBhavaPanel({ birthData }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<View>('vimshopaka')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    vimshopakaBhavaApi.get(birthData)
      .then(setData)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>Calculating…</div>
  if (error) return <div style={{ padding: '20px', color: 'var(--red)', fontSize: '13px' }}>{error}</div>
  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {([['vimshopaka', 'Vimshopaka Bala', '16-varga strength · max 20 pts'],
           ['bhava', 'Bhava Bala', 'House strength from lords + aspects']] as const).map(([id, label, sub]) => (
          <button key={id} onClick={() => setView(id)} style={{
            padding: '10px 16px', borderRadius: 'var(--radius-m)', cursor: 'pointer', textAlign: 'left',
            border: `1px solid ${view === id ? 'var(--accent)' : 'var(--border)'}`,
            background: view === id ? 'var(--accent)' : 'var(--surface)',
            color: view === id ? '#fff' : 'var(--text)',
          }}>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>{label}</div>
            <div style={{ fontSize: '10px', opacity: 0.75, marginTop: '2px' }}>{sub}</div>
          </button>
        ))}
      </div>

      {view === 'vimshopaka' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(data.vimshopaka).sort(([,a]: any, [,b]: any) => b.vimshopaka - a.vimshopaka).map(([planet, pdata]: any) => {
            const color = PLANET_COLORS[planet] || '#888'
            const isOpen = expanded === planet
            return (
              <div key={planet} style={{ border: '1px solid var(--border)', borderLeft: `4px solid ${color}`, borderRadius: 'var(--radius-m)', background: 'var(--surface)', overflow: 'hidden' }}>
                <div onClick={() => setExpanded(isOpen ? null : planet)} style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color }}>{pdata.vimshopaka.toFixed(1)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color }}>{planet}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: color + '18', color, fontWeight: '600' }}>{pdata.strength}</span>
                    </div>
                    <Bar value={pdata.vimshopaka} max={20} color={color} />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{pdata.percent}%</div>
                </div>
                {isOpen && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {Object.entries(pdata.breakdown).map(([varga, bd]: any) => (
                      <div key={varga} style={{ padding: '6px 8px', background: 'var(--surface2)', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)' }}>{varga}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{bd.status}</div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color }}>{bd.score.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {view === 'bhava' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
          {Object.entries(data.bhava_bala).map(([houseNum, hdata]: any) => {
            const strength = hdata.strength
            const color = strength === 'Strong' ? '#16A34A' : strength === 'Moderate' ? '#D97706' : '#DC2626'
            return (
              <div key={houseNum} style={{ padding: '12px 14px', background: 'var(--surface)', border: `1px solid var(--border)`, borderLeft: `4px solid ${color}`, borderRadius: 'var(--radius-m)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>House {houseNum}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: '8px' }}>{hdata.sign}</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color, padding: '2px 8px', borderRadius: '20px', background: color + '18' }}>{strength}</span>
                </div>
                <Bar value={hdata.score} max={20} color={color} />
                <div style={{ fontSize: '11px', fontWeight: '700', color, marginTop: '4px' }}>{hdata.score} pts</div>
                {hdata.notes.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {hdata.notes.map((n: string, i: number) => (
                      <div key={i} style={{ fontSize: '10.5px', color: 'var(--text3)' }}>• {n}</div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-m)', fontSize: '11.5px', color: 'var(--text3)' }}>
        ℹ {data.note}
      </div>
    </div>
  )
}
