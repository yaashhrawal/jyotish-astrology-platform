import { useState } from 'react'
import { rectificationApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const EVENT_TYPES = [
  { value: 'marriage',     label: '💍 Marriage' },
  { value: 'divorce',      label: '💔 Divorce / Separation' },
  { value: 'child',        label: '👶 Child Born' },
  { value: 'job',          label: '💼 Job / Career Start' },
  { value: 'job_loss',     label: '📉 Job Loss / Major Career Change' },
  { value: 'death_family', label: '🕯 Death in Family' },
  { value: 'relocation',   label: '🏠 Major Relocation' },
  { value: 'accident',     label: '🚑 Accident / Health Crisis' },
  { value: 'property',     label: '🏡 Property Purchase' },
  { value: 'education',    label: '🎓 Major Education Event' },
  { value: 'other',        label: '⭐ Other Major Event' },
]

interface LifeEvent { year: number; month: number; day: number; event_type: string; description: string }

interface Props { birthData: any }

export default function RectificationPanel({ birthData }: Props) {
  const { t } = useLang()
  const [events, setEvents] = useState<LifeEvent[]>([{ year: 2000, month: 1, day: 1, event_type: 'marriage', description: '' }])
  const [rangeMins, setRangeMins] = useState(60)
  const [stepMins, setStepMins] = useState(2)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addEvent = () => setEvents(e => [...e, { year: 2005, month: 1, day: 1, event_type: 'other', description: '' }])
  const removeEvent = (i: number) => setEvents(e => e.filter((_, j) => j !== i))
  const updateEvent = (i: number, key: keyof LifeEvent, value: any) =>
    setEvents(e => e.map((ev, j) => j === i ? { ...ev, [key]: value } : ev))

  const run = async () => {
    if (!birthData) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await rectificationApi.get({
        ...birthData,
        events,
        range_minutes: rangeMins,
        step_minutes: stepMins,
      })
      setResult(res)
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text)', fontSize: '12px', width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>{t('Birth Time Rectification')}</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5 }}>
          {t('Enter known life events. The tool tests birth times')} ±{rangeMins} {t('minutes around your given time and scores each by how well events align with dashas and transits.')}
        </div>
      </div>

      {/* Settings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '4px' }}>
            {t('Search Range (±minutes)')}
          </label>
          <select value={rangeMins} onChange={e => setRangeMins(+e.target.value)} style={inp}>
            {[15, 30, 60, 90, 120].map(v => <option key={v} value={v}>±{v} {t('minutes')}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '4px' }}>
            {t('Step Size')}
          </label>
          <select value={stepMins} onChange={e => setStepMins(+e.target.value)} style={inp}>
            {[1, 2, 5, 10].map(v => <option key={v} value={v}>{v} {t('minute')}{v > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      {/* Events */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: '700' }}>{t('Life Events')} ({events.length})</div>
          <button onClick={addEvent} style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid var(--accent)', background: 'var(--accent)', color: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>
            + {t('Add Event')}
          </button>
        </div>
        {events.map((ev, i) => (
          <div key={i} style={{ padding: '12px 16px', borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto 1fr auto', gap: '8px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '3px' }}>{t('Year')}</label>
                <input type="number" value={ev.year} min={1900} max={2100} onChange={e => updateEvent(i, 'year', +e.target.value)} style={inp} />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '3px' }}>{t('Mon')}</label>
                <input type="number" value={ev.month} min={1} max={12} onChange={e => updateEvent(i, 'month', +e.target.value)} style={{ ...inp, width: '50px' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '3px' }}>{t('Day')}</label>
                <input type="number" value={ev.day} min={1} max={31} onChange={e => updateEvent(i, 'day', +e.target.value)} style={{ ...inp, width: '50px' }} />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '3px' }}>{t('Type')}</label>
                <select value={ev.event_type} onChange={e => updateEvent(i, 'event_type', e.target.value)} style={inp}>
                  {EVENT_TYPES.map(et => <option key={et.value} value={et.value}>{t(et.label)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '3px' }}>{t('Notes')}</label>
                <input type="text" value={ev.description} placeholder={t('Optional description')} onChange={e => updateEvent(i, 'description', e.target.value)} style={inp} />
              </div>
              <button onClick={() => removeEvent(i)} disabled={events.length === 1} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: events.length === 1 ? 'not-allowed' : 'pointer', fontSize: '14px', marginBottom: '1px' }}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Run */}
      <button onClick={run} disabled={loading} style={{
        padding: '12px', border: 'none', borderRadius: 'var(--radius-m)', cursor: loading ? 'wait' : 'pointer',
        background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
        color: '#fff', fontSize: '14px', fontWeight: '700',
      }}>
        {loading ? t('Analyzing…') : `🔍 ${t('Rectify Birth Time')} (${t('testing')} ${Math.floor(rangeMins * 2 / stepMins)} ${t('candidates')})`}
      </button>

      {error && <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-m)', color: '#DC2626', fontSize: '13px' }}>{error}</div>}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Best result */}
          <div style={{ padding: '16px 20px', background: '#F0FDF4', border: '2px solid #16A34A', borderRadius: 'var(--radius-m)' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#16A34A', marginBottom: '8px' }}>✓ {t('Best Match')}</div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#16A34A' }}>{result.best_time.time}</div>
                <div style={{ fontSize: '11px', color: '#16A34A', opacity: 0.8 }}>
                  {result.best_time.offset_minutes >= 0 ? '+' : ''}{result.best_time.offset_minutes} {t('min from given time')}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid #16A34A40', paddingLeft: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>{t('Lagna')}: {result.best_time.lagna}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{result.best_time.lagna_degree}° {t('in sign')}</div>
              </div>
              <div style={{ borderLeft: '1px solid #16A34A40', paddingLeft: '24px' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#16A34A' }}>{result.best_time.score}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{t('Score')}</div>
              </div>
            </div>
          </div>

          {/* Top 10 */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: '700' }}>{t('Top Candidates')}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['#', t('Time'), t('Offset'), t('Lagna'), t('Score')].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', border: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.top_candidates.map((c: any, i: number) => (
                  <tr key={i} style={{ background: i === 0 ? '#F0FDF4' : 'transparent' }}>
                    <td style={{ padding: '8px 12px', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text3)' }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid var(--border)', fontSize: '13px', fontWeight: '700', color: i === 0 ? '#16A34A' : 'var(--text)' }}>{c.time}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text2)' }}>{c.offset_minutes >= 0 ? '+' : ''}{c.offset_minutes}m</td>
                    <td style={{ padding: '8px 12px', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text2)' }}>{c.lagna} {c.lagna_degree}°</td>
                    <td style={{ padding: '8px 12px', border: '1px solid var(--border)', fontSize: '13px', fontWeight: '700', color: i === 0 ? '#16A34A' : 'var(--text)' }}>{c.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-m)', fontSize: '11.5px', color: 'var(--text3)' }}>
            ⚠ {result.note} {t('Tested')} {result.all_candidates?.length} {t('candidates across')} {result.events_tested} {t('events')}.
          </div>
        </div>
      )}
    </div>
  )
}
