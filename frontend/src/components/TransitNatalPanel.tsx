import { useState, useEffect } from 'react'
import { transitApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']

interface Props { birthData: any }

export default function TransitNatalPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [transitDate, setTransitDate] = useState(new Date().toISOString().slice(0, 10))

  const fetchData = () => {
    if (!birthData) return
    setLoading(true); setError('')
    const [ty, tm, td] = transitDate.split('-').map(Number)
    transitApi.get({
      birth_year: birthData.year, birth_month: birthData.month, birth_day: birthData.day,
      birth_hour: birthData.hour, birth_minute: birthData.minute,
      birth_tz_offset: birthData.tz_offset,
      birth_lat: birthData.latitude, birth_lon: birthData.longitude,
      ayanamsa: birthData.ayanamsa || 'lahiri',
      transit_year: ty, transit_month: tm, transit_day: td,
      transit_hour: 12, transit_minute: 0,
    })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [birthData, transitDate])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)' }}>{t('Computing transit positions…')}</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  const natal = data.natal || {}
  const transit = data.transit || {}

  // Build houses occupied by transit planets
  const houseTransitMap: Record<number, string[]> = {}
  const natalHouseMap: Record<number, string[]> = {}

  const natalAscSignIdx = Object.values(natal).length > 0 ? (Object.values(natal)[0] as any)?.sign_index ?? 0 : 0

  PLANETS.forEach(p => {
    if (transit[p]) {
      const h = ((transit[p].sign_index - natalAscSignIdx + 12) % 12) + 1
      houseTransitMap[h] = [...(houseTransitMap[h] || []), p]
    }
    if (natal[p]) {
      const h = ((natal[p].sign_index - natalAscSignIdx + 12) % 12) + 1
      natalHouseMap[h] = [...(natalHouseMap[h] || []), p]
    }
  })

  const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]
  const getHouseSign = (h: number) => SIGNS[(natalAscSignIdx + h - 1) % 12]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{t('Transit')} → {t('Natal Houses')}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{data.transit_date}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <input type="date" value={transitDate} onChange={e => setTransitDate(e.target.value)} style={{
            padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)',
            background: 'var(--surface2)', color: 'var(--text)', fontSize: 12
          }} />
        </div>
      </div>

      {/* Planet comparison table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}>Transit Planets in Natal Houses</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Planet','Transit Sign','Transit Deg','Natal Sign','Natal Deg','Transit House','(R)'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLANETS.map((p, i) => {
                const tp = transit[p]
                const np = natal[p]
                if (!tp || !np) return null
                const transitHouse = ((tp.sign_index - natalAscSignIdx + 12) % 12) + 1
                const sameSign = tp.sign === np.sign
                return (
                  <tr key={p} style={{ borderBottom: '1px solid var(--border)', background: sameSign ? 'var(--accent-bg)' : i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                    <td style={{ padding: '7px 12px', fontWeight: 700, color: PLANET_COLORS[p] }}>{t(p)}</td>
                    <td style={{ padding: '7px 12px', fontWeight: sameSign ? 700 : 400, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(tp.sign)}</td>
                    <td style={{ padding: '7px 12px', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{tp.degree?.toFixed(2)}°</td>
                    <td style={{ padding: '7px 12px', color: 'var(--text2)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(np.sign)}</td>
                    <td style={{ padding: '7px 12px', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{np.degree?.toFixed(2)}°</td>
                    <td style={{ padding: '7px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sameSign ? 'var(--accent)' : 'var(--surface2)', color: sameSign ? '#fff' : 'var(--text3)' }}>
                        H{transitHouse}
                      </span>
                    </td>
                    <td style={{ padding: '7px 12px', color: '#DC2626', fontSize: 11, fontWeight: 700 }}>{tp.retrograde ? '℞' : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Houses grid */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}>Houses — Transit Occupation</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, background: 'var(--border)' }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => {
            const tplanets = houseTransitMap[h] || []
            const nplanets = natalHouseMap[h] || []
            const hSign = getHouseSign(h)
            return (
              <div key={h} style={{ background: tplanets.length > 0 ? 'var(--accent-bg)' : 'var(--surface)', padding: '10px 12px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text4)' }}>H{h}</div>
                <div style={{ fontSize: 10, color: 'var(--text4)', marginBottom: 4 }}>{hSign}</div>
                {tplanets.length > 0 && tplanets.map(p => (
                  <div key={p} style={{ fontSize: 11, fontWeight: 700, color: PLANET_COLORS[p] }}>{t(p)}</div>
                ))}
                {nplanets.length > 0 && nplanets.map(p => (
                  <div key={'n'+p} style={{ fontSize: 10, color: PLANET_COLORS[p], opacity: 0.6 }}>{t(p)} (N)</div>
                ))}
                {tplanets.length === 0 && nplanets.length === 0 && <div style={{ fontSize: 10, color: 'var(--text4)' }}>—</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
