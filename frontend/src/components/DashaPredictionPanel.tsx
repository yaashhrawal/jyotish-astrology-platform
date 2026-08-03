/**
 * DashaPredictionPanel — rule-based predictions for the running Vimshottari period
 * (mahadasha + antardasha) using the factor engine, plus a mahadasha timeline.
 * Every prediction cites its rule; plain-language meaning under each.
 */
import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { getDashaPrediction, type DashaPredictResponse } from '../api/jyotish'

export default function DashaPredictionPanel({ birth }: { birth: any }) {
  const { t } = useLang()
  const [data, setData] = useState<DashaPredictResponse | null>(null)
  const [face, setFace] = useState<'seeker' | 'astro'>('seeker')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!birth) return
    setLoading(true); setErr('')
    getDashaPrediction({ ...birth, name: 'Chart' })
      .then(setData).catch(e => setErr(e?.response?.data?.detail || 'Failed to compute')).finally(() => setLoading(false))
  }, [birth])

  if (!birth) return <div style={{ padding: 24, color: 'var(--text3)' }}>{t('Calculate a chart first.')}</div>
  if (loading) return <div style={{ padding: 24, color: 'var(--text3)' }}>{t('Computing…')}</div>
  if (err) return <div style={{ padding: 24, color: '#dc2626' }}>{err}</div>
  if (!data) return null

  const cur = data.current
  const polColor = (p: number) => p > 0 ? '#16a34a' : p < 0 ? '#dc2626' : 'var(--text3)'
  const polSym = (p: number) => p > 0 ? '＋' : p < 0 ? '－' : '○'
  const netColor = (n: number) => n > 1 ? '#16a34a' : n < -1 ? '#dc2626' : 'var(--text3)'
  const ymd = (s: string) => (s || '').slice(0, 10)

  return (
    <div style={{ padding: '16px 20px', maxWidth: 880, margin: '0 auto' }}>
      {/* current period header */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{cur.label}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>
          {t('Running now')} · {ymd(cur.period.maha_start)} → {ymd(cur.period.maha_end)}
          {cur.period.antar_start && <> · {t('sub')}: {ymd(cur.period.antar_start)} → {ymd(cur.period.antar_end || '')}</>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 14px' }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: netColor(cur.net) }}>{cur.net > 0 ? '+' : ''}{cur.net.toFixed(1)}</span>
        {cur.tension && <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: 'var(--gold-bg)', color: 'var(--gold)' }}>⚠ {t('Tension')}</span>}
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginLeft: 'auto' }}>
          {(['seeker', 'astro'] as const).map(f => (
            <button key={f} onClick={() => setFace(f)} style={{
              padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
              background: face === f ? 'var(--accent)' : 'transparent', color: face === f ? '#fff' : 'var(--text2)',
            }}>{f === 'seeker' ? t('Reading') : t('Factors')}</button>
          ))}
        </div>
      </div>

      {face === 'seeker' ? (
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: 'var(--text)' }}>{cur.narrative.headline}</p>
          {cur.narrative.statements.slice(1).map((s: any, i: number) => {
            if (s.kind === 'group') return <div key={i} style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--accent)', margin: '14px 0 6px' }}>{s.text}</div>
            if (s.kind === 'support' || s.kind === 'harm') return (
              <div key={i} style={{ marginBottom: 11, paddingLeft: 10, borderLeft: `2px solid ${s.kind === 'support' ? '#16a34a' : '#dc2626'}` }}>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>{s.text}</div>
                {s.detail && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.detail}</div>}
                {s.rule && <div style={{ fontSize: 10.5, color: 'var(--text4)', marginTop: 2 }}>📜 {s.rule}</div>}
              </div>
            )
            return <div key={i} style={{ marginBottom: 11 }}><div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>{s.text}</div>{s.rule && <div style={{ fontSize: 10.5, color: 'var(--text4)', marginTop: 2 }}>📜 {s.rule}</div>}</div>
          })}
        </div>
      ) : (
        <div>
          {cur.factors.map((f, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '38px 78px 1fr', gap: 10, alignItems: 'center', padding: '7px 0', borderTop: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 13, color: 'var(--text2)' }}>{f.weight.toFixed(1)}</div>
              <div style={{ height: 7, borderRadius: 4, background: 'var(--surface3)', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 4, width: `${Math.min(100, f.weight / 5.5 * 100)}%`, background: polColor(f.polarity) }} />
              </div>
              <div>
                <div style={{ fontSize: 13, lineHeight: 1.35, color: 'var(--text)' }}><span style={{ fontWeight: 800, color: polColor(f.polarity), marginRight: 4 }}>{polSym(f.polarity)}</span>{f.claim}</div>
                {f.effect && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>{f.effect}</div>}
                <div style={{ fontSize: 10.5, color: 'var(--text4)' }}>{f.source}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* mahadasha timeline */}
      <div style={{ marginTop: 24, fontSize: 13, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{t('Mahādaśā timeline')}</div>
      <div style={{ marginTop: 8 }}>
        {data.timeline.map((d, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8,
            background: d.running ? 'var(--accent-bg)' : 'transparent', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ width: 70, fontWeight: d.running ? 800 : 600, color: 'var(--text)' }}>{d.lord}</div>
            <div style={{ width: 130, fontSize: 11.5, color: 'var(--text3)' }}>{d.start.slice(0, 7)} → {d.end.slice(0, 7)}</div>
            <div style={{ width: 44, fontWeight: 800, fontSize: 12.5, color: netColor(d.net) }}>{d.net > 0 ? '+' : ''}{d.net.toFixed(0)}</div>
            <div style={{ flex: 1, fontSize: 12, color: 'var(--text2)' }}>{d.headline}{d.running && <span style={{ color: 'var(--accent)', fontWeight: 800 }}> ◀ {t('now')}</span>}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text4)' }}>{t('Rule-based · deterministic · every prediction cites its classical source.')}</div>
    </div>
  )
}
