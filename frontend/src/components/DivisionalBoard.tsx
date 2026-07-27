import { useEffect, useRef, useState } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'
import type { Planet } from '../api/jyotish'
import NorthIndianChart from './NorthIndianChart'
import SouthIndianChart from './SouthIndianChart'
import EastIndianChart from './EastIndianChart'
import VargaAnalysisDrawer, { type AnalysisTarget } from './VargaAnalysisDrawer'

/**
 * Customisable Divisional Charts Board (Kundli screen).
 * D1 Lagna is pinned first; the astrologer can add any number of vargas for
 * side-by-side comparison. Layout persists per user (backend) + localStorage.
 */

export interface VargaChartData {
  ascendant: { sign: string; sign_index: number; degree: number }
  planets: Record<string, Planet>
  planet_house_map: Record<string, string[]>
  vargottama?: string[]
}

interface BirthData {
  year: number; month: number; day: number
  hour: number; minute: number; tz_offset: number
  latitude: number; longitude: number; ayanamsa: string
}

interface Props {
  birthData: BirthData
  chartStyle: 'north' | 'south' | 'east'
  d1?: VargaChartData          // pass the already-computed D1 to avoid a refetch
  initialLayout?: number[] | null
  onSave?: (layout: number[]) => void   // persist (backend/localStorage)
}

export const VARGAS: { d: number; label: string; name: string; domain: string }[] = [
  { d: 1,  label: 'D1',  name: 'Rashi',            domain: 'Body · overall life' },
  { d: 2,  label: 'D2',  name: 'Hora',             domain: 'Wealth · finances' },
  { d: 3,  label: 'D3',  name: 'Drekkana',         domain: 'Siblings · courage' },
  { d: 4,  label: 'D4',  name: 'Chaturthamsha',    domain: 'Home · property' },
  { d: 7,  label: 'D7',  name: 'Saptamsha',        domain: 'Children · progeny' },
  { d: 9,  label: 'D9',  name: 'Navamsha',         domain: 'Marriage · dharma' },
  { d: 10, label: 'D10', name: 'Dashamsha',        domain: 'Career · status' },
  { d: 12, label: 'D12', name: 'Dwadashamsha',     domain: 'Parents · ancestry' },
  { d: 16, label: 'D16', name: 'Shodashamsha',     domain: 'Vehicles · comforts' },
  { d: 20, label: 'D20', name: 'Vimshamsha',       domain: 'Spiritual progress' },
  { d: 24, label: 'D24', name: 'Chaturvimshamsha', domain: 'Education · learning' },
  { d: 27, label: 'D27', name: 'Bhamsha',          domain: 'Strength · vitality' },
  { d: 30, label: 'D30', name: 'Trimshamsha',      domain: 'Misfortunes · evils' },
  { d: 40, label: 'D40', name: 'Khavedamsha',      domain: 'Maternal legacy' },
  { d: 45, label: 'D45', name: 'Akshavedamsha',    domain: 'Paternal legacy' },
  { d: 60, label: 'D60', name: 'Shashtyamsha',     domain: 'Past karma · timing' },
]
const VMAP = Object.fromEntries(VARGAS.map(v => [v.d, v]))

const PRESETS: { icon: string; label: string; layout: number[] }[] = [
  { icon: '💍', label: 'Marriage', layout: [1, 9] },
  { icon: '💼', label: 'Career',   layout: [1, 10, 24] },
  { icon: '👶', label: 'Progeny',  layout: [1, 7, 9] },
  { icon: '🔱', label: 'Shodashavarga', layout: VARGAS.map(v => v.d) },
]

const SIZE_BY_COL: Record<number, number> = { 2: 420, 3: 300, 4: 230 }

export default function DivisionalBoard({ birthData, chartStyle, d1, initialLayout, onSave }: Props) {
  const { t } = useLang()
  const [layout, setLayout] = useState<number[]>(() => {
    const src = initialLayout && initialLayout.length ? initialLayout : [1, 9, 10]
    return src[0] === 1 ? src : [1, ...src.filter(d => d !== 1)]
  })
  const [cols, setCols] = useState<number>(() => Number(localStorage.getItem('jyotish_board_cols')) || 3)
  const [data, setData] = useState<Record<number, VargaChartData | null>>({})
  const [loadingSet, setLoadingSet] = useState<Set<number>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [analysis, setAnalysis] = useState<{ d: number; target: AnalysisTarget } | null>(null)
  const mounted = useRef(false)

  // Stable key from birth VALUES (birthData is a fresh object every render).
  const birthKey = JSON.stringify([
    birthData.year, birthData.month, birthData.day, birthData.hour, birthData.minute,
    birthData.tz_offset, birthData.latitude, birthData.longitude, birthData.ayanamsa,
  ])

  // When the birth details actually change, drop the fetched cache.
  useEffect(() => { setData({}) }, [birthKey])

  // Fetch any varga on the board we don't have yet (D1 comes from the d1 prop).
  useEffect(() => {
    layout.forEach(d => {
      if (d === 1 && d1) return
      setData(prev => {
        if (prev[d] !== undefined || loadingSet.has(d)) return prev
        setLoadingSet(s => new Set(s).add(d))
        apiPost('/api/calc/varga', { ...birthData, d })
          .then((r: any) => setData(p => ({ ...p, [d]: r })))
          .catch(() => setData(p => ({ ...p, [d]: null })))
          .finally(() => setLoadingSet(s => { const n = new Set(s); n.delete(d); return n }))
        return prev
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, birthKey])

  // Persist layout (skip the very first render)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    localStorage.setItem('jyotish_board', JSON.stringify(layout))
    onSave?.(layout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout])

  const setColumns = (c: number) => { setCols(c); localStorage.setItem('jyotish_board_cols', String(c)) }
  const removeVarga = (d: number) => { if (d !== 1) setLayout(l => l.filter(x => x !== d)) }
  const applyPreset = (l: number[]) => setLayout(l[0] === 1 ? l : [1, ...l.filter(d => d !== 1)])
  const openAdd = () => { setSel(new Set()); setShowAdd(true) }
  const addSelected = () => { setLayout(l => [...l, ...[...sel].filter(d => !l.includes(d))]); setShowAdd(false) }

  const size = SIZE_BY_COL[cols] || 300

  const renderChart = (d: number, cd: VargaChartData) => {
    const v = VMAP[d]
    const title = `${v.label} ${v.name.toUpperCase()}`
    const onPlanetSelect = (planet: string) => setAnalysis({ d, target: { type: 'planet', planet } })
    const onHouseSelect = (h: number | null) => { if (h != null) setAnalysis({ d, target: { type: 'house', house: h } }) }
    const props = { ascendant: cd.ascendant, planets: cd.planets, planetHouseMap: cd.planet_house_map, size, title, compact: true, onPlanetSelect, onHouseSelect }
    if (chartStyle === 'south') return <SouthIndianChart {...props} />
    if (chartStyle === 'east') return <EastIndianChart {...props} />
    return <NorthIndianChart {...props} />
  }

  const d1Planets = (d1?.planets || data[1]?.planets || {}) as Record<string, any>
  const analysisChart = analysis ? (analysis.d === 1 ? (d1 || data[1]) : data[analysis.d]) : null

  return (
    <div>
      {/* Toolbar */}
      <div style={S.bar}>
        <h2 style={S.h2}>{t('Divisional Charts')}</h2>
        <button style={S.primary} onClick={openAdd}>＋ {t('Add Chart')}</button>
        <div style={S.seg}>
          {[2, 3, 4].map(c => (
            <button key={c} onClick={() => setColumns(c)} style={{ ...S.segBtn, ...(cols === c ? S.segOn : {}) }}>{c} {t('col')}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{t('Presets')}:</span>
        {PRESETS.map(p => (
          <span key={p.label} onClick={() => applyPreset(p.layout)} style={S.preset} title={p.layout.map(d => 'D' + d).join(' · ')}>
            {p.icon} {t(p.label)}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {layout.map(d => {
          const v = VMAP[d]; const cd = d === 1 ? (d1 || data[1]) : data[d]; const isD1 = d === 1
          const failed = cd === null && data[d] === null && !(d === 1 && d1)
          return (
            <div key={d} style={{ ...S.card, ...(isD1 ? S.cardDefault : {}) }}
                 onMouseEnter={e => { const x = e.currentTarget.querySelector('.rm') as HTMLElement; if (x) x.style.display = 'flex' }}
                 onMouseLeave={e => { const x = e.currentTarget.querySelector('.rm') as HTMLElement; if (x) x.style.display = 'none' }}>
              {isD1
                ? <span style={S.badge}>{t('LAGNA')}</span>
                : <button className="rm" style={S.rm} onClick={() => removeVarga(d)} title={t('Remove')}>✕</button>}
              <div style={S.cardHead}>
                <span style={S.vcode}>{v.label}</span>
                <span style={S.vname}>{t(v.name)}</span>
                <span style={S.vpurpose}>{t(v.domain)}</span>
              </div>
              {cd
                ? renderChart(d, cd)
                : failed
                  ? <div style={S.loading} onClick={() => setData(p => { const n = { ...p }; delete n[d]; return n })}>⚠ {t('Failed — tap to retry')}</div>
                  : <div style={S.loading}>{t('Calculating')} {v.label}…</div>}
            </div>
          )
        })}
      </div>

      {/* Add-chart modal */}
      {showAdd && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={S.modal}>
            <h3 style={S.mTitle}>{t('Add Divisional Charts')}</h3>
            <p style={S.mSub}>{t('Select the vargas to place on the board.')}</p>
            <div style={S.vgrid}>
              {VARGAS.map(v => {
                const already = layout.includes(v.d)
                const selected = sel.has(v.d)
                return (
                  <div key={v.d} onClick={() => { if (already) return; setSel(s => { const n = new Set(s); n.has(v.d) ? n.delete(v.d) : n.add(v.d); return n }) }}
                       style={{ ...S.vopt, ...(selected ? S.voptSel : {}), ...(already ? S.voptDisabled : {}) }}>
                    <div style={S.voptC}>{v.label}</div>
                    <div style={S.voptN}>{t(v.name)}</div>
                    <div style={S.voptP}>{t(v.domain)}</div>
                  </div>
                )
              })}
            </div>
            <div style={S.mFoot}>
              <span style={{ fontSize: '12.5px', color: 'var(--text3)' }}>{sel.size} {t('selected')}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={S.ghost} onClick={() => setShowAdd(false)}>{t('Cancel')}</button>
                <button style={S.primary} onClick={addSelected}>{t('Add to board')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Varga-aware analysis drawer */}
      {analysis && analysisChart && (
        <VargaAnalysisDrawer
          open={!!analysis}
          onClose={() => setAnalysis(null)}
          vargaD={analysis.d}
          chart={analysisChart}
          d1Planets={d1Planets}
          target={analysis.target}
        />
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  bar: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', margin: '4px 0 16px', paddingBottom: '12px', borderBottom: '2px solid var(--border)' },
  h2: { fontSize: '15px', fontWeight: 800, marginRight: '4px' },
  primary: { border: '1px solid var(--accent)', background: 'var(--accent)', color: '#fff', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  ghost: { border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  seg: { display: 'inline-flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' },
  segBtn: { border: 'none', background: 'var(--surface)', padding: '6px 11px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text3)', cursor: 'pointer' },
  segOn: { background: 'var(--accent)', color: '#fff' },
  preset: { fontSize: '12px', color: 'var(--text3)', cursor: 'pointer', padding: '5px 10px', border: '1px dashed var(--border)', borderRadius: '999px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px', position: 'relative' },
  cardDefault: { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent) inset' },
  cardHead: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  vcode: { fontWeight: 800, fontSize: '14px', color: 'var(--accent)' },
  vname: { fontSize: '12.5px', color: 'var(--text2)', fontWeight: 600, fontFamily: "'Noto Sans Devanagari',sans-serif" },
  vpurpose: { fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto', textAlign: 'right' },
  rm: { position: 'absolute', top: '10px', right: '10px', width: '22px', height: '22px', borderRadius: '6px', border: 'none', background: 'var(--surface2)', color: 'var(--text3)', cursor: 'pointer', fontSize: '12px', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  badge: { position: 'absolute', top: '10px', right: '10px', fontSize: '9.5px', fontWeight: 800, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '2px 7px', borderRadius: '999px', letterSpacing: '.04em' },
  loading: { aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: '12.5px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(20,16,40,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--surface)', borderRadius: '18px', width: '640px', maxWidth: '92vw', maxHeight: '86vh', overflow: 'auto', padding: '24px', boxShadow: '0 30px 70px -20px rgba(0,0,0,.5)' },
  mTitle: { fontSize: '17px', fontWeight: 800, marginBottom: '4px' },
  mSub: { color: 'var(--text3)', fontSize: '13px', marginBottom: '16px' },
  vgrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' },
  vopt: { border: '1.5px solid var(--border)', borderRadius: '10px', padding: '10px', cursor: 'pointer', textAlign: 'center' },
  voptSel: { borderColor: 'var(--accent)', background: 'var(--accent-bg)' },
  voptDisabled: { opacity: 0.4, pointerEvents: 'none' },
  voptC: { fontWeight: 800, color: 'var(--accent)', fontSize: '15px' },
  voptN: { fontSize: '11px', color: 'var(--text2)', marginTop: '2px', fontFamily: "'Noto Sans Devanagari',sans-serif" },
  voptP: { fontSize: '9.5px', color: 'var(--text3)', marginTop: '2px', lineHeight: 1.3 },
  mFoot: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', gap: '10px' },
}
