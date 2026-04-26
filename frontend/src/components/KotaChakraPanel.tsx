import { useState, useEffect } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const NATURE_STYLE: Record<string, { bg: string; color: string }> = {
  protected: { bg: '#D1FAE5', color: '#059669' },
  neutral:   { bg: 'var(--surface2)', color: 'var(--text3)' },
  hostile:   { bg: '#FEF3C7', color: '#D97706' },
  danger:    { bg: '#FEE2E2', color: '#DC2626' },
}

interface Props { birthData: any }

export default function KotaChakraPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/kota_chakra', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Computing Kota Chakra…')}</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  const overallStyle = NATURE_STYLE[data.overall] || NATURE_STYLE.neutral

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Kota Chakra')} — {t('Fortress Wheel')}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
          Natal Moon Nakshatra: <strong style={{ color: 'var(--text)' }}>{data.natal_moon_nakshatra}</strong> ·
          Current transits mapped to 8 fort zones.
          Overall: <strong style={{ color: overallStyle.color }}>{data.overall?.toUpperCase()}</strong>
        </div>
      </div>

      {/* Score cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <div style={{ background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>PROTECTED</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{data.protection_score}</div>
          <div style={{ fontSize: 11, color: '#059669' }}>{data.protected_planets?.join(', ') || 'None'}</div>
        </div>
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#D97706' }}>HOSTILE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#D97706' }}>{data.hostility_score}</div>
          <div style={{ fontSize: 11, color: '#D97706' }}>{data.hostile_planets?.join(', ') || 'None'}</div>
        </div>
        <div style={{ background: overallStyle.bg, border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: overallStyle.color }}>OVERALL</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: overallStyle.color, marginTop: 4 }}>{data.overall?.toUpperCase()}</div>
        </div>
      </div>

      {/* Zone map */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}>Zone Map (Inner → Outer)</div>
        {data.zones_summary?.map((z: any) => {
          const ns = NATURE_STYLE[z.nature] || NATURE_STYLE.neutral
          return (
            <div key={z.zone_index} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px',
              borderBottom: '1px solid var(--border)',
              background: z.planets.length > 0 ? ns.bg + '44' : 'transparent',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ns.color, flexShrink: 0 }} />
              <div style={{ width: 160, fontSize: 12, fontWeight: 600, color: ns.color }}>{z.zone}</div>
              <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {z.planets.length > 0 ? z.planets.map((p: string) => (
                  <span key={p} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: PLANET_COLORS[p] + '22', color: PLANET_COLORS[p] || '#888', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p)}</span>
                )) : <span style={{ fontSize: 11, color: 'var(--text4)' }}>—</span>}
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: ns.bg, color: ns.color, fontWeight: 600 }}>{z.nature}</span>
            </div>
          )
        })}
      </div>

      {/* Planet detail */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}>Planet Details</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {[t('Planet'),t('Transit Sign'),t('Nakshatra'),t('Zone'),t('Effect')].map(h => (
                <th key={h} style={{ padding: '7px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.planet_zones?.map((p: any, i: number) => {
              const ns = NATURE_STYLE[p.nature] || NATURE_STYLE.neutral
              return (
                <tr key={p.planet} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                  <td style={{ padding: '7px 14px', fontWeight: 700, color: PLANET_COLORS[p.planet] || 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.planet)}</td>
                  <td style={{ padding: '7px 14px', color: 'var(--text2)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.transit_sign)}</td>
                  <td style={{ padding: '7px 14px', color: 'var(--text3)', fontSize: 11 }}>{p.transit_nakshatra}</td>
                  <td style={{ padding: '7px 14px', fontSize: 11 }}>{p.zone}</td>
                  <td style={{ padding: '7px 14px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: ns.bg, color: ns.color }}>{p.nature}</span>
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
