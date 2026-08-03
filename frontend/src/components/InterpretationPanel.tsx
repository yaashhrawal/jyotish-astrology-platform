/**
 * InterpretationPanel — rule-based reading (deterministic, sourced).
 * One factor engine, two faces: Seeker (narrative) + Astrologer (ranked factor table).
 * Every prediction shows the exact rule/source that produced it.
 */
import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { getInterpretTopics, getInterpretation, type TopicMeta, type TopicResult } from '../api/jyotish'

const VARGAS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60]

export default function InterpretationPanel({ birth }: { birth: any }) {
  const { t } = useLang()
  const [topics, setTopics] = useState<TopicMeta[]>([])
  const [topic, setTopic] = useState('career')
  const [varga, setVarga] = useState(1)
  const [face, setFace] = useState<'seeker' | 'astro'>('seeker')
  const [res, setRes] = useState<TopicResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { getInterpretTopics().then(setTopics).catch(() => {}) }, [])

  useEffect(() => {
    if (!birth) return
    setLoading(true); setErr('')
    getInterpretation({ ...birth, name: 'Chart', topic, varga })
      .then(r => setRes(r.results[0]))
      .catch(e => setErr(e?.response?.data?.detail || 'Failed to compute'))
      .finally(() => setLoading(false))
  }, [birth, topic, varga])

  if (!birth) return <div style={{ padding: 24, color: 'var(--text3)' }}>{t('Calculate a chart first.')}</div>

  const netColor = (n: number) => n > 1 ? '#16a34a' : n < -1 ? '#dc2626' : '#9ca3af'
  const polColor = (p: number) => p > 0 ? '#16a34a' : p < 0 ? '#dc2626' : '#9ca3af'
  const polSym = (p: number) => p > 0 ? '＋' : p < 0 ? '－' : '○'

  return (
    <div style={{ padding: '16px 20px', maxWidth: 860, margin: '0 auto' }}>
      {/* topic chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {topics.map(tp => (
          <button key={tp.key} onClick={() => setTopic(tp.key)}
            style={{
              padding: '5px 11px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5,
              border: '1px solid var(--border)', fontWeight: topic === tp.key ? 800 : 500,
              background: topic === tp.key ? 'var(--accent)' : 'var(--surface)',
              color: topic === tp.key ? '#fff' : 'var(--text2)',
            }}>{t(tp.label)}</button>
        ))}
      </div>

      {/* controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {(['seeker', 'astro'] as const).map(f => (
            <button key={f} onClick={() => setFace(f)}
              style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                background: face === f ? 'var(--accent)' : 'transparent',
                color: face === f ? '#fff' : 'var(--text2)',
              }}>{f === 'seeker' ? t('Reading') : t('Factors')}</button>
          ))}
        </div>
        <label style={{ fontSize: 12.5, color: 'var(--text3)', display: 'flex', gap: 6, alignItems: 'center' }}>
          {t('Judge in')}:
          <select value={varga} onChange={e => setVarga(Number(e.target.value))}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
            {VARGAS.map(v => <option key={v} value={v}>{v === 1 ? 'D1 (Rāśi)' : `D${v}`}</option>)}
          </select>
        </label>
      </div>

      {loading && <div style={{ color: 'var(--text3)', padding: 16 }}>{t('Computing…')}</div>}
      {err && <div style={{ color: '#dc2626', padding: 16 }}>{err}</div>}

      {res && !loading && (
        <>
          {/* verdict */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 14px',
            border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-sunk, rgba(120,120,140,.06))' }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: netColor(res.net) }}>
              {res.net > 0 ? '+' : ''}{res.net.toFixed(1)}
            </span>
            {res.tension && <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
              background: 'rgba(217,119,6,.15)', color: '#b45309' }}>⚠ {t('Tension')}</span>}
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{res.label}{res.varga && res.varga !== 'D1' ? ` · ${res.varga}` : ''}</span>
          </div>

          {face === 'seeker' ? (
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: 'var(--text)' }}>{res.narrative.headline}</p>
              {res.narrative.statements.slice(1).map((s: any, i: number) => {
                if (s.kind === 'group')
                  return <div key={i} style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--accent)', margin: '14px 0 6px' }}>{s.text}</div>
                if (s.kind === 'support' || s.kind === 'harm')
                  return (
                    <div key={i} style={{ marginBottom: 11, paddingLeft: 10, borderLeft: `2px solid ${s.kind === 'support' ? '#16a34a' : '#dc2626'}` }}>
                      <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>{s.text}</div>
                      {s.detail && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.detail}</div>}
                      {s.rule && <div style={{ fontSize: 10.5, color: 'var(--text4)', marginTop: 2 }}>📜 {s.rule}</div>}
                    </div>
                  )
                return (
                  <div key={i} style={{ marginBottom: 11 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>{s.text}</div>
                    {s.rule && <div style={{ fontSize: 10.5, color: 'var(--text4)', marginTop: 2 }}>📜 {s.rule}</div>}
                  </div>
                )
              })}
            </div>
          ) : (
            <div>
              {res.factors.map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '38px 84px 1fr', gap: 10, alignItems: 'center',
                  padding: '7px 0', borderTop: '1px solid var(--border)' }}>
                  <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--text2)' }}>{f.weight.toFixed(1)}</div>
                  <div style={{ height: 7, borderRadius: 4, background: 'var(--track, rgba(120,120,140,.18))', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 4,
                      width: `${Math.min(100, f.weight / 5.5 * 100)}%`, background: polColor(f.polarity) }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, lineHeight: 1.35, color: 'var(--text)' }}>
                      <span style={{ fontWeight: 800, color: polColor(f.polarity), marginRight: 4 }}>{polSym(f.polarity)}</span>
                      {f.claim}{f.dasha_active && <span style={{ color: '#d97706', fontWeight: 800 }}> ★</span>}
                    </div>
                    {f.effect && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>{f.effect}</div>}
                    <div style={{ fontSize: 10.5, color: 'var(--text4)' }}>{f.source}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text4)', lineHeight: 1.5 }}>
            {t('Rule-based · deterministic · every prediction cites its classical source. ★ = planet in the active daśā.')}
          </div>
        </>
      )}
    </div>
  )
}
