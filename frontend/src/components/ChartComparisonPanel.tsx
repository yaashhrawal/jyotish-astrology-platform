import { useState } from 'react'
import { synastryApi } from '../api/client'
import NorthIndianChart from './NorthIndianChart'
import { useLang } from '../contexts/LanguageContext'
import { translate } from '../i18n/terms'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

interface PersonForm {
  name: string
  year: string; month: string; day: string
  hour: string; minute: string; tz: string
  lat: string; lon: string
}

function defaultPerson(n: string): PersonForm {
  return { name: n, year: '', month: '', day: '', hour: '12', minute: '0', tz: '5.5', lat: '28.6', lon: '77.2' }
}

function formToPayload(f: PersonForm, prefix: 'p1' | 'p2') {
  return {
    [`${prefix}_name`]: f.name,
    [`${prefix}_year`]: +f.year, [`${prefix}_month`]: +f.month, [`${prefix}_day`]: +f.day,
    [`${prefix}_hour`]: +f.hour, [`${prefix}_minute`]: +f.minute,
    [`${prefix}_tz_offset`]: +f.tz, [`${prefix}_lat`]: +f.lat, [`${prefix}_lon`]: +f.lon,
  }
}

function birthToForm(bd: any, name: string): PersonForm {
  return {
    name,
    year: String(bd.year || ''), month: String(bd.month || ''), day: String(bd.day || ''),
    hour: String(bd.hour ?? '12'), minute: String(bd.minute ?? '0'),
    tz: String(bd.tz_offset ?? 5.5),
    lat: String(bd.latitude ?? bd.lat ?? '28.6'), lon: String(bd.longitude ?? bd.lon ?? '77.2'),
  }
}

interface Props { chart?: any; birth?: any }

const inp: React.CSSProperties = {
  padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', width: '100%', boxSizing: 'border-box',
}

const label: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: 'var(--text3)', marginBottom: '3px', display: 'block' }

function PersonForm({ form, onChange, readonly }: { form: PersonForm; onChange: (f: PersonForm) => void; readonly?: boolean }) {
  const { t } = useLang()
  const set = (k: keyof PersonForm) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, [k]: e.target.value })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div><span style={label}>{t('Name')}</span><input style={inp} value={form.name} onChange={set('name')} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div><span style={label}>{t('Year')}</span><input style={inp} placeholder="1990" value={form.year} onChange={set('year')} readOnly={readonly} /></div>
        <div><span style={label}>{t('Month')}</span><input style={inp} placeholder="6" value={form.month} onChange={set('month')} readOnly={readonly} /></div>
        <div><span style={label}>{t('Day')}</span><input style={inp} placeholder="15" value={form.day} onChange={set('day')} readOnly={readonly} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div><span style={label}>{t('Hour')}</span><input style={inp} value={form.hour} onChange={set('hour')} readOnly={readonly} /></div>
        <div><span style={label}>Min</span><input style={inp} value={form.minute} onChange={set('minute')} readOnly={readonly} /></div>
        <div><span style={label}>TZ</span><input style={inp} value={form.tz} onChange={set('tz')} readOnly={readonly} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div><span style={label}>{t('Latitude')}</span><input style={inp} value={form.lat} onChange={set('lat')} readOnly={readonly} /></div>
        <div><span style={label}>{t('Longitude')}</span><input style={inp} value={form.lon} onChange={set('lon')} readOnly={readonly} /></div>
      </div>
    </div>
  )
}

const NATURE_COLOR: Record<string, string> = { strong: '#16A34A', mild: '#0891B2', tense: '#DC2626' }

function AspectBadge({ nature, aspect }: { nature: string; aspect: string }) {
  const c = NATURE_COLOR[nature] || '#888'
  return (
    <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 7px', borderRadius: '20px', background: c + '18', color: c, border: `1px solid ${c}44` }}>
      {aspect}
    </span>
  )
}

function PlanetDot({ planet }: { planet: string }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: PLANET_COLORS[planet] || '#888', marginRight: 4 }} />
}

export default function ChartComparisonPanel({ chart, birth }: Props) {
  const { lang, t } = useLang()
  const [p1, setP1] = useState<PersonForm>(() => birth ? birthToForm(birth, chart?.name || t('Person 1')) : defaultPerson(t('Person 1')))
  const [p2, setP2] = useState<PersonForm>(() => defaultPerson(t('Person 2')))
  const [mode, setMode] = useState<'synastry' | 'composite'>('synastry')
  const [data, setData] = useState<any>(null)
  const [compositeData, setCompositeData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aspectFilter, setAspectFilter] = useState<'all' | 'strong' | 'tense'>('all')
  const [overlayTab, setOverlayTab] = useState<'p2_in_p1' | 'p1_in_p2'>('p2_in_p1')

  const compositePayload = () => ({
    p1_name: p1.name, p1_year: +p1.year, p1_month: +p1.month, p1_day: +p1.day,
    p1_hour: +p1.hour, p1_minute: +p1.minute, p1_tz: +p1.tz, p1_lat: +p1.lat, p1_lon: +p1.lon,
    p2_name: p2.name, p2_year: +p2.year, p2_month: +p2.month, p2_day: +p2.day,
    p2_hour: +p2.hour, p2_minute: +p2.minute, p2_tz: +p2.tz, p2_lat: +p2.lat, p2_lon: +p2.lon,
    ayanamsa: 'lahiri',
  })

  const compute = async () => {
    setLoading(true); setError('')
    try {
      if (mode === 'composite') {
        const res = await synastryApi.composite(compositePayload())
        setCompositeData(res)
      } else {
        const payload = { ...formToPayload(p1, 'p1'), ...formToPayload(p2, 'p2'), ayanamsa: 'lahiri' }
        const res = await synastryApi.get(payload)
        setData(res)
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message)
    } finally { setLoading(false) }
  }

  const filteredAspects = data?.aspects?.filter((a: any) =>
    aspectFilter === 'all' ? true : a.nature === aspectFilter
  ) || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {([['synastry', 'Synastry', 'Cross-aspects + house overlays'], ['composite', 'Composite Chart', 'Midpoint chart of relationship']] as const).map(([m, label, sub]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '10px 16px', borderRadius: 'var(--radius-m)', cursor: 'pointer', textAlign: 'left',
            border: `1px solid ${mode === m ? 'var(--accent)' : 'var(--border)'}`,
            background: mode === m ? 'var(--accent)' : 'var(--surface)',
            color: mode === m ? '#fff' : 'var(--text)',
          }}>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>{label}</div>
            <div style={{ fontSize: '10px', opacity: 0.75, marginTop: '2px' }}>{sub}</div>
          </button>
        ))}
      </div>

      {/* Input forms */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {[
          { label: p1.name || t('Person 1'), form: p1, set: setP1, isChart: !!chart },
          { label: p2.name || t('Person 2'), form: p2, set: setP2, isChart: false },
        ].map(({ label: lbl, form, set, isChart }, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', background: i === 0 ? '#D97706' : '#7C3AED' }} />
              {lbl}
              {isChart && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: '#16A34A18', color: '#16A34A', border: '1px solid #16A34A44' }}>from chart</span>}
            </div>
            <PersonForm form={form} onChange={set} readonly={false} />
          </div>
        ))}
      </div>

      <button onClick={compute} disabled={loading} style={{
        padding: '11px', borderRadius: '8px', border: 'none', cursor: 'pointer',
        background: loading ? 'var(--surface2)' : 'var(--accent)', color: loading ? 'var(--text3)' : '#fff',
        fontSize: '14px', fontWeight: '700', transition: 'background .2s',
      }}>
        {loading ? '…' : t('Compare')}
      </button>

      {error && <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#DC2626', fontSize: '13px' }}>{error}</div>}

      {data && <>
        {/* Harmony score */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
              <svg viewBox="0 0 90 90" style={{ width: 90, height: 90 }}>
                <circle cx="45" cy="45" r="38" fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle cx="45" cy="45" r="38" fill="none"
                  stroke={data.summary.harmony_score > 65 ? '#16A34A' : data.summary.harmony_score > 40 ? '#D97706' : '#DC2626'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(data.summary.harmony_score / 100) * 239} 239`}
                  transform="rotate(-90 45 45)" />
                <text x="45" y="50" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--text)">{data.summary.harmony_score}</text>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Synastry Harmony Score</div>
              <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px' }}>
                {data.p1.name} × {data.p2.name}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Aspects', val: data.summary.total_aspects },
                  { label: 'Harmonious', val: data.summary.strong_aspects, color: '#16A34A' },
                  { label: 'Tense', val: data.summary.tense_aspects, color: '#DC2626' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: s.color || 'var(--text)' }}>{s.val}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: '600' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Aspect grid */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>Cross Aspects · {data.p1.name} ↔ {data.p2.name}</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'strong', 'tense'] as const).map(f => (
                <button key={f} onClick={() => setAspectFilter(f)} style={{
                  padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border)',
                  background: aspectFilter === f ? 'var(--accent)' : 'var(--surface2)',
                  color: aspectFilter === f ? '#fff' : 'var(--text3)',
                  fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
          </div>

          {/* Planet header row */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
                    {data.p1.name} ↓ · {data.p2.name} →
                  </th>
                  {data.p2.planets.map((p: any) => (
                    <th key={p.name} style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid var(--border)', minWidth: 52 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <PlanetDot planet={p.name} />
                        <span style={{ color: PLANET_COLORS[p.name] || 'var(--text3)', fontWeight: '700' }}>{p.name.slice(0, 2)}</span>
                        <span style={{ color: 'var(--text4)', fontSize: '9px' }}>H{p.house}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.p1.planets.map((p1p: any, ri: number) => (
                  <tr key={p1p.name} style={{ borderBottom: '1px solid var(--border)', background: ri % 2 === 0 ? 'transparent' : 'var(--surface2)' }}>
                    <td style={{ padding: '6px 12px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PlanetDot planet={p1p.name} />
                        <span style={{ color: PLANET_COLORS[p1p.name] || 'var(--text)' }}>{p1p.name}</span>
                        <span style={{ color: 'var(--text4)', fontSize: '10px' }}>H{p1p.house}</span>
                      </div>
                    </td>
                    {data.p2.planets.map((p2p: any) => {
                      const asp = data.aspects.find((a: any) => a.p1_planet === p1p.name && a.p2_planet === p2p.name)
                      if (!asp) return <td key={p2p.name} style={{ textAlign: 'center', color: 'var(--text4)', fontSize: '10px' }}>–</td>
                      const c = NATURE_COLOR[asp.nature]
                      return (
                        <td key={p2p.name} style={{ textAlign: 'center', padding: '4px' }}>
                          <div title={`${asp.aspect} (${asp.degree_diff}° diff, orb ${asp.orb}°)`}
                            style={{ padding: '2px 4px', borderRadius: '4px', background: c + '18', color: c, fontWeight: '700', fontSize: '10px', cursor: 'default', border: `1px solid ${c}33` }}>
                            {asp.aspect.slice(0, 3)}
                            <div style={{ fontSize: '8px', opacity: 0.7 }}>{asp.orb}°</div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Aspect list */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: '700' }}>
            Aspect Interpretations ({filteredAspects.length})
          </div>
          {filteredAspects.slice(0, 20).map((a: any, i: number) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px',
              borderBottom: i < filteredAspects.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 140 }}>
                <PlanetDot planet={a.p1_planet} />
                <span style={{ fontWeight: '600', fontSize: '12.5px', color: PLANET_COLORS[a.p1_planet] }}>{a.p1_planet}</span>
                <span style={{ fontSize: '10px', color: 'var(--text4)' }}>H{a.p1_house}</span>
              </div>
              <AspectBadge nature={a.nature} aspect={a.aspect} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 140 }}>
                <PlanetDot planet={a.p2_planet} />
                <span style={{ fontWeight: '600', fontSize: '12.5px', color: PLANET_COLORS[a.p2_planet] }}>{a.p2_planet}</span>
                <span style={{ fontSize: '10px', color: 'var(--text4)' }}>H{a.p2_house}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text4)', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                {a.degree_diff}° · orb {a.orb}°
              </span>
            </div>
          ))}
          {filteredAspects.length === 0 && (
            <div style={{ padding: '16px 18px', fontSize: '12.5px', color: 'var(--text3)' }}>No {aspectFilter} aspects found.</div>
          )}
        </div>

        {/* House overlays */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>House Overlays</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'p2_in_p1' as const, label: `${data.p2.name} in ${data.p1.name}'s houses` },
                { key: 'p1_in_p2' as const, label: `${data.p1.name} in ${data.p2.name}'s houses` },
              ].map(t => (
                <button key={t.key} onClick={() => setOverlayTab(t.key)} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer',
                  background: overlayTab === t.key ? 'var(--accent)' : 'var(--surface2)',
                  color: overlayTab === t.key ? '#fff' : 'var(--text3)', fontSize: '11px', fontWeight: '600',
                }}>{t.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0' }}>
            {Array.from({ length: 12 }, (_, h) => {
              const house = h + 1
              const planets = overlayTab === 'p2_in_p1'
                ? data.p2_in_p1_houses.filter((p: any) => p.house === house)
                : data.p1_in_p2_houses.filter((p: any) => p.house === house)
              return (
                <div key={house} style={{
                  padding: '10px', borderRight: h % 6 !== 5 ? '1px solid var(--border)' : 'none',
                  borderBottom: h < 6 ? '1px solid var(--border)' : 'none',
                  minHeight: '70px',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text4)', marginBottom: '6px' }}>H{house}</div>
                  {planets.map((p: any) => (
                    <div key={p.planet} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                      <PlanetDot planet={p.planet} />
                      <span style={{ fontSize: '11px', fontWeight: '600', color: PLANET_COLORS[p.planet] || 'var(--text)' }}>{translate(p.planet, lang).slice(0, 2)}</span>
                      <span style={{ fontSize: '9px', color: 'var(--text4)' }}>{p.sign?.slice(0, 3)}</span>
                    </div>
                  ))}
                  {planets.length === 0 && <span style={{ fontSize: '10px', color: 'var(--text4)' }}>—</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Side-by-side planet tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { person: data.p1, color: '#D97706' },
            { person: data.p2, color: '#7C3AED' },
          ].map(({ person, color }) => (
            <div key={person.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '12.5px', fontWeight: '700', color }}>
                {person.name} — Planetary Positions
              </div>
              {person.planets.map((p: any) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: PLANET_COLORS[p.name] || '#888', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: PLANET_COLORS[p.name] || 'var(--text)', flex: 1 }}>{p.name}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text2)' }}>{p.sign}</span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text4)', fontVariantNumeric: 'tabular-nums' }}>{p.degree.toFixed(1)}° · H{p.house}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </>}

      {/* Composite result */}
      {compositeData && mode === 'composite' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>
              Composite Chart — {compositeData.p1_name} × {compositeData.p2_name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
              Ascendant: <strong>{compositeData.composite_ascendant?.sign}</strong> {compositeData.composite_ascendant?.degree?.toFixed(1)}° · {compositeData.note}
            </div>
          </div>
          <NorthIndianChart
            ascendant={compositeData.composite_ascendant}
            planets={compositeData.composite_planets}
            planetHouseMap={compositeData.planet_house_map}
            size={400}
            title="Composite Midpoint Chart"
          />
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: '700' }}>Composite Planets</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
              {Object.entries(compositeData.composite_planets).map(([planet, pd]: any) => {
                const color = PLANET_COLORS[planet] || '#888'
                return (
                  <div key={planet} style={{ background: 'var(--surface)', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color }}>{planet}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text3)' }}>H{pd.house}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{pd.sign} {pd.degree?.toFixed(1)}°</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
