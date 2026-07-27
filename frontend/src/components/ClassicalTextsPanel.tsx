import { useState, useRef } from 'react'
import { classicalSearchApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const SOURCES = ['All', 'BPHS', 'Saravali', 'Phaladeepika', 'Lal Kitab', 'Jataka Parijata']

const QUICK_SEARCHES = [
  'Raja yoga', 'Dhana yoga', 'Gajakesari', 'Pancha Mahapurusha',
  'Saturn remedy', 'Mars marriage', 'Kuja dosha', 'Ashtakavarga',
  'Moon nakshatra', 'Jupiter exaltation', 'Rahu dasha', 'Viparita Raja',
]

const SOURCE_COLORS: Record<string, string> = {
  'BPHS': '#7C3AED', 'Saravali': '#B45309', 'Phaladeepika': '#0891B2',
  'Lal Kitab': '#DC2626', 'Jataka Parijata': '#16A34A',
}

export default function ClassicalTextsPanel() {
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('All')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useLang()

  const search = async (q: string = query) => {
    if (!q.trim()) return
    setLoading(true); setSearched(true)
    try {
      const res = await classicalSearchApi.search(q, source === 'All' ? undefined : source)
      setResults(res.results)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
        <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{t('Classical Jyotish Text Search')}</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
          {t('Search BPHS · Saravali · Phaladeepika · Lal Kitab · Jataka Parijata — shlokas and classical interpretations')}
        </div>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder={t('e.g. Saturn in 7th house, Raja yoga, Moon exaltation…')}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-m)',
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text)', fontSize: '13px',
          }}
        />
        <select value={source} onChange={e => setSource(e.target.value)} style={{
          padding: '10px 10px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text)', fontSize: '12px', cursor: 'pointer',
        }}>
          {SOURCES.map(s => <option key={s} value={s}>{t(s)}</option>)}
        </select>
        <button onClick={() => search()} disabled={loading || !query.trim()} style={{
          padding: '10px 20px', borderRadius: 'var(--radius-m)', border: 'none',
          background: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
        }}>
          {loading ? '…' : `🔍 ${t('Search')}`}
        </button>
      </div>

      {/* Quick search chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {QUICK_SEARCHES.map(q => (
          <button key={q} onClick={() => { setQuery(q); search(q) }} style={{
            padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--text3)', fontSize: '11px', cursor: 'pointer',
            fontWeight: '500',
          }}>{q}</button>
        ))}
      </div>

      {/* Results */}
      {searched && !loading && results.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
          {t('No results found. Try different keywords.')}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {results.map(r => {
          const srcColor = SOURCE_COLORS[r.source] || '#888'
          return (
            <div key={r.id} style={{ border: '1px solid var(--border)', borderLeft: `4px solid ${srcColor}`, borderRadius: 'var(--radius-m)', background: 'var(--surface)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: srcColor + '18', color: srcColor }}>
                  {r.source}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{r.chapter}</span>
                <span style={{ fontSize: '10px', color: 'var(--text4)', marginLeft: 'auto' }}>{t('Score')}: {r.relevance_score}</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>{r.topic}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7, fontStyle: 'italic' }}>"{r.shloka}"</div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {r.tags.slice(0, 6).map((tag: string) => (
                  <button key={tag} onClick={() => { setQuery(tag); search(tag) }} style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                    border: '1px solid var(--border)', background: 'var(--surface2)',
                    color: 'var(--text3)', cursor: 'pointer',
                  }}>{tag}</button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
