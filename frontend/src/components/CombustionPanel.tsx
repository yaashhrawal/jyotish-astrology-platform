import PlanetInterpretationDrawer from './PlanetInterpretation'
import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { apiPost } from '../api/client'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const SEV_COLORS: Record<string, string> = {
  deep: '#DC2626', moderate: '#D97706', mild: '#CA8A04', none: 'var(--text4)'
}

interface Props { birthData: any }

export default function CombustionPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selPlanet, setSelPlanet] = useState<string | null>(null)

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/combustion', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)' }}>Checking combustion…</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  const combust = (data.combust_planets || []).filter((p: any) => p.combust)
  const wars = data.planetary_wars || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 600, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('SUN POSITION')}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#D97706', marginTop: 4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.sun_sign)}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{data.sun_longitude?.toFixed(2)}°</div>
        </div>
        <div style={{ background: combust.length > 0 ? '#FEF2F2' : 'var(--surface)', border: `1px solid ${combust.length > 0 ? '#FCA5A5' : 'var(--border)'}`, borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 600, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('COMBUST PLANETS')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: combust.length > 0 ? '#DC2626' : 'var(--green)', marginTop: 4 }}>{data.combust_count}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{combust.map((p: any) => t(p.planet)).join(', ') || t('None')}</div>
        </div>
        <div style={{ background: wars.length > 0 ? '#FEF2F2' : 'var(--surface)', border: `1px solid ${wars.length > 0 ? '#FCA5A5' : 'var(--border)'}`, borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 600, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('PLANETARY WARS')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: wars.length > 0 ? '#DC2626' : 'var(--green)', marginTop: 4 }}>{data.war_count}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{wars.map((w: any) => `${t(w.planet1)}/${t(w.planet2)}`).join(', ') || t('None')}</div>
        </div>
      </div>

      {/* Combustion table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Combustion Analysis')}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Planet', 'Distance from Sun', 'Orb Threshold', 'Severity', 'Retrograde'].map(h => (
                <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11.5, color: 'var(--text3)', fontWeight: 500, borderBottom: '1px solid var(--border)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.combust_planets?.map((p: any, i: number) => (
              <tr key={p.planet} style={{ borderBottom: '1px solid var(--border)', background: p.combust ? '#FEF2F210' : i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                <td style={{ padding: '8px 16px', fontWeight: 600, color: PLANET_COLORS[p.planet] || 'var(--text)', cursor: 'pointer', fontFamily: "'Noto Sans Devanagari', sans-serif" }} onClick={() => setSelPlanet(p.planet)}>{t(p.planet)}</td>
                <td style={{ padding: '8px 16px', fontVariantNumeric: 'tabular-nums', color: p.combust ? SEV_COLORS[p.severity] : 'var(--text2)' }}>
                  {p.angular_distance?.toFixed(2)}°
                </td>
                <td style={{ padding: '8px 16px', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{p.orb_threshold}°</td>
                <td style={{ padding: '8px 16px' }}>
                  {p.severity !== 'none' ? (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: SEV_COLORS[p.severity] + '22', color: SEV_COLORS[p.severity], fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                      {t(p.severity.toUpperCase())}
                    </span>
                  ) : <span style={{ color: 'var(--text4)', fontSize: 11 }}>—</span>}
                </td>
                <td style={{ padding: '8px 16px', color: 'var(--text3)', fontSize: 11, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{p.retrograde ? t('Yes (adj. orb)') : t('No')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Planetary Wars */}
      {wars.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', marginBottom: 10, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Planetary Wars (Graha Yuddha)')}</div>
          {wars.map((w: any, i: number) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #FCA5A5', display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: PLANET_COLORS[w.planet1], fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(w.planet1)}</span>
              <span style={{ color: '#DC2626', fontWeight: 700 }}>⚔</span>
              <span style={{ fontWeight: 700, color: PLANET_COLORS[w.planet2], fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(w.planet2)}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{w.angular_distance}° apart</span>
              <span style={{ fontSize: 11, color: '#DC2626', fontStyle: 'italic' }}>{w.effect}</span>
            </div>
          ))}
        </div>
      )}
      {selPlanet && data && (() => {
        const allPlanets = Object.fromEntries((data.combust_planets || []).map((p: any) => [p.planet, { sign: p.sign || '', house: p.house || 0, degree: p.distance_from_sun || 0 }]))
        const pd = allPlanets[selPlanet]
        return pd ? <PlanetInterpretationDrawer planet={selPlanet} planetData={pd} allPlanets={allPlanets} onClose={() => setSelPlanet(null)} /> : null
      })()}
    </div>
  )
}
