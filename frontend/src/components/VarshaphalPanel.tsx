import PlanetInterpretationDrawer from './PlanetInterpretation'
import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { varshaphalApi } from '../api/client'
import NorthIndianChart from './NorthIndianChart'
import SouthIndianChart from './SouthIndianChart'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

interface Props { chart: any; birthData: any }

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px',
}

export default function VarshaphalPanel({ chart, birthData }: Props) {
  const { t } = useLang()
  const currentYear = new Date().getFullYear()
  const birthYear = chart?.birth?.split('-')[0] ? parseInt(chart.birth.split('-')[0]) : currentYear - 30
  const [returnYear, setReturnYear] = useState(currentYear)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [chartStyle, setChartStyle] = useState<'north' | 'south'>('north')
  const [selPlanet, setSelPlanet] = useState<string | null>(null)

  const loadData = async () => {
    if (!birthData) return
    setLoading(true); setError('')
    try {
      const res = await varshaphalApi.get({ ...birthData, return_year: returnYear })
      setData(res)
    } catch (e: any) {
      const d = e.response?.data?.detail; setError(typeof d === 'string' ? d : Array.isArray(d) ? d.map((x: any) => x.msg).join(', ') : e.message)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!birthData) return
    loadData()
  }, [birthData, returnYear])

  const years = Array.from({ length: 40 }, (_, i) => (isNaN(birthYear) ? currentYear : birthYear) + i + 1)

  // Build chart-compatible object for chart components
  const varshaphalAsc = data?.ascendant
  const varshaphalPlanets = data ? Object.fromEntries((data.planets || []).map((p: any) => [p.name, p])) : {}
  const varshaphalHouseMap = data?.planet_house_map || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Year selector */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Varshaphal')} — {t('Solar Return Chart')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Year:</span>
          <select value={returnYear} onChange={e => setReturnYear(+e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px' }}>
            {years.map(y => <option key={y} value={y}>{y} (Age {y - birthYear})</option>)}
          </select>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            {(['north', 'south'] as const).map(s => (
              <button key={s} onClick={() => setChartStyle(s)} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '12px',
                background: chartStyle === s ? 'var(--accent)' : 'var(--surface2)',
                color: chartStyle === s ? '#fff' : 'var(--text3)',
              }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>
      </div>

      {loading && <div style={{ padding: '20px', color: 'var(--text3)' }}>Computing solar return…</div>}
      {error && <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#DC2626', fontSize: '13px' }}>{error}</div>}

      {data && <>
        {/* Return info bar */}
        <div style={{ ...card, display: 'flex', gap: '24px', flexWrap: 'wrap', background: 'var(--accent-bg)', border: '1px solid rgba(87,70,175,.2)' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Solar Return')}</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent)', marginTop: '2px' }}>{returnYear} · {t('Age')} {data.age}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Sun Returns')}</div>
            <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '2px' }}>{data.return_datetime?.slice(0, 16)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Return Lagna')}</div>
            <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '2px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.ascendant?.sign)} {data.ascendant?.degree?.toFixed(1)}°</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Varshesh (Year Lord)')}</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: PLANET_COLORS[data.year_lord] || 'var(--accent)', marginTop: '2px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.year_lord)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Muntha')}</div>
            <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '2px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.muntha?.sign)} · H{data.muntha?.house}</div>
          </div>
        </div>

        {/* Chart + planets side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: '16px', flexWrap: 'wrap' }}>
          {/* Chart */}
          <div style={card}>
            <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Solar Return Chart')} {returnYear}</div>
            {varshaphalAsc && (
              chartStyle === 'north'
                ? <NorthIndianChart ascendant={varshaphalAsc} planets={varshaphalPlanets} planetHouseMap={varshaphalHouseMap} />
                : <SouthIndianChart ascendant={varshaphalAsc} planets={varshaphalPlanets} planetHouseMap={varshaphalHouseMap} />
            )}
          </div>

          {/* Planet positions */}
          <div style={card}>
            <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Planetary Positions (Return vs Natal)')}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Planet','Return Sign','House','Natal Sign','Natal H','Status','Retro'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.planets?.map((p: any, i: number) => (
                  <tr key={p.name} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface2)' }}>
                    <td style={{ padding: '6px 8px', fontWeight: '700', color: PLANET_COLORS[p.name] || 'var(--text)', cursor: 'pointer', fontFamily: "'Noto Sans Devanagari', sans-serif" }} onClick={() => setSelPlanet(p.name)}>
                      {t(p.name)}
                    </td>
                    <td style={{ padding: '6px 8px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.sign)} {p.degree}°</td>
                    <td style={{ padding: '6px 8px', fontWeight: '600' }}>H{p.house}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.natal_sign)}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--text3)' }}>H{p.natal_house}</td>
                    <td style={{ padding: '6px 8px' }}>
                      {p.status !== 'neutral' && (
                        <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '10px',
                          background: p.status === 'exalted' ? '#16A34A22' : p.status === 'debilitated' ? '#DC262622' : '#B4530922',
                          color: p.status === 'exalted' ? '#16A34A' : p.status === 'debilitated' ? '#DC2626' : '#B45309',
                          fontFamily: "'Noto Sans Devanagari', sans-serif",
                        }}>{t(p.status)}</span>
                      )}
                    </td>
                    <td style={{ padding: '6px 8px', color: 'var(--text4)', fontSize: '11px' }}>{p.retrograde ? '℞' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Muntha + strength panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          {/* Muntha */}
          <div style={card}>
            <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Muntha')}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.muntha?.sign)}</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('House')} {data.muntha?.house} {t('from natal Lagna')}</div>
            <div style={{ fontSize: '11px', color: 'var(--text4)', marginTop: '8px', lineHeight: 1.5 }}>
              Muntha advances 1 sign/year from birth Lagna. Its house position colors the year's themes.
            </div>
          </div>

          {/* Kendra planets */}
          <div style={card}>
            <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Kendras (1/4/7/10)')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {data.kendra_planets?.map((p: string) => (
                <span key={p} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                  background: (PLANET_COLORS[p] || '#888') + '18', color: PLANET_COLORS[p] || 'var(--text)',
                  border: `1px solid ${(PLANET_COLORS[p] || '#888')}44`, fontFamily: "'Noto Sans Devanagari', sans-serif"
                }}>{t(p)}</span>
              ))}
              {!data.kendra_planets?.length && <span style={{ fontSize: '12px', color: 'var(--text4)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('No planets in kendras')}</span>}
            </div>
          </div>

          {/* Trikona planets */}
          <div style={card}>
            <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Trikonas (1/5/9)')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {data.trikona_planets?.map((p: string) => (
                <span key={p} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                  background: (PLANET_COLORS[p] || '#888') + '18', color: PLANET_COLORS[p] || 'var(--text)',
                  border: `1px solid ${(PLANET_COLORS[p] || '#888')}44`, fontFamily: "'Noto Sans Devanagari', sans-serif"
                }}>{t(p)}</span>
              ))}
              {!data.trikona_planets?.length && <span style={{ fontSize: '12px', color: 'var(--text4)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('No planets in trikonas')}</span>}
            </div>
          </div>
        </div>

        {/* Tajika Aspects */}
        {data.tajika_aspects?.length > 0 && (
          <div style={card}>
            <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Tajika Aspects')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.tajika_aspects.map((a: any, i: number) => {
                const typeColor = a.tajika_type === 'Ithasala' ? '#16A34A' : a.tajika_type === 'Yamaya' ? '#5746AF' : '#D97706'
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 12px', background: 'var(--surface2)', borderRadius: '8px', fontSize: '12px' }}>
                    <span style={{ fontWeight: '700', color: PLANET_COLORS[a.planet1] || 'var(--text)', minWidth: 60, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(a.planet1)}</span>
                    <span style={{ color: 'var(--text4)', fontSize: '10px', minWidth: 70 }}>{a.aspect}</span>
                    <span style={{ fontWeight: '700', color: PLANET_COLORS[a.planet2] || 'var(--text)', minWidth: 60, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(a.planet2)}</span>
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: typeColor + '18', color: typeColor, border: `1px solid ${typeColor}33`, minWidth: 70, textAlign: 'center', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(a.tajika_type)}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text4)', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{a.orb}° orb</span>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text4)', lineHeight: 1.6 }}>
              <strong>Ithasala</strong> = applying (faster → slower, beneficial) · <strong>Ishrafa</strong> = separating (past) · <strong>Yamaya</strong> = within 1° (exact, powerful)
            </div>
          </div>
        )}

        {/* Year selector strip */}
        <div style={{ ...card, padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Jump to Year</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {years.filter((_, i) => i % 2 === 0 || years[_] === currentYear).map(y => (
              <button key={y} onClick={() => setReturnYear(y)} style={{
                padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)',
                background: y === returnYear ? 'var(--accent)' : y === currentYear ? 'var(--accent-bg)' : 'var(--surface2)',
                color: y === returnYear ? '#fff' : y === currentYear ? 'var(--accent)' : 'var(--text3)',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer',
              }}>{y}</button>
            ))}
          </div>
        </div>
        {selPlanet && data && (() => {
          const allPlanets = Object.fromEntries((data.planets || []).map((p: any) => [p.name, { sign: p.sign, house: p.house, degree: parseFloat(p.degree) || 0, retrograde: p.retrograde, status: p.status }]))
          const pd = allPlanets[selPlanet]
          return pd ? <PlanetInterpretationDrawer planet={selPlanet} planetData={pd} allPlanets={allPlanets} onClose={() => setSelPlanet(null)} /> : null
        })()}
      </>}
    </div>
  )
}
