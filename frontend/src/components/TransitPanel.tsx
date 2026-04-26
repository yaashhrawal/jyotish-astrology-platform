import { useState, useRef, useEffect, useCallback } from 'react'
import { transitApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'
import TransitWheel from './TransitWheel'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626',
  Mercury: '#16A34A', Jupiter: '#B45309', Venus: '#7C3AED',
  Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#9CA3AF',
}

const PLANET_SYMBOL: Record<string, string> = {
  Sun: '☀', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
}

const ASPECTS = [
  { name: 'Conjunction', degrees: 0, orb: 8 },
  { name: 'Opposition', degrees: 180, orb: 8 },
  { name: 'Trine', degrees: 120, orb: 8 },
  { name: 'Square', degrees: 90, orb: 7 },
  { name: 'Sextile', degrees: 60, orb: 6 },
]

function getAspects(transitPlanets: any, natalPlanets: any) {
  const aspects: any[] = []
  for (const [tp, tdata] of Object.entries(transitPlanets) as any) {
    for (const [np, ndata] of Object.entries(natalPlanets) as any) {
      const diff = Math.abs((tdata.longitude - ndata.longitude + 360) % 360)
      const diff2 = diff > 180 ? 360 - diff : diff
      for (const asp of ASPECTS) {
        const orb = Math.abs(diff2 - asp.degrees)
        if (orb <= asp.orb) {
          aspects.push({ transit: tp, natal: np, aspect: asp.name, orb: orb.toFixed(1) })
        }
      }
    }
  }
  return aspects.sort((a, b) => parseFloat(a.orb) - parseFloat(b.orb))
}

const label: React.CSSProperties = {
  fontSize: '11px', fontWeight: '600', color: 'var(--text3)',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px',
}

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-m)', padding: '18px',
}

interface Props {
  chart: any
}

export default function TransitPanel({ chart }: Props) {
  const { t: tl } = useLang()
  const [useNow, setUseNow] = useState(true)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5))
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [animStep, setAnimStep] = useState<'day' | 'week' | 'month'>('week')
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stepDate = useCallback((d: string, step: typeof animStep) => {
    const dt = new Date(d)
    if (step === 'day') dt.setDate(dt.getDate() + 1)
    else if (step === 'week') dt.setDate(dt.getDate() + 7)
    else dt.setMonth(dt.getMonth() + 1)
    return dt.toISOString().slice(0, 10)
  }, [])

  useEffect(() => {
    if (playing) {
      animRef.current = setInterval(() => {
        setDate(prev => {
          const next = stepDate(prev, animStep)
          return next
        })
        setUseNow(false)
      }, 600)
    } else {
      if (animRef.current) clearInterval(animRef.current)
    }
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [playing, animStep, stepDate])

  // Auto-fetch when date changes during animation
  useEffect(() => {
    if (playing && chart) calculate()
  }, [date, playing]) // eslint-disable-line

  const calculate = useCallback(async () => {
    setLoading(true); setError('')
    try {
      // parse birth date from chart
      const birthParts = chart.birth?.split(' ') || []
      const [bd, bt] = [birthParts[0] || '1990-01-01', birthParts[1] || '12:00']
      const [by, bm, bdd] = bd.split('-').map(Number)
      const [bh, bmin] = bt.split(':').map(Number)

      const payload: any = {
        birth_year: by, birth_month: bm, birth_day: bdd,
        birth_hour: bh, birth_minute: bmin, birth_tz_offset: 5.5,
        birth_lat: chart.latitude || 28.6, birth_lon: chart.longitude || 77.2,
        ayanamsa: chart.ayanamsa || 'lahiri',
      }
      if (!useNow) {
        const [ty, tm, td] = date.split('-').map(Number)
        const [th, tmin] = time.split(':').map(Number)
        payload.transit_year = ty; payload.transit_month = tm; payload.transit_day = td
        payload.transit_hour = th; payload.transit_minute = tmin
      }
      const data = await transitApi.get(payload)
      setResult(data)
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }, [chart, useNow, date, time])

  const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls */}
      <div style={{ ...card, display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <div style={label}>Transit Date</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setUseNow(true)} style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '12.5px', cursor: 'pointer',
              border: useNow ? 'none' : '1px solid var(--border)',
              background: useNow ? 'var(--accent)' : 'transparent',
              color: useNow ? '#fff' : 'var(--text2)', fontWeight: '600',
            }}>Now</button>
            <button onClick={() => setUseNow(false)} style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '12.5px', cursor: 'pointer',
              border: !useNow ? 'none' : '1px solid var(--border)',
              background: !useNow ? 'var(--accent)' : 'transparent',
              color: !useNow ? '#fff' : 'var(--text2)', fontWeight: '600',
            }}>Custom</button>
          </div>
        </div>
        {!useNow && (
          <>
            <div>
              <div style={label}>Date</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{
                padding: '7px 10px', border: '1px solid var(--border)',
                borderRadius: '6px', fontSize: '13px', background: 'var(--surface2)',
              }} />
            </div>
            <div>
              <div style={label}>Time</div>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{
                padding: '7px 10px', border: '1px solid var(--border)',
                borderRadius: '6px', fontSize: '13px', background: 'var(--surface2)',
              }} />
            </div>
          </>
        )}
        <button onClick={calculate} disabled={loading} style={{
          padding: '8px 20px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
          cursor: 'pointer', opacity: loading ? 0.7 : 1,
        }}>{loading ? tl('Calculating…') : tl('Calculate Transits')}</button>
        {error && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>}

        {/* Animation controls */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600' }}>ANIMATE:</span>
          {(['day', 'week', 'month'] as const).map(s => (
            <button key={s} onClick={() => setAnimStep(s)} style={{
              padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
              border: '1px solid var(--border)', cursor: 'pointer',
              background: animStep === s ? 'var(--accent)' : 'var(--surface2)',
              color: animStep === s ? '#fff' : 'var(--text3)',
            }}>{s === 'day' ? '1D' : s === 'week' ? '1W' : '1M'}</button>
          ))}
          <button onClick={() => { setUseNow(false); setPlaying(p => !p) }} style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
            border: 'none', cursor: 'pointer',
            background: playing ? '#DC2626' : '#16A34A', color: '#fff',
          }}>{playing ? '⏸ Pause' : '▶ Play'}</button>
          {playing && <span style={{ fontSize: '11px', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{date}</span>}
        </div>
      </div>

      {result && (
        <>
          {/* Transit date banner */}
          <div style={{ fontSize: '13px', color: 'var(--text3)', fontWeight: '500' }}>
            Transit for: <strong style={{ color: 'var(--text)' }}>{result.transit_date}</strong>
            {' — over natal chart of '}
            <strong style={{ color: 'var(--accent)' }}>{chart.name}</strong>
          </div>

          {/* Transit Wheel */}
          <div style={card}>
            <div style={label}>Transit Wheel — Natal (inner) vs Transit (outer)</div>
            <TransitWheel
              natalPlanets={result.natal || {}}
              transitPlanets={result.transit || {}}
              ascendantLon={result.natal_ascendant?.longitude ?? chart.ascendant?.longitude}
            />
          </div>

          {/* Planet comparison table */}
          <div style={card}>
            <div style={label}>Transit vs Natal Positions</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Planet', 'Transit Sign', 'Transit Deg', 'Natal Sign', 'Natal Deg', 'House Transit'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Use natal ascendant sign index from chart prop (reliable source)
                    const ascSignIdx = chart.ascendant?.sign_index ?? 0
                    return planets.map(p => {
                      const t = result.transit?.[p]
                      const n = result.natal?.[p]
                      if (!t || !n) return null
                      const sameSign = t.sign === n.sign
                      const transitHouse = ((t.sign_index - ascSignIdx + 12) % 12) + 1
                      return (
                        <tr key={p} style={{ borderBottom: '1px solid var(--border)', background: sameSign ? 'var(--accent-bg)' : 'transparent' }}>
                          <td style={{ padding: '9px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <span style={{ color: PLANET_COLORS[p], fontSize: '15px' }}>{PLANET_SYMBOL[p]}</span>
                              <span style={{ fontWeight: '600', color: PLANET_COLORS[p], fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{tl(p)}</span>
                            </div>
                          </td>
                          <td style={{ padding: '9px 10px', color: 'var(--text)', fontWeight: sameSign ? '700' : '400', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{tl(t.sign)}</td>
                          <td style={{ padding: '9px 10px', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{t.degree?.toFixed(2)}°{t.retrograde ? ' ®' : ''}</td>
                          <td style={{ padding: '9px 10px', color: 'var(--text2)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{tl(n.sign)}</td>
                          <td style={{ padding: '9px 10px', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{n.degree?.toFixed(2)}°</td>
                          <td style={{ padding: '9px 10px' }}>
                            <span style={{
                              fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                              background: sameSign ? 'var(--accent)' : 'var(--surface2)',
                              color: sameSign ? '#fff' : 'var(--text3)',
                            }}>H{transitHouse}</span>
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aspects */}
          {(() => {
            const aspects = getAspects(result.transit || {}, result.natal || {})
            if (!aspects.length) return null
            return (
              <div style={card}>
                <div style={label}>Transit Aspects to Natal ({aspects.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {aspects.slice(0, 20).map((a, i) => (
                    <div key={i} style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <span style={{ color: PLANET_COLORS[a.transit], fontWeight: '700', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{tl(a.transit)}</span>
                      <span style={{ color: 'var(--text3)', fontSize: '10px' }}>{a.aspect}</span>
                      <span style={{ color: PLANET_COLORS[a.natal], fontWeight: '700', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{tl(a.natal)}</span>
                      <span style={{ color: 'var(--text4)', fontSize: '10px' }}>({a.orb}°)</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
