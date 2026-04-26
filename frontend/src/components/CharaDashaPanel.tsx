import { useState, useEffect } from 'react'
import { charaDashaApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const SIGN_COLORS = [
  '#DC2626','#16A34A','#0891B2','#2563EB','#D97706','#7C3AED',
  '#0891B2','#DC2626','#B45309','#57534E','#2563EB','#7C3AED',
]

function isNow(start: string, end: string) { const n = new Date(); return new Date(start) <= n && n <= new Date(end) }
function isPast(end: string) { return new Date(end) < new Date() }

interface Props { birthData: any }

export default function CharaDashaPanel({ birthData }: Props) {
  const { t } = useLang()
  const [variant, setVariant] = useState<'srath' | 'kn'>('srath')
  const [data, setData] = useState<any>(null)
  const [dataKN, setDataKN] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    if (!birthData) return
    const cached = variant === 'srath' ? data : dataKN
    if (cached) return
    setLoading(true); setError('')
    const fn = variant === 'srath' ? charaDashaApi.get : charaDashaApi.getKN
    fn(birthData)
      .then((d: any) => {
        if (variant === 'srath') setData(d); else setDataKN(d)
        const activeIdx = d.dashas?.findIndex((x: any) => x.is_active)
        if (activeIdx >= 0) setExpanded(activeIdx)
      })
      .catch((e: any) => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false))
  }, [birthData, variant])

  const activeData = variant === 'srath' ? data : dataKN

  if (loading) return <div style={{ padding: '20px', color: 'var(--text3)' }}>Calculating Chara Dasha…</div>
  if (error) return <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#DC2626', fontSize: '13px' }}>{error}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Variant toggle */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[{ id: 'srath' as const, label: 'Sanjay Rath', sub: 'Mars/Saturn lord Scorpio/Aquarius' },
          { id: 'kn' as const,    label: 'KN Rao',       sub: 'Ketu/Rahu lord Scorpio/Aquarius' }].map(v => (
          <button key={v.id} onClick={() => setVariant(v.id)} style={{
            padding: '8px 14px', borderRadius: 'var(--radius-m)', cursor: 'pointer', textAlign: 'left',
            border: `1px solid ${variant === v.id ? 'var(--accent)' : 'var(--border)'}`,
            background: variant === v.id ? 'var(--accent)' : 'var(--surface)',
            color: variant === v.id ? '#fff' : 'var(--text)',
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700' }}>{v.label}</div>
            <div style={{ fontSize: '10px', opacity: 0.75, marginTop: '1px' }}>{v.sub}</div>
          </button>
        ))}
      </div>

      {!activeData && !loading && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>Select a variant to load</div>}
      {!activeData ? null : <>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>{t('Chara Dasha')} — {t('Jaimini System')} ({activeData.variant})</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5 }}>
          Sign-based dasha. Lagna: <strong style={{ color: 'var(--text)' }}>{t(activeData.ascendant?.sign)}</strong>. Each rashi gets years determined by its lord's position from it.
        </div>
      </div>

      {/* Sign years table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: '700' }}>
          Chara Years Per Sign
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1px', background: 'var(--border)' }}>
          {activeData.sign_years?.map((sy: any, i: number) => {
            const c = SIGN_COLORS[i % 12]
            return (
              <div key={i} style={{ background: 'var(--surface)', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text4)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(sy.sign)}</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: c, marginTop: '2px' }}>{sy.years}y</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Visual bar — first cycle */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: 'var(--text3)' }}>First Cycle (from Lagna sign)</div>
        <div style={{ display: 'flex', height: '28px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {activeData.dashas?.slice(0, 12).map((d: any, i: number) => {
            const totalYears = activeData.dashas.slice(0,12).reduce((s: number, x: any) => s + x.years, 0)
            const w = (d.years / totalYears) * 100
            const active = d.is_active
            const c = SIGN_COLORS[d.sign_index % 12]
            return (
              <div key={i} onClick={() => setExpanded(expanded === i ? null : i)} title={`${d.sign}: ${d.years}y`}
                style={{ width: `${w}%`, background: c, opacity: active ? 1 : isPast(d.end) ? 0.2 : 0.5,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '8px', color: '#fff', fontWeight: '700', position: 'relative',
                  borderRight: '1px solid rgba(255,255,255,.2)', transition: 'opacity .2s',
                }}>
                {w > 5 ? d.sign.slice(0, 3) : ''}
                {active && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0,
                  borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid rgba(255,255,255,.9)' }} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Dasha list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {activeData.dashas?.slice(0, 24).map((d: any, i: number) => {
          const active = d.is_active
          const past = isPast(d.end)
          const open = expanded === i
          const c = SIGN_COLORS[d.sign_index % 12]
          const lordColor = PLANET_COLORS[d.lord] || '#888'

          return (
            <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <div onClick={() => setExpanded(open ? null : i)} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', cursor: 'pointer',
                background: active ? (c + '12') : open ? 'var(--hover)' : 'transparent',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: c, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: active ? '700' : '600', color: active ? c : past ? 'var(--text3)' : 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                      {t(d.sign)} {t('Dasha')}
                    </span>
                    <span style={{ fontSize: '11px', color: lordColor, fontWeight: '600', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>({t(d.lord)})</span>
                    <span style={{ fontSize: '10px', color: 'var(--text4)' }}>H{d.house}</span>
                    {active && <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 8px', borderRadius: '20px', background: c, color: '#fff' }}>ACTIVE</span>}
                    {past && <span style={{ fontSize: '10px', color: 'var(--text4)' }}>past</span>}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '2px' }}>
                    {d.start?.slice(0, 7)} → {d.end?.slice(0, 7)} · {d.years}y
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text4)' }}>{open ? '▲' : '▼'}</span>
              </div>

              {open && d.antardashas && (
                <div style={{ background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
                  {/* Mini bar */}
                  <div style={{ display: 'flex', height: '4px', margin: '0 18px 0 36px' }}>
                    {d.antardashas.map((ad: any, j: number) => {
                      const adActive = isNow(ad.start || '', ad.end || '')
                      const ac = SIGN_COLORS[ad.sign_index % 12]
                      return (
                        <div key={j} style={{ flex: ad.years, background: ac, opacity: adActive ? 1 : 0.4, borderRight: '1px solid white' }} />
                      )
                    })}
                  </div>
                  {d.antardashas.map((ad: any, j: number) => {
                    const adActive = isNow(ad.start || '', ad.end || '')
                    const ac = SIGN_COLORS[ad.sign_index % 12]
                    return (
                      <div key={j} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '6px 18px 6px 36px', borderTop: j === 0 ? '1px solid var(--border)' : 'none',
                        borderBottom: '1px solid var(--border)',
                        background: adActive ? (ac + '12') : 'transparent',
                      }}>
                        <div style={{ width: 7, height: 7, borderRadius: '1px', background: ac, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '12px', fontWeight: adActive ? '700' : '400', color: adActive ? ac : 'var(--text2)' }}>
                            {t(d.sign)} / <span style={{ color: ac }}>{t(ad.sign)}</span>
                          </span>
                          {adActive && <span style={{ marginLeft: 8, fontSize: '9px', fontWeight: '700', padding: '1px 6px', borderRadius: '10px', background: ac, color: '#fff' }}>NOW</span>}
                        </div>
                        <span style={{ fontSize: '10.5px', color: 'var(--text4)', fontVariantNumeric: 'tabular-nums' }}>
                          {ad.start?.slice(0, 7)} → {ad.end?.slice(0, 7)} · {ad.years?.toFixed(2)}y
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
      </>}
    </div>
  )
}
