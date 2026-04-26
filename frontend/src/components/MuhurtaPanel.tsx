import { useState } from 'react'
import { muhurtaApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PURPOSES = ['general', 'marriage', 'travel', 'business', 'education', 'medical', 'construction']

const QUALITY_COLOR: Record<string, string> = {
  Excellent: '#16A34A', Good: '#0891B2', Average: '#D97706', Poor: '#DC2626'
}

const inp: React.CSSProperties = {
  padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', width: '100%', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: 'var(--text3)', marginBottom: '3px', display: 'block' }

export default function MuhurtaPanel() {
  const { t } = useLang()
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const nextMonth = new Date(today); nextMonth.setDate(today.getDate() + 14)
  const nextStr = nextMonth.toISOString().slice(0, 10)

  const [form, setForm] = useState({
    lat: '28.6', lon: '77.2', tz: '5.5',
    start: todayStr, end: nextStr, purpose: 'general',
  })
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [dayFilter, setDayFilter] = useState<string | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const compute = async () => {
    setLoading(true); setError('')
    try {
      const [sy, sm, sd] = form.start.split('-').map(Number)
      const [ey, em, ed] = form.end.split('-').map(Number)
      const res = await muhurtaApi.get({
        lat: +form.lat, lon: +form.lon, tz: +form.tz,
        start_year: sy, start_month: sm, start_day: sd,
        end_year: ey, end_month: em, end_day: ed,
        purpose: form.purpose,
      })
      setData(res)
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message)
    } finally { setLoading(false) }
  }

  const displaySlots = data?.all_slots?.filter((s: any) =>
    (!dayFilter || s.date === dayFilter) && (showAll || s.quality !== 'Poor')
  ) || []

  const groupedByDate: Record<string, any[]> = {}
  displaySlots.forEach((s: any) => {
    if (!groupedByDate[s.date]) groupedByDate[s.date] = []
    groupedByDate[s.date].push(s)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Input */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Muhurta')} — {t('Auspicious Timing Finder')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
          <div><span style={lbl}>Latitude</span><input style={inp} value={form.lat} onChange={set('lat')} /></div>
          <div><span style={lbl}>Longitude</span><input style={inp} value={form.lon} onChange={set('lon')} /></div>
          <div><span style={lbl}>Timezone</span><input style={inp} value={form.tz} onChange={set('tz')} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div><span style={lbl}>Start Date</span><input type="date" style={inp} value={form.start} onChange={set('start')} /></div>
          <div><span style={lbl}>End Date</span><input type="date" style={inp} value={form.end} onChange={set('end')} /></div>
          <div>
            <span style={lbl}>Purpose</span>
            <select style={inp} value={form.purpose} onChange={set('purpose')}>
              {PURPOSES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <button onClick={compute} disabled={loading} style={{
          marginTop: '14px', width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
          background: loading ? 'var(--surface2)' : 'var(--accent)', color: loading ? 'var(--text3)' : '#fff',
          fontSize: '14px', fontWeight: '700', cursor: 'pointer',
        }}>
          {loading ? t('Scanning muhurtas…') : t('Find Auspicious Times')}
        </button>
      </div>

      {error && <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#DC2626', fontSize: '13px' }}>{error}</div>}

      {data && <>
        {/* Best muhurtas */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: '700' }}>
            ⭐ Top 5 Muhurtas for {form.purpose.charAt(0).toUpperCase() + form.purpose.slice(1)}
          </div>
          {data.best_muhurtas?.map((s: any, i: number) => (
            <div key={i} style={{
              padding: '14px 18px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
              display: 'flex', gap: '16px', alignItems: 'flex-start',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                background: (QUALITY_COLOR[s.quality] || '#888') + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', fontWeight: '800', color: QUALITY_COLOR[s.quality],
              }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>
                    {new Date(s.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {s.time}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700',
                    background: (QUALITY_COLOR[s.quality] || '#888') + '18',
                    color: QUALITY_COLOR[s.quality], border: `1px solid ${(QUALITY_COLOR[s.quality] || '#888')}44`
                  }}>{s.quality} · {s.score}/100</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  {[
                    { label: 'Tithi', val: s.tithi?.name },
                    { label: 'Nakshatra', val: s.nakshatra?.nakshatra },
                    { label: 'Yoga', val: s.yoga?.name },
                    { label: 'Vara', val: s.vara?.day },
                  ].map(item => (
                    <span key={item.label} style={{ fontSize: '11px', color: 'var(--text3)' }}>
                      <strong style={{ color: 'var(--text2)' }}>{item.label}:</strong> {item.val}
                    </span>
                  ))}
                </div>
                {s.positives?.length > 0 && (
                  <div style={{ fontSize: '11.5px', color: '#16A34A' }}>✓ {s.positives.join(' · ')}</div>
                )}
                {s.issues?.length > 0 && (
                  <div style={{ fontSize: '11.5px', color: '#DC2626', marginTop: '2px' }}>⚠ {s.issues.join(' · ')}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Full calendar grid */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>All Slots ({data.total_checked} checked)</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />
                Show Poor
              </label>
              {dayFilter && (
                <button onClick={() => setDayFilter(null)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: '11px', cursor: 'pointer', color: 'var(--text3)' }}>
                  Clear filter ×
                </button>
              )}
            </div>
          </div>

          {Object.entries(groupedByDate).map(([date, slots]) => (
            <div key={date} style={{ borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: '8px 18px', background: 'var(--surface2)', fontSize: '11.5px', fontWeight: '700', color: 'var(--text3)', cursor: 'pointer' }}
                onClick={() => setDayFilter(dayFilter === date ? null : date)}>
                {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1px', background: 'var(--border)' }}>
                {slots.map((s: any, i: number) => {
                  const c = QUALITY_COLOR[s.quality] || '#888'
                  return (
                    <div key={i} style={{ background: 'var(--surface)', padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700' }}>{s.time}</span>
                        <span style={{ padding: '1px 6px', borderRadius: '20px', fontSize: '9px', fontWeight: '700',
                          background: c + '18', color: c, border: `1px solid ${c}33` }}>{s.quality}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', color: c }}>{s.score}</span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text4)', lineHeight: 1.6 }}>
                        {s.nakshatra?.nakshatra} · {s.tithi?.name}<br />
                        {s.yoga?.name}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </>}
    </div>
  )
}
