import { useState, useEffect } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const SIGN_COLORS = [
  '#DC2626','#16A34A','#0891B2','#2563EB','#D97706','#7C3AED',
  '#0891B2','#DC2626','#B45309','#57534E','#2563EB','#7C3AED',
]
const sc = (idx: number) => SIGN_COLORS[idx % 12]

function isPast(end: string) { return new Date(end) < new Date() }

interface Props { birthData: any }

export default function NarayanaPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/narayana_dasha', birthData)
      .then(d => {
        setData(d)
        const ai = d.dashas?.findIndex((x: any) => x.is_active)
        if (ai >= 0) setExpanded(ai)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Computing Narayana Dasha…')}</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Narayana Dasha')} — {t('Jaimini System')}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          Sign-based dasha. Lagna direction: <strong style={{ color: 'var(--accent)' }}>{data.lagna_direction}</strong>.
          Ascendant: <strong style={{ color: 'var(--text)' }}>{data.ascendant?.sign}</strong>
        </div>
      </div>

      {/* Dasha list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {data.dashas?.slice(0, 24).map((d: any, i: number) => {
          const active = d.is_active
          const past = isPast(d.end)
          const open = expanded === i
          const c = sc(d.sign_index)
          return (
            <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <div onClick={() => setExpanded(open ? null : i)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', cursor: 'pointer',
                background: active ? c + '12' : open ? 'var(--hover)' : 'transparent',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 600, color: active ? c : past ? 'var(--text3)' : 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                      {t(d.sign)} {t('Dasha')}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text4)' }}>({d.direction})</span>
                    {active && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: c, color: '#fff' }}>ACTIVE</span>}
                    {past && <span style={{ fontSize: 10, color: 'var(--text4)' }}>past</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 2 }}>
                    {d.start?.slice(0,7)} → {d.end?.slice(0,7)} · {d.years}y
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text4)' }}>{open ? '▲' : '▼'}</span>
              </div>

              {open && d.antardashas && (
                <div style={{ background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
                  {d.antardashas.map((ad: any, j: number) => {
                    const adActive = ad.is_active
                    const ac = sc(ad.sign_index)
                    return (
                      <div key={j} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '6px 18px 6px 36px',
                        borderBottom: '1px solid var(--border)', background: adActive ? ac + '12' : 'transparent',
                      }}>
                        <div style={{ width: 7, height: 7, borderRadius: 1, background: ac, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: adActive ? 700 : 400, color: adActive ? ac : 'var(--text2)' }}>
                            <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(d.sign)}</span> / <span style={{ color: ac, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(ad.sign)}</span>
                          </span>
                          {adActive && <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: ac, color: '#fff' }}>NOW</span>}
                        </div>
                        <span style={{ fontSize: 10.5, color: 'var(--text4)', fontVariantNumeric: 'tabular-nums' }}>
                          {ad.start?.slice(0,7)} → {ad.end?.slice(0,7)} · {ad.years?.toFixed(2)}y
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
