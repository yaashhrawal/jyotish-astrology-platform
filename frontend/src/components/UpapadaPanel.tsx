import { useState } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

interface BirthData {
  year: number; month: number; day: number
  hour: number; minute: number; tz_offset: number
  latitude: number; longitude: number; ayanamsa: string
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#f59e0b', Moon: '#a78bfa', Mars: '#ef4444',
  Mercury: '#10b981', Jupiter: '#f97316', Venus: '#ec4899',
  Saturn: '#6366f1', Rahu: '#64748b', Ketu: '#84cc16',
}

const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']

const RISK_COLOR: Record<string, string> = { high: '#ef4444', moderate: '#f59e0b', low: '#22c55e' }
const EFFECT_BG: Record<string, string> = { positive: '#16A34A18', negative: '#DC262618', neutral: 'var(--surface2)' }
const EFFECT_BORDER: Record<string, string> = { positive: '#16A34A44', negative: '#DC262644', neutral: 'var(--border)' }

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px',
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 10, background: 'var(--surface2)', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: 5, transition: 'width .3s' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}/100</span>
    </div>
  )
}

export default function UpapadaPanel({ birthData }: { birthData: BirthData | null }) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const compute = async () => {
    if (!birthData) return
    setLoading(true); setError('')
    try {
      const res = await apiPost('/api/calc/upapada_analysis', birthData)
      setData(res)
    } catch (e: any) {
      setError(e?.response?.data?.detail || t('Computation failed'))
    } finally { setLoading(false) }
  }

  if (!birthData) return <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>{t('Enter birth data to compute Upapada analysis.')}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ec4899' }}>{t('Upapada Lagna (UL)')}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t('A12 — Marriage Timing · Jaimini')}</div>
        </div>
        <button onClick={compute} disabled={loading} style={{
          marginLeft: 'auto', padding: '8px 20px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}>{loading ? t('Computing…') : t('Compute')}</button>
      </div>

      {error && <div style={{ padding: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>}

      {data && (
        <>
          {/* Header stats */}
          <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
              {[
                { label: t('Upapada Lagna'), val: data.upapada_lagna?.sign, sub: ORDINALS[data.upapada_lagna?.house_in_d1] + ' ' + t('house'), color: '#ec4899' },
                { label: t('UL Lord'), val: data.upapada_lagna?.lord, sub: `${t('in')} ${data.ul_lord_analysis?.sign} (${ORDINALS[data.ul_lord_analysis?.house]}H)`, color: PLANET_COLORS[data.upapada_lagna?.lord] || 'var(--accent)' },
                { label: t('Darakaraka'), val: data.darakaraka, sub: t("Soul's spouse indicator"), color: PLANET_COLORS[data.darakaraka] || 'var(--accent)' },
                { label: t('Separation Risk'), val: data.seventh_from_ul?.separation_risk, sub: t('7th from UL'), color: RISK_COLOR[data.seventh_from_ul?.separation_risk] || 'var(--text3)' },
              ].map(({ label, val, sub, color }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color, textTransform: 'capitalize' }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text4)' }}>{sub}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{t('Marriage Quality Score')}</div>
              <ScoreBar score={data.marriage_quality_score || 0} />
            </div>
          </div>

          {/* UL sign interpretation */}
          {data.ul_sign_interpretation && (
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ec4899', marginBottom: 12 }}>{t('UL in')} {data.upapada_lagna?.sign} — {t('Marriage Profile')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{t('Spouse Nature')}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{data.ul_sign_interpretation.spouse_nature}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{t('Marriage Character')}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{data.ul_sign_interpretation.marriage}</div>
                </div>
              </div>
            </div>
          )}

          {/* Planets in UL */}
          {data.ul_planet_readings?.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ec4899', marginBottom: 12 }}>{t('Planets in Upapada Lagna')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.ul_planet_readings.map((p: any) => (
                  <div key={p.planet} style={{ padding: '10px 12px', borderRadius: 8, background: EFFECT_BG[p.effect] || 'var(--surface2)', border: `1px solid ${EFFECT_BORDER[p.effect] || 'var(--border)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: PLANET_COLORS[p.planet] + '22', color: PLANET_COLORS[p.planet] }}>{p.planet}</span>
                      <span style={{ fontSize: 11, color: EFFECT_BG[p.effect] === '#16A34A18' ? '#16A34A' : p.effect === 'negative' ? '#DC2626' : 'var(--text3)', textTransform: 'capitalize' }}>{p.effect}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{p.reading}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UL Lord */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ec4899', marginBottom: 12 }}>{t('UL Lord')} — {data.ul_lord_analysis?.planet}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 12 }}>
              {[
                [t('Sign'), data.ul_lord_analysis?.sign],
                [t('House'), ORDINALS[data.ul_lord_analysis?.house]],
                [t('Dignity'), (data.ul_lord_analysis?.status || '').replace('_', ' ')],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, textTransform: 'capitalize' }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{data.ul_lord_analysis?.reading}</div>
          </div>

          {/* Gaunapada + 7th */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: `${t('2nd from UL — Gaunapada')} (${data.gaunapada?.sign})`, data: data.gaunapada, color: '#60a5fa' },
              { label: `${t('7th from UL')} (${data.seventh_from_ul?.sign})`, data: data.seventh_from_ul, color: '#f97316' },
            ].map(({ label, data: d, color }) => (
              <div key={label} style={card}>
                <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 10 }}>{label}</div>
                {d?.planets?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {d.planets.map((p: string) => (
                      <span key={p} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: PLANET_COLORS[p] + '22', color: PLANET_COLORS[p] }}>{p}</span>
                    ))}
                  </div>
                )}
                {!d?.planets?.length && <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 8 }}>{t('No planets')}</div>}
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{d?.reading}</div>
                {d?.separation_risk && (
                  <div style={{ fontSize: 11, marginTop: 8, fontWeight: 700, color: RISK_COLOR[d.separation_risk] }}>
                    {t('Separation risk')}: {d.separation_risk}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ ...card, fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text2)' }}>{t('Classical source')}:</strong> {t('Jaimini Sutras Ch. 1.2, BPHS Ch. 80–81. Upapada = Arudha of 12th house (A12). UL indicates the manifest form of marriage. Combine with 7H, 7L, Venus, Darakaraka.')}
          </div>
        </>
      )}
    </div>
  )
}
