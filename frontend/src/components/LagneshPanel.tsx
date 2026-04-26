import { useState, useEffect } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const STRENGTH_COLORS: Record<string, string> = {
  exalted: '#059669', own: '#2563EB', friendly: '#16A34A',
  neutral: '#6B7280', enemy: '#D97706', debilitated: '#DC2626'
}

interface Props { birthData: any }

export default function LagneshPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/lagnesh_analysis', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Analyzing Lagnesh…')}</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  const pc = PLANET_COLORS[data.lagnesh] || 'var(--accent)'
  const sc = STRENGTH_COLORS[data.dignity] || 'var(--text3)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hero card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          {t('Lagnesh Analysis')} — {t('Ascendant Lord')}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: pc, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.lagnesh)}</div>
            <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 2, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Lord of')} {t(data.ascendant_sign)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
              {t('in')} <span style={{ color: 'var(--accent)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.lagnesh_sign)}</span> — {t('House')} <span style={{ color: 'var(--accent)' }}>{data.lagnesh_house}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: sc + '20', color: sc, border: `1px solid ${sc}44` }}>
                {data.dignity}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: 'var(--surface2)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                {data.strength_label} ({data.strength_score}/5)
              </span>
              {data.lagnesh_retrograde && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: '#FEE2E2', color: '#DC2626' }}>(R)</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{data.lagnesh_nakshatra} Pada {data.lagnesh_pada} · {data.lagnesh_degree}° · Lon {data.lagnesh_longitude}°</div>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{t('House Interpretation')}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{data.house_interpretation}</div>
        {data.retrograde_note && (
          <div style={{ fontSize: 12, color: '#D97706', marginTop: 10, padding: '8px 12px', background: '#FEF3C7', borderRadius: 8 }}>
            ↺ {data.retrograde_note}
          </div>
        )}
      </div>

      {/* Aspects received */}
      {data.aspect_notes?.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{t('Aspects Received by')} <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.lagnesh)}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.aspects_received.map((asp: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
                <span style={{ fontWeight: 700, color: PLANET_COLORS[asp.planet] || 'var(--text)', minWidth: 70, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(asp.planet)}</span>
                <span style={{ fontSize: 11, color: 'var(--text4)' }}>from H{asp.from_house}</span>
                <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>{data.aspect_notes[i]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Co-tenants */}
      {data.co_tenants?.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Co-tenants in H{data.lagnesh_house}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {data.co_tenants.map((p: string) => (
              <span key={p} style={{ padding: '4px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: (PLANET_COLORS[p] || '#888') + '20', color: PLANET_COLORS[p] || 'var(--text)', border: `1px solid ${PLANET_COLORS[p] || '#888'}44`, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p)}</span>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
        {data.summary}
      </div>
    </div>
  )
}
