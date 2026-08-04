import { useState, useEffect } from 'react'
import { sarvatobhadraApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const TARA_COLOR: Record<string, string> = {
  good: '#16A34A', bad: '#DC2626', mixed: '#D97706'
}

const NAKSHATRA_ABBR = [
  "Asw","Bha","Kri","Roh","Mri","Ard","Pun","Pus","Ash",
  "Mag","PPh","UPh","Has","Chi","Swa","Vis","Anu","Jye",
  "Mul","PAs","UAs","Shr","Dha","Sha","PBh","UBh","Rev","Abh"
]

interface Props { birthData: any }

function PlanetDot({ planet, size = 8 }: { planet: string; size?: number }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: PLANET_COLORS[planet] || '#888', marginRight: 3, flexShrink: 0 }} />
}

export default function SarvatobhadraPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    sarvatobhadraApi.get(birthData)
      .then(setData).catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: '20px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Computing Sarvatobhadra Chakra…')}</div>
  if (error) return <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#DC2626', fontSize: '13px' }}>{error}</div>
  if (!data) return null

  // Build 9x9 grid lookup
  const cellMap: Record<string, { natal: string[]; transit: string[] }> = {}
  for (const cell of (data.grid || [])) {
    cellMap[`${cell.row},${cell.col}`] = { natal: cell.natal_planets || [], transit: cell.transit_planets || [] }
  }

  // Nakshatra positions in grid (same as backend SBC layout)
  const NAK_POSITIONS: [number, number][] = [
    [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],  // N: 0-6
    [1,8],[2,8],[3,8],[4,8],[5,8],[6,8],[7,8],  // E: 7-13
    [8,7],[8,6],[8,5],[8,4],[8,3],[8,2],[8,1],  // S: 14-20
    [7,0],[6,0],[5,0],[4,0],[3,0],[2,0],        // W: 21-26
    [0,0],                                       // Abhijit: 27
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Sarvatobhadra Chakra')} (SBC)</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5 }}>
          Moon in <strong style={{ color: 'var(--text)' }}>{data.moon_nakshatra}</strong>.
          9×9 grid showing natal (filled) and current transit (outlined) planets in nakshatra cells.
          Used for vedha (obstruction) analysis and transit quality.
        </div>
      </div>

      <div className="jyo-sbc-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px' }}>
        {/* SBC Grid */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', overflow: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', marginBottom: '10px' }}>Sarvatobhadra Chakra</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)',
            border: '2px solid var(--border)', borderRadius: '4px', overflow: 'hidden',
            minWidth: '360px',
          }}>
            {Array.from({ length: 81 }, (_, idx) => {
              const row = Math.floor(idx / 9)
              const col = idx % 9
              const isBrahma = row === 4 && col === 4
              const isInner = row >= 1 && row <= 7 && col >= 1 && col <= 7 && !isBrahma
              const cell = cellMap[`${row},${col}`] || { natal: [], transit: [] }

              // Find nakshatra for this cell
              let nakIdx = -1
              for (let n = 0; n < NAK_POSITIONS.length; n++) {
                if (NAK_POSITIONS[n][0] === row && NAK_POSITIONS[n][1] === col) {
                  nakIdx = n; break
                }
              }

              const isMoonNak = nakIdx === data.moon_nak_index
              const hasVedha = data.vedha?.some((v: any) =>
                data.natal_planets?.find((p: any) => p.planet === v.natal_planet && p.sbc_row === row && p.sbc_col === col)
              )

              return (
                <div key={idx} style={{
                  minHeight: 44, padding: '3px', fontSize: '9px',
                  border: '1px solid var(--border)',
                  background: isBrahma ? 'var(--accent)' : isMoonNak ? '#0891B218' : isInner ? 'var(--surface2)' : 'var(--surface)',
                  position: 'relative',
                  outline: hasVedha ? '2px solid #DC2626' : 'none',
                  outlineOffset: '-2px',
                }}>
                  {isBrahma && (
                    <div style={{ textAlign: 'center', color: '#fff', fontWeight: '800', fontSize: '8px', marginTop: 4 }}>ॐ<br/>Brahma</div>
                  )}
                  {nakIdx >= 0 && (
                    <div style={{ fontSize: '7px', fontWeight: '700', color: isMoonNak ? '#0891B2' : 'var(--text4)', marginBottom: '2px' }}>
                      {NAKSHATRA_ABBR[nakIdx] || ''}
                    </div>
                  )}
                  {/* Natal planets */}
                  {cell.natal.map(p => (
                    <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '1px' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: PLANET_COLORS[p] || '#888', display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: '7.5px', fontWeight: '700', color: PLANET_COLORS[p] || 'var(--text)' }}>{p.slice(0,2)}</span>
                    </div>
                  ))}
                  {/* Transit planets */}
                  {cell.transit.map(p => (
                    <div key={'t'+p} style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '1px', opacity: 0.7 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'transparent', border: `1.5px solid ${PLANET_COLORS[p] || '#888'}`, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: '7.5px', color: PLANET_COLORS[p] || 'var(--text3)' }}>{p.slice(0,2)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '10.5px', color: 'var(--text4)' }}>
            <span><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#888', marginRight: 3 }} />Natal</span>
            <span><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', border: '1.5px solid #888', marginRight: 3 }} />Transit</span>
            <span style={{ color: '#0891B2' }}>■ Moon Nak</span>
            <span style={{ color: '#DC2626' }}>■ Vedha</span>
          </div>
        </div>

        {/* Right panel: Vedha + Tara */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Vedha */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '10px' }}>⚡ Vedha (Obstruction)</div>
            {data.vedha?.length ? data.vedha.map((v: any, i: number) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FCA5A5', marginBottom: '6px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#DC2626' }}>
                  <PlanetDot planet={v.natal_planet} />{v.natal_planet}
                  <span style={{ fontSize: '10px', color: '#888', fontWeight: '400', marginLeft: 4 }}>({v.natal_nakshatra})</span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#666', marginTop: '3px' }}>
                  Obstructed by transit <strong style={{ color: PLANET_COLORS[v.transit_planet] || '#333' }}>{v.transit_planet}</strong>
                  {' '}in {v.transit_nakshatra}
                </div>
              </div>
            )) : (
              <div style={{ fontSize: '12px', color: '#16A34A', padding: '10px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                ✓ No vedha — transits clear
              </div>
            )}
          </div>

          {/* Moon Tara */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '10px' }}>
              ☽ Moon Tara — Transit Quality
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text4)', marginBottom: '8px' }}>
              Moon in <strong style={{ color: '#0891B2' }}>{data.moon_nakshatra}</strong>
            </div>
            {data.moon_taras?.map((tara: any, i: number) => {
              const c = TARA_COLOR[tara.nature] || '#888'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: i < data.moon_taras.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <PlanetDot planet={tara.planet} />
                  <span style={{ fontSize: '11px', fontWeight: '600', color: PLANET_COLORS[tara.planet] || 'var(--text)', minWidth: 52, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(tara.planet)}</span>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '20px', background: c + '18', color: c, border: `1px solid ${c}33` }}>
                    {tara.tara}
                  </span>
                  <span style={{ fontSize: '9.5px', color: 'var(--text4)', marginLeft: 'auto' }}>{tara.nakshatra?.slice(0,8)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
