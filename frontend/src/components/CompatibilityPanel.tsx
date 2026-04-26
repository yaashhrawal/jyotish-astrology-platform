import { useState, useEffect, useRef } from 'react'
import { compatibilityApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const label: React.CSSProperties = {
  fontSize: '11px', fontWeight: '600', color: 'var(--text3)',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px',
}
const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-m)', padding: '20px',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid var(--border)',
  borderRadius: '8px', fontSize: '13px', background: 'var(--surface2)',
  color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
}

interface GeoResult { display_name: string; lat: string; lon: string; address?: { country_code?: string; country?: string; state?: string } }

function guessTZ(lon: number, cc?: string): number {
  const TZ: Record<string, number> = { in: 5.5, pk: 5, lk: 5.5, np: 5.75, bd: 6, gb: 0, us: -5, au: 10, ae: 4, sg: 8, cn: 8, jp: 9 }
  if (cc && TZ[cc.toLowerCase()] !== undefined) return TZ[cc.toLowerCase()]
  return Math.round((lon / 15) * 2) / 2
}

interface PersonForm {
  name: string; gender: string; year: string; month: string; day: string
  hour: string; minute: string; tz: string; lat: string; lon: string; place: string
}

const defaultPerson = (): PersonForm => ({
  name: '', gender: 'female', year: '1990', month: '1', day: '1',
  hour: '12', minute: '0', tz: '5.5', lat: '28.6', lon: '77.2', place: 'Delhi',
})

const KOOTA_DESC: Record<string, string> = {
  'Varna': 'Spiritual compatibility & ego alignment',
  'Vashya': 'Mutual attraction & control',
  'Tara': 'Destiny & birth star compatibility',
  'Yoni': 'Physical & intimate compatibility',
  'Graha Maitri': 'Mental compatibility & friendship',
  'Gana': 'Temperament & nature compatibility',
  'Bhakoot': 'Emotional & family harmony',
  'Nadi': 'Health & progeny compatibility',
}

function PersonFields({ label: personLabel, form, onChange }: {
  label: string; form: PersonForm; onChange: (f: PersonForm) => void
}) {
  const { t } = useLang()
  const set = (k: keyof PersonForm, v: string) => onChange({ ...form, [k]: v })
  const setE = (k: keyof PersonForm) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value)

  const [cityQuery, setCityQuery] = useState(form.place || '')
  const [sugs, setSugs] = useState<GeoResult[]>([])
  const [showSug, setShowSug] = useState(false)
  const [searching, setSearching] = useState(false)
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sugRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cityQuery.length < 2) { setSugs([]); setShowSug(false); return }
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery)}&format=json&limit=6&addressdetails=1`, { headers: { 'Accept-Language': 'en' } })
        setSugs(await res.json()); setShowSug(true)
      } catch { setSugs([]) }
      setSearching(false)
    }, 350)
  }, [cityQuery])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (sugRef.current && !sugRef.current.contains(e.target as Node)) setShowSug(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selectCity = (r: GeoResult) => {
    const lat = parseFloat(r.lat); const lon = parseFloat(r.lon)
    const tz = guessTZ(lon, r.address?.country_code)
    const parts = r.display_name.split(',').map(s => s.trim())
    setCityQuery(parts[0])
    onChange({ ...form, place: r.display_name, lat: String(lat), lon: String(lon), tz: String(tz) })
    setShowSug(false); setSugs([])
  }

  return (
    <div style={{ flex: 1, minWidth: '280px' }}>
      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)', marginBottom: '14px', paddingBottom: '8px', borderBottom: '2px solid var(--accent)' }}>
        {personLabel}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Name */}
        <div>
          <div style={label}>{t('Name')}</div>
          <input style={inp} placeholder={t('Full Name')} value={form.name} onChange={setE('name')} />
        </div>

        {/* Gender */}
        <div>
          <div style={label}>{t('Gender')}</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[['male', '♂ Male'], ['female', '♀ Female'], ['other', '⚧ Other']].map(([g, lbl2]) => (
              <button key={g} type="button" onClick={() => set('gender', g)} style={{
                padding: '5px 12px', border: '1px solid var(--border)', borderRadius: '6px',
                cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                background: form.gender === g ? 'var(--accent)' : 'var(--surface2)',
                color: form.gender === g ? '#fff' : 'var(--text3)',
              }}>{lbl2}</button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div><div style={label}>{t('Year')}</div><input style={inp} type="number" value={form.year} onChange={setE('year')} /></div>
          <div><div style={label}>{t('Month')}</div><input style={inp} type="number" min={1} max={12} value={form.month} onChange={setE('month')} /></div>
          <div><div style={label}>{t('Day')}</div><input style={inp} type="number" min={1} max={31} value={form.day} onChange={setE('day')} /></div>
        </div>

        {/* Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div><div style={label}>{t('Hour')}</div><input style={inp} type="number" min={0} max={23} value={form.hour} onChange={setE('hour')} /></div>
          <div><div style={label}>{t('Minute')}</div><input style={inp} type="number" min={0} max={59} value={form.minute} onChange={setE('minute')} /></div>
          <div><div style={label}>TZ (+/-)</div><input style={inp} type="number" step={0.5} value={form.tz} onChange={setE('tz')} /></div>
        </div>

        {/* City search */}
        <div style={{ position: 'relative' }} ref={sugRef}>
          <div style={label}>{t('Birth Place')} {searching && <span style={{ color: 'var(--accent)', fontSize: '10px' }}>…</span>}</div>
          <input style={{ ...inp, paddingRight: '28px' }} placeholder={t('Search city')} value={cityQuery}
            onChange={e => { setCityQuery(e.target.value); setShowSug(true) }}
            onFocus={() => { if (sugs.length > 0) setShowSug(true) }} autoComplete="off" />
          {showSug && sugs.length > 0 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 400, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,.15)', maxHeight: '200px', overflowY: 'auto' }}>
              {sugs.map((r, i) => {
                const parts = r.display_name.split(',').map(s => s.trim())
                return (
                  <div key={i} onClick={() => selectCity(r)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: i < sugs.length - 1 ? '1px solid var(--border)' : 'none', fontSize: '12px' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ fontWeight: '600' }}>{parts[0]}</div>
                    <div style={{ color: 'var(--text3)', fontSize: '10px' }}>{parts.slice(1, 3).join(', ')}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Coords + TZ (auto-filled from city, editable) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div><div style={label}>{t('Latitude')}</div><input style={inp} type="number" step={0.01} value={form.lat} onChange={setE('lat')} /></div>
          <div><div style={label}>{t('Longitude')}</div><input style={inp} type="number" step={0.01} value={form.lon} onChange={setE('lon')} /></div>
        </div>
      </div>
    </div>
  )
}

interface Props { chart?: any }

function chartToForm(chart: any): PersonForm {
  const parts = chart?.birth?.split(' ') || []
  const [bd, bt] = [parts[0] || '1990-01-01', parts[1] || '12:00']
  const [by, bm, bdd] = bd.split('-')
  const [bh, bmin] = bt.split(':')
  return {
    name: chart?.name || '', gender: chart?.gender || 'male',
    year: by || '1990', month: bm || '1', day: bdd || '1',
    hour: bh || '12', minute: bmin || '0', tz: '5.5',
    lat: String(chart?.latitude ?? '28.6'), lon: String(chart?.longitude ?? '77.2'),
    place: chart?.place || 'Delhi',
  }
}

export default function CompatibilityPanel({ chart }: Props) {
  const { t } = useLang()
  const [p1, setP1] = useState<PersonForm>(() => chart ? chartToForm(chart) : defaultPerson())
  const [p2, setP2] = useState<PersonForm>(defaultPerson())
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function calculate() {
    setLoading(true); setError('')
    try {
      const data = await compatibilityApi.get({
        p1_name: p1.name || 'Person 1',
        p1_year: +p1.year, p1_month: +p1.month, p1_day: +p1.day,
        p1_hour: +p1.hour, p1_minute: +p1.minute, p1_tz_offset: +p1.tz,
        p1_lat: +p1.lat, p1_lon: +p1.lon,
        p2_name: p2.name || 'Person 2',
        p2_year: +p2.year, p2_month: +p2.month, p2_day: +p2.day,
        p2_hour: +p2.hour, p2_minute: +p2.minute, p2_tz_offset: +p2.tz,
        p2_lat: +p2.lat, p2_lon: +p2.lon,
      })
      setResult(data)
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally { setLoading(false) }
  }

  const scoreColor = (pct: number) =>
    pct >= 75 ? '#16A34A' : pct >= 58 ? '#0891B2' : pct >= 50 ? '#D97706' : '#DC2626'

  const verdictStyle = (v: string): React.CSSProperties => {
    const c = v.includes('Excellent') ? '#16A34A' : v.includes('Good') ? '#0891B2' :
      v.includes('Average') ? '#D97706' : '#DC2626'
    return { color: c, fontWeight: '800', fontSize: '22px' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Intro */}
      <div style={{ ...card, background: 'var(--accent-bg)', border: '1px solid rgba(87,70,175,.2)' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)', marginBottom: '4px' }}>
          {t('Kundali Milan')}
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.6 }}>
          Classical Vedic compatibility based on Moon nakshatra. 8 kootas scored against 36 maximum gunas.
          18+ gunas = acceptable match. 28+ = excellent.
        </div>
      </div>

      {/* Auto-fill notice */}
      {chart && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px',
          background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span>✓</span>
          <span>Person 1 auto-filled from <strong>{chart.name}</strong>'s chart. Enter Person 2 details below.</span>
          <button onClick={() => setP1(defaultPerson())} style={{
            marginLeft: 'auto', fontSize: '11px', padding: '2px 8px',
            border: '1px solid #BBF7D0', borderRadius: '4px', background: 'transparent',
            color: '#166534', cursor: 'pointer',
          }}>Clear</button>
        </div>
      )}

      {/* Two person forms */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <PersonFields label={chart ? `Person 1 — ${chart.name}` : 'Person 1 (Boy / Partner A)'} form={p1} onChange={setP1} />
        <div style={{ width: '1px', background: 'var(--border)', flexShrink: 0 }} />
        <PersonFields label="Person 2 (Girl / Partner B)" form={p2} onChange={setP2} />
      </div>

      {/* Calculate button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={calculate} disabled={loading} style={{
          padding: '10px 28px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
          cursor: 'pointer', opacity: loading ? 0.7 : 1,
          boxShadow: '0 4px 14px rgba(87,70,175,.3)',
        }}>{loading ? t('Calculating') : t('Match Kundalis')}</button>
        {error && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>}
      </div>

      {result && (
        <>
          {/* Score summary */}
          <div style={{ ...card, display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Circular score */}
            <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
              <svg width="110" height="110">
                <circle cx="55" cy="55" r="48" fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle cx="55" cy="55" r="48" fill="none"
                  stroke={scoreColor(result.percentage)}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - result.percentage / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 55 55)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '26px', fontWeight: '800', color: scoreColor(result.percentage) }}>{result.score}</span>
                <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600' }}>/ {result.max_score}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>
                {result.person1?.name} &amp; {result.person2?.name}
              </div>
              <div style={verdictStyle(result.verdict)}>{result.verdict}</div>
              <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '6px' }}>
                {result.percentage}% compatibility
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '20px', fontSize: '12px' }}>
                <div>
                  <div style={{ color: 'var(--text4)', marginBottom: '2px' }}>P1 Moon</div>
                  <div style={{ fontWeight: '600', color: 'var(--text)' }}>{result.person1?.moon_sign}</div>
                  <div style={{ color: 'var(--text3)', fontSize: '11px' }}>{result.person1?.nakshatra}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text4)', marginBottom: '2px' }}>P2 Moon</div>
                  <div style={{ fontWeight: '600', color: 'var(--text)' }}>{result.person2?.moon_sign}</div>
                  <div style={{ color: 'var(--text3)', fontSize: '11px' }}>{result.person2?.nakshatra}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Koota breakdown */}
          <div style={card}>
            <div style={label}>{t('8-Koota Breakdown')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(result.kootas || {}).map(([name, k]: any) => {
                const pct = k.max > 0 ? k.score / k.max : 0
                const c = pct >= 0.75 ? '#16A34A' : pct >= 0.5 ? '#0891B2' : pct > 0 ? '#D97706' : '#DC2626'
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '110px', flexShrink: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text)', marginBottom: '2px' }}>{name}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text4)', lineHeight: 1.4 }}>{KOOTA_DESC[name]}</div>
                    </div>
                    <div style={{ flex: 1, height: '8px', background: 'var(--surface2)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct * 100}%`, background: c, borderRadius: '99px', transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ width: '48px', textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: c }}>{k.score}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text4)' }}>/{k.max}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Classical doshas note */}
          <div style={{ ...card, background: 'var(--surface2)', fontSize: '12px', color: 'var(--text3)', lineHeight: 1.7 }}>
            <div style={label}>{t('Important Notes')}</div>
            <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Nadi Dosha</strong> (0/8) is the most serious — same Nadi indicates health issues for progeny. Requires remedies.</li>
              <li><strong>Bhakoot Dosha</strong> (0/7) in 6-8 or 5-9 positions causes financial and emotional stress.</li>
              <li><strong>Graha Maitri</strong> reflects long-term mental harmony — critical for lasting relationships.</li>
              <li>Score below 18 gunas is generally not recommended in traditional practice.</li>
              <li>Additional factors: Mangal dosha, Kuja dosha, and Shadashtak positions should be checked separately.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
