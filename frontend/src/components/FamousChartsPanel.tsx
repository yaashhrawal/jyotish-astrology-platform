import { useState, useEffect } from 'react'
import { famousChartsApi } from '../api/client'

const CATEGORY_COLORS: Record<string, string> = {
  'Saint/Philosopher': '#7C3AED',
  'Saint/Mystic': '#7C3AED',
  'Saint/Yogi': '#7C3AED',
  'Political Leader': '#DC2626',
  'Military/Political': '#DC2626',
  'Historical Figure': '#B45309',
  'Scientist': '#0891B2',
  'Scientist/Inventor': '#0891B2',
  'Mathematician': '#0891B2',
  'Artist/Polymath': '#D97706',
  'Musician': '#D97706',
  'Writer/Poet': '#D97706',
  'Astrologer': '#6366F1',
  'Actor': '#EC4899',
  'Singer': '#EC4899',
  'Sportsperson': '#16A34A',
  'Entrepreneur': '#F59E0B',
}

interface FamousChart {
  id: string
  name: string
  category: string
  year: number; month: number; day: number
  hour: number; minute: number
  latitude: number; longitude: number; tz_offset: number
  place: string
  tags: string[]
  notes: string
}

interface Props {
  onLoadChart?: (chart: FamousChart) => void
}

export default function FamousChartsPanel({ onLoadChart }: Props) {
  const [charts, setCharts] = useState<FamousChart[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')
  const [selectedTag, setSelectedTag] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    famousChartsApi.meta().then(d => {
      setCategories(d.categories)
      setAllTags(d.tags)
    }).catch(() => {})
    fetchCharts()
  }, [])

  const fetchCharts = async (params?: any) => {
    setLoading(true)
    try {
      const d = await famousChartsApi.list(params)
      setCharts(d.charts)
    } catch { setCharts([]) }
    finally { setLoading(false) }
  }

  const search = () => {
    const params: any = {}
    if (q.trim()) params.q = q.trim()
    if (selectedCat !== 'All') params.category = selectedCat
    if (selectedTag) params.tag = selectedTag
    fetchCharts(params)
  }

  const reset = () => {
    setQ(''); setSelectedCat('All'); setSelectedTag('')
    fetchCharts()
  }

  const fmtDate = (c: FamousChart) => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const h = Math.floor(c.hour).toString().padStart(2, '0')
    const m = c.minute.toString().padStart(2, '0')
    return `${c.day} ${months[c.month - 1]} ${c.year}, ${h}:${m}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
        <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Famous Charts Atlas</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
          Study birth charts of saints, leaders, scientists, artists & more — {charts.length || 26} notable figures
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Search by name, place, tag…"
          style={{ flex: 1, minWidth: '180px', padding: '9px 12px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px' }}
        />
        <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} style={{
          padding: '9px 10px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text)', fontSize: '12px',
        }}>
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} style={{
          padding: '9px 10px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text)', fontSize: '12px',
        }}>
          <option value="">All Tags</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={search} style={{ padding: '9px 18px', borderRadius: 'var(--radius-m)', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          🔍 Search
        </button>
        <button onClick={reset} style={{ padding: '9px 14px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer' }}>
          Reset
        </button>
      </div>

      {/* Results */}
      {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: '13px' }}>Loading…</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
        {charts.map(c => {
          const color = CATEGORY_COLORS[c.category] || '#888'
          const isOpen = expanded === c.id
          return (
            <div key={c.id} style={{ border: '1px solid var(--border)', borderLeft: `4px solid ${color}`, borderRadius: 'var(--radius-m)', background: 'var(--surface)', overflow: 'hidden' }}>
              {/* Card header */}
              <div
                onClick={() => setExpanded(isOpen ? null : c.id)}
                style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', marginBottom: '2px' }}>{c.name}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', background: color + '18', color }}>{c.category}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{fmtDate(c)} · {c.place}</div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text4)', marginTop: '2px' }}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Coords */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    {[
                      ['Lat', c.latitude.toFixed(4)],
                      ['Lon', c.longitude.toFixed(4)],
                      ['TZ', (c.tz_offset >= 0 ? '+' : '') + c.tz_offset],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background: 'var(--surface2)', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)' }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <div style={{ fontSize: '11.5px', color: 'var(--text2)', lineHeight: 1.6, fontStyle: 'italic' }}>{c.notes}</div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {c.tags.map(t => (
                      <span key={t} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text3)' }}>
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Load chart button */}
                  {onLoadChart && (
                    <button
                      onClick={() => onLoadChart(c)}
                      style={{ padding: '8px 16px', borderRadius: 'var(--radius-m)', border: 'none', background: color, color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', width: '100%' }}
                    >
                      📊 Load This Chart
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!loading && charts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: '13px' }}>No charts found.</div>
      )}
    </div>
  )
}
