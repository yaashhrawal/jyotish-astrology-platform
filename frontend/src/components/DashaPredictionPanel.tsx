/**
 * DashaPredictionPanel — factor-based predictions for EVERY Vimshottari mahadasha and
 * its antardashas. Accordion: expand a mahadasha to see its reading + its antardashas;
 * click an antardasha for its own full reading. Every prediction cites its rule.
 */
import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { getDashaPrediction, getDashaDetail, type DashaPredictResponse, type TopicResult } from '../api/jyotish'

const netColor = (n: number) => n > 1 ? '#16a34a' : n < -1 ? '#dc2626' : 'var(--text3)'

function Reading({ r }: { r: TopicResult }) {
  return (
    <div>
      <p style={{ fontSize: 14.5, fontWeight: 700, margin: '0 0 10px', color: 'var(--text)' }}>{r.narrative.headline}</p>
      {r.narrative.statements.slice(1).map((s: any, i: number) => {
        if (s.kind === 'group') return <div key={i} style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--accent)', margin: '10px 0 5px' }}>{s.text}</div>
        if (s.kind === 'support' || s.kind === 'harm') return (
          <div key={i} style={{ marginBottom: 9, paddingLeft: 9, borderLeft: `2px solid ${s.kind === 'support' ? '#16a34a' : '#dc2626'}` }}>
            <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--text)' }}>{s.text}</div>
            {s.detail && <div style={{ fontSize: 11.5, color: 'var(--text2)', marginTop: 1 }}>{s.detail}</div>}
            {s.rule && <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 1 }}>📜 {s.rule}</div>}
          </div>
        )
        return <div key={i} style={{ marginBottom: 9, fontSize: 13, lineHeight: 1.45, color: 'var(--text)' }}>{s.text}{s.rule && <div style={{ fontSize: 10, color: 'var(--text4)' }}>📜 {s.rule}</div>}</div>
      })}
    </div>
  )
}

export default function DashaPredictionPanel({ birth }: { birth: any }) {
  const { t } = useLang()
  const [data, setData] = useState<DashaPredictResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [openMaha, setOpenMaha] = useState<string | null>(null)
  const [openAntar, setOpenAntar] = useState<string | null>(null)  // "Maha·Antar"
  const [antarDetail, setAntarDetail] = useState<Record<string, TopicResult>>({})

  useEffect(() => {
    if (!birth) return
    setLoading(true); setErr('')
    getDashaPrediction({ ...birth, name: 'Chart' })
      .then(d => { setData(d); setOpenMaha(d.current.maha) })
      .catch(e => setErr(e?.response?.data?.detail || 'Failed to compute')).finally(() => setLoading(false))
  }, [birth])

  const loadAntar = (maha: string, antar: string) => {
    const key = `${maha}·${antar}`
    if (openAntar === key) { setOpenAntar(null); return }
    setOpenAntar(key)
    if (!antarDetail[key]) {
      getDashaDetail({ ...birth, name: 'Chart', maha, antar })
        .then(det => setAntarDetail(m => ({ ...m, [key]: det }))).catch(() => {})
    }
  }

  if (!birth) return <div style={{ padding: 24, color: 'var(--text3)' }}>{t('Calculate a chart first.')}</div>
  if (loading) return <div style={{ padding: 24, color: 'var(--text3)' }}>{t('Computing…')}</div>
  if (err) return <div style={{ padding: 24, color: '#dc2626' }}>{err}</div>
  if (!data) return null
  const ymd = (s: string) => (s || '').slice(0, 7)

  return (
    <div style={{ padding: '16px 20px', maxWidth: 880, margin: '0 auto' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{t('Dasha Predictions')}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>{t('Tap a period to read it. Every prediction cites its rule.')}</div>

      {data.mahadashas.map(m => {
        const mOpen = openMaha === m.lord
        return (
          <div key={m.lord} style={{ marginBottom: 8, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {/* maha row */}
            <button onClick={() => setOpenMaha(mOpen ? null : m.lord)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer',
              border: 'none', textAlign: 'left', background: m.running ? 'var(--accent-bg)' : 'var(--surface)',
            }}>
              <span style={{ transform: mOpen ? 'rotate(90deg)' : 'none', transition: '.15s', color: 'var(--text3)' }}>▸</span>
              <span style={{ width: 66, fontWeight: 800, color: 'var(--text)' }}>{m.lord}</span>
              <span style={{ width: 120, fontSize: 11.5, color: 'var(--text3)' }}>{ymd(m.start)} → {ymd(m.end)}</span>
              <span style={{ width: 40, fontWeight: 800, fontSize: 12.5, color: netColor(m.net) }}>{m.net > 0 ? '+' : ''}{m.net.toFixed(0)}</span>
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text2)' }}>{m.headline}</span>
              {m.running && <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)' }}>◀ {t('now')}</span>}
            </button>

            {mOpen && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                <Reading r={m.reading} />
                {/* antardashas */}
                <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--accent)', margin: '16px 0 6px' }}>
                  {m.lord} {t('Antardaśās')}
                </div>
                {m.antardashas.map(a => {
                  const key = `${m.lord}·${a.lord}`
                  const aOpen = openAntar === key
                  return (
                    <div key={a.lord} style={{ borderTop: '1px solid var(--border)' }}>
                      <button onClick={() => loadAntar(m.lord, a.lord)} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 6px', cursor: 'pointer',
                        border: 'none', textAlign: 'left', background: a.running ? 'var(--accent-bg)' : 'transparent',
                      }}>
                        <span style={{ transform: aOpen ? 'rotate(90deg)' : 'none', transition: '.15s', color: 'var(--text4)', fontSize: 11 }}>▸</span>
                        <span style={{ width: 60, fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{a.lord}</span>
                        <span style={{ width: 116, fontSize: 11, color: 'var(--text3)' }}>{ymd(a.start)} → {ymd(a.end)}</span>
                        <span style={{ width: 36, fontWeight: 800, fontSize: 12, color: netColor(a.net) }}>{a.net > 0 ? '+' : ''}{a.net.toFixed(0)}</span>
                        <span style={{ flex: 1, fontSize: 11.5, color: 'var(--text2)' }}>{a.headline}</span>
                        {a.running && <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--accent)' }}>◀ {t('now')}</span>}
                      </button>
                      {aOpen && antarDetail[key] && (
                        <div style={{ padding: '8px 12px 14px 20px' }}><Reading r={antarDetail[key]} /></div>
                      )}
                      {aOpen && !antarDetail[key] && <div style={{ padding: '8px 20px', fontSize: 12, color: 'var(--text3)' }}>{t('Computing…')}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text4)' }}>{t('Rule-based · deterministic · every prediction cites its classical source.')}</div>
    </div>
  )
}
