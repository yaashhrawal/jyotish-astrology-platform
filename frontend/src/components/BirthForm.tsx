import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { BirthData } from '../api/jyotish'
import { useLang } from '../contexts/LanguageContext'

interface Props {
  onSubmit: (data: BirthData) => void
  loading: boolean
}

// ── Constants ────────────────────────────────────────────────────────────────
const AYANAMSAS = [
  // Standard India
  { value: 'lahiri',               label: 'Lahiri',                sub: 'Standard · Govt of India' },
  { value: 'kp',                   label: 'KP',                    sub: 'Krishnamurti Paddhati' },
  { value: 'raman',                label: 'Raman',                 sub: 'B.V. Raman' },
  { value: 'yukteshwar',           label: 'Yukteshwar',            sub: 'Sri Yukteshwar' },
  { value: 'true_chitra',          label: 'True Chitra',           sub: 'Chitrapaksha · spica-based' },
  // Classical Indian
  { value: 'aryabhata',            label: 'Aryabhata',             sub: 'Classical Aryabhata (499 AD)' },
  { value: 'suryasiddhanta',       label: 'Surya Siddhanta',       sub: 'SS Revati' },
  { value: 'suryasiddhanta_citra', label: 'Surya Siddhanta Citra', sub: 'SS Chitra' },
  { value: 'true_revati',          label: 'True Revati',           sub: 'Revati-based' },
  { value: 'true_pushya',          label: 'True Pushya',           sub: 'Pushya nakshatra-based' },
  { value: 'usha_shashi',          label: 'Usha-Shashi',           sub: 'Usha & Shashi' },
  // Western / historical
  { value: 'fagan_bradley',        label: 'Fagan-Bradley',         sub: 'Western sidereal' },
  { value: 'de_luce',              label: 'DeLuce',                sub: 'Robert DeLuce' },
  { value: 'sassanian',            label: 'Sassanian',             sub: 'Persian / Sassanid era' },
  { value: 'galactic_center',      label: 'Galactic Center',       sub: '0° Sag = Galactic Center' },
  { value: 'hipparcos',            label: 'Hipparcos',             sub: 'Based on Hipparcos catalog' },
  { value: 'aldebaran_15tau',      label: 'Aldebaran 15° Tau',     sub: 'Aldebaran at 15° Taurus' },
  { value: 'babyl_huber',          label: 'Babylonian (Huber)',     sub: 'Babylonian · Huber method' },
  { value: 'j2000',                label: 'J2000',                 sub: 'Julian 2000 epoch' },
  { value: 'jn95',                 label: 'JN95',                  sub: 'Newcomb / JN95' },
]

const HOUSE_SYSTEMS = [
  { value: 'placidus',      label: 'Placidus',      sub: 'Most common Western' },
  { value: 'whole_sign',    label: 'Whole Sign',     sub: 'Classical Vedic default' },
  { value: 'equal',         label: 'Equal House',    sub: 'Equal 30° from ASC' },
  { value: 'koch',          label: 'Koch',           sub: 'Birth place system' },
  { value: 'regiomontanus', label: 'Regiomontanus',  sub: 'Prime vertical' },
  { value: 'campanus',      label: 'Campanus',       sub: 'Prime vertical trisection' },
  { value: 'sripathi',      label: 'Sripathi',       sub: 'Classical Indian' },
  { value: 'porphyry',      label: 'Porphyry',       sub: 'Trisection of quadrants' },
  { value: 'morinus',       label: 'Morinus',        sub: 'Equal from ARMC' },
  { value: 'alcabitius',    label: 'Alcabitius',     sub: 'Medieval semi-arc' },
]

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const COUNTRY_TZ: Record<string, number> = {
  in: 5.5, pk: 5.0, lk: 5.5, np: 5.75, bd: 6.0,
  gb: 0, ie: 0, us: -5, ca: -5, au: 10, nz: 12,
  ae: 4, sg: 8, cn: 8, jp: 9, de: 1, fr: 1, it: 1,
  nl: 1, es: 1, za: 2, ke: 3, ru: 3,
}

function guessTimezone(lon: number, countryCode?: string): number {
  if (countryCode && COUNTRY_TZ[countryCode.toLowerCase()] !== undefined)
    return COUNTRY_TZ[countryCode.toLowerCase()]
  return Math.round((lon / 15) * 2) / 2
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface GeoResult {
  display_name: string
  lat: string
  lon: string
  address?: {
    country_code?: string
    country?: string
    state?: string
    state_district?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
  }
}

function parsePlaceName(r: GeoResult): { name: string; region: string; country: string } {
  const parts = r.display_name.split(',').map(s => s.trim())
  const name = parts[0]
  const addr = r.address
  const region = addr?.state || addr?.state_district || addr?.county || parts[1] || ''
  const country = addr?.country || parts[parts.length - 1] || ''
  return { name, region, country }
}

// ── Sub-components ────────────────────────────────────────────────────────────

// Smart number input — string state, select-all on focus, clamp on blur
function NumInput({
  label, value, min, max, onChange, highlight = false,
}: {
  label?: string; value: number; min: number; max: number
  onChange: (v: number) => void; highlight?: boolean
}) {
  const [raw, setRaw] = useState(String(value))
  const [focused, setFocused] = useState(false)
  // Don't overwrite what the user is typing; only sync from parent when unfocused.
  useEffect(() => { if (!focused) setRaw(String(value)) }, [value, focused])

  return (
    <input
      type="text"
      inputMode="numeric"
      value={raw}
      onFocus={e => { setFocused(true); e.target.select() }}
      onChange={e => {
        const v = e.target.value
        setRaw(v)
        // Only propagate a value that is already in range — never clamp mid-typing
        // (typing "2" toward "2000" must not snap to the min).
        const n = parseFloat(v)
        if (!isNaN(n) && n >= min && n <= max) onChange(n)
      }}
      onBlur={() => {
        setFocused(false)
        const n = parseFloat(raw)
        const clamped = isNaN(n) ? min : Math.min(max, Math.max(min, n))
        setRaw(String(clamped))
        onChange(clamped)
      }}
      placeholder={label}
      style={{
        width: '100%', padding: '8px 10px',
        background: 'var(--surface)',
        border: `1px solid ${highlight ? '#F6C90E' : 'var(--border)'}`,
        borderRadius: 'var(--radius-s)',
        fontSize: '13px', color: highlight ? 'var(--gold)' : 'var(--text)',
        outline: 'none', transition: 'border-color .15s, box-shadow .15s',
        fontVariantNumeric: 'tabular-nums',
      }}
      onMouseEnter={e => { if (!highlight) (e.target as HTMLInputElement).style.borderColor = 'var(--border2)' }}
      onMouseLeave={e => { if (!highlight) (e.target as HTMLInputElement).style.borderColor = 'var(--border)' }}
    />
  )
}

// Custom select dropdown — replaces native <select>
function CustomSelect({
  value, options, onChange,
}: {
  value: string
  options: { value: string; label: string; sub?: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find(o => o.value === value)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '8px 12px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-s)', cursor: 'pointer',
          fontSize: '13px', color: 'var(--text)', transition: 'border-color .15s',
          outline: 'none',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <span>{current?.label || value}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s',
          color: 'var(--text3)', flexShrink: 0,
        }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="anim-slide-down" style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-m)', boxShadow: 'var(--shadow-l)',
          overflow: 'hidden',
        }}>
          {options.map((opt, i) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                padding: '9px 12px', cursor: 'pointer',
                borderBottom: i < options.length - 1 ? '1px solid var(--border)' : 'none',
                background: opt.value === value ? 'var(--accent-bg)' : 'transparent',
                transition: 'background .1s',
              }}
              onMouseEnter={e => {
                if (opt.value !== value) (e.currentTarget as HTMLDivElement).style.background = 'var(--hover)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = opt.value === value ? 'var(--accent-bg)' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: opt.value === value ? 'var(--accent)' : 'var(--text)' }}>
                  {opt.label}
                </span>
                {opt.value === value && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3 3 6-6" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              {opt.sub && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '1px' }}>{opt.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Form ─────────────────────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  display: 'block', marginBottom: '5px', fontSize: '11.5px',
  fontWeight: '500', color: 'var(--text2)', letterSpacing: '0.01em',
}

export default function BirthForm({ onSubmit, loading }: Props) {
  const { t } = useLang()
  const [form, setForm] = useState({
    name: '', gender: 'male' as 'male' | 'female' | 'other',
    day: 1, month: 1, year: 1990,
    hour12: 12, minute: 0, ampm: 'AM' as 'AM' | 'PM',
    tz_offset: 5.5, latitude: 28.613, longitude: 77.209,
    place: 'Delhi', ayanamsa: 'lahiri', house_system: 'whole_sign', node_type: 'true',
  })

  const [cityQuery, setCityQuery] = useState('Delhi')
  const [suggestions, setSuggestions] = useState<GeoResult[]>([])
  const [showSug, setShowSug] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const justSelectedRef = useRef(false)   // skip the re-search triggered by selectCity
  const sugRef = useRef<HTMLDivElement>(null)

  const set = useCallback(<K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(f => ({ ...f, [key]: value })), [])

  // City autocomplete
  useEffect(() => {
    // A city was just picked — don't re-open the dropdown for the filled-in name.
    if (justSelectedRef.current) { justSelectedRef.current = false; return }
    if (cityQuery.length < 2) { setSuggestions([]); setShowSug(false); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery)}&format=json&limit=7&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data: GeoResult[] = await res.json()
        setSuggestions(data)
        setShowSug(true)
      } catch { setSuggestions([]) }
      setSearching(false)
    }, 350)
  }, [cityQuery])

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sugRef.current && !sugRef.current.contains(e.target as Node)) setShowSug(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selectCity = (r: GeoResult) => {
    const lat = parseFloat(r.lat)
    const lon = parseFloat(r.lon)
    const tz = guessTimezone(lon, r.address?.country_code)
    const { name, region, country } = parsePlaceName(r)
    const displayName = [name, region, country].filter(Boolean).join(', ')
    justSelectedRef.current = true      // block the re-search this setCityQuery would trigger
    setCityQuery(name)
    setForm(f => ({ ...f, place: displayName, latitude: lat, longitude: lon, tz_offset: tz }))
    setShowSug(false)
    setSuggestions([])
  }

  const hour24 = (): number => {
    let h = form.hour12 % 12
    if (form.ampm === 'PM') h += 12
    return h
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: form.name, year: form.year, month: form.month, day: form.day,
      hour: hour24(), minute: form.minute, tz_offset: form.tz_offset,
      latitude: form.latitude, longitude: form.longitude,
      place: form.place, ayanamsa: form.ayanamsa, house_system: form.house_system, node_type: form.node_type,
    })
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-s)', fontSize: '13px', color: 'var(--text)',
    outline: 'none', transition: 'border-color .15s',
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '4px 0' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Birth Details')}</h3>
        <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
          {t('Enter exact time and place for accurate chart')}
        </p>
      </div>

      {/* Name + Gender */}
      <div style={{ marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'end' }}>
        <div>
          <label style={lbl}>{t('Full Name')}</label>
          <input
            style={inp}
            type="text"
            placeholder="e.g. Narendra Modi"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            required
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        <div>
          <label style={lbl}>{t('Gender')}</label>
          <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-s)', overflow: 'hidden' }}>
            {(['male', 'female', 'other'] as const).map(g => (
              <button key={g} type="button" onClick={() => set('gender', g)} style={{
                padding: '7px 10px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: '600',
                background: form.gender === g ? 'var(--accent)' : 'transparent',
                color: form.gender === g ? '#fff' : 'var(--text3)',
                transition: 'background .15s, color .15s',
                whiteSpace: 'nowrap',
                fontFamily: "'Noto Sans Devanagari', sans-serif",
              }}>{g === 'male' ? '♂' : g === 'female' ? '♀' : '⚧'} {g === 'male' ? t('Male') : g === 'female' ? t('Female') : t('Other')}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Date row */}
      <div style={{ marginBottom: '14px' }}>
        <label style={lbl}>{t('Date of Birth')}</label>
        <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 72px', gap: '6px' }}>
          <NumInput value={form.day} min={1} max={31} label="DD" onChange={v => set('day', v)} />
          <CustomSelect
            value={String(form.month)}
            options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
            onChange={v => set('month', parseInt(v))}
          />
          <NumInput value={form.year} min={1800} max={2100} label="YYYY" onChange={v => set('year', v)} />
        </div>
      </div>

      {/* Time */}
      <div style={{ marginBottom: '14px' }}>
        <label style={lbl}>{t('Time of Birth')}</label>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <NumInput value={form.hour12} min={1} max={12} label="HH" onChange={v => set('hour12', v)} />
          </div>
          <span style={{ color: 'var(--text4)', fontSize: '18px', fontWeight: '300', flexShrink: 0, lineHeight: 1 }}>:</span>
          <div style={{ flex: 1 }}>
            <NumInput value={form.minute} min={0} max={59} label="MM" onChange={v => set('minute', v)} />
          </div>
          {/* AM/PM pill */}
          <div style={{
            display: 'flex', background: 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-s)',
            overflow: 'hidden', flexShrink: 0,
          }}>
            {(['AM', 'PM'] as const).map(p => (
              <button key={p} type="button" onClick={() => set('ampm', p)} style={{
                padding: '7px 11px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: '600', letterSpacing: '0.02em',
                background: form.ampm === p ? 'var(--accent)' : 'transparent',
                color: form.ampm === p ? '#fff' : 'var(--text3)',
                transition: 'background .15s, color .15s',
              }}>{p}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
          = {hour24().toString().padStart(2,'0')}:{form.minute.toString().padStart(2,'0')} in 24-hour format
        </div>
      </div>

      {/* City search */}
      <div style={{ marginBottom: '14px', position: 'relative' }} ref={sugRef}>
        <label style={lbl}>
          {t('Birth Place')}
          {searching && (
            <span style={{
              marginLeft: '8px', fontSize: '10px', color: 'var(--accent)',
              fontWeight: '500', letterSpacing: '0.02em',
            }}>searching…</span>
          )}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            style={{ ...inp, paddingRight: '32px' }}
            type="text"
            placeholder="Search any city worldwide…"
            value={cityQuery}
            onChange={e => { setCityQuery(e.target.value); setShowSug(true) }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--accent)'
              if (suggestions.length > 0) setShowSug(true)
            }}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            autoComplete="off"
          />
          {searching && (
            <div style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              width: '14px', height: '14px', border: '2px solid var(--accent-bg)',
              borderTopColor: 'var(--accent)', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
          )}
        </div>

        {showSug && suggestions.length > 0 && (
          <div className="anim-slide-down" style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-m)', boxShadow: 'var(--shadow-l)',
            maxHeight: '260px', overflowY: 'auto',
          }}>
            {suggestions.map((r, i) => {
              const { name, region, country } = parsePlaceName(r)
              return (
                <div key={i} onClick={() => selectCity(r)} style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background .1s',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    background: 'var(--surface2)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', flexShrink: 0,
                  }}>📍</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '1px' }}>
                      {[region, country].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Coordinates + TZ — collapsible section */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ ...lbl, marginBottom: '8px' }}>{t('Coordinates & Timezone')}</label>
        <div style={{
          background: 'var(--surface2)', borderRadius: 'var(--radius-m)',
          padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px',
        }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px', fontWeight: '500' }}>LAT</div>
            <NumInput value={form.latitude} min={-90} max={90} onChange={v => set('latitude', v)} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px', fontWeight: '500' }}>LON</div>
            <NumInput value={form.longitude} min={-180} max={180} onChange={v => set('longitude', v)} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--gold)', marginBottom: '4px', fontWeight: '600' }}>UTC ⚠</div>
            <NumInput value={form.tz_offset} min={-12} max={14} onChange={v => set('tz_offset', v)} highlight />
          </div>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '5px' }}>
          Timezone auto-filled from city. Verify for daylight saving.
        </div>
      </div>

      {/* Ayanamsa */}
      <div style={{ marginBottom: '16px' }}>
        <label style={lbl}>{t('Ayanamsa')}</label>
        <CustomSelect
          value={form.ayanamsa}
          options={AYANAMSAS}
          onChange={v => set('ayanamsa', v)}
        />
      </div>

      {/* House System */}
      <div style={{ marginBottom: '16px' }}>
        <label style={lbl}>House System</label>
        <CustomSelect
          value={form.house_system}
          options={HOUSE_SYSTEMS}
          onChange={v => set('house_system', v)}
        />
      </div>

      {/* Node Type */}
      <div style={{ marginBottom: '20px' }}>
        <label style={lbl}>Rahu/Ketu Node</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[{ value: 'true', label: 'True Node', sub: 'Osculating (JHora default)' }, { value: 'mean', label: 'Mean Node', sub: 'Average motion' }].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('node_type', opt.value)}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 'var(--radius-m)',
                border: `1px solid ${form.node_type === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                background: form.node_type === opt.value ? 'var(--accent)' : 'var(--surface)',
                color: form.node_type === opt.value ? '#fff' : 'var(--text)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '600' }}>{opt.label}</div>
              <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: '11px', border: 'none',
          borderRadius: 'var(--radius-m)',
          background: loading
            ? 'var(--surface2)'
            : 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
          color: loading ? 'var(--text3)' : '#fff',
          fontSize: '13.5px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 2px 8px rgba(87,70,175,.35)',
          transition: 'all .2s, transform .1s',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={e => { if (!loading) (e.currentTarget.style.transform = 'translateY(-1px)') }}
        onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)') }}
        onMouseDown={e => { if (!loading) (e.currentTarget.style.transform = 'translateY(0)') }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{
              width: '14px', height: '14px', border: '2px solid rgba(255,255,255,.3)',
              borderTopColor: '#fff', borderRadius: '50%',
              display: 'inline-block', animation: 'spin 0.7s linear infinite',
            }} />
            {t('Calculating…')}
          </span>
        ) : `${t('Calculate Chart')} ⚡`}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  )
}
