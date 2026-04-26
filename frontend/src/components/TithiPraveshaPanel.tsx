import PlanetInterpretationDrawer from './PlanetInterpretation'
import { useState } from 'react'
import { apiPost } from '../api/client'
import NorthIndianChart from './NorthIndianChart'
import SouthIndianChart from './SouthIndianChart'
import { useLang } from '../contexts/LanguageContext'

export default function TithiPraveshaPanel({ birthData, chartStyle }: { birthData: any; chartStyle: 'north' | 'south' }) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [selPlanet, setSelPlanet] = useState<string | null>(null)

  const fetch = async () => {
    setLoading(true); setError('')
    try {
      const res = await apiPost('/api/calc/tithi_pravesha', { ...birthData, return_year: year })
      setData(res)
    } catch (e: any) {
      const d = e.response?.data?.detail
      setError(typeof d === 'string' ? d : e.message)
    } finally { setLoading(false) }
  }

  const returnPlanets = data ? Object.fromEntries((data.planets || []).map((p: any) => [p.name, p])) : {}

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Controls */}
      <div style={{
        display: 'flex', gap: '12px', alignItems: 'center',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '14px 20px',
      }}>
        <span style={{ fontSize: '13px', color: 'var(--text3)' }}>{t('Return Year')}:</span>
        <input type="number" value={year} onChange={e => setYear(+e.target.value)}
          min={birthData?.year || 1900} max={2100}
          style={{ width: '90px', padding: '6px 10px', borderRadius: '6px',
            border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }} />
        <button onClick={fetch} disabled={loading} style={{
          padding: '8px 24px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
        }}>{loading ? t('Calculating…') : t('Calculate')}</button>
        {error && <span style={{ color: 'var(--red)', fontSize: '13px' }}>{error}</span>}
      </div>

      {data && (
        <>
          {/* Header */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '16px 24px',
            display: 'flex', gap: '32px', flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Natal Tithi</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent)' }}>
                {data.natal_tithi?.paksha} {data.natal_tithi?.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Tithi {data.natal_tithi?.tithi_num} · {data.natal_tithi?.angle?.toFixed(1)}°</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Return Moment</div>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>{data.return_datetime}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Return Lagna</div>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>{data.return_ascendant?.sign} {data.return_ascendant?.degree?.toFixed(1)}°</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Occurrences in Year</div>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>{data.all_returns_in_year}</div>
            </div>
          </div>

          {/* Chart + table */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ width: '320px', flexShrink: 0 }}>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px', fontWeight: '600' }}>
                Tithi Pravesha Chart {year}
              </div>
              {chartStyle === 'north'
                ? <NorthIndianChart ascendant={data.return_ascendant} planets={returnPlanets} planetHouseMap={data.planet_house_map} />
                : <SouthIndianChart ascendant={data.return_ascendant} planets={returnPlanets} planetHouseMap={data.planet_house_map} />}
            </div>

            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px', fontWeight: '600' }}>
                Planetary Positions
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                      {['Planet', 'Return Sign', 'H', 'Natal Sign', 'Retro'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px',
                          color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.planets || []).map((p: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '600', cursor: 'pointer', color: 'var(--accent)', fontFamily: "'Noto Sans Devanagari', sans-serif" }} onClick={() => setSelPlanet(p.name)}>{t(p.name)}</td>
                        <td style={{ padding: '8px 12px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.sign)} {p.degree?.toFixed(1)}°</td>
                        <td style={{ padding: '8px 12px', color: 'var(--accent)', fontWeight: '600' }}>H{p.house}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text3)' }}>{p.natal_sign}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--red)', fontSize: '11px' }}>{p.retrograde ? '℞' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {selPlanet && data && (() => {
            const allPlanets = Object.fromEntries((data.planets || []).map((p: any) => [p.name, { sign: p.sign, house: p.house, degree: p.degree || 0, retrograde: p.retrograde }]))
            const pd = allPlanets[selPlanet]
            return pd ? <PlanetInterpretationDrawer planet={selPlanet} planetData={pd} allPlanets={allPlanets} onClose={() => setSelPlanet(null)} /> : null
          })()}
        </>
      )}
    </div>
  )
}
