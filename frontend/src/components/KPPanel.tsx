import NorthIndianChart from './NorthIndianChart'
import { useState, useEffect } from 'react'
import { kpApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const PLANETS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"]

interface Props { birthData: any }

export default function KPPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeHouse, setActiveHouse] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'planets' | 'cusps' | 'sigs'>('planets')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    kpApi.get({ ...birthData, ayanamsa: 'kp' })
      .then(setData).catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: '20px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Computing KP chart…')}</div>
  if (error) return <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#DC2626', fontSize: '13px' }}>{error}</div>
  if (!data) return null

  const tabs = [
    { id: 'planets' as const, label: 'Planet Sub-lords' },
    { id: 'cusps' as const, label: 'Cusp Sub-lords' },
    { id: 'sigs' as const, label: 'Significators' },
  ]

  const sigHouses = activeHouse ? [activeHouse] : Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('KP System')} — {t('Krishnamurti Paddhati')}</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.6 }}>
          Ascendant: <strong style={{ color: 'var(--text)' }}>{data.ascendant?.sign} {data.ascendant?.degree?.toFixed(2)}°</strong>
          {' · '}Nak Lord: <strong style={{ color: PLANET_COLORS[data.ascendant?.nak_lord] || 'var(--text)' }}>{data.ascendant?.nak_lord}</strong>
          {' · '}Sub Lord: <strong style={{ color: PLANET_COLORS[data.ascendant?.sub_lord] || 'var(--text)' }}>{data.ascendant?.sub_lord}</strong>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text4)', marginTop: '4px' }}>Using Krishnamurti (KP) ayanamsa. Sub-lords indicate the finer timing of events.</div>
      </div>

      {/* KP rashi kundli (chart + tables — keep both) */}
      {data.ascendant && (() => {
        const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
        const kP: Record<string, any> = {}, kMap: Record<string, string[]> = {}
        for (const [n, pd] of Object.entries<any>(data.planets || {})) {
          kP[n] = { sign: pd.sign, sign_index: pd.sign_index ?? SIGNS.indexOf(pd.sign), degree: pd.degree || 0, retrograde: pd.retrograde }
          const h = String(pd.house)
          ;(kMap[h] = kMap[h] || []).push(n)
        }
        return (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'center' }}>
            <NorthIndianChart ascendant={data.ascendant} planets={kP} planetHouseMap={kMap} size={380} title="KP" />
          </div>
        )
      })()}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer',
            background: activeTab === t.id ? 'var(--accent)' : 'transparent',
            color: activeTab === t.id ? '#fff' : 'var(--text3)',
            fontSize: '13px', fontWeight: '600', transition: 'all .15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Planet Sub-lords */}
      {activeTab === 'planets' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '2px solid var(--border)' }}>
                {['Planet', 'Sign', '°', 'House', 'Nak Lord', 'Sub Lord', 'Sub-Sub', 'Status', 'Retro'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLANETS.filter(p => data.planets?.[p]).map((p, i) => {
                const pd = data.planets[p]
                return (
                  <tr key={p} style={{ borderBottom: '1px solid var(--border)', background: i % 2 ? 'var(--surface2)' : 'transparent' }}>
                    <td style={{ padding: '8px 10px', fontWeight: '700', color: PLANET_COLORS[p] || 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(pd.sign)}</td>
                    <td style={{ padding: '8px 10px', fontVariantNumeric: 'tabular-nums' }}>{pd.degree?.toFixed(3)}</td>
                    <td style={{ padding: '8px 10px', fontWeight: '600' }}>H{pd.house}</td>
                    <td style={{ padding: '8px 10px', color: PLANET_COLORS[pd.nak_lord] || 'var(--text)', fontWeight: '600', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(pd.nak_lord)}</td>
                    <td style={{ padding: '8px 10px', color: PLANET_COLORS[pd.sub_lord] || 'var(--accent)', fontWeight: '700', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(pd.sub_lord)}</td>
                    <td style={{ padding: '8px 10px', color: PLANET_COLORS[pd.sub_sub_lord] || 'var(--text3)', fontSize: '11px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(pd.sub_sub_lord)}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {pd.status !== 'neutral' && (
                        <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '8px',
                          background: pd.status === 'exalted' ? '#16A34A22' : '#DC262622',
                          color: pd.status === 'exalted' ? '#16A34A' : '#DC2626',
                        }}>{pd.status}</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text4)' }}>{pd.retrograde ? '℞' : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cusp Sub-lords */}
      {activeTab === 'cusps' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => {
              const cusp = data.cusps?.[h]
              if (!cusp) return null
              return (
                <div key={h} style={{ background: 'var(--surface)', padding: '14px 16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text4)', marginBottom: '6px' }}>HOUSE {h}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>{cusp.sign} {cusp.longitude?.toFixed(2)}°</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Nak', val: cusp.nak_lord },
                      { label: 'Sub', val: cusp.sub_lord },
                      { label: 'S-S', val: cusp.sub_sub_lord },
                    ].map(item => (
                      <div key={item.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text4)', fontWeight: '600' }}>{item.label}</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: PLANET_COLORS[item.val] || 'var(--text)' }}>{item.val?.slice(0,2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Significators */}
      {activeTab === 'sigs' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text3)', marginRight: '4px' }}>Filter house:</span>
            {[null, ...Array.from({ length: 12 }, (_, i) => i + 1)].map(h => (
              <button key={h ?? 'all'} onClick={() => setActiveHouse(h)} style={{
                padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border)',
                background: activeHouse === h ? 'var(--accent)' : 'var(--surface2)',
                color: activeHouse === h ? '#fff' : 'var(--text3)',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer',
              }}>{h === null ? 'All' : `H${h}`}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
            {sigHouses.map(h => {
              const sigs: string[] = data.significators?.[h] || []
              return (
                <div key={h} style={{ background: 'var(--surface)', padding: '14px 16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text4)', marginBottom: '8px' }}>
                    HOUSE {h} SIGNIFICATORS
                  </div>
                  {sigs.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {sigs.map(p => (
                        <span key={p} style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                          background: (PLANET_COLORS[p] || '#888') + '18',
                          color: PLANET_COLORS[p] || 'var(--text)',
                          border: `1px solid ${(PLANET_COLORS[p] || '#888')}33`,
                          fontFamily: "'Noto Sans Devanagari', sans-serif",
                        }}>{t(p)}</span>
                      ))}
                    </div>
                  ) : <span style={{ fontSize: '11px', color: 'var(--text4)' }}>None</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* KP interpretation note */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text3)' }}>KP Method Quick Reference</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: 'var(--text3)', lineHeight: 1.6 }}>
          <div>• <strong>Nakshatra Lord:</strong> General area of result</div>
          <div>• <strong>Sub Lord:</strong> Specific result — most important</div>
          <div>• <strong>Sub-Sub Lord:</strong> Timing of result</div>
          <div>• <strong>House Significator:</strong> Planets delivering house results</div>
          <div>• If Sub Lord of cusp = significator of that house → event promised</div>
          <div>• Dasha/Bhukti of significator activates the event</div>
        </div>
      </div>
    </div>
  )
}
