import { useState } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLOR: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#D97706', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E',
}

const ALL_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu']

export default function TransitHitPanel({ birthData }: { birthData: any }) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string[]>(['Jupiter', 'Saturn', 'Rahu'])
  const [months, setMonths] = useState(12)
  const [filterPlanet, setFilterPlanet] = useState('all')

  const fetch = async () => {
    setLoading(true); setError('')
    try {
      const res = await apiPost('/api/calc/transit_hits', {
        ...birthData, transit_planets: selected, months_ahead: months,
      })
      setData(res)
    } catch (e: any) {
      const d = e.response?.data?.detail
      setError(typeof d === 'string' ? d : e.message)
    } finally { setLoading(false) }
  }

  const togglePlanet = (p: string) =>
    setSelected(s => s.includes(p) ? s.filter(x => x !== p) : [...s, p])

  const hits: any[] = (data?.hits || []).filter((h: any) =>
    filterPlanet === 'all' || h.transit_planet === filterPlanet)

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Controls */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '16px 20px', display: 'flex', gap: '20px',
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Transit Planets
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {ALL_PLANETS.map(p => (
              <button key={p} onClick={() => togglePlanet(p)} style={{
                padding: '4px 12px', borderRadius: '20px', border: '1px solid',
                borderColor: selected.includes(p) ? (PLANET_COLOR[p] || 'var(--accent)') : 'var(--border)',
                background: selected.includes(p) ? (PLANET_COLOR[p] || 'var(--accent)') + '18' : 'transparent',
                color: selected.includes(p) ? (PLANET_COLOR[p] || 'var(--accent)') : 'var(--text3)',
                cursor: 'pointer', fontSize: '12px', fontWeight: selected.includes(p) ? '600' : '400',
              }}><span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p)}</span></button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase' }}>Months Ahead</div>
          <select value={months} onChange={e => setMonths(+e.target.value)} style={{
            padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)',
            background: 'var(--bg)', color: 'var(--text)', fontSize: '13px',
          }}>
            {[3, 6, 12, 18, 24].map(m => <option key={m} value={m}>{m} months</option>)}
          </select>
        </div>
        <button onClick={fetch} disabled={loading || selected.length === 0} style={{
          padding: '8px 24px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
          marginTop: '18px',
        }}>{loading ? t('Calculating…') : t('Find Hits')}</button>
        {error && <div style={{ color: 'var(--red)', fontSize: '13px' }}>{error}</div>}
      </div>

      {data && (
        <>
          {/* Summary */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '12px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)' }}>{data.total}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Total Hits</div>
            </div>
            {data.transit_planets?.map((p: string) => {
              const count = data.hits?.filter((h: any) => h.transit_planet === p).length || 0
              return (
                <div key={p} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '12px 20px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: PLANET_COLOR[p] || 'var(--text)' }}>{count}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p)}</div>
                </div>
              )
            })}
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', ...data.transit_planets].map((p: string) => (
              <button key={p} onClick={() => setFilterPlanet(p)} style={{
                padding: '5px 14px', borderRadius: '20px', border: '1px solid var(--border)',
                background: filterPlanet === p ? 'var(--accent)' : 'transparent',
                color: filterPlanet === p ? '#fff' : 'var(--text3)',
                cursor: 'pointer', fontSize: '12px',
              }}>{p === 'all' ? 'All' : p}</button>
            ))}
          </div>

          {/* Hit list grouped by date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.hits_by_date?.filter((d: any) =>
              filterPlanet === 'all' || d.events.some((e: any) => e.transit_planet === filterPlanet)
            ).map((day: any) => {
              const dayEvents = filterPlanet === 'all' ? day.events
                : day.events.filter((e: any) => e.transit_planet === filterPlanet)
              return (
                <div key={day.date} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '8px', overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '8px 16px', background: 'var(--bg)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '12px', fontWeight: '700', color: 'var(--text)',
                  }}>{day.date}</div>
                  {dayEvents.map((ev: any, i: number) => (
                    <div key={i} style={{
                      padding: '10px 16px', borderBottom: i < dayEvents.length - 1 ? '1px solid var(--border)' : 'none',
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                      <span style={{
                        fontWeight: '700', fontSize: '13px',
                        color: PLANET_COLOR[ev.transit_planet] || 'var(--text)',
                        minWidth: '70px', fontFamily: "'Noto Sans Devanagari', sans-serif",
                      }}>{t(ev.transit_planet)}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{t('conjunct natal')}</span>
                      <span style={{ fontWeight: '600', fontSize: '13px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(ev.natal_point)}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                        @ {t(ev.natal_sign)} {ev.natal_degree?.toFixed(2)}°
                      </span>
                      {ev.direction === 'retrograde' && (
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                          background: 'var(--red-bg)', color: 'var(--red)', fontWeight: '600',
                        }}>℞ Retro</span>
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
            {hits.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px', fontSize: '13px' }}>
                No hits found for selected planets in {months} months
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
