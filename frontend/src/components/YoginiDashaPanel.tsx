import { useState, useEffect } from 'react'
import { yoginiDashaApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const YOGINI_COLORS: Record<string, string> = {
  Mangala: '#DC2626', Pingala: '#D97706', Dhanya: '#16A34A', Bhramari: '#DC2626',
  Bhadrika: '#0891B2', Ulka: '#2563EB', Siddha: '#7C3AED', Sankata: '#57534E'
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const YOGINI_MEANINGS: Record<string, string> = {
  Mangala: 'Success, auspicious beginnings, good health',
  Pingala: 'Power, authority, solar energy',
  Dhanya: 'Wealth, abundance, knowledge',
  Bhramari: 'Transformation, challenges, karmic lessons',
  Bhadrika: 'Prosperity, mercury-ruled intellect',
  Ulka: 'Delays, hard work, discipline, karmic debts',
  Siddha: 'Achievements, arts, relationships',
  Sankata: 'Obstacles, foreign travel, karmic accumulation',
}

function isNow(start: string, end: string) { const n = new Date(); return new Date(start) <= n && n <= new Date(end) }
function isPast(end: string) { return new Date(end) < new Date() }

interface Props { birthData: any }

export default function YoginiDashaPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    yoginiDashaApi.get(birthData)
      .then(d => {
        setData(d)
        const activeIdx = d.dashas?.findIndex((x: any) => x.is_active)
        if (activeIdx >= 0) setExpanded(activeIdx)
      })
      .catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: '20px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Computing Yogini Dasha…')}</div>
  if (error) return <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#DC2626', fontSize: '13px' }}>{error}</div>
  if (!data) return null

  const totalYears = 36
  const dashasForBar = data.dashas?.slice(0, 8) || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Yogini Dasha')} — 36 {t('Year Cycle')}</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
          Moon in <strong style={{ color: 'var(--text)' }}>{data.moon_nakshatra}</strong>
          {' · '}Starting Yogini: <strong style={{ color: YOGINI_COLORS[data.starting_yogini] || 'var(--accent)' }}>{data.starting_yogini}</strong>
          {' · '}Balance at birth: <strong>{data.balance_at_birth?.toFixed(2)}y</strong>
        </div>
      </div>

      {/* Visual bar */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: 'var(--text3)' }}>First Cycle (36 years)</div>
        <div style={{ display: 'flex', height: '32px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {dashasForBar.map((d: any, i: number) => {
            const w = (d.years / totalYears) * 100
            const active = d.is_active
            const c = YOGINI_COLORS[d.yogini] || '#888'
            return (
              <div key={i} onClick={() => setExpanded(expanded === i ? null : i)} title={`${d.yogini} (${d.lord})`}
                style={{ width: `${w}%`, background: c, opacity: active ? 1 : isPast(d.end) ? 0.2 : 0.5,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', color: '#fff', fontWeight: '700', position: 'relative',
                  borderRight: '1px solid rgba(255,255,255,.2)', transition: 'opacity .2s',
                }}>
                {w > 5 ? d.yogini.slice(0, 3) : ''}
                {active && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0,
                  borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid rgba(255,255,255,.9)' }} />}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
          {Object.entries(YOGINI_COLORS).map(([name, color]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: 'var(--text3)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Dasha list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {data.dashas?.slice(0, 24).map((d: any, i: number) => {
          const active = d.is_active
          const past = isPast(d.end)
          const open = expanded === i
          const c = YOGINI_COLORS[d.yogini] || '#888'

          return (
            <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <div onClick={() => setExpanded(open ? null : i)} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', cursor: 'pointer',
                background: active ? (c + '12') : open ? 'var(--hover)' : 'transparent',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: active ? '700' : '600', color: active ? c : past ? 'var(--text3)' : 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                      {t(d.yogini)}
                    </span>
                    <span style={{ fontSize: '11px', color: PLANET_COLORS[d.lord] || 'var(--text3)', fontWeight: '600', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>({t(d.lord)})</span>
                    {active && <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 8px', borderRadius: '20px', background: c, color: '#fff' }}>ACTIVE</span>}
                    {past && <span style={{ fontSize: '10px', color: 'var(--text4)' }}>past</span>}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '2px' }}>
                    {d.start?.slice(0, 7)} → {d.end?.slice(0, 7)} · {d.years.toFixed(1)}y
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text4)' }}>{open ? '▲' : '▼'}</span>
              </div>

              {open && (
                <div style={{ background: 'var(--surface2)', padding: '10px 18px 14px 36px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginBottom: '10px', lineHeight: 1.5 }}>
                    {YOGINI_MEANINGS[d.yogini] || ''}
                  </div>
                  {/* Antardashas */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {d.antardashas?.map((ad: any, j: number) => {
                      const adActive = isNow(ad.start, ad.end)
                      const ac = YOGINI_COLORS[ad.yogini] || '#888'
                      return (
                        <div key={j} style={{
                          padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)',
                          background: adActive ? (ac + '18') : 'var(--surface)',
                          borderColor: adActive ? ac + '44' : 'var(--border)',
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: ac, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(ad.yogini)}</div>
                          <div style={{ fontSize: '9.5px', color: 'var(--text4)', marginTop: '2px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(ad.lord)}</div>
                          <div style={{ fontSize: '9.5px', color: 'var(--text4)', marginTop: '3px', fontVariantNumeric: 'tabular-nums' }}>
                            {ad.start?.slice(0, 7)} →<br />{ad.end?.slice(0, 7)}
                          </div>
                          {adActive && <div style={{ fontSize: '8px', fontWeight: '700', color: ac, marginTop: '3px' }}>NOW</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
