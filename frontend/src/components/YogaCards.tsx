import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { apiPost } from '../api/client'

interface Yoga {
  name: string
  type: string
  description: string
  strength: string
}

interface Props {
  birthData: {
    year: number; month: number; day: number
    hour: number; minute: number; tz_offset: number
    latitude: number; longitude: number; ayanamsa: string
  }
}

const TYPE_STYLE: Record<string, { accent: string; bg: string; dot: string }> = {
  'Pancha Mahapurusha': { accent: '#16A34A', bg: '#F0FDF4', dot: '#16A34A' },
  'Raj Yoga':           { accent: '#5746AF', bg: '#EEF0FB', dot: '#5746AF' },
  'Intelligence Yoga':  { accent: '#7C3AED', bg: '#F5F3FF', dot: '#7C3AED' },
  'Wealth Yoga':        { accent: '#B45309', bg: '#FEFCE8', dot: '#B45309' },
  'Solar Yoga':         { accent: '#D97706', bg: '#FFF7ED', dot: '#D97706' },
  'Strength Indicator': { accent: '#0891B2', bg: '#F0F9FF', dot: '#0891B2' },
  'Challenging Yoga':   { accent: '#C53030', bg: '#FFF5F5', dot: '#C53030' },
  'Protective Yoga':    { accent: '#16A34A', bg: '#F0FDF4', dot: '#16A34A' },
  'Character Yoga':     { accent: '#0891B2', bg: '#F0F9FF', dot: '#0891B2' },
  'default':            { accent: '#57534E', bg: '#F7F6F3', dot: '#A8A29E' },
}

const STRENGTH_STARS: Record<string, React.ReactNode> = {
  strong:      <span style={{ color: '#D97706', fontSize: '11px' }}>★★★</span>,
  moderate:    <span style={{ color: '#D97706', fontSize: '11px' }}>★★<span style={{ color: '#E8E6DF' }}>★</span></span>,
  weak:        <span style={{ color: '#D97706', fontSize: '11px' }}>★<span style={{ color: '#E8E6DF' }}>★★</span></span>,
  challenging: <span style={{ color: '#C53030', fontSize: '11px' }}>⚠</span>,
}

export default function YogaCards({ birthData }: Props) {
  const { t } = useLang()
  const [yogas, setYogas] = useState<Yoga[]>([])
  const [loading, setLoading] = useState(true)
  const [ascendant, setAscendant] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    apiPost('/api/calc/yogas', birthData)
      .then((r: any) => { setYogas(r.yogas || []); setAscendant(r.ascendant || '') })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const typeStyle = (type: string) => TYPE_STYLE[type] || TYPE_STYLE['default']
  const allTypes = ['all', ...Array.from(new Set(yogas.map(y => y.type)))]
  const filtered = filter === 'all' ? yogas : yogas.filter(y => y.type === filter)

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
      <div style={{ fontSize: '13px' }}>Detecting yogas…</div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '3px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Yoga Analysis')}</h3>
          <div style={{ fontSize: '12.5px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            {t(ascendant)} {t('Ascendant')} · <strong style={{ color: 'var(--text2)' }}>{yogas.length}</strong> {t('yogas detected')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {allTypes.map(tab => (
            <button key={tab} onClick={() => setFilter(tab)} style={{
              padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', cursor: 'pointer',
              border: '1px solid',
              borderColor: filter === tab ? 'var(--accent)' : 'var(--border)',
              background: filter === tab ? 'var(--accent-bg)' : 'transparent',
              color: filter === tab ? 'var(--accent)' : 'var(--text3)',
              fontWeight: filter === tab ? '600' : '400',
              transition: 'all .15s',
              fontFamily: "'Noto Sans Devanagari', sans-serif",
            }}>
              {tab === 'all' ? `${t('All')} (${yogas.length})` : t(tab)}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontStyle: 'italic' }}>
          No yogas in this category
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {filtered.map((yoga, i) => {
            const s = typeStyle(yoga.type)
            const devFont = "'Noto Sans Devanagari', sans-serif"
            return (
              <div key={i} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '16px',
                borderLeft: `3px solid ${s.accent}`,
                transition: 'transform .15s, box-shadow .15s',
                boxShadow: 'var(--shadow-xs)',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-m)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'none'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-xs)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text)', lineHeight: 1.3, fontFamily: devFont }}>
                    {t(yoga.name)}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: '8px' }}>{STRENGTH_STARS[yoga.strength]}</div>
                </div>
                <span style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: '12px', marginBottom: '10px',
                  fontSize: '10.5px', fontWeight: '600', letterSpacing: '0.01em',
                  background: s.bg, color: s.accent, fontFamily: devFont,
                }}>{t(yoga.type)}</span>
                <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.55, fontFamily: devFont }}>
                  {t(yoga.description)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary bar */}
      {yogas.length > 0 && (
        <div style={{
          marginTop: '20px', padding: '14px 18px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '8px', display: 'flex', gap: '20px', flexWrap: 'wrap',
        }}>
          {Object.entries(
            yogas.reduce((acc, y) => { acc[y.type] = (acc[y.type] || 0) + 1; return acc }, {} as Record<string,number>)
          ).map(([type, count]) => {
            const s = typeStyle(type)
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.dot, flexShrink: 0, display: 'block' }} />
                <span style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(type)}:</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: s.accent }}>{count}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
