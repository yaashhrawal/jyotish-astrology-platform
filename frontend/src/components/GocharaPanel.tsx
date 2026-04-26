import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { apiPost } from '../api/client'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const EFFECT_STYLE: Record<string, { bg: string; color: string }> = {
  'favorable':          { bg: '#D1FAE5', color: '#059669' },
  'unfavorable':        { bg: '#FEE2E2', color: '#DC2626' },
  'cancelled (vedha)':  { bg: '#FEF3C7', color: '#D97706' },
}

interface Props { birthData: any }

export default function GocharaPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/gochara', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)' }}>Computing Gochara…</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  const overallStyle = EFFECT_STYLE[data.overall] || { bg: 'var(--surface2)', color: 'var(--text3)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Gochara')} — {t('Transit Analysis from Natal Moon')}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
          {t('Natal Moon')}: <strong style={{ color: '#0891B2' }}>{t(data.natal_moon_sign)}</strong> ·
          {t('Transit Date')}: {data.transit_date} ·
          {t('Overall')}: <strong style={{ color: overallStyle.color }}>{t(data.overall?.toUpperCase())}</strong>
        </div>
      </div>

      {/* Score summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <div style={{ background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#059669', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('FAVORABLE')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{data.favorable_count}</div>
        </div>
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('UNFAVORABLE')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#DC2626' }}>{data.unfavorable_count}</div>
        </div>
        <div style={{ background: data.ashtama_planets?.length > 0 ? '#FEF2F2' : 'var(--surface)', border: `1px solid ${data.ashtama_planets?.length > 0 ? '#FCA5A5' : 'var(--border)'}`, borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('ASHTAMA (H8)')}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#DC2626', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{data.ashtama_planets?.map((p: string) => t(p)).join(', ') || t('None')}</div>
        </div>
      </div>

      {/* Planet table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Planet-wise Gochara')}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Planet','Transit Sign','H from ☽','Favorable H','Effect','Vedha'].map(h => (
                <th key={h} style={{ padding: '7px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', borderBottom: '1px solid var(--border)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.planets?.map((p: any, i: number) => {
              const es = EFFECT_STYLE[p.effect] || { bg: 'transparent', color: 'var(--text3)' }
              return (
                <tr key={p.planet} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                  <td style={{ padding: '7px 14px', fontWeight: 700, color: PLANET_COLORS[p.planet] || 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.planet)}</td>
                  <td style={{ padding: '7px 14px', color: 'var(--text2)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.transit_sign)}</td>
                  <td style={{ padding: '7px 14px', fontWeight: 700, color: 'var(--accent)' }}>H{p.house_from_moon}</td>
                  <td style={{ padding: '7px 14px', fontSize: 10, color: 'var(--text4)' }}>{p.favorable_houses?.join(',')}</td>
                  <td style={{ padding: '7px 14px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: es.bg, color: es.color, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                      {t(p.effect)}
                    </span>
                  </td>
                  <td style={{ padding: '7px 14px', fontSize: 11, color: p.vedha_occupied ? '#D97706' : 'var(--text4)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {p.vedha_occupied ? `H${p.vedha_house} (${t(p.vedha_by)})` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
