import { useState, useEffect } from 'react'
import { sthiraDashaApi, moolaDashaApi, taraDashaApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E',
}

type Mode = 'sthira' | 'moola' | 'tara'
interface Props { birthData: any }

function DashaRow({ d }: { d: any }) {
  const color = PLANET_COLORS[d.lord] || '#888'
  return (
    <div style={{
      padding: '10px 14px',
      background: d.is_active ? color + '12' : 'var(--surface)',
      border: `1px solid ${d.is_active ? color + '60' : 'var(--border)'}`,
      borderLeft: `4px solid ${d.is_active ? color : 'transparent'}`,
      borderRadius: 'var(--radius-m)',
      display: 'grid', gridTemplateColumns: '140px 1fr 1fr auto',
      alignItems: 'center', gap: '10px',
    }}>
      <div>
        <span style={{ fontSize: '13px', fontWeight: '700', color }}>
          {d.lord || d.sign}
        </span>
        {d.tara && <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{d.tara}</div>}
        {d.nakshatra && <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{d.nakshatra}</div>}
        {d.sign && !d.lord?.includes(d.sign) && <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{d.sign}</div>}
      </div>
      <div style={{ fontSize: '11.5px', color: 'var(--text2)' }}>{d.start}</div>
      <div style={{ fontSize: '11.5px', color: 'var(--text2)' }}>{d.end}</div>
      <div style={{ fontSize: '11.5px', color: 'var(--text3)', textAlign: 'right' }}>
        {typeof d.years === 'number' ? d.years.toFixed(1) : d.years}y
        {d.is_active && <span style={{ marginLeft: '6px', fontSize: '10px', color, fontWeight: '700' }}>◉</span>}
      </div>
    </div>
  )
}

function DashaList({ data, loading, error }: { data: any; loading: boolean; error: string }) {
  const { t } = useLang()
  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>{t('Calculating…')}</div>
  if (error) return <div style={{ padding: '20px', color: 'var(--red)', fontSize: '13px' }}>{error}</div>
  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '140px 1fr 1fr auto', gap: '10px' }}>
        {[t('Lord / Sign'), t('Start'), t('End'), t('Duration')].map(h => (
          <div key={h} style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
        ))}
      </div>
      {data.dashas.map((d: any, i: number) => <DashaRow key={i} d={d} />)}
    </div>
  )
}

export default function MiscDashaPanel({ birthData }: Props) {
  const { t } = useLang()
  const [mode, setMode] = useState<Mode>('sthira')
  const [sthira, setSthira] = useState<any>(null)
  const [moola, setMoola] = useState<any>(null)
  const [tara, setTara] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!birthData) return
    const fetchers: Record<Mode, [() => Promise<any>, (v: any) => void]> = {
      sthira: [() => sthiraDashaApi.get(birthData), setSthira],
      moola:  [() => moolaDashaApi.get(birthData),  setMoola],
      tara:   [() => taraDashaApi.get(birthData),   setTara],
    }
    const current = { sthira, moola, tara }[mode]
    if (current) return
    setLoading(true); setError('')
    const [fn, setter] = fetchers[mode]
    fn().then(setter).catch((e: any) => setError(e.message)).finally(() => setLoading(false))
  }, [mode, birthData])

  const MODES: { id: Mode; label: string; sub: string }[] = [
    { id: 'sthira', label: t('Sthira Dasha'), sub: t('7y per sign from Lagna · 84y cycle') },
    { id: 'moola',  label: t('Moola Dasha'),  sub: t('Vimshottari from Lagna nakshatra · 120y') },
    { id: 'tara',   label: t('Tara Dasha'),   sub: t('9 Taras × 9y from Moon nakshatra · 81y') },
  ]

  const current = { sthira, moola, tara }[mode]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding: '10px 16px', borderRadius: 'var(--radius-m)', cursor: 'pointer',
            border: `1px solid ${mode === m.id ? 'var(--accent)' : 'var(--border)'}`,
            background: mode === m.id ? 'var(--accent)' : 'var(--surface)',
            color: mode === m.id ? '#fff' : 'var(--text)', textAlign: 'left',
          }}>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>{m.label}</div>
            <div style={{ fontSize: '10px', opacity: 0.75, marginTop: '2px' }}>{m.sub}</div>
          </button>
        ))}
      </div>

      {/* Info bar */}
      {current && (
        <div style={{
          padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-m)', fontSize: '12px', color: 'var(--text2)',
        }}>
          <strong>{current.system}</strong>
          {current.lagna_sign && <span> · {t('Lagna')}: {current.lagna_sign}</span>}
          {current.moon_nakshatra && <span> · {t('Moon Nakshatra')}: {current.moon_nakshatra}</span>}
          {current.lagna_nakshatra && <span> · {t('Lagna Nakshatra')}: {current.lagna_nakshatra}</span>}
        </div>
      )}

      {/* Dasha list */}
      <DashaList data={current} loading={loading} error={error} />
    </div>
  )
}
