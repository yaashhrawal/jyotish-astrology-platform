import PlanetInterpretationDrawer from './PlanetInterpretation'
import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { apiPost } from '../api/client'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB'
}

const DIGNITY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  exalted:     { bg: '#D1FAE5', color: '#059669', label: '↑ Exalt' },
  moolatrikona:{ bg: '#DBEAFE', color: '#2563EB', label: '◎ Mool' },
  own:         { bg: '#EDE9FE', color: '#7C3AED', label: '◈ Own' },
  friend:      { bg: '#FEF3C7', color: '#D97706', label: '♥ Friend' },
  neutral:     { bg: 'transparent', color: 'var(--text4)', label: '— Neutral' },
  debilitated: { bg: '#FEE2E2', color: '#DC2626', label: '↓ Debil' },
}

const VARGA_NAMES = ['D1','D2','D3','D4','D7','D9','D10','D12','D16','D20','D24','D27','D30','D40','D45','D60']

interface Props { birthData: any }

export default function DignityPanel({ birthData }: Props) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selPlanet, setSelPlanet] = useState<string | null>(null)

  useEffect(() => {
    if (!birthData) return
    setLoading(true)
    apiPost('/api/calc/dignity', birthData)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [birthData])

  if (loading) return <div style={{ padding: 20, color: 'var(--text3)' }}>Computing Dignity Table…</div>
  if (error) return <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>{error}</div>
  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Planetary Dignity')} — 16 {t('Vargas')}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          Varga Visesha: strength across divisional charts. Simhasana ≥ 5 dignities, Gopura ≥ 4, Uttama ≥ 3, Parijata ≥ 2.
        </div>
      </div>

      {/* Visesha summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
        {data.planets?.map((p: any) => {
          const c = PLANET_COLORS[p.planet] || '#888'
          const dc = DIGNITY_COLORS[p.d1_dignity] || DIGNITY_COLORS.neutral
          return (
            <div key={p.planet} style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: 10, padding: '12px 10px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setSelPlanet(p.planet)}>
              <div style={{ fontSize: 13, fontWeight: 800, color: c, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.planet).slice(0,2)}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.d1_sign)?.slice(0,3)}</div>
              <div style={{ fontSize: 9, marginTop: 4, padding: '1px 4px', borderRadius: 6, background: dc.bg, color: dc.color, fontWeight: 600, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {t(p.d1_dignity)?.slice(0,5)}
              </div>
              <div style={{ marginTop: 5, height: 4, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(p.good_count / 16) * 100}%`, background: p.good_count >= 10 ? '#22c55e' : p.good_count >= 6 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginTop: 3 }}>{p.good_count}/16</div>
              <div style={{ fontSize: 9, color: 'var(--text4)', marginTop: 2, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(p.visesha?.split(' ')[0])}</div>
            </div>
          )
        })}
      </div>

      {/* Full varga table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'auto' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Full Dignity Matrix')}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', borderBottom: '1px solid var(--border)', position: 'sticky', left: 0, background: 'var(--surface2)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Planet')}</th>
              {VARGA_NAMES.map(v => (
                <th key={v} style={{ padding: '6px 8px', textAlign: 'center', fontSize: 10, color: 'var(--text3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{v}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.planets?.map((p: any, i: number) => (
              <tr key={p.planet} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: PLANET_COLORS[p.planet] || 'var(--text)', position: 'sticky', left: 0, background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {t(p.planet)}
                </td>
                {VARGA_NAMES.map(v => {
                  const vd = p.vargas?.[v]
                  const dc = DIGNITY_COLORS[vd?.dignity] || DIGNITY_COLORS.neutral
                  return (
                    <td key={v} title={`${v}: ${vd?.sign} — ${vd?.dignity}`} style={{ padding: '4px 6px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', fontSize: 9, padding: '1px 4px', borderRadius: 4,
                        background: dc.bg, color: dc.color, fontWeight: 600, whiteSpace: 'nowrap',
                      }}>
                        {vd?.sign?.slice(0,3) || '—'}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {Object.entries(DIGNITY_COLORS).map(([k, v]) => (
          <span key={k} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: v.bg, color: v.color, fontWeight: 600 }}>{v.label}</span>
        ))}
      </div>
      {selPlanet && data && (() => {
        const allPlanets = Object.fromEntries((data.planets || []).map((p: any) => [p.planet, { sign: p.d1_sign, house: p.house || 0, degree: p.degree || 0, status: p.d1_dignity }]))
        const pd = allPlanets[selPlanet]
        return pd ? <PlanetInterpretationDrawer planet={selPlanet} planetData={pd} allPlanets={allPlanets} onClose={() => setSelPlanet(null)} /> : null
      })()}
    </div>
  )
}
