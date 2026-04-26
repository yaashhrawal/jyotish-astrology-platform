import PlanetInterpretationDrawer from './PlanetInterpretation'
import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { aspectsApi } from '../api/client'
import AspectWheel from './AspectWheel'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const PLANETS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"]

const ASPECT_COLOR: Record<string, string> = {
  'Conjunction': '#D97706', 'Trine': '#16A34A', 'Sextile': '#0891B2',
  'Square': '#DC2626', 'Opposition': '#7C3AED', 'Quincunx': '#57534E', 'Semi-Sextile': '#A8A29E',
}

const STRENGTH_COLOR = (s: number) => s >= 0.75 ? '#16A34A' : s >= 0.4 ? '#D97706' : '#DC2626'

interface Props { birthData: any }

function PlanetChip({ planet }: { planet: string }) {
  const c = PLANET_COLORS[planet] || '#888'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px',
      background: c + '18', color: c, fontSize: '11px', fontWeight: '700', border: `1px solid ${c}33` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, display: 'inline-block' }} />
      {planet}
    </span>
  )
}

export default function AspectsPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'wheel' | 'grid' | 'parashari' | 'western'>('wheel')
  const [selPlanet, setSelPlanet] = useState<string | null>(null)

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    aspectsApi.get(birthData)
      .then(setData).catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: '20px', color: 'var(--text3)' }}>Computing aspects…</div>
  if (error) return <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#DC2626', fontSize: '13px' }}>{error}</div>
  if (!data) return null

  const tabs = [
    { id: 'wheel' as const,     label: '◎ Wheel' },
    { id: 'grid' as const,      label: t('Aspect Matrix') },
    { id: 'parashari' as const, label: t('Parashari Aspects') },
    { id: 'western' as const,   label: t('Western Aspects') },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer',
            background: view === t.id ? 'var(--accent)' : 'transparent',
            color: view === t.id ? '#fff' : 'var(--text3)',
            fontSize: '13px', fontWeight: '600', transition: 'all .15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Aspect Wheel */}
      {view === 'wheel' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px' }}>
            Aspect Web — toggle Parashari / Western below
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(['parashari', 'western'] as const).map(m => (
              <button key={m} onClick={() => setView(m)}
                style={{ padding: '4px 14px', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: 'transparent', color: 'var(--text3)' }}>
                Show {m === 'parashari' ? 'Parashari' : 'Western'} wheel
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text4)', textAlign: 'center', marginBottom: '8px', fontWeight: '600' }}>PARASHARI</div>
              <AspectWheel mode="parashari" parashariAspects={data.parashari_aspects || []} planetLongitudes={data.planet_longitudes} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text4)', textAlign: 'center', marginBottom: '8px', fontWeight: '600' }}>WESTERN</div>
              <AspectWheel mode="western" westernAspects={data.western_aspects || []} planetLongitudes={data.planet_longitudes} />
            </div>
          </div>
        </div>
      )}

      {/* Aspect Matrix */}
      {view === 'grid' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text4)', minWidth: 100, borderBottom: '2px solid var(--border)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {t('Planet')} ↓ / ↗
                  </th>
                  {PLANETS.map(p => (
                    <th key={p} style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '2px solid var(--border)', minWidth: 72 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: PLANET_COLORS[p] || '#888', display: 'inline-block' }} />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: PLANET_COLORS[p] || 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p).slice(0, 3)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLANETS.map((rowP, ri) => {
                  return (
                    <tr key={rowP} style={{ borderBottom: '1px solid var(--border)', background: ri % 2 === 0 ? 'transparent' : 'var(--surface2)' }}>
                      <td style={{ padding: '8px 14px', fontWeight: '700', color: PLANET_COLORS[rowP] || 'var(--text)', whiteSpace: 'nowrap', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: PLANET_COLORS[rowP] || '#888', display: 'inline-block', flexShrink: 0 }} />
                          {t(rowP)}
                        </div>
                      </td>
                      {PLANETS.map(colP => {
                        if (rowP === colP) {
                          return <td key={colP} style={{ textAlign: 'center', background: 'var(--border)', width: 72 }} />
                        }
                        // Check if rowP aspects colP (parashari)
                        const rowAspects = data.parashari_aspects?.filter((a: any) => a.aspector === rowP && a.aspected_planets?.includes(colP)) || []
                        // Check western
                        const westernAsp = data.longitude_aspects?.find((a: any) =>
                          (a.planet1 === rowP && a.planet2 === colP) || (a.planet1 === colP && a.planet2 === rowP))

                        if (rowAspects.length > 0) {
                          const asp = rowAspects[0]
                          const full = asp.full_aspect
                          const c = full ? '#16A34A' : '#D97706'
                          return (
                            <td key={colP} style={{ textAlign: 'center', padding: '4px' }}>
                              <div title={`${rowP} ${asp.aspect_type} on ${colP} (${full ? 'Full' : 'Partial'} aspect, ${Math.round(asp.strength * 100)}% strength)`}
                                style={{ padding: '3px 5px', borderRadius: '5px', background: c + '18', color: c, fontSize: '10px', fontWeight: '700', border: `1px solid ${c}33`, cursor: 'default' }}>
                                {full ? '●' : '◐'}
                                <div style={{ fontSize: '8px', opacity: 0.7 }}>{asp.aspect_type.replace('th house', 'H')}</div>
                              </div>
                            </td>
                          )
                        }
                        if (westernAsp) {
                          const c = ASPECT_COLOR[westernAsp.aspect] || '#888'
                          return (
                            <td key={colP} style={{ textAlign: 'center', padding: '4px' }}>
                              <div title={`${westernAsp.aspect} ${westernAsp.actual_diff}° (orb ${westernAsp.orb}°)`}
                                style={{ padding: '3px 5px', borderRadius: '5px', background: c + '12', color: c, fontSize: '9px', fontWeight: '600', border: `1px solid ${c}22`, cursor: 'default' }}>
                                {westernAsp.aspect.slice(0, 3)}
                                <div style={{ fontSize: '7px', opacity: 0.7 }}>{westernAsp.orb}°</div>
                              </div>
                            </td>
                          )
                        }
                        return <td key={colP} style={{ textAlign: 'center', color: 'var(--text4)', fontSize: '10px' }}>–</td>
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '10.5px', color: 'var(--text4)' }}>
            <span><span style={{ color: '#16A34A', fontWeight: '700' }}>●</span> Full Parashari aspect</span>
            <span><span style={{ color: '#D97706', fontWeight: '700' }}>◐</span> Partial Parashari aspect</span>
            <span style={{ color: '#0891B2' }}>Tri</span> Trine · <span style={{ color: '#DC2626' }}>Squ</span> Square · <span style={{ color: '#7C3AED' }}>Opp</span> Opposition
          </div>
        </div>
      )}

      {/* Parashari aspects list */}
      {view === 'parashari' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: '700', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            {t('Parashari Special Aspects')} — {t('House-based')}
          </div>
          {data.parashari_aspects?.filter((a: any) => a.aspected_planets?.length > 0).map((a: any, i: number) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px',
              borderBottom: '1px solid var(--border)',
              background: a.full_aspect ? 'var(--accent-bg)' : 'transparent',
            }}>
              <PlanetChip planet={a.aspector} />
              <div style={{ fontSize: '11px', color: 'var(--text3)', minWidth: 90, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t(a.aspect_type)} → H{a.target_house}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text2)', flex: 1, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t(a.target_sign)}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {a.aspected_planets.map((p: string) => <PlanetChip key={p} planet={p} />)}
              </div>
              <div style={{ fontSize: '11px', color: STRENGTH_COLOR(a.strength), fontWeight: '700', minWidth: 40, textAlign: 'right' }}>
                {Math.round(a.strength * 100)}%
              </div>
              {a.full_aspect && <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', background: '#16A34A18', color: '#16A34A', border: '1px solid #16A34A33' }}>Full</span>}
            </div>
          ))}
          {data.mutual_aspects?.length > 0 && (
            <div style={{ padding: '12px 18px', background: 'var(--surface2)', borderTop: '2px solid var(--border)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Mutual Aspects')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {data.mutual_aspects.map((m: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <PlanetChip planet={m.planet1} />
                    <span style={{ fontSize: '10px', color: 'var(--text4)' }}>↔</span>
                    <PlanetChip planet={m.planet2} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Western aspects list */}
      {view === 'western' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: '700', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            {t('Longitude-based Aspects (8° orb)')}
          </div>
          {data.longitude_aspects?.sort((a: any, b: any) => b.strength - a.strength).map((a: any, i: number) => {
            const c = ASPECT_COLOR[a.aspect] || '#888'
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                <PlanetChip planet={a.planet1} />
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: c + '18', color: c, border: `1px solid ${c}33`, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t(a.aspect)}
                </span>
                <PlanetChip planet={a.planet2} />
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text4)', fontVariantNumeric: 'tabular-nums' }}>
                    {a.actual_diff}° · orb {a.orb}°
                  </span>
                  <div style={{ width: 40, height: 5, borderRadius: '3px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ width: `${a.strength * 100}%`, height: '100%', background: c, borderRadius: '3px' }} />
                  </div>
                  {a.applying && <span style={{ fontSize: '9px', fontWeight: '700', color: '#16A34A', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Applying')}</span>}
                </div>
              </div>
            )
          })}
          {(!data.longitude_aspects?.length) && (
            <div style={{ padding: '20px 18px', color: 'var(--text3)', fontSize: '12.5px' }}>No aspects within 8° orb.</div>
          )}
        </div>
      )}

      {/* Planet aspect summary */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: '700', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
          {t('Planet Aspect Summary')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
          {PLANETS.map(p => {
            const pa = data.planet_aspects?.[p]
            if (!pa) return null
            const aspectedBy = pa.aspected_by || []
            const aspectsTo = pa.aspects_to || []
            return (
              <div key={p} style={{ background: 'var(--surface)', padding: '12px 14px', cursor: 'pointer' }} onClick={() => setSelPlanet(p)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PLANET_COLORS[p] || '#888', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontWeight: '700', fontSize: '12px', color: PLANET_COLORS[p] || 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p)}</span>
                </div>
                {aspectedBy.length > 0 && (
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: '700', color: 'var(--text4)', marginBottom: '3px' }}>ASPECTED BY</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {aspectedBy.map((a: string) => (
                        <span key={a} style={{ fontSize: '9.5px', fontWeight: '700', padding: '1px 5px', borderRadius: '6px',
                          background: (PLANET_COLORS[a] || '#888') + '18', color: PLANET_COLORS[a] || 'var(--text3)' }}>{a.slice(0,2)}</span>
                      ))}
                    </div>
                  </div>
                )}
                {aspectsTo.length > 0 && (
                  <div>
                    <div style={{ fontSize: '9.5px', fontWeight: '700', color: 'var(--text4)', marginBottom: '3px' }}>ASPECTS</div>
                    {aspectsTo.map((at: any, j: number) => (
                      <div key={j} style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '2px' }}>
                        H{at.house} ({at.sign?.slice(0, 3)})
                        {at.planets?.length > 0 && <span style={{ color: '#D97706' }}> → {at.planets.join(', ')}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {selPlanet && data?.planet_aspects && (() => {
        const pa = data.planet_aspects[selPlanet]
        if (!pa) return null
        const allPlanets: Record<string, any> = {}
        PLANETS.forEach(p => { if (data.planet_aspects?.[p]) allPlanets[p] = { sign: data.planet_aspects[p].sign || '', house: data.planet_aspects[p].house || 0, degree: 0 } })
        return <PlanetInterpretationDrawer planet={selPlanet} planetData={{ sign: pa.sign || '', house: pa.house || 0, degree: 0 }} allPlanets={allPlanets} onClose={() => setSelPlanet(null)} />
      })()}
    </div>
  )
}
