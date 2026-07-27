import { useState } from 'react'
import { api } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

function toCSV(rows: string[][]): string {
  return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export default function EphemerisExportPanel() {
  const { t } = useLang()
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    lat: 28.6139, lon: 77.209, tz: 5.5, ayanamsa: 'lahiri',
    mode: 'month' as 'month' | 'year',
    step: '1',
  })
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [err, setErr] = useState('')

  const fetchDay = async (year: number, month: number, day: number) => {
    const res = await api.post('/api/calc/chart', {
      year, month, day, hour: 12, minute: 0, tz_offset: form.tz,
      latitude: form.lat, longitude: form.lon, ayanamsa: form.ayanamsa,
    })
    return res.data
  }

  const buildRows = async (dates: { y: number; m: number; d: number }[]) => {
    const header = ['Date', 'JD', ...PLANETS.flatMap(p => [`${p} Sign`, `${p} Lon`, `${p} Nakshatra`, `${p} Status`]), 'Ascendant Sign']
    const rows: string[][] = [header]

    for (let i = 0; i < dates.length; i++) {
      const { y, m, d } = dates[i]
      setProgress(`${t('Processing')} ${d}/${m}/${y} (${i + 1}/${dates.length})…`)
      try {
        const data = await fetchDay(y, m, d)
        const planets = data.planets || {}
        const asc = data.ascendant || {}
        const dateStr = `${d.toString().padStart(2,'0')}/${m.toString().padStart(2,'0')}/${y}`
        const row: string[] = [dateStr, data.julian_day?.toFixed(4) || '']
        for (const p of PLANETS) {
          const pd = planets[p] || {}
          row.push(pd.sign || '', pd.longitude?.toFixed ? pd.longitude.toFixed(4) : '', pd.nakshatra || '', pd.status || '')
        }
        row.push(asc.sign || '')
        rows.push(row)
      } catch {
        rows.push([`${d}/${m}/${y}`, '', ...Array(PLANETS.length * 4 + 1).fill('ERROR')])
      }
    }
    return rows
  }

  const exportEphemeris = async () => {
    setLoading(true); setErr(''); setProgress('')
    try {
      let dates: { y: number; m: number; d: number }[] = []
      const step = parseInt(form.step) || 1

      if (form.mode === 'month') {
        const days = daysInMonth(form.year, form.month)
        for (let d = 1; d <= days; d += step) dates.push({ y: form.year, m: form.month, d })
      } else {
        for (let m = 1; m <= 12; m++) {
          const days = daysInMonth(form.year, m)
          for (let d = 1; d <= days; d += step) dates.push({ y: form.year, m, d })
        }
      }

      const rows = await buildRows(dates)
      const csv = toCSV(rows)
      const filename = form.mode === 'month'
        ? `ephemeris_${form.year}_${String(form.month).padStart(2,'0')}.csv`
        : `ephemeris_${form.year}.csv`
      downloadCSV(filename, csv)
      setProgress(`${t('Done!')} ${rows.length - 1} ${t('rows exported.')}`)
    } catch (e: any) { setErr(e?.message || t('Export failed')) }
    finally { setLoading(false) }
  }

  const exportDashaCSV = async () => {
    setLoading(true); setErr(''); setProgress(t('Fetching dasha data…'))
    try {
      const res = await api.post('/api/calc/dasha', {
        year: form.year, month: form.month, day: 1, hour: 12, minute: 0,
        tz_offset: form.tz, latitude: form.lat, longitude: form.lon, ayanamsa: form.ayanamsa,
      })
      const dashas = res.data?.dashas || []
      const header = ['Mahadasha Lord', 'Start', 'End', 'Years', 'Antardashas']
      const rows: string[][] = [header]
      for (const d of dashas) {
        const antars = (d.antardashas || []).map((a: any) => `${a.lord}(${a.start?.slice(0,7)}–${a.end?.slice(0,7)})`).join('; ')
        rows.push([d.lord, d.start?.slice(0,10), d.end?.slice(0,10), d.years?.toFixed(1), antars])
      }
      downloadCSV(`dasha_${form.year}_${form.month}.csv`, toCSV(rows))
      setProgress(t('Dasha CSV exported.'))
    } catch (e: any) { setErr(e?.message || t('Failed')) }
    finally { setLoading(false) }
  }

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{label}</div>
      {children}
    </div>
  )

  const inp = { padding: '9px 10px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', width: '100%', boxSizing: 'border-box' as const }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
        <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{t('Ephemeris & Data Export')}</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{t('Export planetary positions for any date range as CSV · suitable for Excel / Google Sheets')}</div>
      </div>

      {/* Config */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <F label={t('Export Mode')}>
            <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value as any }))} style={inp}>
              <option value="month">{t('Single Month')}</option>
              <option value="year">{t('Full Year')}</option>
            </select>
          </F>
          <F label={t('Step (days)')}>
            <select value={form.step} onChange={e => setForm(f => ({ ...f, step: e.target.value }))} style={inp}>
              <option value="1">{t('Every day')}</option>
              <option value="3">{t('Every 3 days')}</option>
              <option value="7">{t('Weekly')}</option>
              <option value="15">{t('Fortnightly')}</option>
            </select>
          </F>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <F label={t('Year')}>
            <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))} style={inp} min="1800" max="2100" />
          </F>
          {form.mode === 'month' && (
            <F label={t('Month')}>
              <select value={form.month} onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))} style={inp}>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => (
                  <option key={m} value={i+1}>{t(m)}</option>
                ))}
              </select>
            </F>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
          <F label={t('Latitude')}>
            <input type="number" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: parseFloat(e.target.value) }))} style={inp} step="0.0001" />
          </F>
          <F label={t('Longitude')}>
            <input type="number" value={form.lon} onChange={e => setForm(f => ({ ...f, lon: parseFloat(e.target.value) }))} style={inp} step="0.0001" />
          </F>
          <F label={t('TZ Offset')}>
            <input type="number" value={form.tz} onChange={e => setForm(f => ({ ...f, tz: parseFloat(e.target.value) }))} style={inp} step="0.5" />
          </F>
          <F label={t('Ayanamsa')}>
            <select value={form.ayanamsa} onChange={e => setForm(f => ({ ...f, ayanamsa: e.target.value }))} style={inp}>
              <option value="lahiri">{t('Lahiri')}</option>
              <option value="raman">{t('B.V. Raman')}</option>
              <option value="krishnamurti">{t('KP')}</option>
              <option value="yukteshwar">{t('Yukteshwar')}</option>
            </select>
          </F>
        </div>

        <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: '8px', fontSize: '11.5px', color: 'var(--text3)' }}>
          ℹ {t('Columns exported: Date, Julian Day, and for each planet: Sign, Longitude (decimal), Nakshatra, Status · Plus Ascendant sign at 12:00 noon for the location')}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={exportEphemeris} disabled={loading} style={{
          padding: '11px 24px', borderRadius: 'var(--radius-m)', border: 'none',
          background: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
          opacity: loading ? 0.6 : 1,
        }}>
          📊 {t('Export Ephemeris CSV')}
        </button>
        <button onClick={exportDashaCSV} disabled={loading} style={{
          padding: '11px 20px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          opacity: loading ? 0.6 : 1,
        }}>
          🌀 {t('Export Dasha CSV')}
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <div style={{ padding: '10px 14px', background: loading ? '#FEF3C720' : '#F0FDF4', border: `1px solid ${loading ? '#F59E0B' : '#16A34A'}40`, borderRadius: 'var(--radius-m)', fontSize: '12px', color: loading ? '#92400E' : '#166534' }}>
          {loading ? '⏳ ' : '✅ '}{progress}
        </div>
      )}
      {err && <div style={{ fontSize: '12px', color: '#DC2626', padding: '8px 12px', background: '#FEF2F2', borderRadius: '8px' }}>{err}</div>}

      {/* Format info */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', padding: '14px 16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>{t('CSV Column Structure')}</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['Date', 'JD', 'Sun Sign', 'Sun Lon', 'Sun Nakshatra', 'Sun Status', '… ×9 planets …', 'Asc Sign'].map(c => (
            <span key={c} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'var(--surface2)', color: 'var(--text3)', border: '1px solid var(--border)' }}>{c}</span>
          ))}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
          {t('Total columns:')} <strong>38</strong> (2 + 4 per planet × 9 + 1 ascendant)
        </div>
      </div>
    </div>
  )
}
