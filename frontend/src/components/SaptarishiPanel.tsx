import { useState, useEffect } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

interface Props { birthData: any }

const SAGE_COLORS = ['#D97706','#0891B2','#DC2626','#16A34A','#B45309','#7C3AED','#2563EB']

export default function SaptarishiPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'birth' | 'current'>('birth')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/saptarishis', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Computing Saptarishis…')}</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  const sages = view === 'birth' ? data.birth_sages : data.current_sages

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>सप्तर्षि · {t('Saptarishis')} — {t('Seven Sages')}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>7 sages traverse 27 nakshatras · 100 years/nakshatra · 2700-year cycle</div>
          </div>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            {(['birth', 'current'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '4px 12px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: view === v ? 'var(--accent)' : 'var(--surface2)',
                color: view === v ? '#fff' : 'var(--text3)',
              }}>{v === 'birth' ? 'At Birth' : 'Current (2026)'}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 12 }}>
          <div style={{ padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
            <span style={{ color: 'var(--text4)', fontSize: 10 }}>Natal Moon Nakshatra</span>
            <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{data.moon_nakshatra}</div>
          </div>
          <div style={{ padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
            <span style={{ color: 'var(--text4)', fontSize: 10 }}>Leading Nak at Birth</span>
            <div style={{ fontWeight: 700 }}>{data.birth_leading_nakshatra}</div>
          </div>
          <div style={{ padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
            <span style={{ color: 'var(--text4)', fontSize: 10 }}>Current Era</span>
            <div style={{ fontWeight: 700 }}>{data.current_leading_nakshatra} · {data.years_remaining_in_current_nak}yr left</div>
          </div>
        </div>
      </div>

      {/* Sage grid */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}>
          Seven Sages — {view === 'birth' ? `Birth Year ${data.birth_year}` : 'Current 2026'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border)' }}>
          {sages?.map((s: any, i: number) => {
            const isClosest = data.closest_sage_to_moon?.sage === s.sage
            return (
              <div key={s.sage} style={{ background: isClosest ? SAGE_COLORS[i] + '18' : 'var(--surface)', padding: '12px 10px', border: isClosest ? `2px solid ${SAGE_COLORS[i]}` : 'none' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: SAGE_COLORS[i], marginBottom: 4 }}>{s.sage}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{s.nakshatra}</div>
                <div style={{ fontSize: 9, color: 'var(--text4)', marginTop: 4, lineHeight: 1.4 }}>{s.nak_theme?.slice(0, 30)}</div>
                {isClosest && <div style={{ fontSize: 9, color: SAGE_COLORS[i], marginTop: 4, fontWeight: 700 }}>← Moon's Sage</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Closest sage detail */}
      {data.closest_sage_to_moon && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Sage Closest to Natal Moon</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>{data.closest_sage_to_moon.sage} in {data.closest_sage_to_moon.nakshatra}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{data.closest_sage_to_moon.meaning}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{data.closest_sage_to_moon.nak_theme}</div>
        </div>
      )}

      {/* Cycle note */}
      <div style={{ padding: '12px 16px', background: 'var(--surface2)', borderRadius: 10, fontSize: 12, color: 'var(--text3)' }}>
        {data.cycle_note} · {data.distance_note}
      </div>
    </div>
  )
}
