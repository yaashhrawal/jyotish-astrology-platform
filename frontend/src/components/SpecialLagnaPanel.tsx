import { useState, useEffect } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const LAGNA_COLORS: Record<string, string> = {
  SL: '#D97706', IL: '#16A34A', PL: '#DC2626', BL: '#5746AF'
}

interface Props { birthData: any }

export default function SpecialLagnaPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/special_lagnas', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Computing Special Lagnas…')}</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  const lagnas = [
    data.sree_lagna, data.indu_lagna, data.pranapada_lagna, data.bhava_lagna
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Special Lagnas')}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          Ascendant: <strong style={{ color: 'var(--text)' }}>{data.ascendant?.sign}</strong> {data.ascendant?.degree?.toFixed(2)}°
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
        {lagnas.map((l: any) => {
          if (!l) return null
          const c = LAGNA_COLORS[l.abbr] || 'var(--accent)'
          return (
            <div key={l.abbr} style={{ background: 'var(--surface)', border: `2px solid ${c}`, borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: c }}>{l.abbr}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{l.name}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: c, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{l.sign ? t(l.sign) : '—'}</div>
              {l.degree !== undefined && (
                <div style={{ fontSize: 12, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  {l.degree?.toFixed(2)}°
                </div>
              )}
              {l.hours_from_sunrise !== undefined && (
                <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>
                  {l.hours_from_sunrise}h from sunrise
                </div>
              )}
              {l.lagna_9th_lord && (
                <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>
                  9th lords: {l.lagna_9th_lord} + {l.moon_9th_lord}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                {l.meaning}
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}>Lagna Summary</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Lagna', 'Sign', 'Purpose'].map(h => (
                <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11.5, color: 'var(--text3)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px 16px', fontWeight: 700, color: 'var(--accent)' }}>Lagna (ASC)</td>
              <td style={{ padding: '8px 16px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.ascendant?.sign)}</td>
              <td style={{ padding: '8px 16px', color: 'var(--text3)', fontSize: 12 }}>Overall personality, life direction</td>
            </tr>
            {lagnas.map((l: any) => l && (
              <tr key={l.abbr} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 16px', fontWeight: 700, color: LAGNA_COLORS[l.abbr] }}>{l.abbr}</td>
                <td style={{ padding: '8px 16px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{l.sign ? t(l.sign) : '—'}</td>
                <td style={{ padding: '8px 16px', color: 'var(--text3)', fontSize: 12 }}>{l.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
