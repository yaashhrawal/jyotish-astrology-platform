import { useState, useRef, useEffect } from 'react'
import { prashnaApi } from '../api/client'
import NorthIndianChart from './NorthIndianChart'
import { useLang } from '../contexts/LanguageContext'

const CATEGORIES = [
  { id: 'general',      label: '🔮 General',        desc: 'Open question' },
  { id: 'career',       label: '💼 Career',          desc: 'Job, business, promotion' },
  { id: 'marriage',     label: '💍 Marriage',         desc: 'Relationship, partner' },
  { id: 'health',       label: '🏥 Health',           desc: 'Illness, recovery' },
  { id: 'finance',      label: '💰 Finance',          desc: 'Money, investment, debt' },
  { id: 'travel',       label: '✈️ Travel',           desc: 'Journey, foreign, relocation' },
  { id: 'education',    label: '📚 Education',        desc: 'Exams, admission, study' },
  { id: 'property',     label: '🏠 Property',         desc: 'House, land, vehicle' },
  { id: 'legal',        label: '⚖️ Legal',            desc: 'Court, dispute, litigation' },
  { id: 'lost_item',    label: '🔍 Lost Item',        desc: 'Missing object, person' },
  { id: 'spirituality', label: '🕉️ Spirituality',    desc: 'Dharma, pilgrimage, practice' },
]

const VERDICT_STYLE: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  'Favorable':            { bg: '#F0FDF4', border: '#86EFAC', color: '#166534', icon: '✦' },
  'Moderately Favorable': { bg: '#FEFCE8', border: '#FDE68A', color: '#92400E', icon: '◐' },
  'Mixed':                { bg: '#F8F7FF', border: '#C4B5FD', color: '#5746AF', icon: '⚖' },
  'Unfavorable':          { bg: '#FFF5F5', border: '#FCA5A5', color: '#C53030', icon: '✗' },
  'Matter Will Not Proceed': { bg: '#F9FAFB', border: '#D1D5DB', color: '#6B7280', icon: '○' },
}

// Prashna-specific house meanings per category
const PRASHNA_HOUSE_MEANING: Record<string, Record<number, { role: string; means: string; watch: string }>> = {
  general: {
    1: { role: 'Querent', means: 'You — your health, vitality, overall situation', watch: 'Lagna lord strong? Planets here benefic or malefic?' },
    2: { role: 'Finances / Speech', means: 'Money flow, accumulated wealth, family support', watch: 'Benefics here = financial support; malefics = expenses' },
    3: { role: 'Effort / Courage', means: 'Your own effort, short journeys, communications', watch: 'Strong 3rd = matter needs personal effort to succeed' },
    4: { role: 'Hidden / Peace', means: 'Final outcome, inner peace, what lies below surface', watch: 'H4 lord strong = peaceful ending; afflicted = hidden obstacles' },
    5: { role: 'Intelligence / Counsel', means: 'Advice received, mental clarity, past karma', watch: 'Jupiter here = wise counsel; Rahu/Ketu = confused thinking' },
    6: { role: 'Obstacles / Enemies', means: 'Opposition, delays, debts, health issues', watch: 'Malefics here intensify obstacles for the matter' },
    7: { role: 'The Other Party', means: 'Person / situation being asked about; desired outcome', watch: 'H7 lord strong = favourable from other side' },
    8: { role: 'Delays / Transformation', means: 'Unexpected events, hidden factors, chronic issues', watch: 'Afflicted 8th = delays, shocks; Saturn here = long wait' },
    9: { role: 'Luck / Dharma', means: 'Divine grace, fortune, righteous path', watch: 'Benefics in 9th = matter blessed; natural timing indicator' },
    10: { role: 'Action / Result', means: 'Concrete outcome, what you will actually do', watch: 'H10 lord in kendra = definitive action; dusthana = inaction' },
    11: { role: 'Gains / Desires', means: 'Fulfilment of desire, friends, financial gain', watch: 'Planets here show nature of gain; H11 lord strong = success' },
    12: { role: 'Loss / Resolution', means: 'Expenses, endings, distant places, liberation', watch: 'Lagna lord in 12th = querent loses interest or moves away' },
  },
  career: {
    1: { role: 'Querent', means: 'Your capabilities, current state, readiness', watch: 'Strong lagna = you are capable; weak = self-doubt or poor health affecting work' },
    2: { role: 'Salary / Resources', means: 'Compensation, accumulated savings, team support', watch: 'H2 lord strong = financial improvement; afflicted = salary issues' },
    6: { role: 'Service / Daily Work', means: 'Job environment, colleagues, workload, interviews', watch: 'Malefics in 6th afflict work environment but can show competitive success' },
    7: { role: 'Business Partner / Client', means: 'Employer, business partner, key decision-maker', watch: 'H7 lord well-placed = support from superiors or partner' },
    10: { role: 'Career / Promotion', means: 'Status, authority, public recognition, the job itself', watch: 'Sun/Jupiter in 10th = authority gained; Saturn here = slow but steady rise' },
    11: { role: 'Income Gains', means: 'Salary hike, profits, achievement of career goal', watch: 'H11 lord joining H10 lord = promotion/raise imminent' },
  },
  marriage: {
    1: { role: 'Querent', means: 'Your readiness, personality shown in relationship', watch: 'Venus afflicted in lagna = relationship complications from your side' },
    2: { role: 'Family Support', means: 'Family acceptance, wealth coming through marriage', watch: 'H2 lord strong = family supportive of union' },
    5: { role: 'Romance / Attraction', means: 'Love, attraction, past-life connection, pregnancy', watch: 'Venus or Moon in 5th = strong romantic connection' },
    7: { role: 'Spouse / Partner', means: 'The other person — their nature, willingness, timing', watch: 'H7 lord strong and unafflicted = partner is suitable and willing' },
    8: { role: 'Longevity of Bond', means: 'Depth, intimacy, shared transformation, delays', watch: 'Malefics in 8th = karmic delays or complications in formalising' },
    11: { role: 'Fulfilment / Social', means: 'Social circle accepting, desire fulfilled, happiness', watch: 'H11 lord joining H7 = successful union with social blessing' },
  },
  health: {
    1: { role: 'Body / Vitality', means: 'Overall health, physical strength, recovery potential', watch: 'Lagna lord strong = body fighting back; Sun here = vitality' },
    6: { role: 'Disease / Treatment', means: 'Nature of illness, doctors, treatment success', watch: 'H6 lord weak = disease loses; H6 lord strong = illness persists' },
    8: { role: 'Severity / Surgery', means: 'Chronic conditions, surgery, life-threatening aspect', watch: 'Saturn in 8th = long illness; Mars = surgery likely' },
    12: { role: 'Hospitalisation / Rest', means: 'Hospital stay, bed rest, isolation, foreign treatment', watch: 'Many planets in 12th = extended bed rest or hospitalisation' },
  },
  finance: {
    2: { role: 'Liquid Wealth', means: 'Cash flow, bank balance, family money', watch: 'H2 lord strong = savings secure; afflicted = money leaking out' },
    5: { role: 'Speculation / Investment', means: 'Stock market, speculation, investment returns', watch: 'H5 + H9 lords linked = speculative gains; malefics = losses' },
    8: { role: 'Inherited / Sudden', means: 'Unexpected money, inheritance, partner\'s wealth', watch: 'H8 lord in 2nd/11th = sudden windfall' },
    11: { role: 'Income / Profits', means: 'Regular income, business profits, target achievement', watch: 'Jupiter in 11th = sustained income growth' },
    12: { role: 'Expenses / Losses', means: 'Outflows, debts, losses, money going abroad', watch: 'H12 lord in 2nd = heavy expenditure draining wealth' },
  },
}

const SIGN_LORDS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
}

const SIGNS_LIST = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']

const BENEFICS = new Set(['Jupiter','Venus','Mercury','Moon'])
const MALEFICS = new Set(['Sun','Mars','Saturn','Rahu','Ketu'])

const QUESTION_HOUSES_FE: Record<string, { primary: number[]; secondary: number[]; enemy: number[] }> = {
  career:       { primary: [10, 11], secondary: [6, 2],  enemy: [12] },
  marriage:     { primary: [7, 2],   secondary: [5, 11], enemy: [6]  },
  health:       { primary: [1, 6],   secondary: [8],     enemy: [12] },
  lost_item:    { primary: [2, 4],   secondary: [7],     enemy: []   },
  legal:        { primary: [7, 6],   secondary: [10],    enemy: [12] },
  travel:       { primary: [3, 9],   secondary: [12],    enemy: [8]  },
  property:     { primary: [4],      secondary: [11],    enemy: [12] },
  finance:      { primary: [2, 11],  secondary: [5, 9],  enemy: [8, 12] },
  education:    { primary: [4, 9],   secondary: [5],     enemy: [12] },
  spirituality: { primary: [9, 12],  secondary: [5, 1],  enemy: []   },
  general:      { primary: [1, 10],  secondary: [5, 9],  enemy: []   },
}

function houseSign(ascSignIndex: number, h: number): string {
  return SIGNS_LIST[(ascSignIndex + h - 1) % 12]
}

function houseLord(ascSignIndex: number, h: number): string {
  return SIGN_LORDS[houseSign(ascSignIndex, h)] || ''
}

function getHouseStrength(_lord: string, lordHouse: number | undefined): 'strong' | 'moderate' | 'weak' {
  if (!lordHouse) return 'moderate'
  if ([1,4,7,10].includes(lordHouse)) return 'strong'
  if ([5,9].includes(lordHouse)) return 'strong'
  if ([6,8,12].includes(lordHouse)) return 'weak'
  return 'moderate'
}

function computeHouseAnalysisFE(
  planets: Record<string, any>,
  ascSignIndex: number,
  category: string
): Record<string, any> {
  const q = QUESTION_HOUSES_FE[category] || QUESTION_HOUSES_FE['general']
  const allHouses = [...new Set([...q.primary, ...q.secondary, ...q.enemy])]
  const result: Record<string, any> = {}

  for (const h of allHouses) {
    const lord = houseLord(ascSignIndex, h)
    const lordHouse = planets[lord]?.house as number | undefined
    const occupants = Object.entries(planets)
      .filter(([, p]: [string, any]) => p.house === h)
      .map(([n]) => n)
    const beneficOcc = occupants.filter(p => BENEFICS.has(p))
    const maleficOcc = occupants.filter(p => MALEFICS.has(p))
    const strength = getHouseStrength(lord, lordHouse)
    const role = q.primary.includes(h) ? 'Primary' : q.enemy.includes(h) ? 'Obstacle' : 'Secondary'

    const parts: string[] = []
    if (beneficOcc.length) parts.push(`${beneficOcc.join(', ')} placed here — benefic influence`)
    if (maleficOcc.length) parts.push(`${maleficOcc.join(', ')} placed here — malefic pressure`)
    parts.push(`Lord ${lord} is ${strength} (H${lordHouse ?? '?'})`)
    if (role === 'Primary' && strength === 'strong') parts.push('Primary house strong — favorable for matter')
    if (role === 'Primary' && strength === 'weak') parts.push('Primary house lord weakened — obstacles likely')

    result[String(h)] = {
      house: h, role, lord, lord_house: lordHouse, lord_strength: strength,
      occupants, strength, interpretation: parts.join('. '),
    }
  }
  return result
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

interface GeoResult { lat: number; lon: number; display: string }

async function searchCity(q: string): Promise<GeoResult[]> {
  if (q.length < 2) return []
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}&addressdetails=1`)
  const data = await r.json()
  return data.map((d: any) => ({
    lat: parseFloat(d.lat), lon: parseFloat(d.lon),
    display: [d.address?.city || d.address?.town || d.address?.village || d.name, d.address?.state, d.address?.country].filter(Boolean).join(' · ')
  }))
}

function getNow() {
  const d = new Date()
  return {
    year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
    hour: d.getHours(), minute: d.getMinutes(),
  }
}

export default function PrashnaPanel() {
  const { t } = useLang()
  const now = getNow()
  const [form, setForm] = useState({ ...now, lat: 28.6139, lon: 77.2090, tz: 5.5, place: 'New Delhi' })
  const [category, setCategory] = useState('general')
  const [question, setQuestion] = useState('')
  const [nimitta, setNimitta] = useState('')
  const [useNow, setUseNow] = useState(true)
  const [cityQuery, setCityQuery] = useState('New Delhi')
  const [citySuggestions, setCitySuggestions] = useState<GeoResult[]>([])
  const [showCityDrop, setShowCityDrop] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    panchanga: true, kp: true, shadow: true, moon: true,
    houses: false, factors: false, afflictions: true, accuracy: false,
  })
  const toggle = (key: string) => setExpanded(e => ({ ...e, [key]: !e[key] }))
  const cityRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCityDrop(false)
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

  useEffect(() => {
    if (useNow) {
      const t = setInterval(() => setForm(f => ({ ...f, ...getNow() })), 5000)
      return () => clearInterval(t)
    }
  }, [useNow])

  const handleCityInput = async (v: string) => {
    setCityQuery(v); setShowCityDrop(true)
    if (v.length >= 2) setCitySuggestions(await searchCity(v))
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        setForm(f => ({ ...f, lat: parseFloat(latitude.toFixed(4)), lon: parseFloat(longitude.toFixed(4)) }))
        setCityQuery(`${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`)
        // reverse geocode
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`)
          .then(r => r.json())
          .then(d => {
            const name = [d.address?.city || d.address?.town || d.address?.village, d.address?.state, d.address?.country].filter(Boolean).join(' · ')
            if (name) { setCityQuery(name); setForm(f => ({ ...f, place: name })) }
          }).catch(() => {})
      },
      () => setError('Location access denied')
    )
  }

  const handleSubmit = async () => {
    setLoading(true); setError(''); setResult(null)
    const { lat, lon, tz, year, month, day, hour, minute } = form
    const payload: any = {
      latitude: lat, longitude: lon, tz_offset: tz,
      ayanamsa: 'lahiri',
      question_text: question.trim() || '',
      question_category: category,
      nimitta: nimitta.trim() || '',
    }
    if (!useNow) {
      payload.custom_year = year; payload.custom_month = month
      payload.custom_day = day; payload.custom_hour = hour; payload.custom_minute = minute
    }
    try {
      const data = await prashnaApi.analyze(payload as any)
      setResult(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Calculation failed — is backend running?')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left: Question Form ─────────────────────────────────────────────── */}
      <div style={{
        width: '340px', flexShrink: 0, borderRight: '1px solid var(--border)',
        background: 'var(--surface)', overflowY: 'auto', padding: '24px 20px',
        display: 'flex', flexDirection: 'column', gap: '20px',
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Prashna Kundali')}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{t('Horary astrology')} — {t('cast chart for moment of question')}</div>
        </div>

        {/* Time of question */}
        <div>
          <div style={sectionLabel}>Time of Question</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', background: 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '8px',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text3)', flex: 1 }}>Use current time</span>
            <button onClick={() => setUseNow(!useNow)} style={{
              width: '36px', height: '20px', borderRadius: '10px', border: 'none',
              background: useNow ? 'var(--accent)' : 'var(--border)', cursor: 'pointer',
              position: 'relative', transition: 'background .2s',
            }}>
              <div style={{
                position: 'absolute', top: '2px', left: useNow ? '18px' : '2px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: '#fff', transition: 'left .2s',
              }} />
            </button>
          </div>

          {!useNow && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {[
                { label: 'Year', key: 'year', min: 1900, max: 2100 },
                { label: 'Month', key: 'month', min: 1, max: 12 },
                { label: 'Day', key: 'day', min: 1, max: 31 },
                { label: 'Hour', key: 'hour', min: 0, max: 23 },
                { label: 'Min', key: 'minute', min: 0, max: 59 },
                { label: 'TZ', key: 'tz', min: -12, max: 14 },
              ].map(({ label, key, min, max }) => (
                <div key={key}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '3px' }}>{label}</div>
                  <input
                    type="number" min={min} max={max}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
                    style={numInputStyle}
                  />
                </div>
              ))}
            </div>
          )}

          {useNow && (
            <div style={{ fontSize: '12px', color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', fontWeight: '600', padding: '4px 0' }}>
              {form.year}-{String(form.month).padStart(2,'0')}-{String(form.day).padStart(2,'0')} {String(form.hour).padStart(2,'0')}:{String(form.minute).padStart(2,'0')} (live)
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ ...sectionLabel, marginBottom: 0 }}>Location</div>
            <button onClick={handleGetLocation} style={{
              padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)',
              background: 'var(--surface2)', color: 'var(--text2)', fontSize: '11px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              fontWeight: '500', transition: 'all .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >📍 Use my location</button>
          </div>
          <div ref={cityRef} style={{ position: 'relative' }}>
            <input
              value={cityQuery}
              onChange={e => handleCityInput(e.target.value)}
              onFocus={() => { if (citySuggestions.length) setShowCityDrop(true) }}
              placeholder="Search city…"
              style={{ ...textInputStyle, width: '100%', boxSizing: 'border-box' }}
            />
            {showCityDrop && citySuggestions.length > 0 && (
              <div className="anim-slide-down" style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '8px', boxShadow: 'var(--shadow-m)', zIndex: 100, overflow: 'hidden',
              }}>
                {citySuggestions.map((c, i) => (
                  <div key={i} onClick={() => {
                    setForm(f => ({ ...f, lat: c.lat, lon: c.lon, place: c.display }))
                    setCityQuery(c.display); setShowCityDrop(false)
                  }} style={{
                    padding: '9px 12px', fontSize: '12.5px', cursor: 'pointer',
                    borderBottom: i < citySuggestions.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >{c.display}</div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '3px' }}>Latitude</div>
              <input type="number" value={form.lat} step="0.001"
                onChange={e => setForm(f => ({ ...f, lat: parseFloat(e.target.value) || 0 }))}
                style={numInputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '3px' }}>Longitude</div>
              <input type="number" value={form.lon} step="0.001"
                onChange={e => setForm(f => ({ ...f, lon: parseFloat(e.target.value) || 0 }))}
                style={numInputStyle} />
            </div>
          </div>
        </div>

        {/* Category */}
        <div>
          <div style={sectionLabel}>Question Category</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {CATEGORIES.map(cat => (
              <div key={cat.id} onClick={() => { setCategory(cat.id); if (result) setExpanded(e => ({ ...e, houses: true })) }} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '7px', cursor: 'pointer',
                background: category === cat.id ? 'var(--accent-bg)' : 'transparent',
                border: `1px solid ${category === cat.id ? 'var(--accent)' : 'transparent'}`,
                transition: 'all .15s',
              }}
                onMouseEnter={e => { if (category !== cat.id) e.currentTarget.style.background = 'var(--hover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = category === cat.id ? 'var(--accent-bg)' : 'transparent' }}
              >
                <span style={{ fontSize: '13px' }}>{cat.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto' }}>{cat.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Question text */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <div style={{ ...sectionLabel, marginBottom: 0 }}>Your Question</div>
            <span style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: '400' }}>(optional — astrologer will interpret)</span>
          </div>
          <textarea
            rows={3}
            placeholder="Optional — describe the matter or leave blank for planetary reading…"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 12px',
              border: '1px solid var(--border)', borderRadius: '8px',
              background: 'var(--surface)', fontSize: '13px', color: 'var(--text)',
              resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5', outline: 'none',
            }}
          />
        </div>

        {/* Nimitta (omen) */}
        <div>
          <div style={sectionLabel}>Nimitta / Omen <span style={{ color: 'var(--text3)', fontWeight: '400' }}>(optional)</span></div>
          <input
            placeholder="First thing you saw, heard, or thought…"
            value={nimitta}
            onChange={e => setNimitta(e.target.value)}
            style={{ ...textInputStyle, width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: '10.5px', color: 'var(--text3)', marginTop: '4px' }}>
            Traditional sign considered at moment of question
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 12px', background: 'var(--red-bg)', border: '1px solid #FCA5A5',
            borderRadius: '7px', color: 'var(--red)', fontSize: '12.5px',
          }}>{error}</div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          padding: '11px', borderRadius: '8px', border: 'none',
          background: 'var(--accent)', color: '#fff', fontSize: '14px',
          fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1, transition: 'opacity .2s',
        }}>
          {loading ? t('Casting chart…') : `✦ ${t('Cast Prashna Chart')}`}
        </button>
      </div>

      {/* ── Right: Results ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {!result && !loading && (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '16px',
            color: 'var(--text3)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', opacity: 0.3 }}>☽</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text2)' }}>Prashna Kundali</div>
            <div style={{ fontSize: '13px', maxWidth: '320px', lineHeight: '1.6' }}>
              Set your location, choose category, ask your question sincerely — then cast the chart.
              The moment of asking is the birth of the answer.
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
              {['Moon Application', 'KP Ruling Planets', 'Gulika', 'Hora Lord', 'AI Interpretation'].map(f => (
                <span key={f} style={{
                  fontSize: '11px', padding: '4px 10px', borderRadius: '20px',
                  background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text3)',
                }}>{f}</span>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
            <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 2s linear infinite' }}>☽</div>
              <div style={{ fontSize: '13px' }}>Casting Prashna chart…</div>
            </div>
          </div>
        )}

        {result && (
          <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ── Vibe Score + Verdict ──────────────────────────── */}
            {result.verdict && (() => {
              const v = VERDICT_STYLE[result.verdict.verdict] || VERDICT_STYLE['Mixed']
              const vs = result.vibe_score
              const vibeColor = vs ? (vs.score >= 65 ? '#166534' : vs.score >= 45 ? '#92400E' : '#C53030') : v.color
              const vibeBg = vs ? (vs.score >= 65 ? '#F0FDF4' : vs.score >= 45 ? '#FEFCE8' : '#FFF5F5') : v.bg
              return (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {/* Vibe score gauge */}
                  {vs && (
                    <div style={{
                      background: vibeBg, border: `2px solid ${vs.score >= 65 ? '#86EFAC' : vs.score >= 45 ? '#FDE68A' : '#FCA5A5'}`,
                      borderRadius: '12px', padding: '16px 20px', minWidth: '160px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: vibeColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Vibe Score</div>
                      <div style={{ fontSize: '48px', fontWeight: '800', color: vibeColor, lineHeight: 1 }}>{vs.score}</div>
                      <div style={{ fontSize: '10px', color: vibeColor, opacity: 0.7, marginTop: '2px' }}>/100</div>
                      {/* Score bar */}
                      <div style={{ height: '4px', background: 'rgba(0,0,0,.1)', borderRadius: '2px', margin: '10px 0 6px' }}>
                        <div style={{ height: '100%', width: `${vs.score}%`, background: vibeColor, borderRadius: '2px', transition: 'width .6s ease' }} />
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: vibeColor }}>{vs.label}</div>
                    </div>
                  )}
                  {/* Verdict */}
                  <div style={{
                    flex: 1, padding: '16px 20px', borderRadius: '12px',
                    background: v.bg, border: `2px solid ${v.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '24px', color: v.color }}>{v.icon}</span>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: v.color }}>{result.verdict.verdict}</div>
                        <div style={{ fontSize: '11.5px', color: v.color, opacity: 0.7 }}>
                          Raw score: {result.verdict.score > 0 ? '+' : ''}{result.verdict.score} · {result.verdict.timeline || 'Timeline unclear'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {result.verdict.signals?.map((s: any, i: number) => (
                        <span key={i} style={{
                          fontSize: '11px', padding: '3px 9px', borderRadius: '20px',
                          background: 'rgba(255,255,255,0.7)',
                          color: typeof s === 'object' ? (s.positive ? '#166534' : '#C53030') : v.color,
                          border: `1px solid ${v.border}`,
                        }}>{typeof s === 'object' ? s.text : s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ── Chart + indicators row ────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '24px', alignItems: 'start' }}>

              {/* Prashna chart */}
              {result.ascendant && (
                <div>
                  <NorthIndianChart
                    ascendant={result.ascendant}
                    planets={result.planets}
                    planetHouseMap={result.planet_house_map}
                    size={500} title="PRASHNA D1"
                    onHouseSelect={setSelectedHouse}
                  />
                  {selectedHouse && (() => {
                    const catMeanings = PRASHNA_HOUSE_MEANING[category] || PRASHNA_HOUSE_MEANING['general']
                    const hm = catMeanings[selectedHouse] || PRASHNA_HOUSE_MEANING['general'][selectedHouse]
                    const houseSign = SIGNS_LIST[(result.ascendant.sign_index + selectedHouse - 1) % 12]
                    const houseSignLord = SIGN_LORDS[houseSign] || ''
                    const planetsHere: string[] = result.planet_house_map?.[selectedHouse] || result.planet_house_map?.[String(selectedHouse)] || []
                    return (
                      <div className="anim-slide-down" style={{
                        marginTop: '12px', padding: '14px 16px',
                        background: 'var(--accent-bg)', border: '1px solid var(--accent)',
                        borderRadius: '10px', maxWidth: '400px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)' }}>House {selectedHouse}</span>
                            {hm && <span style={{ fontSize: '11.5px', color: 'var(--accent)', marginLeft: '8px', opacity: 0.8 }}>— {hm.role}</span>}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{houseSign} · lord: <strong style={{ color: PLANET_COLORS[houseSignLord] }}>{houseSignLord}</strong></span>
                        </div>
                        {planetsHere.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            {planetsHere.map(p => (
                              <span key={p} style={{
                                fontSize: '11.5px', padding: '2px 8px', borderRadius: '20px', fontWeight: '700',
                                background: 'var(--surface)', border: '1px solid var(--border)',
                                color: PLANET_COLORS[p] || 'var(--text)',
                              }}>{p}</span>
                            ))}
                            <span style={{ fontSize: '11px', color: 'var(--text3)', alignSelf: 'center' }}>placed here</span>
                          </div>
                        )}
                        {hm && (
                          <>
                            <div style={{ fontSize: '12.5px', color: 'var(--text)', marginBottom: '6px', lineHeight: '1.5' }}>{hm.means}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text2)', fontStyle: 'italic', lineHeight: '1.5' }}>
                              <strong>Watch:</strong> {hm.watch}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Right column: indicators */}
              <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Tithi / Vara / Hora */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={cardHeader}>Panchanga</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)' }}>
                    {[
                      ['Tithi', result.tithi ? `${result.tithi.paksha} ${result.tithi.name}` : '—'],
                      ['Vara', result.vara_lord || '—'],
                      ['Hora Lord', result.hora_lord || '—'],
                      ['Moon Nak', result.moon_analysis?.nakshatra || '—'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: 'var(--surface)', padding: '10px 14px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{k}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KP Ruling Planets */}
                {result.ruling_planets?.length > 0 && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={cardHeader}>KP Ruling Planets</div>
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(result.ruling_planets as any[]).map((rp, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11.5px', color: 'var(--text3)' }}>{rp.rank}. {rp.type}</span>
                          <span style={{
                            fontSize: '12.5px', fontWeight: '700',
                            color: PLANET_COLORS[rp.planet] || 'var(--text)',
                          }}>{rp.planet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gulika & Pranapada */}
                {(result.gulika || result.pranapada) && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={cardHeader}>Shadow Points</div>
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {result.gulika && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11.5px', color: 'var(--text3)' }}>Gulika (Mandi)</span>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#57534E' }}>
                            {result.gulika.sign} {result.gulika.degree?.toFixed(1)}° H{result.gulika.house}
                          </span>
                        </div>
                      )}
                      {result.pranapada && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11.5px', color: 'var(--text3)' }}>Pranapada</span>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0891B2' }}>
                            {result.pranapada.sign} {result.pranapada.degree?.toFixed(1)}°
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Moon Analysis ─────────────────────────────────── */}
            {result.moon_analysis && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={cardHeader}>Moon Analysis — Primary Indicator</div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Phase</div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: result.moon_analysis.is_waxing ? 'var(--green)' : 'var(--text2)' }}>
                        {result.moon_analysis.is_waxing ? '☽ Waxing (Shukla)' : '☾ Waning (Krishna)'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Void of Course</div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: result.moon_analysis.void_of_course ? 'var(--red)' : 'var(--green)' }}>
                        {result.moon_analysis.void_of_course ? '✗ Yes — nothing will proceed' : '✓ No — aspects active'}
                      </div>
                    </div>
                  </div>

                  {result.moon_analysis.applying_to?.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '500', marginBottom: '6px' }}>Applying to (upcoming influence)</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {result.moon_analysis.applying_to.map((p: any, i: number) => (
                          <span key={i} style={{
                            fontSize: '11.5px', padding: '3px 10px', borderRadius: '20px',
                            background: p.nature === 'benefic' ? 'var(--green-bg)' : 'var(--red-bg)',
                            color: p.nature === 'benefic' ? 'var(--green)' : 'var(--red)',
                            border: `1px solid ${p.nature === 'benefic' ? '#86EFAC' : '#FCA5A5'}`, fontWeight: '600',
                          }}>{p.planet} ({p.diff}° · {p.days_to_meet}d)</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.moon_analysis.separating_from?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '500', marginBottom: '6px' }}>Separating from (past influence)</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {result.moon_analysis.separating_from.map((p: any, i: number) => (
                          <span key={i} style={{
                            fontSize: '11.5px', padding: '3px 10px', borderRadius: '20px',
                            background: 'var(--surface2)', color: 'var(--text2)',
                            border: '1px solid var(--border)',
                          }}>{p.planet}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── House Analysis (collapsible, live-recomputed on category change) ── */}
            {result.ascendant && (() => {
              const liveHA = computeHouseAnalysisFE(result.planets || {}, result.ascendant.sign_index, category)
              const catLabel = CATEGORIES.find(c => c.id === category)?.label
              return Object.keys(liveHA).length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <div onClick={() => toggle('houses')} style={{ ...cardHeader, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>House Analysis — {catLabel}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{expanded.houses ? '▲' : '▼'}</span>
                </div>
                {expanded.houses && (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(liveHA).map(([key, info]: [string, any]) => (
                      <div key={key} style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text)' }}>H{info.house} — {info.role} · Lord: <span style={{ color: PLANET_COLORS[info.lord] || 'var(--accent)' }}>{info.lord}</span> in H{info.lord_house}</span>
                          <span style={{
                            fontSize: '10.5px', padding: '2px 8px', borderRadius: '20px',
                            background: info.strength === 'strong' ? 'var(--green-bg)' : info.strength === 'weak' ? 'var(--red-bg)' : 'var(--accent-bg)',
                            color: info.strength === 'strong' ? 'var(--green)' : info.strength === 'weak' ? 'var(--red)' : 'var(--accent)',
                            fontWeight: '600',
                          }}>{info.strength}</span>
                        </div>
                        {info.occupants?.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            {info.occupants.map((p: string) => (
                              <span key={p} style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '20px', fontWeight: '700', background: 'var(--surface)', border: '1px solid var(--border)', color: PLANET_COLORS[p] || 'var(--text)' }}>{p}</span>
                            ))}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.5' }}>{info.interpretation}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
            })()}

            {/* ── Panchanga Deep ───────────────────────────────── */}
            {(result.nitya_yoga || result.karana || result.drekkana) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {result.nitya_yoga && (
                  <div style={{
                    padding: '14px 16px', borderRadius: '10px',
                    background: result.nitya_yoga.auspicious ? 'var(--green-bg)' : 'var(--red-bg)',
                    border: `1px solid ${result.nitya_yoga.auspicious ? '#86EFAC' : '#FCA5A5'}`,
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', color: result.nitya_yoga.auspicious ? 'var(--green)' : 'var(--red)' }}>Nitya Yoga</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: result.nitya_yoga.auspicious ? 'var(--green)' : 'var(--red)', marginBottom: '4px' }}>{result.nitya_yoga.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text2)' }}>{result.nitya_yoga.note}</div>
                  </div>
                )}
                {result.karana && (
                  <div style={{
                    padding: '14px 16px', borderRadius: '10px',
                    background: result.karana.auspicious ? 'var(--surface2)' : 'var(--red-bg)',
                    border: `1px solid ${result.karana.auspicious ? 'var(--border)' : '#FCA5A5'}`,
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', color: result.karana.auspicious ? 'var(--text3)' : 'var(--red)' }}>Karana</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: result.karana.auspicious ? 'var(--text)' : 'var(--red)', marginBottom: '4px' }}>{result.karana.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text2)' }}>{result.karana.note}</div>
                  </div>
                )}
                {result.drekkana && (
                  <div style={{
                    padding: '14px 16px', borderRadius: '10px',
                    background: result.drekkana.is_sarpa ? 'var(--red-bg)' : 'var(--surface2)',
                    border: `1px solid ${result.drekkana.is_sarpa ? '#FCA5A5' : 'var(--border)'}`,
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', color: result.drekkana.is_sarpa ? 'var(--red)' : 'var(--text3)' }}>Rising Drekkana</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: result.drekkana.is_sarpa ? 'var(--red)' : 'var(--text)', marginBottom: '4px' }}>
                      {result.drekkana.is_sarpa ? '⚠ Sarpa Drekkana' : `Face ${result.drekkana.face}/3`}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text2)' }}>{result.drekkana.note}</div>
                  </div>
                )}
                {result.arudha_lagna && (
                  <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--accent-bg)', border: '1px solid var(--accent)' }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', color: 'var(--accent)' }}>Arudha Lagna</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>{result.arudha_lagna.sign} · H{result.arudha_lagna.house}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text2)' }}>{result.arudha_lagna.note}</div>
                  </div>
                )}
              </div>
            )}

            {/* ── Combustion & Planetary War ───────────────────── */}
            {((result.combustion?.length > 0) || (result.planetary_war?.length > 0)) && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={cardHeader}>⚠ Afflictions — Combustion & Planetary War</div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result.combustion?.map((c: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', background: 'var(--red-bg)', borderRadius: '7px' }}>
                      <span style={{ fontSize: '12px', color: '#D97706', flexShrink: 0 }}>☀</span>
                      <div>
                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: PLANET_COLORS[c.planet] || 'var(--text)' }}>{c.planet}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text2)' }}> — {c.degrees_from_sun.toFixed(1)}° from Sun (threshold {c.threshold}°)</span>
                        <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '2px' }}>{c.effect}</div>
                      </div>
                    </div>
                  ))}
                  {result.planetary_war?.map((w: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', background: '#FFF7ED', borderRadius: '7px' }}>
                      <span style={{ fontSize: '12px', color: '#D97706', flexShrink: 0 }}>⚔</span>
                      <div>
                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text)' }}>{w.planets.join(' vs ')} ({w.separation}° apart)</span>
                        <div style={{ fontSize: '11px', color: '#92400E', marginTop: '2px' }}>{w.effect}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Nimitta Analysis ─────────────────────────────── */}
            {result.nimitta_analysis && (
              <div style={{
                padding: '14px 18px', borderRadius: '10px',
                background: result.nimitta_analysis.verdict === 'auspicious' ? 'var(--green-bg)' : result.nimitta_analysis.verdict === 'inauspicious' ? 'var(--red-bg)' : 'var(--surface2)',
                border: `1px solid ${result.nimitta_analysis.verdict === 'auspicious' ? '#86EFAC' : result.nimitta_analysis.verdict === 'inauspicious' ? '#FCA5A5' : 'var(--border)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>{result.nimitta_analysis.verdict === 'auspicious' ? '🌸' : result.nimitta_analysis.verdict === 'inauspicious' ? '🪶' : '◯'}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text)' }}>Nimitta: {result.nimitta_analysis.verdict.toUpperCase()}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto' }}>Score: {result.nimitta_analysis.score > 0 ? '+' : ''}{result.nimitta_analysis.score}</span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: '1.6' }}>{result.nimitta_analysis.interpretation}</div>
              </div>
            )}

            {/* ── Vibe Score Breakdown (collapsible) ───────────── */}
            {result.vibe_score?.breakdown?.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <div onClick={() => toggle('factors')} style={{ ...cardHeader, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Factor Breakdown — Vibe Score {result.vibe_score.score}/100</span>
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{expanded.factors ? '▲' : '▼'}</span>
                </div>
                {expanded.factors && (
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text3)', minWidth: '36px', textAlign: 'right' }}>PTS</span>
                      <span style={{ fontSize: '11px', color: 'var(--text3)' }}>FACTOR → EFFECT</span>
                    </div>
                    {result.vibe_score.breakdown.map((b: any, i: number) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '6px 8px', borderRadius: '6px',
                        background: b.pts > 0 ? 'var(--green-bg)' : b.pts < 0 ? 'var(--red-bg)' : 'transparent',
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', minWidth: '36px', textAlign: 'right', color: b.pts > 0 ? 'var(--green)' : b.pts < 0 ? 'var(--red)' : 'var(--text3)' }}>
                          {b.pts > 0 ? '+' : ''}{b.pts}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', flex: '0 0 auto', minWidth: '160px' }}>{b.factor}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text3)', flex: 1 }}>{b.note}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '6px', paddingTop: '6px', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 8px 2px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', minWidth: '36px', textAlign: 'right', color: 'var(--text)' }}>
                        {result.vibe_score.score}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)' }}>Total Score → {result.vibe_score.label}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Chart Accuracy Verify ─────────────────────────── */}
            {result.planets && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <div onClick={() => toggle('accuracy')} style={{ ...cardHeader, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🔬 Verify Chart Accuracy</span>
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{expanded.accuracy ? '▲' : '▼'}</span>
                </div>
                {expanded.accuracy && (
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px', lineHeight: '1.5' }}>
                      Compare these exact longitudes with <strong>Jagannatha Hora</strong> (free software) or <strong>astro.com → Extended Chart</strong> (select Lahiri ayanamsa, sidereal). Values should match within ±0.1°.
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px' }}>
                      Chart time: <strong style={{ color: 'var(--text)' }}>{result.timestamp}</strong> · Ayanamsa: <strong style={{ color: 'var(--text)' }}>{result.ayanamsa || 'Lahiri'}</strong>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface2)' }}>
                          {['Planet', 'Sign', 'Longitude', 'Degree in Sign', 'Nakshatra', 'House'].map(h => (
                            <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: '500', color: 'var(--text3)', borderBottom: '1px solid var(--border)', fontSize: '11px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '7px 10px', fontWeight: '700', color: 'var(--accent)' }}>Lagna</td>
                          <td style={{ padding: '7px 10px' }}>{result.ascendant?.sign}</td>
                          <td style={{ padding: '7px 10px', fontVariantNumeric: 'tabular-nums' }}>{((result.ascendant?.sign_index || 0) * 30 + (result.ascendant?.degree || 0)).toFixed(3)}°</td>
                          <td style={{ padding: '7px 10px', fontVariantNumeric: 'tabular-nums' }}>{result.ascendant?.degree?.toFixed(3)}°</td>
                          <td style={{ padding: '7px 10px', color: 'var(--text3)' }}>—</td>
                          <td style={{ padding: '7px 10px', fontWeight: '600', color: 'var(--accent)' }}>H1</td>
                        </tr>
                        {Object.entries(result.planets).map(([name, p]: [string, any]) => (
                          <tr key={name} style={{ borderBottom: '1px solid var(--border)', background: 'transparent' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '7px 10px', fontWeight: '700', color: PLANET_COLORS[name] || 'var(--text)' }}>
                              {name} {p.retrograde ? <span style={{ color: 'var(--red)', fontSize: '9px' }}>(R)</span> : ''}
                            </td>
                            <td style={{ padding: '7px 10px' }}>{p.sign}</td>
                            <td style={{ padding: '7px 10px', fontVariantNumeric: 'tabular-nums', color: 'var(--text2)' }}>
                              {p.longitude?.toFixed(3) || ((p.sign_index || 0) * 30 + (p.degree || 0)).toFixed(3)}°
                            </td>
                            <td style={{ padding: '7px 10px', fontVariantNumeric: 'tabular-nums', color: 'var(--text2)' }}>{p.degree?.toFixed(3)}°</td>
                            <td style={{ padding: '7px 10px', color: 'var(--text3)', fontSize: '11px' }}>{p.nakshatra} {p.pada ? `P${p.pada}` : ''}</td>
                            <td style={{ padding: '7px 10px', fontWeight: '600', color: 'var(--accent)' }}>H{p.house}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--accent-bg)', borderRadius: '7px', fontSize: '11.5px', color: 'var(--text2)', lineHeight: '1.6' }}>
                      <strong>To verify in JHora:</strong> Options → Ayanamsa → Lahiri. Chart → Rashi. Check lagna degree and Moon longitude first — these are most critical for Prashna accuracy. If lagna matches within 1°, chart is correct.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── AI Interpretation ─────────────────────────────── */}
            {result.ai_interpretation && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ ...cardHeader, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '18px', height: '18px', borderRadius: '5px',
                    background: 'linear-gradient(135deg,#5746AF,#8B5CF6)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', color: '#fff', flexShrink: 0,
                  }}>✦</span>
                  Classical Interpretation
                </div>
                <div style={{ padding: '20px', fontSize: '13.5px', lineHeight: '1.75', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                  {typeof result.ai_interpretation === "string" ? result.ai_interpretation : JSON.stringify(result.ai_interpretation)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: '600', color: 'var(--text3)',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px',
}

const numInputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', borderRadius: '6px',
  border: '1px solid var(--border)', background: 'var(--surface)',
  fontSize: '13px', color: 'var(--text)', boxSizing: 'border-box', outline: 'none',
}

const textInputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)',
  background: 'var(--surface)', fontSize: '13px', color: 'var(--text)', outline: 'none',
}

const cardHeader: React.CSSProperties = {
  padding: '10px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)',
  fontSize: '11.5px', fontWeight: '600', color: 'var(--text2)',
  letterSpacing: '0.03em',
}
