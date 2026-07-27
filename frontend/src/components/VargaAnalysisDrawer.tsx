import { useState } from 'react'
import type { Planet } from '../api/jyotish'
import { useLang } from '../contexts/LanguageContext'
import { PLANET_IN_SIGN, PLANET_IN_HOUSE, PLANET_KARAKATVA } from './PlanetInterpretation'
import { getVargaDomain, NAKSHATRAS, NAKSHATRA_SOURCE } from '../data/vargaKnowledge'

/**
 * Varga-aware analysis drawer. Reads a planet/house IN THE CONTEXT OF the varga
 * clicked (D10 = career, D9 = marriage …), layering:
 *   varga-domain house framing → planet-in-sign → planet-in-house → nakshatra
 *   (true, from D1) → karakatva → dignity. Every claim cites a classical source.
 */

interface ChartData {
  ascendant: { sign: string; sign_index: number; degree: number }
  planets: Record<string, Planet>
  planet_house_map: Record<string, string[]>
}
export interface AnalysisTarget { type: 'planet' | 'house'; planet?: string; house?: number }

interface Props {
  open: boolean
  onClose: () => void
  vargaD: number
  chart: ChartData          // the varga chart that was clicked
  d1Planets: Record<string, Planet>   // for the TRUE nakshatra (a D1 property)
  target: AnalysisTarget | null
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E',
}
const SIGN_SRC = 'BPHS Ch. 20–23 — Effects of planets in the Rashis'
const HOUSE_SRC = 'BPHS Ch. 24–33 — Effects of planets in the Bhavas'
const KARAKA_SRC = 'BPHS Ch. 3 — Graha Karakatva; Uttara Kalamrita'
const DIGNITY_SRC = 'BPHS Ch. 3 — Exaltation, debilitation & own signs'

function dignityNote(status?: string): string | null {
  switch (status) {
    case 'exalted':     return 'Exalted (uccha) — gives its fullest, most benefic results here. A great strength in this chart.'
    case 'debilitated': return 'Debilitated (neecha) — struggles to express naturally; results are weakened unless cancelled (Neecha Bhanga).'
    case 'own_sign':    return 'Own sign (swakshetra) — comfortable and strong; delivers stable, reliable results.'
    default:            return null
  }
}

// Collapsible learning-style section with a citation.
function Section({ title, summary, detail, source, color }: {
  title: string; summary: string; detail?: string; source?: string; color?: string
}) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color || 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text3)' }}>{title}</span>
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text4)' }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div style={{ marginTop: '7px' }}>
          <div style={{ fontSize: '13.5px', color: 'var(--text)', lineHeight: 1.6 }}>{summary}</div>
          {detail && <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.6, marginTop: '6px' }}>{detail}</div>}
          {source && (
            <div style={{ fontSize: '10.5px', color: 'var(--accent)', marginTop: '7px', fontStyle: 'italic' }}>📜 {source}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function VargaAnalysisDrawer({ open, onClose, vargaD, chart, d1Planets, target }: Props) {
  const { t } = useLang()
  if (!open || !target) return null
  const vd = getVargaDomain(vargaD)

  // ── Build the reading body ──────────────────────────────────────────
  let headerTitle = ''
  let headerSub = ''
  let body: React.ReactNode = null

  const planetLine = (name: string) => {
    const p = chart.planets[name]; if (!p) return null
    const house = p.house as number
    const sign = p.sign
    const d1 = d1Planets[name]
    const nak = d1?.nakshatra
    const nakInfo = nak ? NAKSHATRAS.find(n => n.name === nak) : undefined
    const dig = dignityNote(p.status)
    const houseFrame = vd.houseMeanings[house - 1] || ''
    const signText = PLANET_IN_SIGN[name]?.[sign]
    const houseText = PLANET_IN_HOUSE[name]?.[house - 1]?.replace(/^H\d+\s*—\s*/, '')

    return (
      <div key={name}>
        {/* Quick facts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '4px 0 8px' }}>
          <Fact k={t('Sign')} v={t(sign)} />
          <Fact k={t('House')} v={`${house} · ${vd.label}`} />
          {p.retrograde && <Fact k="" v={t('Retrograde')} warn />}
          {p.status && p.status !== 'neutral' && <Fact k="" v={t(p.status)} good={p.status === 'exalted' || p.status === 'own_sign'} warn={p.status === 'debilitated'} />}
          {d1 && <Fact k="°" v={`${(d1.degree ?? p.degree)?.toFixed(1)}°`} />}
        </div>

        <Section
          color={PLANET_COLORS[name]}
          title={`${t('In the')} ${vd.name} (${vd.domain})`}
          summary={`${t(name)} ${t('sits in house')} ${house} ${t('of the')} ${vd.label} ${t('chart')} — ${houseFrame}`}
          detail={`${t('So its results here are read specifically for')}: ${vd.domain.toLowerCase()}.`}
          source={vd.source}
        />
        {signText && <Section color={PLANET_COLORS[name]} title={`${t(name)} ${t('in')} ${t(sign)}`} summary={signText} source={SIGN_SRC} />}
        {houseText && <Section color={PLANET_COLORS[name]} title={`${t(name)} ${t('in house')} ${house}`} summary={houseText} source={HOUSE_SRC} />}
        {nakInfo && (
          <Section
            color={PLANET_COLORS[name]}
            title={`${t('Nakshatra')}: ${nak}${d1?.pada ? ` · ${t('Pada')} ${d1.pada}` : ''}`}
            summary={`${nakInfo.traits}.`}
            detail={`${t('Lord')}: ${nakInfo.lord} · ${t('Deity')}: ${nakInfo.deity} · ${t('Symbol')}: ${nakInfo.symbol}. ${t('Nakshatra is taken from the true D1 longitude.')}`}
            source={NAKSHATRA_SOURCE}
          />
        )}
        <Section color={PLANET_COLORS[name]} title={t('Karaka (significations)')} summary={PLANET_KARAKATVA[name] || ''} source={KARAKA_SRC} />
        {dig && <Section color={PLANET_COLORS[name]} title={t('Dignity')} summary={dig} source={DIGNITY_SRC} />}
      </div>
    )
  }

  if (target.type === 'planet' && target.planet) {
    const name = target.planet
    headerTitle = `${t(name)} ${t('in')} ${vd.label}`
    headerSub = vd.domain
    body = planetLine(name)
  } else if (target.type === 'house' && target.house) {
    const h = target.house
    const here = chart.planet_house_map[h] || []
    headerTitle = `${t('House')} ${h} · ${vd.label}`
    headerSub = vd.domain
    body = (
      <div>
        <Section
          title={`${t('House')} ${h} ${t('in')} ${vd.name}`}
          summary={vd.houseMeanings[h - 1] || ''}
          detail={vd.keyHouses.includes(h) ? `⭐ ${t('A key house for this chart')} (${vd.domain}).` : undefined}
          source={vd.source}
        />
        {here.length === 0
          ? <div style={{ fontSize: '13px', color: 'var(--text3)', fontStyle: 'italic', padding: '12px 0' }}>{t('No planets in this house.')}</div>
          : here.map(p => (
              <div key={p} style={{ marginTop: '10px', paddingTop: '4px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: PLANET_COLORS[p] || 'var(--accent)', marginBottom: '2px' }}>{t(p)}</div>
                {planetLine(p)}
              </div>
            ))}
      </div>
    )
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={panel} className="anim-slide-in-right">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{headerTitle}</div>
            <div style={{ fontSize: '12.5px', color: 'var(--accent)', fontWeight: 600, marginTop: '2px' }}>{headerSub}</div>
          </div>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text4)', marginBottom: '10px' }}>
          {t('Reading framed for this divisional chart. Tap a section to collapse.')}
        </div>
        <div>{body}</div>
      </div>
    </div>
  )
}

function Fact({ k, v, good, warn }: { k: string; v: string; good?: boolean; warn?: boolean }) {
  const color = warn ? 'var(--red)' : good ? 'var(--green)' : 'var(--text2)'
  const bg = warn ? 'var(--red-bg)' : good ? 'var(--green-bg)' : 'var(--surface2)'
  return (
    <span style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '999px', background: bg, color, fontWeight: 600 }}>
      {k && <span style={{ opacity: .6 }}>{k}: </span>}{v}
    </span>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(20,16,40,.35)', zIndex: 1000,
  display: 'flex', justifyContent: 'flex-end',
}
const panel: React.CSSProperties = {
  width: '420px', maxWidth: '92vw', height: '100%', background: 'var(--surface)',
  borderLeft: '1px solid var(--border)', boxShadow: '-20px 0 50px -20px rgba(0,0,0,.4)',
  padding: '22px', overflowY: 'auto',
}
const closeBtn: React.CSSProperties = {
  width: '30px', height: '30px', border: 'none', borderRadius: '50%', background: 'var(--surface2)',
  color: 'var(--text3)', cursor: 'pointer', fontSize: '18px', flexShrink: 0,
}
