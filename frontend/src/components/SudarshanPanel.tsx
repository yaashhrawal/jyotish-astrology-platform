import { useState, useEffect } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const SIGN_COLORS = [
  '#DC2626','#16A34A','#0891B2','#2563EB','#D97706','#7C3AED',
  '#0891B2','#DC2626','#B45309','#57534E','#2563EB','#7C3AED',
]

function Wheel({ title, chakra, color }: { title: string; chakra: any; color: string }) {
  if (!chakra?.wheel) return null
  return (
    <div style={{ background: 'var(--surface)', border: `2px solid ${color}`, borderRadius: 12, padding: 16, flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>
        From <strong>{chakra.start_sign}</strong> — Active: <strong style={{ color }}>{chakra.active_sign} (H{chakra.active_house})</strong>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
        {chakra.wheel.map((h: any) => {
          const sc = SIGN_COLORS[h.sign ? ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].indexOf(h.sign) % 12 : 0]
          return (
            <div key={h.house} style={{
              padding: '6px 8px', borderRadius: 6, fontSize: 11, textAlign: 'center',
              background: h.active ? color + '22' : 'var(--surface2)',
              border: h.active ? `2px solid ${color}` : '1px solid var(--border)',
            }}>
              <div style={{ fontWeight: 700, color: h.active ? color : 'var(--text3)', fontSize: 10 }}>H{h.house}</div>
              <div style={{ fontWeight: 600, color: sc, fontSize: 11 }}>{h.sign?.slice(0,3)}</div>
              {h.planets?.length > 0 && (
                <div style={{ fontSize: 9, color: 'var(--text4)', marginTop: 2 }}>
                  {h.planets.map((p: string) => p.slice(0,2)).join(' ')}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface Props { birthData: any }

export default function SudarshanPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/sudarshana', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Computing Sudarshana Chakra…')}</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Sudarshana Chakra')} — {t('Three Wheels')}</div>
        <div style={{ display: 'flex', gap: 24, marginTop: 8, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text4)' }}>Age</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{data.age_years}y</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text4)' }}>Year of Life</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>#{data.current_year_of_life}</div>
          </div>
          {data.triple_activation && (
            <div style={{ padding: '8px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>⚡ Triple Activation — all 3 wheels same house</span>
            </div>
          )}
        </div>
      </div>

      {/* Three wheels */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Wheel title="Lagna Chakra" chakra={data.lagna_chakra} color="#5746AF" />
        <Wheel title="Chandra (Moon) Chakra" chakra={data.moon_chakra} color="#0891B2" />
        <Wheel title="Surya (Sun) Chakra" chakra={data.sun_chakra} color="#D97706" />
      </div>

      {/* Active signs summary */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Current Activation</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Lagna Chakra', sign: data.lagna_chakra?.active_sign, house: data.lagna_chakra?.active_house, color: '#5746AF' },
            { label: 'Moon Chakra', sign: data.moon_chakra?.active_sign, house: data.moon_chakra?.active_house, color: '#0891B2' },
            { label: 'Sun Chakra', sign: data.sun_chakra?.active_sign, house: data.sun_chakra?.active_house, color: '#D97706' },
          ].map(c => (
            <div key={c.label} style={{ padding: '10px 16px', background: c.color + '11', border: `1px solid ${c.color}`, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 600 }}>{c.label.toUpperCase()}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: c.color, marginTop: 2, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(c.sign)}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>House {c.house}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
