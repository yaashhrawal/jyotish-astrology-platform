import { useState, useEffect } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Venus2: '#7C3AED'
}
const PC = (p: string) => PLANET_COLORS[p] || '#888'

function isPast(end: string) { return new Date(end) < new Date() }

interface Props { birthData: any }

export default function AshtottariPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/ashtottari', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Computing Ashtottari Dasha…')}</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  const activeDasha = data.dashas?.[data.active_dasha_index]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Ashtottari Dasha')} — 108 Year Cycle</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
          Moon Nakshatra: <strong style={{ color: 'var(--text)' }}>{data.moon_nakshatra}</strong> ·
          Starting Dasha: <strong style={{ color: PC(data.starting_dasha) }}>{data.starting_dasha}</strong>
          {activeDasha && <> · Active: <strong style={{ color: PC(activeDasha.planet) }}>{activeDasha.planet}</strong> Dasha ({activeDasha.start?.slice(0,7)} → {activeDasha.end?.slice(0,7)})</>}
        </div>
      </div>

      {/* Visual bar */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text3)' }}>108-Year Timeline</div>
        <div style={{ display: 'flex', height: 24, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {data.dashas?.slice(0, 8).map((d: any, i: number) => {
            const total = data.dashas.slice(0,8).reduce((s: number, x: any) => s + x.years, 0)
            const w = (d.years / total) * 100
            const active = d.is_active
            const c = PC(d.planet)
            return (
              <div key={i} title={`${d.planet}: ${d.years?.toFixed(1)}y`} style={{
                width: `${w}%`, background: c,
                opacity: active ? 1 : isPast(d.end) ? 0.2 : 0.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, color: '#fff', fontWeight: 700,
                borderRight: '1px solid rgba(255,255,255,.2)',
              }}>
                {w > 6 ? d.planet.slice(0,2) : ''}
              </div>
            )
          })}
        </div>
      </div>

      {/* Dasha list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {data.dashas?.slice(0, 16).map((d: any, i: number) => {
          const active = d.is_active
          const past = isPast(d.end)
          const c = PC(d.planet)
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
              borderBottom: '1px solid var(--border)',
              background: active ? c + '12' : 'transparent',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 600, color: active ? c : past ? 'var(--text3)' : 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {t(d.planet)} Dasha
                  </span>
                  {active && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: c, color: '#fff' }}>ACTIVE</span>}
                  {past && <span style={{ fontSize: 10, color: 'var(--text4)' }}>past</span>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 2 }}>
                  {d.start?.slice(0,7)} → {d.end?.slice(0,7)} · {d.years?.toFixed(2)}y
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
