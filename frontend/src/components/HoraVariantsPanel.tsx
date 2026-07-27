import { useState, useEffect } from 'react'
import { horaVariantsApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E',
}
const PLANET_SYMBOLS: Record<string, string> = {
  Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋',
}

interface Props { birthData: any }

export default function HoraVariantsPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    horaVariantsApi.get(birthData)
      .then(setData)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>{t('Calculating Hora Variants…')}</div>
  if (error) return <div style={{ padding: '20px', color: 'var(--red)', fontSize: '13px' }}>{error}</div>
  if (!data) return null

  const planets = Object.entries(data.planets) as [string, any][]
  const methods: string[] = data.methods

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>{t('Hora Chart — 5 Classical Methods')}</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
          {t('Each method assigns a planetary hora lord to each planet based on its exact degree.')}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text3)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', border: '1px solid var(--border)' }}>
                {t('Planet')}
              </th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text3)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', border: '1px solid var(--border)' }}>
                {t('Sign · Degree')}
              </th>
              {methods.map(m => (
                <th key={m} style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text3)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planets.map(([planet, pdata]) => {
              const color = PLANET_COLORS[planet] || '#888'
              return (
                <tr key={planet} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', color }}>{PLANET_SYMBOLS[planet] || '✦'}</span>
                      <span style={{ fontWeight: '700', color }}>{planet}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text2)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    {pdata.sign} {pdata.degree}°
                  </td>
                  {methods.map(m => {
                    const hora = pdata.horas[m] || '—'
                    const isSun = hora.toLowerCase().includes('sun') || hora.toLowerCase().includes('leo')
                    return (
                      <td key={m} style={{
                        padding: '10px 12px', textAlign: 'center', border: '1px solid var(--border)',
                        background: isSun ? '#D9770610' : '#0891B210',
                        color: isSun ? '#D97706' : '#0891B2',
                        fontWeight: '600', fontSize: '11px',
                      }}>
                        {hora}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Method descriptions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
        {[
          { name: 'Parashari', desc: t('Odd signs: Sun first half, Moon second. Even reversed. Standard method.') },
          { name: 'Kashinatha', desc: t('Same as Parashari but dual signs split at 20° instead of 15°.') },
          { name: 'Tajika/Persian', desc: t('2.5° micro-hours cycling Sun→Moon→Mars→Mercury→Jupiter→Venus→Saturn.') },
          { name: 'Nadi (Sun-Moon-Jupiter)', desc: t('Each sign split in 3 × 10° sections: Sun, Moon, Jupiter.') },
          { name: 'BV Raman', desc: t('Parashari labels with explicit sign names (Leo/Cancer) instead of planets.') },
        ].map(m => (
          <div key={m.name} style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>{m.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: 1.5 }}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-m)', fontSize: '11.5px', color: 'var(--text3)' }}>
        ℹ {data.note}
      </div>
    </div>
  )
}
