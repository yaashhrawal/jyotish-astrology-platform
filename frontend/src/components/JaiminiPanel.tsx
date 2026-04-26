import PlanetInterpretationDrawer from './PlanetInterpretation'
import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { apiPost } from '../api/client'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const KARAKA_COLORS: Record<string, string> = {
  AK: '#5746AF', AmK: '#0891B2', BK: '#DC2626', MK: '#16A34A',
  PiK: '#D97706', GK: '#57534E', DK: '#7C3AED',
}

const KARAKA_FULL: Record<string, string> = {
  AK: 'Atma Karaka', AmK: 'Amatya Karaka', BK: 'Bhratri Karaka',
  MK: 'Matri Karaka', PiK: 'Pitri Karaka', GK: 'Gnati Karaka', DK: 'Dara Karaka',
}

interface Props { birthData: any }

export default function JaiminiPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selPlanet, setSelPlanet] = useState<string | null>(null)

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/jaimini_karakas', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)' }}>Computing Jaimini Karakas…</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Jaimini Chara Karakas')}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
          {t('7 planets ranked by degree in sign (descending). Highest = Atma Karaka (soul indicator).')}
          {t('Atmakaraka')}: <strong style={{ color: PLANET_COLORS[data.atmakaraka] }}>{t(data.atmakaraka)}</strong>
        </div>
      </div>

      {/* Karakas grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
        {data.karakas?.map((k: any) => (
          <div key={k.karaka} style={{
            background: 'var(--surface)', border: `2px solid ${KARAKA_COLORS[k.karaka] || 'var(--border)'}`,
            borderRadius: 12, padding: '14px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: KARAKA_COLORS[k.karaka], fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(k.karaka)}</div>
            <div style={{ fontSize: 10, color: KARAKA_COLORS[k.karaka], opacity: 0.8, marginTop: 1, fontStyle: 'italic' }}>{KARAKA_FULL[k.karaka] || ''}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: PLANET_COLORS[k.planet] || 'var(--text)', marginTop: 4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(k.planet)}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(k.sign)?.slice(0, 3)}</div>
            <div style={{ fontSize: 11, color: 'var(--text4)', fontVariantNumeric: 'tabular-nums' }}>{k.degree_in_sign?.toFixed(2)}°</div>
          </div>
        ))}
      </div>

      {/* Karakas detail table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Karaka Details')}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Karaka', 'Planet', 'Sign', 'Degree', 'Navamsha Sign', 'Meaning'].map(h => (
                <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11.5, color: 'var(--text3)', fontWeight: 500, borderBottom: '1px solid var(--border)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.karakas?.map((k: any, i: number) => (
              <tr key={k.karaka} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                <td style={{ padding: '8px 16px', fontWeight: 700, color: KARAKA_COLORS[k.karaka], fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(k.karaka)}</td>
                <td style={{ padding: '8px 16px', fontWeight: 600, color: PLANET_COLORS[k.planet] || 'var(--text)', cursor: 'pointer', fontFamily: "'Noto Sans Devanagari', sans-serif" }} onClick={() => setSelPlanet(k.planet)}>{t(k.planet)}</td>
                <td style={{ padding: '8px 16px', color: 'var(--text2)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(k.sign)}</td>
                <td style={{ padding: '8px 16px', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{k.degree_in_sign?.toFixed(2)}°</td>
                <td style={{ padding: '8px 16px', color: 'var(--accent)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(k.navamsha_sign)}</td>
                <td style={{ padding: '8px 16px', fontSize: 12, color: 'var(--text3)' }}>{k.karaka_full?.split(' — ')[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Karakamsha */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Karakamsha Lagna')}</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text4)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Karakamsha Sign')}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.karakamsha_sign)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text4)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('House in Natal')}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>H{data.karakamsha_house}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text4)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Swamsha')}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: data.swamsha ? 'var(--green)' : 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              {data.swamsha ? t('Yes — AK in Lagna navamsha (powerful)') : t('No')}
            </div>
          </div>
          {data.planets_in_karakamsha?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text4)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Planets in Karakamsha H')}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{data.planets_in_karakamsha.map((p: string) => t(p)).join(', ')}</div>
            </div>
          )}
        </div>
      </div>
      {selPlanet && data && (() => {
        const allPlanets = Object.fromEntries((data.karakas || []).map((k: any) => [k.planet, { sign: k.sign, house: 0, degree: k.degree_in_sign || 0 }]))
        const pd = allPlanets[selPlanet]
        return pd ? <PlanetInterpretationDrawer planet={selPlanet} planetData={pd} allPlanets={allPlanets} onClose={() => setSelPlanet(null)} /> : null
      })()}
    </div>
  )
}
