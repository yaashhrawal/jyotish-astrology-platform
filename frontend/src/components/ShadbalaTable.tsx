import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { shadbaladApi } from '../api/client'
import ShadbalaRadar from './ShadbalaRadar'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#D97706', Venus: '#7C3AED', Saturn: '#2563EB',
}

export default function ShadbalaTable({ birthData }: { birthData: any }) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    shadbaladApi.compute({ ...birthData, is_day_birth: birthData.hour >= 6 && birthData.hour < 18 })
      .then(r => { setData(r.shadbala); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null)

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
      Computing Shadbala…
    </div>
  )
  if (!data) return (
    <div style={{ padding: '20px', color: 'var(--red)', fontSize: '13px' }}>
      Shadbala computation failed
    </div>
  )

  const planets = Object.entries(data)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Radar chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
          Shadbala Radar — click planet to isolate
        </div>
        <ShadbalaRadar data={data} selected={selectedPlanet} onSelect={setSelectedPlanet} />
      </div>

    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: 'var(--surface2)' }}>
            {['Planet', 'Sthana', 'Dig', 'Kala', 'Naisargika', 'Drik', 'Total (r)', 'Required', 'Status'].map(h => (
              <th key={h} style={{
                padding: '10px 14px', textAlign: 'left',
                color: 'var(--text3)', fontWeight: '500', fontSize: '11.5px',
                borderBottom: '1px solid var(--border)',
                fontFamily: "'Noto Sans Devanagari', sans-serif",
              }}>{t(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {planets.map(([name, sb]: [string, any], idx) => {
            const color = PLANET_COLORS[name] || 'var(--accent)'
            const pct = Math.min(100, (sb.total_rupas / sb.required_rupas) * 100)
            const sufficient = sb.sufficient
            return (
              <tr key={name} style={{
                borderBottom: '1px solid var(--border)',
                background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
                transition: 'background .1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'var(--surface)' : 'var(--surface2)')}
              >
                <td style={{ padding: '10px 14px', fontWeight: '700', color, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(name)}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>{sb.sthana_bala.toFixed(1)}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>{sb.dig_bala.toFixed(1)}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>{sb.kala_bala.toFixed(1)}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>{sb.naisargika_bala.toFixed(1)}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>{sb.drik_bala.toFixed(1)}</td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '60px', height: '5px', background: 'var(--surface3)',
                      borderRadius: '3px', overflow: 'hidden', flexShrink: 0,
                    }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: sufficient ? 'var(--green)' : color,
                        borderRadius: '3px', transition: 'width .3s',
                      }} />
                    </div>
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: '600', color: 'var(--text)', fontSize: '12.5px' }}>
                      {sb.total_rupas.toFixed(2)}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '10px 14px', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{sb.required_rupas}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600',
                    background: sufficient ? 'var(--green-bg)' : 'var(--red-bg)',
                    color: sufficient ? 'var(--green)' : 'var(--red)',
                    fontFamily: "'Noto Sans Devanagari', sans-serif",
                  }}>
                    {sufficient ? `✓ ${t('Strong')}` : `✗ ${t('Weak')}`}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </div>
  )
}
