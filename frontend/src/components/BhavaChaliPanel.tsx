import PlanetInterpretationDrawer from './PlanetInterpretation'
import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { apiPost } from '../api/client'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

interface Props { birthData: any }

export default function BhavaChaliPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selPlanet, setSelPlanet] = useState<string | null>(null)

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/bhava_chalit', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)' }}>Computing Bhava Chalit…</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  const shifted = data.shifted_planets || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Bhava Chalit Chart')} — {t('Placidus Cusps')}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          Planets placed by actual house cusp boundaries, not equal signs.
          {shifted.length > 0 ? (
            <span style={{ marginLeft: 8, color: '#DC2626', fontWeight: 600 }}>
              {shifted.length} planet{shifted.length > 1 ? 's' : ''} shifted house.
            </span>
          ) : (
            <span style={{ marginLeft: 8, color: 'var(--green)', fontWeight: 600 }}>No planets shifted.</span>
          )}
        </div>
      </div>

      {/* Shifted planets highlight */}
      {shifted.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', marginBottom: 8, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('House Shifts (Rashi → Chalit)')}</div>
          {shifted.map((p: any) => (
            <div key={p.planet} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', borderBottom: '1px solid #FCA5A5' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: PLANET_COLORS[p.planet] || '#888', flexShrink: 0, display: 'block' }} />
              <span style={{ fontWeight: 700, color: PLANET_COLORS[p.planet] || '#888', width: 80, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.planet)}</span>
              <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.sign)}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Rashi')} H{p.rashi_house}</span>
              <span style={{ fontSize: 14, color: '#DC2626' }}>→</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Chalit')} H{p.chalit_house}</span>
            </div>
          ))}
        </div>
      )}

      {/* Planet table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Planet Positions')}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Planet', 'Sign', 'Degree', 'Rashi House', 'Chalit House', 'Shifted?'].map(h => (
                <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11.5, color: 'var(--text3)', fontWeight: 500, borderBottom: '1px solid var(--border)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.planets?.map((p: any, i: number) => (
              <tr key={p.planet} style={{ borderBottom: '1px solid var(--border)', background: p.shifted ? '#FEF2F220' : i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                <td style={{ padding: '8px 16px', fontWeight: 600, color: PLANET_COLORS[p.planet] || 'var(--accent)', cursor: 'pointer', fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                  onClick={() => setSelPlanet(p.planet)}>
                  {t(p.planet)}{p.retrograde ? <span style={{ color: 'var(--red)', fontSize: 9 }}> (R)</span> : ''}
                </td>
                <td style={{ padding: '8px 16px', color: 'var(--text2)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.sign)}</td>
                <td style={{ padding: '8px 16px', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{p.degree?.toFixed(2)}°</td>
                <td style={{ padding: '8px 16px', fontWeight: 600, color: 'var(--accent)' }}>H{p.rashi_house}</td>
                <td style={{ padding: '8px 16px', fontWeight: 700, color: p.shifted ? '#DC2626' : 'var(--accent)' }}>H{p.chalit_house}</td>
                <td style={{ padding: '8px 16px' }}>
                  {p.shifted
                    ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#FEF2F2', color: '#DC2626', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('SHIFTED')}</span>
                    : <span style={{ fontSize: 10, color: 'var(--text4)' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cusps */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('House Cusps (Placidus)')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 1, background: 'var(--border)' }}>
          {data.cusps?.map((c: any) => (
            <div key={c.house} style={{ background: 'var(--surface)', padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text4)' }}>H{c.house}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginTop: 2, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(c.sign)?.slice(0, 3)}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{c.degree?.toFixed(1)}°</div>
            </div>
          ))}
        </div>
      </div>
      {selPlanet && data && (() => {
        const allPlanets = Object.fromEntries((data.planets || []).map((p: any) => [p.planet, { sign: p.sign, house: p.chalit_house, degree: p.degree, retrograde: p.retrograde }]))
        const pd = allPlanets[selPlanet]
        return pd ? <PlanetInterpretationDrawer planet={selPlanet} planetData={pd} allPlanets={allPlanets} onClose={() => setSelPlanet(null)} /> : null
      })()}
    </div>
  )
}
