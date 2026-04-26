import { useState, useEffect } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const SIGN_COLORS = [
  '#DC2626','#16A34A','#0891B2','#2563EB','#D97706','#7C3AED',
  '#0891B2','#DC2626','#B45309','#57534E','#2563EB','#7C3AED',
]
const sc = (sign: string) => {
  const idx = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].indexOf(sign)
  return SIGN_COLORS[idx % 12] || '#888'
}

function isPast(end: string) { return new Date(end) < new Date() }

interface Props { birthData: any }

export default function KalachakraPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/kalachakra', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Computing Kalachakra Dasha…')}</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  const activeDasha = data.dashas?.[data.active_dasha_index]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Kalachakra Dasha')} — 360 Year Cycle</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
          Moon Nakshatra: <strong style={{ color: 'var(--text)' }}>{data.moon_nakshatra}</strong> · Pada {data.moon_pada} ·
          Navamsha: <strong style={{ color: 'var(--accent)' }}>{data.navamsha_sign}</strong> ·
          Direction: <strong>{data.direction}</strong>
          {activeDasha && <> · Active: <strong style={{ color: sc(activeDasha.sign) }}>{activeDasha.sign}</strong> ({activeDasha.start?.slice(0,7)} → {activeDasha.end?.slice(0,7)})</>}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {data.dashas?.slice(0, 24).map((d: any, i: number) => {
          const active = d.is_active
          const past = isPast(d.end)
          const c = sc(d.sign)
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px',
              borderBottom: '1px solid var(--border)',
              background: active ? c + '12' : 'transparent',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: c, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 600, color: active ? c : past ? 'var(--text3)' : 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {t(d.sign)} {t('Dasha')}
                  </span>
                  {active && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: c, color: '#fff' }}>ACTIVE</span>}
                  {past && <span style={{ fontSize: 10, color: 'var(--text4)' }}>past</span>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 2 }}>
                  {d.start?.slice(0,7)} → {d.end?.slice(0,7)} · {d.years?.toFixed(2)}y · {d.direction}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
