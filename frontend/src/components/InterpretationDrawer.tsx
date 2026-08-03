/**
 * InterpretationDrawer — the NEW rule-based factor engine as a slide-in drawer,
 * opened by clicking a house/planet on the chart board. Replaces the old
 * VargaAnalysisDrawer. Deep + precise: ranked sourced factors + seeker narrative,
 * every prediction citing its rule, judged inside the clicked divisional (Dx).
 */
import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { getInterpretation, getPlanetInterpretation, type TopicResult } from '../api/jyotish'
import ShlokaCard from './ShlokaCard'
import { PLANET_IN_SIGN, PLANET_IN_HOUSE, PLANET_KARAKATVA } from './PlanetInterpretation'

const HOUSE_TOPIC: Record<number, string> = {
  1: 'self', 2: 'wealth', 3: 'courage', 4: 'home', 5: 'children', 6: 'health',
  7: 'marriage', 8: 'longevity', 9: 'fortune', 10: 'career', 11: 'gains', 12: 'moksha',
}

interface Target { type: 'planet' | 'house'; planet?: string; house?: number }

interface Props {
  open: boolean
  onClose: () => void
  vargaD: number
  target: Target
  birthData: any
  chart: any            // the clicked varga chart (for planet→house lookup)
}

export default function InterpretationDrawer({ open, onClose, vargaD, target, birthData, chart }: Props) {
  const { t } = useLang()
  const [face, setFace] = useState<'seeker' | 'astro'>('seeker')
  const [res, setRes] = useState<TopicResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const isPlanet = target.type === 'planet' && !!target.planet
  // resolve which house (→ topic) a house-click maps to
  let house = 1
  if (target.type === 'house' && target.house) house = target.house
  else if (isPlanet) house = chart?.planets?.[target.planet!]?.house || 1
  const topic = HOUSE_TOPIC[house] || 'self'

  useEffect(() => {
    if (!open || !birthData) return
    setLoading(true); setErr('')
    const req = isPlanet
      ? getPlanetInterpretation({ ...birthData, name: 'Chart', planet: target.planet!, varga: vargaD }).then(r => r as any)
      : getInterpretation({ ...birthData, name: 'Chart', topic, varga: vargaD }).then(r => r.results[0])
    req.then(setRes).catch(e => setErr(e?.response?.data?.detail || 'Failed to compute')).finally(() => setLoading(false))
  }, [open, topic, vargaD, birthData, isPlanet, target.planet])

  if (!open) return null

  const polColor = (p: number) => p > 0 ? '#16a34a' : p < 0 ? '#dc2626' : 'var(--text3)'
  const polSym = (p: number) => p > 0 ? '＋' : p < 0 ? '－' : '○'
  const netColor = res && res.net > 1 ? '#16a34a' : res && res.net < -1 ? '#dc2626' : 'var(--text3)'

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', zIndex: 300 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(440px, 92vw)', zIndex: 310,
        background: 'var(--surface)', borderLeft: '1px solid var(--border)', boxShadow: 'var(--shadow-l)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>
              {res?.label || t('Interpretation')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              {t('House')} {house} · D{vargaD}{target.type === 'planet' ? ` · ${target.planet}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 20, color: 'var(--text3)' }}>✕</button>
        </div>

        {/* face toggle */}
        <div style={{ padding: '10px 20px 0', display: 'flex', gap: 0 }}>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {(['seeker', 'astro'] as const).map(f => (
              <button key={f} onClick={() => setFace(f)} style={{
                padding: '6px 16px', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                background: face === f ? 'var(--accent)' : 'transparent', color: face === f ? '#fff' : 'var(--text2)',
              }}>{f === 'seeker' ? t('Reading') : t('Factors')}</button>
            ))}
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 24px' }}>
          {loading && <div style={{ color: 'var(--text3)' }}>{t('Computing…')}</div>}
          {err && <div style={{ color: '#dc2626' }}>{err}</div>}
          {res && !loading && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 14px' }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: netColor }}>{res.net > 0 ? '+' : ''}{res.net.toFixed(1)}</span>
                {res.tension && <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: 'var(--gold-bg)', color: 'var(--gold)' }}>⚠ {t('Tension')}</span>}
              </div>

              {face === 'seeker' ? (
                <div>
                  <p style={{ fontSize: 15.5, fontWeight: 700, margin: '0 0 14px', color: 'var(--text)' }}>{res.narrative.headline}</p>
                  {res.narrative.statements.slice(1).map((s: any, i: number) => {
                    if (s.kind === 'group')
                      return <div key={i} style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--accent)', margin: '14px 0 6px' }}>{s.text}</div>
                    if (s.kind === 'support' || s.kind === 'harm')
                      return (
                        <div key={i} style={{ marginBottom: 11, paddingLeft: 10, borderLeft: `2px solid ${s.kind === 'support' ? '#16a34a' : '#dc2626'}` }}>
                          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text)' }}>{s.text}</div>
                          {s.detail && <div style={{ fontSize: 11.5, color: 'var(--text2)', marginTop: 2 }}>{s.detail}</div>}
                          {s.rule && <div style={{ fontSize: 10.5, color: 'var(--text4)', marginTop: 2 }}>📜 {s.rule}</div>}
                        </div>
                      )
                    return (
                      <div key={i} style={{ marginBottom: 11 }}>
                        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text)' }}>{s.text}</div>
                        {s.rule && <div style={{ fontSize: 10.5, color: 'var(--text4)', marginTop: 2 }}>📜 {s.rule}</div>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div>
                  {res.factors.map((f, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 70px 1fr', gap: 9, alignItems: 'center', padding: '7px 0', borderTop: '1px solid var(--border)' }}>
                      <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 12.5, color: 'var(--text2)' }}>{f.weight.toFixed(1)}</div>
                      <div style={{ height: 6, borderRadius: 4, background: 'var(--surface3)', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 4, width: `${Math.min(100, f.weight / 5.5 * 100)}%`, background: polColor(f.polarity) }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12.5, lineHeight: 1.35, color: 'var(--text)' }}>
                          <span style={{ fontWeight: 800, color: polColor(f.polarity), marginRight: 4 }}>{polSym(f.polarity)}</span>
                          {f.claim}{f.dasha_active && <span style={{ color: 'var(--gold)', fontWeight: 800 }}> ★</span>}
                        </div>
                        {(f as any).effect && <div style={{ fontSize: 11.5, color: 'var(--text2)', marginTop: 1 }}>{(f as any).effect}</div>}
                        <div style={{ fontSize: 10, color: 'var(--text4)' }}>{f.source}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Classical text — verbatim planet-in-sign / planet-in-house (planet clicks) */}
              {isPlanet && (res as any).planet && (() => {
                const pl = (res as any).planet as string, sg = (res as any).sign as string, hs = (res as any).house as number
                const signTxt = PLANET_IN_SIGN[pl]?.[sg]
                const houseTxt = PLANET_IN_HOUSE[pl]?.[hs - 1]
                return (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--accent)', marginBottom: 8 }}>{t('Classical text')}</div>
                    {PLANET_KARAKATVA[pl] && <div style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.5 }}><b>{t(pl)} {t('signifies')}:</b> {t(PLANET_KARAKATVA[pl])}</div>}
                    {signTxt && <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8, lineHeight: 1.5 }}><b>{t(pl)} {t('in')} {t(sg)}:</b> {t(signTxt)}</div>}
                    {houseTxt && <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4, lineHeight: 1.5 }}><b>{t('In the')} {hs}{t('th house')}:</b> {t(houseTxt)}</div>}
                    <div style={{ fontSize: 10.5, color: 'var(--text4)', marginTop: 4 }}>📜 BPHS Ch.20–33 — planet in sign & bhava</div>
                  </div>
                )
              })()}

              {/* classical verses */}
              <ShlokaCard topics={['karaka', 'guna', ...(house === 10 ? ['dignity'] : [])]} />
            </>
          )}
        </div>
      </div>
    </>
  )
}
