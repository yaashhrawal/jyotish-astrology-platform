import { useEffect, useState } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'
import NorthIndianChart from './NorthIndianChart'
import SouthIndianChart from './SouthIndianChart'
import type { Planet } from '../api/jyotish'
import PlanetInterpretationDrawer from './PlanetInterpretation'

interface VargaData {
  d: number; name: string; domain: string
  ascendant: { sign: string; sign_index: number; degree: number }
  planets: Record<string, Planet>
  planet_house_map: Record<string, string[]>
  vargottama: string[]
}

interface Props {
  birthData: {
    year: number; month: number; day: number
    hour: number; minute: number; tz_offset: number
    latitude: number; longitude: number; ayanamsa: string
  }
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const VARGAS = [
  { d: 1,  label: 'D1',  name: 'Rashi',             domain: 'Physical self, overall life' },
  { d: 2,  label: 'D2',  name: 'Hora',               domain: 'Wealth & finances' },
  { d: 3,  label: 'D3',  name: 'Drekkana',           domain: 'Siblings, courage' },
  { d: 4,  label: 'D4',  name: 'Chaturthamsha',      domain: 'Property, fixed assets' },
  { d: 7,  label: 'D7',  name: 'Saptamsha',          domain: 'Children, progeny' },
  { d: 9,  label: 'D9',  name: 'Navamsha',           domain: 'Spouse, dharma, soul' },
  { d: 10, label: 'D10', name: 'Dashamsha',          domain: 'Career, profession' },
  { d: 12, label: 'D12', name: 'Dwadashamsha',       domain: 'Parents, ancestry' },
  { d: 16, label: 'D16', name: 'Shodashamsha',       domain: 'Vehicles, comforts' },
  { d: 20, label: 'D20', name: 'Vimshamsha',         domain: 'Spiritual progress' },
  { d: 24, label: 'D24', name: 'Chaturvimshamsha',   domain: 'Education, learning' },
  { d: 27, label: 'D27', name: 'Bhamsha',            domain: 'Strength, vitality' },
  { d: 30, label: 'D30', name: 'Trimshamsha',        domain: 'Misfortunes, evils' },
  { d: 40, label: 'D40', name: 'Khavedamsha',        domain: 'Maternal legacy' },
  { d: 45, label: 'D45', name: 'Akshavedamsha',      domain: 'Paternal legacy' },
  { d: 60, label: 'D60', name: 'Shashtyamsha',       domain: 'Past karma, precise timing' },
  { d: 81, label: 'D81', name: 'Navamsha-Navamsha',  domain: 'D9 of D9 — very deep soul' },
  { d: 108, label: 'D108', name: 'Ashtottaramsha',   domain: 'D12 of D9 — ancestors & dharma' },
  { d: 144, label: 'D144', name: 'Dwad-Dwad',        domain: 'D12 of D12 — deepest lineage' },
]

// Classical house significations for interpretation
const HOUSE_SIGNIFICATIONS: Record<number, string> = {
  1: 'Self, body, personality', 2: 'Wealth, speech, family',
  3: 'Siblings, courage, efforts', 4: 'Mother, home, peace of mind',
  5: 'Children, intellect, past merit', 6: 'Enemies, debts, disease',
  7: 'Spouse, partnerships, business', 8: 'Longevity, transformation, hidden',
  9: 'Dharma, luck, father', 10: 'Career, status, authority',
  11: 'Gains, income, fulfillment', 12: 'Loss, liberation, foreign'
}

const EXALTATION: Record<string, string> = {
  Sun: 'Aries', Moon: 'Taurus', Mars: 'Capricorn', Mercury: 'Virgo',
  Jupiter: 'Cancer', Venus: 'Pisces', Saturn: 'Libra'
}
const DEBILITATION: Record<string, string> = {
  Sun: 'Libra', Moon: 'Scorpio', Mars: 'Cancer', Mercury: 'Pisces',
  Jupiter: 'Capricorn', Venus: 'Virgo', Saturn: 'Aries'
}

function getPlanetStatus(planet: string, sign: string): 'exalted' | 'debilitated' | 'neutral' {
  if (EXALTATION[planet] === sign) return 'exalted'
  if (DEBILITATION[planet] === sign) return 'debilitated'
  return 'neutral'
}

function HouseAnalysis({ varga, d }: { varga: VargaData; d: number }) {
  const [selHouse, setSelHouse] = useState<number | null>(null)

  const planetsInHouse = (h: number) =>
    Object.entries(varga.planets).filter(([, p]) => p.house === h)

  const importantHouses = d === 9  ? [1, 7, 5, 9] :
                          d === 10 ? [1, 10, 6, 11] :
                          d === 7  ? [1, 5, 9] :
                          d === 4  ? [1, 4] :
                          d === 2  ? [1, 2, 11] :
                          [1, 5, 9]

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
        House Analysis — {varga.name}
      </div>

      {/* Key houses for this varga */}
      <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginBottom: '10px' }}>
        Key houses for {varga.domain}: <strong style={{ color: 'var(--accent)' }}>H{importantHouses.join(', H')}</strong>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => {
          const planets = planetsInHouse(h)
          const isKey = importantHouses.includes(h)
          const isSelected = selHouse === h
          if (planets.length === 0 && !isKey) return null

          return (
            <div key={h} onClick={() => setSelHouse(isSelected ? null : h)}
              style={{
                padding: '7px 10px', borderRadius: '8px', cursor: 'pointer',
                background: isSelected ? 'var(--accent-bg)' : isKey ? 'var(--surface2)' : 'transparent',
                border: `1px solid ${isSelected ? 'var(--accent)' : isKey ? 'var(--border)' : 'transparent'}`,
                transition: 'all .12s',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: '700', width: '22px',
                  color: isKey ? 'var(--accent)' : 'var(--text3)',
                }}>H{h}</span>
                <span style={{ fontSize: '11px', color: 'var(--text3)', flex: 1 }}>{HOUSE_SIGNIFICATIONS[h]}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {planets.map(([name, p]) => {
                    const st = getPlanetStatus(name, p.sign)
                    return (
                      <span key={name} style={{
                        fontSize: '10.5px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px',
                        color: PLANET_COLORS[name] || 'var(--text)',
                        background: (PLANET_COLORS[name] || '#666') + '18',
                        border: `1px solid ${(PLANET_COLORS[name] || '#666')}30`,
                      }}>
                        {name.slice(0, 2)}{(p as any).retrograde ? '®' : ''}{st === 'exalted' ? '↑' : st === 'debilitated' ? '↓' : ''}
                      </span>
                    )
                  })}
                </div>
              </div>
              {isSelected && planets.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  {planets.map(([name, p]) => {
                    const st = getPlanetStatus(name, p.sign)
                    return (
                      <div key={name} style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.7 }}>
                        <strong style={{ color: PLANET_COLORS[name] }}>{name}</strong> in {p.sign}
                        {st !== 'neutral' && <span style={{ color: st === 'exalted' ? 'var(--green)' : 'var(--red)', marginLeft: '4px' }}>{st === 'exalted' ? '↑ Exalted' : '↓ Debilitated'}</span>}
                        {(p as any).retrograde && <span style={{ color: 'var(--red)', marginLeft: '4px' }}>® Retrograde</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function VargaCharts({ birthData }: Props) {
  const { t } = useLang()
  const [selectedD, setSelectedD] = useState(9)
  const [varga, setVarga] = useState<VargaData | null>(null)
  const [loading, setLoading] = useState(false)
  const [chartStyle, setChartStyle] = useState<'north' | 'south'>('north')
  const [selPlanet, setSelPlanet] = useState<string | null>(null)

  const fetchVarga = (d: number) => {
    setLoading(true); setSelectedD(d)
    apiPost('/api/calc/varga', { ...birthData, d })
      .then((r: any) => setVarga(r))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchVarga(9) }, [])

  const info = VARGAS.find(v => v.d === selectedD)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Varga selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {VARGAS.map(v => (
          <button key={v.d} onClick={() => fetchVarga(v.d)} title={v.domain} style={{
            padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', border: 'none',
            background: selectedD === v.d ? 'var(--accent)' : 'var(--surface2)',
            color: selectedD === v.d ? '#fff' : 'var(--text3)',
            fontSize: '12px', fontWeight: selectedD === v.d ? '700' : '500',
            transition: 'all .15s', textAlign: 'center',
            boxShadow: selectedD === v.d ? '0 2px 8px rgba(87,70,175,.25)' : 'none',
          }}>
            <div style={{ fontWeight: '700' }}>{v.label}</div>
            <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '1px' }}>{v.domain.split(',')[0]}</div>
          </button>
        ))}
      </div>

      {/* Chart style toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600' }}>Style:</span>
        {(['north', 'south'] as const).map(s => (
          <button key={s} onClick={() => setChartStyle(s)} style={{
            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
            border: chartStyle === s ? 'none' : '1px solid var(--border)',
            background: chartStyle === s ? 'var(--accent)' : 'transparent',
            color: chartStyle === s ? '#fff' : 'var(--text3)', fontWeight: '600',
          }}>{s === 'north' ? 'North Indian' : 'South Indian'}</button>
        ))}
      </div>

      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
          {t('Calculating')} {info?.name || `D${selectedD}`}…
        </div>
      )}

      {!loading && varga && (
        <>
          {/* Header */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)' }}>
                  {varga.d === 1 ? 'D1' : `D${varga.d}`} — {varga.name}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text3)', marginTop: '3px' }}>
                  {varga.domain} · <strong style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(varga.ascendant.sign)}</strong> {t('Ascendant')} {varga.ascendant.degree.toFixed(1)}°
                </div>
              </div>
              {varga.vargottama?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gold)' }}>◈ Vargottama:</span>
                  {varga.vargottama.map(p => (
                    <span key={p} style={{
                      fontSize: '11.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px',
                      background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid #FDE68A',
                    }}>{p}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chart + analysis */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Chart */}
            {chartStyle === 'north' ? (
              <NorthIndianChart
                ascendant={varga.ascendant} planets={varga.planets}
                planetHouseMap={varga.planet_house_map} size={400}
                title={`${info?.label} ${varga.name?.toUpperCase()}`}
              />
            ) : (
              <SouthIndianChart
                ascendant={varga.ascendant} planets={varga.planets}
                planetHouseMap={varga.planet_house_map} size={400}
                title={`${info?.label} ${varga.name?.toUpperCase()}`}
              />
            )}

            {/* Right column */}
            <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Planet positions */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Planets</div>
                {Object.entries(varga.planets).map(([name, p]) => {
                  const isVarg = varga.vargottama?.includes(name)
                  const st = getPlanetStatus(name, p.sign)
                  return (
                    <div key={name} onClick={() => setSelPlanet(name)} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 4px', borderBottom: '1px solid var(--border)',
                      cursor: 'pointer', borderRadius: '4px', transition: 'background .1s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PLANET_COLORS[name] || 'var(--text3)', flexShrink: 0, display: 'block' }} />
                      <span style={{ fontSize: '12.5px', fontWeight: '600', color: PLANET_COLORS[name], width: '62px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(name)}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text2)', flex: 1 }}>{p.sign}</span>
                      <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600' }}>H{p.house}</span>
                      {st === 'exalted' && <span style={{ fontSize: '10px', color: 'var(--green)', fontWeight: '700' }}>↑</span>}
                      {st === 'debilitated' && <span style={{ fontSize: '10px', color: 'var(--red)', fontWeight: '700' }}>↓</span>}
                      {(p as any).retrograde && <span style={{ fontSize: '9px', color: 'var(--red)' }}>®</span>}
                      {isVarg && <span style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: '700' }}>◈</span>}
                      <span style={{ fontSize: '10px', color: 'var(--text4)' }}>›</span>
                    </div>
                  )
                })}
              </div>

              {/* House analysis */}
              <HouseAnalysis varga={varga} d={selectedD} />
            </div>
          </div>
        </>
      )}
      {varga && selPlanet && (
        <PlanetInterpretationDrawer
          planet={selPlanet}
          planetData={selPlanet ? { ...(varga.planets as any)[selPlanet], status: getPlanetStatus(selPlanet, (varga.planets as any)[selPlanet]?.sign) } : null}
          allPlanets={Object.fromEntries(Object.entries(varga.planets).map(([n, p]) => [n, { house: (p as any).house }]))}
          onClose={() => setSelPlanet(null)}
        />
      )}
    </div>
  )
}
