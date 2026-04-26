import { useState, useEffect } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const SIGN_COLORS = [
  '#DC2626','#16A34A','#0891B2','#2563EB','#D97706','#7C3AED',
  '#0891B2','#DC2626','#B45309','#57534E','#2563EB','#7C3AED',
]
const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
const sc = (sign: string) => SIGN_COLORS[SIGNS.indexOf(sign) % 12] || '#888'

function isPast(end: string) { return new Date(end) < new Date() }

function DashaList({ system, dashas }: { system: string; dashas: any[]; activeIndex?: number }) {
  const { t } = useLang()
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}>{system}</div>
      {dashas?.slice(0, 20).map((d: any, i: number) => {
        const active = d.is_active
        const past = isPast(d.end)
        const c = sc(d.sign)
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px',
            borderBottom: '1px solid var(--border)',
            background: active ? c + '12' : 'transparent',
          }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: c, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? c : past ? 'var(--text3)' : 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t(d.sign)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text4)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('lord')}: {t(d.lord)}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>{d.years}y</span>
                {active && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: c, color: '#fff' }}>ACTIVE</span>}
                {past && <span style={{ fontSize: 10, color: 'var(--text4)' }}>past</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                {d.start?.slice(0,7)} → {d.end?.slice(0,7)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface Props { birthData: any }

export default function ShoolaPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/shoola_dasha', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Computing Shoola Dasha…')}</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Shoola Dasha')} — {t('Jaimini Longevity Dasha')}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          Ascendant: <strong>{data.ascendant?.sign}</strong> ·
          8th House: <strong style={{ color: 'var(--red)' }}>{data.eighth_sign}</strong>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <DashaList
          system={data.shoola_dasha?.system}
          dashas={data.shoola_dasha?.dashas || []}
          activeIndex={data.shoola_dasha?.active_index}
        />
        <DashaList
          system={data.niryana_shoola_dasha?.system}
          dashas={data.niryana_shoola_dasha?.dashas || []}
          activeIndex={data.niryana_shoola_dasha?.active_index}
        />
      </div>
    </div>
  )
}
