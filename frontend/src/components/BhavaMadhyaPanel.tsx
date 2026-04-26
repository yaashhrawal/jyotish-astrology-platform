import { useState, useEffect } from 'react'
import { apiPost } from '../api/client'
import NorthIndianChart from './NorthIndianChart'
import SouthIndianChart from './SouthIndianChart'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

function downloadCSV(data: any) {
  const rows = [
    ['Planet','Sign','Degree','Longitude','Nakshatra','Nak Lord','Pada','House','Retrograde','Status'],
    ...(data.planets || []).map((p: any) => [
      p.planet, p.sign, p.degree, p.longitude, p.nakshatra,
      p.nakshatra_lord, p.pada, p.house, p.retrograde, p.status
    ])
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'planets.csv'; a.click()
  URL.revokeObjectURL(url)
}

function downloadMadhyaCSV(data: any) {
  const rows = [
    ['House','Cusp Start','Cusp End','Madhya Lon','Madhya Sign','Madhya Degree'],
    ...(data.bhava_madhya || []).map((h: any) => [
      h.house, h.cusp_start, h.cusp_end, h.madhya_longitude, h.madhya_sign, h.madhya_degree
    ])
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'bhava_madhya.csv'; a.click()
  URL.revokeObjectURL(url)
}

interface Props { birthData: any }

export default function BhavaMadhyaPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [chartStyle, setChartStyle] = useState<'north' | 'south'>('north')
  const [showMadhya, setShowMadhya] = useState(false)

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/bhava_madhya', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)' }}>Computing Bhava Madhya…</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header + Export */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Bhava Madhya — House Midpoints + Export</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            Ascendant: <strong>{data.ascendant?.sign}</strong> {data.ascendant?.degree?.toFixed(2)}°
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => downloadCSV(data)} style={{
            padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--text)', fontSize: 12, cursor: 'pointer', fontWeight: 600,
          }}>↓ Planets CSV</button>
          <button onClick={() => downloadMadhyaCSV(data)} style={{
            padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--text)', fontSize: 12, cursor: 'pointer', fontWeight: 600,
          }}>↓ Madhya CSV</button>
        </div>
      </div>

      {/* Chart with midpoints overlay */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Chart with Bhava Madhya</div>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', marginLeft: 'auto' }}>
            {(['north', 'south'] as const).map(s => (
              <button key={s} onClick={() => setChartStyle(s)} style={{
                padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: chartStyle === s ? 'var(--accent)' : 'var(--surface2)',
                color: chartStyle === s ? '#fff' : 'var(--text3)',
              }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: 11, cursor: 'pointer', color: 'var(--text3)' }}>
            <input type="checkbox" checked={showMadhya} onChange={e => setShowMadhya(e.target.checked)} />
            Show ◆ midpoints
          </label>
        </div>
        {(() => {
          const planets = Object.fromEntries((data.planets || []).map((p: any) => [p.planet, { sign: p.sign, house: p.house, degree: p.degree, retrograde: p.retrograde, status: p.status, nakshatra: p.nakshatra, nakshatra_lord: p.nakshatra_lord, pada: p.pada }]))
          const planetHouseMap: Record<string, string[]> = {}
          ;(data.planets || []).forEach((p: any) => {
            if (!planetHouseMap[p.house]) planetHouseMap[p.house] = []
            planetHouseMap[p.house].push(p.planet)
          })
          return chartStyle === 'north'
            ? <NorthIndianChart ascendant={data.ascendant} planets={planets} planetHouseMap={planetHouseMap} bhavaMadhya={showMadhya ? data.bhava_madhya : undefined} />
            : <SouthIndianChart ascendant={data.ascendant} planets={planets} planetHouseMap={planetHouseMap} />
        })()}
        <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 8 }}>◆ = Bhava Madhya (house midpoint in purple)</div>
      </div>

      {/* Madhya table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}>Bhava Madhya (House Midpoints)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 1, background: 'var(--border)' }}>
          {data.bhava_madhya?.map((h: any) => (
            <div key={h.house} style={{ background: 'var(--surface)', padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text4)' }}>H{h.house}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>{h.madhya_sign?.slice(0,3)}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{h.madhya_degree?.toFixed(1)}°</div>
              <div style={{ fontSize: 9, color: 'var(--text4)', marginTop: 2 }}>{h.madhya_longitude?.toFixed(2)}°</div>
            </div>
          ))}
        </div>
      </div>

      {/* Planet table with full data */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}>Planet Data</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Planet','Sign','°','Longitude','Nakshatra','Lord','Pada','House','Status'].map(h => (
                <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', borderBottom: '1px solid var(--border)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.planets?.map((p: any, i: number) => (
              <tr key={p.planet} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                <td style={{ padding: '7px 12px', fontWeight: 700, color: PLANET_COLORS[p.planet] || 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t(p.planet)}{p.retrograde ? <span style={{ color: 'var(--red)', fontSize: 9 }}>({t('retrograde').slice(0,2)})</span> : ''}
                </td>
                <td style={{ padding: '7px 12px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.sign)}</td>
                <td style={{ padding: '7px 12px', fontVariantNumeric: 'tabular-nums', color: 'var(--text2)' }}>{p.degree?.toFixed(2)}</td>
                <td style={{ padding: '7px 12px', fontVariantNumeric: 'tabular-nums', color: 'var(--text3)', fontSize: 11 }}>{p.longitude?.toFixed(4)}</td>
                <td style={{ padding: '7px 12px', color: 'var(--text2)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.nakshatra)}</td>
                <td style={{ padding: '7px 12px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.nakshatra_lord)}</td>
                <td style={{ padding: '7px 12px', color: 'var(--text3)' }}>{p.pada}</td>
                <td style={{ padding: '7px 12px', fontWeight: 700, color: 'var(--accent)' }}>H{p.house}</td>
                <td style={{ padding: '7px 12px' }}>
                  {p.status && p.status !== 'neutral'
                    ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                        background: p.status === 'exalted' ? '#D1FAE5' : p.status === 'debilitated' ? '#FEE2E2' : '#EDE9FE',
                        color: p.status === 'exalted' ? '#059669' : p.status === 'debilitated' ? '#DC2626' : '#7C3AED',
                        fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                        {t(p.status)}
                      </span>
                    : <span style={{ color: 'var(--text4)' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
