import { useState, useEffect } from 'react'
import { dashaApi, transitApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const PLANET_LIST = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']

function getDashaAtDate(dashas: any[], date: Date): { maha: any; antar: any } | null {
  for (const maha of dashas) {
    if (new Date(maha.start) <= date && date <= new Date(maha.end)) {
      for (const antar of (maha.antardashas || [])) {
        if (new Date(antar.start) <= date && date <= new Date(antar.end)) {
          return { maha, antar }
        }
      }
      return { maha, antar: null }
    }
  }
  return null
}

function transit_influence(_transitPlanet: string, transitSign: string, natalSign: string): string {
  // Very simplified aspect check by sign distance
  const signs = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]
  const ti = signs.indexOf(transitSign)
  const ni = signs.indexOf(natalSign)
  if (ti < 0 || ni < 0) return 'neutral'
  const diff = Math.abs(ti - ni) % 12
  if (diff === 0) return 'conjunction'
  if (diff === 6) return 'opposition'
  if (diff === 4 || diff === 8) return 'trine'
  if (diff === 3 || diff === 9) return 'square'
  return 'neutral'
}

const INFLUENCE_COLORS: Record<string, string> = {
  conjunction: '#7C3AED', trine: '#16A34A', opposition: '#DC2626', square: '#F59E0B', neutral: '#94A3B8'
}

interface Props { birthData: any }

export default function DashaTransitOverlayPanel({ birthData }: Props) {
  const { t } = useLang()
  const [dashas, setDashas] = useState<any[]>([])
  const [transit, setTransit] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [err, setErr] = useState('')
  const [activeDasha, setActiveDasha] = useState<{ maha: any; antar: any } | null>(null)

  useEffect(() => {
    if (!birthData) return
    setLoading(true); setErr('')
    const now = new Date(date)

    const [ty, tm, td] = date.split('-').map(Number)
    Promise.all([
      dashaApi.get(birthData),
      transitApi.get({
        birth_year: birthData.year, birth_month: birthData.month, birth_day: birthData.day,
        birth_hour: birthData.hour, birth_minute: birthData.minute,
        birth_tz_offset: birthData.tz_offset,
        birth_lat: birthData.latitude, birth_lon: birthData.longitude,
        ayanamsa: birthData.ayanamsa || 'lahiri',
        transit_year: ty, transit_month: tm, transit_day: td, transit_hour: 12, transit_minute: 0,
      }),
    ]).then(([dashaData, transitData]) => {
      const allDashas = dashaData?.dashas || []
      setDashas(allDashas)
      setTransit(transitData)
      setActiveDasha(getDashaAtDate(allDashas, now))
    }).catch(e => setErr(e?.message || t('Error')))
    .finally(() => setLoading(false))
  }, [birthData, date])

  if (!birthData) return <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>{t('Load a birth chart first.')}</div>
  if (loading) return <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>{t('Computing dasha + transit overlay…')}</div>
  if (err) return <div style={{ padding: 12, background: '#FEF2F2', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{err}</div>

  const natalPlanets = transit?.natal || {}
  const transitPlanets = transit?.transit || {}

  const influences = PLANET_LIST.map(tp => {
    const td = transitPlanets[tp]
    if (!td) return null
    const checks = PLANET_LIST.map(np => {
      const nd = natalPlanets[np]
      if (!nd) return null
      const rel = transit_influence(tp, td.sign, nd.sign)
      if (rel === 'neutral') return null
      return { natal_planet: np, natal_sign: nd.sign, rel }
    }).filter(Boolean)
    return checks.length ? { transit_planet: tp, transit_sign: td.sign, checks } : null
  }).filter(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{t('Dasha ↔ Transit Overlay')}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{t('Active dasha period + current transits over natal chart — combined view')}</div>
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{
          padding: '8px 12px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text)', fontSize: '13px',
        }} />
      </div>

      {/* Active Dasha block */}
      {activeDasha && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>{t('Active Dasha Period')}</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ padding: '10px 18px', borderRadius: '10px', background: PLANET_COLORS[activeDasha.maha.lord] + '18', border: `2px solid ${PLANET_COLORS[activeDasha.maha.lord]}44` }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{t('Mahadasha')}</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: PLANET_COLORS[activeDasha.maha.lord] }}>{activeDasha.maha.lord}</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>{activeDasha.maha.start?.slice(0,7)} → {activeDasha.maha.end?.slice(0,7)}</div>
            </div>
            {activeDasha.antar && (
              <>
                <div style={{ fontSize: '20px', color: 'var(--text3)' }}>→</div>
                <div style={{ padding: '10px 18px', borderRadius: '10px', background: PLANET_COLORS[activeDasha.antar.lord] + '18', border: `2px solid ${PLANET_COLORS[activeDasha.antar.lord]}44` }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{t('Antardasha')}</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: PLANET_COLORS[activeDasha.antar.lord] }}>{activeDasha.antar.lord}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>{activeDasha.antar.start?.slice(0,7)} → {activeDasha.antar.end?.slice(0,7)}</div>
                </div>
              </>
            )}
          </div>

          {/* Dasha lord transit positions */}
          <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--surface2)', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: '700', marginBottom: '6px' }}>{t('Dasha Lord Positions Today')}</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[activeDasha.maha.lord, activeDasha.antar?.lord].filter(Boolean).map((lord: string) => {
                const tp = transitPlanets[lord]
                return tp ? (
                  <div key={lord} style={{ padding: '6px 12px', borderRadius: '8px', background: PLANET_COLORS[lord] + '18', fontSize: '12px' }}>
                    <span style={{ fontWeight: '700', color: PLANET_COLORS[lord] }}>{lord}</span>
                    <span style={{ color: 'var(--text2)', marginLeft: '6px' }}>{t('in')} {tp.sign} {tp.degree?.toFixed ? tp.degree.toFixed(1) : ''}°</span>
                    {tp.retrograde && <span style={{ color: '#F59E0B', marginLeft: '4px', fontSize: '10px' }}>℞</span>}
                  </div>
                ) : null
              })}
            </div>
          </div>
        </div>
      )}

      {/* Planet-by-planet transit table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', padding: '14px 16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>{t('Transits vs Natal')} ({date})</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', color: 'var(--text3)', fontWeight: '700', textTransform: 'uppercase' }}>{t('Planet')}</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', color: 'var(--text3)', fontWeight: '700', textTransform: 'uppercase' }}>{t('Natal Sign')}</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', color: 'var(--text3)', fontWeight: '700', textTransform: 'uppercase' }}>{t('Transit Sign')}</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', color: 'var(--text3)', fontWeight: '700', textTransform: 'uppercase' }}>{t('House')}</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', color: 'var(--text3)', fontWeight: '700', textTransform: 'uppercase' }}>℞</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', color: 'var(--text3)', fontWeight: '700', textTransform: 'uppercase' }}>{t('Dasha Relevance')}</th>
              </tr>
            </thead>
            <tbody>
              {PLANET_LIST.map(p => {
                const nd = natalPlanets[p]
                const td = transitPlanets[p]
                if (!nd && !td) return null
                const c = PLANET_COLORS[p]
                const isDashaLord = activeDasha && (activeDasha.maha.lord === p || activeDasha.antar?.lord === p)
                return (
                  <tr key={p} style={{ borderBottom: '1px solid var(--border)', background: isDashaLord ? c + '08' : 'transparent' }}>
                    <td style={{ padding: '7px 8px', fontWeight: '700', color: c }}>
                      {p} {isDashaLord && <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '10px', background: c + '20', color: c, marginLeft: '4px' }}>{t('dasha')}</span>}
                    </td>
                    <td style={{ padding: '7px 8px', color: 'var(--text2)' }}>{nd?.sign || '—'}</td>
                    <td style={{ padding: '7px 8px', color: 'var(--text)', fontWeight: '600' }}>{td?.sign || '—'}</td>
                    <td style={{ padding: '7px 8px', color: 'var(--text3)' }}>{td?.house ? `H${td.house}` : '—'}</td>
                    <td style={{ padding: '7px 8px', color: '#F59E0B' }}>{td?.retrograde ? '℞' : ''}</td>
                    <td style={{ padding: '7px 8px' }}>
                      {isDashaLord && (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: '#7C3AED18', color: '#7C3AED', fontWeight: '700' }}>
                          {activeDasha?.maha.lord === p ? t('Mahadasha Lord') : t('Antardasha Lord')}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Significant transits */}
      {influences.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>{t('Significant Transits (non-neutral aspects)')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {influences.map((inf: any) => (
              <div key={inf.transit_planet} style={{ padding: '8px 12px', background: 'var(--surface2)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', color: PLANET_COLORS[inf.transit_planet], fontSize: '12px' }}>
                    {t('Transit')} {inf.transit_planet} {t('in')} {inf.transit_sign}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text3)' }}>→</span>
                  {inf.checks.map((c: any) => (
                    <span key={c.natal_planet} style={{
                      fontSize: '11px', padding: '2px 9px', borderRadius: '20px',
                      background: INFLUENCE_COLORS[c.rel] + '18', color: INFLUENCE_COLORS[c.rel],
                      border: `1px solid ${INFLUENCE_COLORS[c.rel]}44`, fontWeight: '600',
                    }}>
                      {c.rel} {t('natal')} {c.natal_planet}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming dasha changes */}
      {dashas.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>{t('Upcoming Mahadasha Changes')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {dashas
              .filter(d => new Date(d.end) > new Date(date))
              .slice(0, 5)
              .map(d => {
                const c = PLANET_COLORS[d.lord]
                const isActive = new Date(d.start) <= new Date(date) && new Date(date) <= new Date(d.end)
                return (
                  <div key={d.lord + d.start} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', borderRadius: '8px', background: isActive ? c + '10' : 'transparent', border: isActive ? `1px solid ${c}30` : '1px solid transparent' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>
                      {d.lord.slice(0,2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: '700', color: c, fontSize: '12px' }}>{d.lord}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: '8px' }}>{d.start?.slice(0,7)} → {d.end?.slice(0,7)}</span>
                    </div>
                    {isActive && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: c + '20', color: c, fontWeight: '700' }}>▶ {t('NOW')}</span>}
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
