import { useState, useEffect } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

interface Props { birthData: any }

const BIRD_COLORS: Record<string, string> = {
  Vulture: '#D97706', Owl: '#0891B2', Crow: '#DC2626', Cock: '#16A34A', Peacock: '#7C3AED'
}
const ACTIVITY_COLORS: Record<string, string> = {
  Ruling: '#059669', Eating: '#2563EB', Walking: '#B45309', Sleeping: '#6B7280', Dying: '#DC2626'
}

export default function PanchaPakshiPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/pancha_pakshi', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Computing Pancha Pakshi…')}</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  const birthColor = BIRD_COLORS[data.birth_bird] || 'var(--accent)'
  const dayColor = BIRD_COLORS[data.day_bird] || 'var(--accent)'
  const actColor = ACTIVITY_COLORS[data.current_day_activity] || 'var(--text)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: `2px solid ${birthColor}44`, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{t('Birth Bird')}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: birthColor, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.birth_bird)}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Planet: {data.birth_bird_planet}</div>
        </div>
        <div style={{ background: 'var(--surface)', border: `2px solid ${dayColor}44`, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{t('Day Bird')}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: dayColor, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.day_bird)}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{data.weekday} · {data.paksha} Paksha</div>
        </div>
        <div style={{ background: 'var(--surface)', border: `2px solid ${actColor}44`, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{t('Current Activity')}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: actColor, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.current_day_activity)}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{data.current_verdict}</div>
        </div>
      </div>

      {/* Today's schedule */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}>Today's Activity Schedule</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: 'var(--border)' }}>
          {data.slots?.map((slot: any) => {
            const ac = ACTIVITY_COLORS[slot.day_bird_activity] || 'var(--text)'
            const bac = ACTIVITY_COLORS[slot.birth_bird_activity] || 'var(--text)'
            return (
              <div key={slot.slot} style={{
                background: slot.is_current ? 'var(--accent)10' : 'var(--surface)',
                padding: '12px 10px',
                border: slot.is_current ? '2px solid var(--accent)' : 'none',
              }}>
                <div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 4 }}>Slot {slot.slot} {slot.is_current ? '← NOW' : ''}</div>
                <div style={{ fontSize: 10, color: 'var(--text4)', marginBottom: 6 }}>{slot.time_range}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: ac, marginBottom: 2, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Day')}: {t(slot.day_bird_activity)}</div>
                <div style={{ fontSize: 10, color: bac, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Birth')}: {t(slot.birth_bird_activity)}</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, padding: '2px 6px', borderRadius: 4,
                  background: slot.combined_verdict === 'Excellent' ? '#D1FAE5' : slot.combined_verdict === 'Very Poor' ? '#FEE2E2' : 'var(--surface2)',
                  color: slot.combined_verdict === 'Excellent' ? '#059669' : slot.combined_verdict === 'Very Poor' ? '#DC2626' : 'var(--text3)',
                }}>
                  {slot.combined_verdict}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Birds reference */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Five Birds Reference</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {data.birds_info?.map((b: any) => (
            <div key={b.bird} style={{ padding: '8px 14px', borderRadius: 10, background: (BIRD_COLORS[b.bird] || '#888') + '18', border: `1px solid ${BIRD_COLORS[b.bird] || '#888'}44` }}>
              <div style={{ fontWeight: 700, color: BIRD_COLORS[b.bird] || 'var(--text)', fontSize: 12, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(b.bird)}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>{b.planet}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text4)' }}>
          Activity order per bird slot: Ruling → Eating → Walking → Sleeping → Dying (5 slots × 4.8 hrs each)
        </div>
      </div>
    </div>
  )
}
