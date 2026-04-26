import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { dashaApi } from '../api/client'

interface Sookshma { lord: string; start: string; end: string; days: number }
interface Pratyantardasha { lord: string; start: string; end: string; years: number; sookshmas?: Sookshma[] }
interface Antardasha { lord: string; start: string; end: string; years: number; pratyantardashas?: Pratyantardasha[] }
interface Dasha { lord: string; start: string; end: string; years: number; antardashas?: Antardasha[] }

interface Props {
  dashas: Dasha[]
  birthYear: number
  birthData?: any
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

function dotStyle(lord: string, size = 9): React.CSSProperties {
  return { width: size, height: size, borderRadius: '50%', background: PLANET_COLORS[lord] || 'var(--text3)', flexShrink: 0 }
}

function badgeStyle(lord: string): React.CSSProperties {
  const c = PLANET_COLORS[lord] || '#666'
  return { fontSize: '10px', fontWeight: '700', padding: '1px 7px', borderRadius: '20px', background: c + '22', color: c, border: `1px solid ${c}44` }
}

function isNow(start: string, end: string) { const n = new Date(); return new Date(start) <= n && n <= new Date(end) }
function isPast(end: string) { return new Date(end) < new Date() }

export default function DashaTimeline({ dashas: propDashas, birthYear, birthData }: Props) {
  const { t } = useLang()
  const [fullDashas, setFullDashas] = useState<Dasha[]>([])
  const [dashaBalance, setDashaBalance] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [expandedAntar, setExpandedAntar] = useState<string | null>(null)
  const [expandedPratya, setExpandedPratya] = useState<string | null>(null)
  const [sookshmaCache, setSookshmaCache] = useState<Record<string, Sookshma[]>>({})
  const [sookshmaLoading, setSookshmaLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    dashaApi.get(birthData).then(data => {
      const d: Dasha[] = data.dashas || []
      setFullDashas(d)
      setDashaBalance(data.dasha_balance)
      const activeIdx = d.findIndex(x => isNow(x.start, x.end))
      if (activeIdx >= 0) setExpanded(activeIdx)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [birthData])

  const fetchSookshma = async (mahaLord: string, antarLord: string, pt: Pratyantardasha, key: string) => {
    if (sookshmaCache[key]) { setExpandedPratya(expandedPratya === key ? null : key); return }
    setSookshmaLoading(key)
    try {
      const res = await dashaApi.sookshma({ maha_lord: mahaLord, antar_lord: antarLord, pratya_lord: pt.lord, pratya_start: pt.start, pratya_years: pt.years })
      setSookshmaCache(c => ({ ...c, [key]: res.sookshma_dashas }))
      setExpandedPratya(key)
    } catch { /* ignore */ }
    finally { setSookshmaLoading(null) }
  }

  const dashas = fullDashas.length ? fullDashas : propDashas
  const totalYears = dashas.reduce((s, d) => s + d.years, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Dasha balance at birth */}
      {dashaBalance && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: (PLANET_COLORS[dashaBalance.lord] || 'var(--accent)') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
            ⏱
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Dasha Balance at Birth')}</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: PLANET_COLORS[dashaBalance.lord] || 'var(--accent)', marginTop: '2px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              {t(dashaBalance.lord)} · {dashaBalance.years}y ({dashaBalance.days}d remaining)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              {t('Moon')} in {t(dashaBalance.nakshatra)} — {t('Vimshottari starts with')} {t(dashaBalance.lord)} {t('Mahadasha')}
            </div>
          </div>
        </div>
      )}

      {/* Visual bar */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Vimshottari Dasha')} — {t('120 Year Life Map')}</div>
        <div style={{ display: 'flex', height: '36px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '6px' }}>
          {dashas.map((d, i) => {
            const w = (d.years / totalYears) * 100
            const active = isNow(d.start, d.end)
            return (
              <div key={i} onClick={() => setExpanded(expanded === i ? null : i)}
                title={`${d.lord}: ${d.start.slice(0,7)} – ${d.end.slice(0,7)}`}
                style={{
                  width: `${w}%`, flexShrink: 0, cursor: 'pointer',
                  background: PLANET_COLORS[d.lord] || 'var(--text3)',
                  opacity: active ? 1 : expanded === i ? 0.8 : isPast(d.end) ? 0.22 : 0.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', color: '#fff', fontWeight: '700',
                  borderRight: '1px solid rgba(255,255,255,.12)', transition: 'opacity .2s', position: 'relative',
                }}>
                {w > 6 ? d.lord.slice(0, 2) : ''}
                {active && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid rgba(255,255,255,.9)' }} />}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text3)' }}>
          <span>{birthYear}</span>
          <span style={{ color: 'var(--accent)', fontWeight: '600', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('NOW')} ↑</span>
          <span>{birthYear + 120}</span>
        </div>
      </div>

      {/* Dasha list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading && <div style={{ padding: '14px 20px', fontSize: '12.5px', color: 'var(--text3)' }}>Loading antardashas…</div>}

        {dashas.map((d, i) => {
          const active = isNow(d.start, d.end)
          const past = isPast(d.end)
          const open = expanded === i

          return (
            <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              {/* Mahadasha row */}
              <div onClick={() => setExpanded(open ? null : i)} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px',
                cursor: 'pointer', background: active ? 'var(--accent-bg)' : open ? 'var(--hover)' : 'transparent',
                transition: 'background .15s',
              }}>
                <div style={dotStyle(d.lord, 10)} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: active ? '700' : '600', color: active ? PLANET_COLORS[d.lord] : past ? 'var(--text3)' : 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                      {t(d.lord)} {t('Mahadasha')}
                    </span>
                    {active && <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 8px', borderRadius: '20px', background: PLANET_COLORS[d.lord], color: '#fff', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('ACTIVE')}</span>}
                    {past && <span style={{ fontSize: '10px', color: 'var(--text4)', marginLeft: '2px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('past')}</span>}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '2px' }}>
                    {d.start.slice(0, 7)} → {d.end.slice(0, 7)} · {d.years.toFixed(1)}y
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text4)' }}>{open ? '▲' : '▼'}</span>
              </div>

              {/* Antardashas */}
              {open && d.antardashas && d.antardashas.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  {/* Mini bar for antardashas */}
                  <div style={{ display: 'flex', height: '6px', margin: '0 18px 0 36px' }}>
                    {d.antardashas.map((ad, j) => (
                      <div key={j} style={{
                        flex: ad.years, background: PLANET_COLORS[ad.lord] || '#ccc',
                        opacity: isNow(ad.start, ad.end) ? 1 : 0.4,
                        borderRight: '1px solid white',
                      }} title={ad.lord} />
                    ))}
                  </div>

                  {d.antardashas.map((ad, j) => {
                    const adActive = isNow(ad.start, ad.end)
                    const adPast = isPast(ad.end)
                    const adKey = `${i}-${j}`
                    const adOpen = expandedAntar === adKey
                    return (
                      <div key={j}>
                        <div
                          onClick={e => { e.stopPropagation(); setExpandedAntar(adOpen ? null : adKey) }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '7px 18px 7px 36px', cursor: 'pointer',
                            borderTop: j === 0 ? '1px solid var(--border)' : 'none',
                            borderBottom: '1px solid var(--border)',
                            background: adActive ? (PLANET_COLORS[ad.lord] + '12') : adOpen ? 'var(--hover)' : 'transparent',
                          }}>
                          <div style={dotStyle(ad.lord, 7)} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', fontWeight: adActive ? '700' : '400', color: adActive ? PLANET_COLORS[ad.lord] : adPast ? 'var(--text4)' : 'var(--text2)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                                {t(d.lord)} / <span style={{ color: PLANET_COLORS[ad.lord] }}>{t(ad.lord)}</span>
                              </span>
                              {adActive && <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 6px', borderRadius: '20px', background: PLANET_COLORS[ad.lord], color: '#fff', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('NOW')}</span>}
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text4)', marginTop: '1px' }}>
                              {ad.start.slice(0, 7)} → {ad.end.slice(0, 7)} · {ad.years.toFixed(2)}y
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span style={badgeStyle(d.lord)}>{d.lord.slice(0,2)}</span>
                            <span style={badgeStyle(ad.lord)}>{ad.lord.slice(0,2)}</span>
                            {ad.pratyantardashas && <span style={{ fontSize: '10px', color: 'var(--text4)' }}>{adOpen ? '▲' : '▼'}</span>}
                          </div>
                        </div>
                        {/* Pratyantardashas */}
                        {adOpen && ad.pratyantardashas && (
                          <div style={{ background: 'var(--surface3)', borderBottom: '1px solid var(--border)' }}>
                            {ad.pratyantardashas.map((pt, k) => {
                              const ptActive = isNow(pt.start, pt.end)
                              const ptKey = `${i}-${j}-${k}`
                              const ptOpen = expandedPratya === ptKey
                              const sookshmas = sookshmaCache[ptKey]
                              return (
                                <div key={k}>
                                  <div
                                    onClick={e => { e.stopPropagation(); fetchSookshma(d.lord, ad.lord, pt, ptKey) }}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '8px',
                                      padding: '5px 18px 5px 54px', cursor: 'pointer',
                                      borderBottom: '1px solid var(--border)',
                                      background: ptActive ? (PLANET_COLORS[pt.lord] + '10') : ptOpen ? 'var(--hover)' : 'transparent',
                                    }}>
                                    <div style={dotStyle(pt.lord, 5)} />
                                    <span style={{ fontSize: '11px', fontWeight: ptActive ? '700' : '400', color: ptActive ? PLANET_COLORS[pt.lord] : isPast(pt.end) ? 'var(--text4)' : 'var(--text3)', flex: 1, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                                      {t(d.lord)} / {t(ad.lord)} / <span style={{ color: PLANET_COLORS[pt.lord] }}>{t(pt.lord)}</span>
                                      {ptActive && <span style={{ marginLeft: '5px', fontSize: '8px', fontWeight: '700', padding: '1px 4px', borderRadius: '10px', background: PLANET_COLORS[pt.lord], color: '#fff' }}>{t('NOW')}</span>}
                                    </span>
                                    <span style={{ fontSize: '10px', color: 'var(--text4)', fontVariantNumeric: 'tabular-nums' }}>
                                      {pt.start.slice(0, 7)} → {pt.end.slice(0, 7)}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--text4)', marginLeft: '4px' }}>
                                      {sookshmaLoading === ptKey ? '…' : ptOpen ? '▲' : '▼'}
                                    </span>
                                  </div>
                                  {/* Sookshma dashas — level 4 */}
                                  {ptOpen && sookshmas && (
                                    <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                                      {sookshmas.map((sk, m) => {
                                        const skActive = isNow(sk.start, sk.end)
                                        return (
                                          <div key={m} style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '4px 18px 4px 72px',
                                            borderBottom: m < sookshmas.length - 1 ? '1px solid var(--border)' : 'none',
                                            background: skActive ? (PLANET_COLORS[sk.lord] + '10') : 'transparent',
                                          }}>
                                            <div style={dotStyle(sk.lord, 4)} />
                                            <span style={{ fontSize: '10px', fontWeight: skActive ? '700' : '400', color: skActive ? PLANET_COLORS[sk.lord] : isPast(sk.end) ? 'var(--text4)' : 'var(--text3)', flex: 1, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                                              {t(d.lord)} / {t(ad.lord)} / {t(pt.lord)} / <span style={{ color: PLANET_COLORS[sk.lord] }}>{t(sk.lord)}</span>
                                              {skActive && <span style={{ marginLeft: '4px', fontSize: '7px', fontWeight: '700', padding: '1px 3px', borderRadius: '8px', background: PLANET_COLORS[sk.lord], color: '#fff' }}>{t('NOW')}</span>}
                                            </span>
                                            <span style={{ fontSize: '9px', color: 'var(--text4)', fontVariantNumeric: 'tabular-nums' }}>
                                              {sk.start.slice(0, 10)} → {sk.end.slice(0, 10)} · {sk.days.toFixed(1)}d
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
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {open && !fullDashas.length && (
                <div style={{ padding: '10px 36px', fontSize: '11.5px', color: 'var(--text4)', background: 'var(--surface2)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t('Antardashas available after first calculation')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Planet color legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {Object.entries(PLANET_COLORS).map(([p, c]) => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
            {t(p)}
          </div>
        ))}
      </div>
    </div>
  )
}
