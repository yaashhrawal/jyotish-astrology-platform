import { useEffect, useState } from 'react'
import { researchApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'
import { translate } from '../i18n/terms'


const S = {
  wrap: { display: 'flex', gap: '20px' },
  panel: { background: '#0f1923', border: '1px solid #2a4a6b', borderRadius: '10px', padding: '20px' },
  label: { color: '#4a6fa5', fontSize: '12px', marginBottom: '4px', display: 'block' },
  select: { width: '100%', padding: '7px 10px', background: '#07111a', border: '1px solid #2a4a6b', borderRadius: '6px', color: '#e0e0e0', fontSize: '13px', marginBottom: '10px' },
  btn: { padding: '9px 18px', background: '#4a9eff', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  title: { color: '#4a9eff', fontSize: '15px', fontWeight: 'bold', marginBottom: '14px' },
  chartCard: { background: '#07111a', border: '1px solid #1a3a5c', borderRadius: '8px', padding: '12px', marginBottom: '8px' },
  badge: { fontSize: '11px', padding: '2px 6px', borderRadius: '3px', background: '#1a3a5c', color: '#4a9eff', margin: '2px' },
  stat: { display: 'inline-block', padding: '8px 14px', background: '#07111a', border: '1px solid #1a3a5c', borderRadius: '8px', margin: '4px', textAlign: 'center' as const },
}

export default function ResearchLab() {
  const { lang, t } = useLang()
  const [filters, setFilters] = useState<Record<string, string>>({})

  const SIGNS_T = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].map(s => ({ val: s, label: translate(s, lang) }))
  const PLANETS_T = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map(p => ({ val: p, label: translate(p, lang) }))
  const [results, setResults] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    researchApi.stats().then(setStats).catch(() => {})
  }, [])

  const set = (key: string, val: string) => setFilters(f => val ? { ...f, [key]: val } : (({ [key]: _, ...rest }) => rest)(f))

  const search = async () => {
    setLoading(true)
    try {
      const r = await researchApi.filter(filters)
      setResults(r)
    } catch { setResults({ charts: [], count: 0 }) }
    setLoading(false)
  }

  const reset = () => { setFilters({}); setResults(null) }

  return (
    <div>
      <div style={S.wrap}>
        {/* Filter panel */}
        <div style={{ ...S.panel, width: '280px', flexShrink: 0 }}>
          <div style={S.title}>{t('Filter')}</div>

          <label style={S.label}>{t('Ascendant')}</label>
          <select style={S.select} value={filters.ascendant || ''} onChange={e => set('ascendant', e.target.value)}>
            <option value="">—</option>
            {SIGNS_T.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
          </select>

          <label style={S.label}>{t('Moon Sign')}</label>
          <select style={S.select} value={filters.moon_sign || ''} onChange={e => set('moon_sign', e.target.value)}>
            <option value="">—</option>
            {SIGNS_T.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
          </select>

          <label style={S.label}>{translate('Sun', lang)}</label>
          <select style={S.select} value={filters.sun_sign || ''} onChange={e => set('sun_sign', e.target.value)}>
            <option value="">—</option>
            {SIGNS_T.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
          </select>

          <label style={S.label}>{t('Atmakaraka')}</label>
          <select style={S.select} value={filters.atmakaraka || ''} onChange={e => set('atmakaraka', e.target.value)}>
            <option value="">—</option>
            {PLANETS_T.slice(0, 7).map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
          </select>

          <label style={S.label}>{t('Dasha')}</label>
          <select style={S.select} value={filters.active_md || ''} onChange={e => set('active_md', e.target.value)}>
            <option value="">—</option>
            {PLANETS_T.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
          </select>

          <div style={{ borderTop: '1px solid #1a3a5c', paddingTop: '12px', marginTop: '4px' }}>
            <label style={S.label}>{t('Filter')}</label>
            <select style={S.select} value={filters.planet || ''} onChange={e => set('planet', e.target.value)}>
              <option value="">—</option>
              {PLANETS_T.map(p => <option key={p.val} value={p.val.toLowerCase()}>{p.label}</option>)}
            </select>
            {filters.planet && <>
              <label style={S.label}>{t('In Sign')}</label>
              <select style={S.select} value={filters.planet_sign || ''} onChange={e => set('planet_sign', e.target.value)}>
                <option value="">—</option>
                {SIGNS_T.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
              </select>
              <label style={S.label}>{t('In House')}</label>
              <select style={S.select} value={filters.planet_house || ''} onChange={e => set('planet_house', e.target.value)}>
                <option value="">—</option>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}
              </select>
            </>}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button style={S.btn} onClick={search} disabled={loading}>
              {loading ? '…' : t('Search')}
            </button>
            <button style={{ ...S.btn, background: '#1a3a5c' }} onClick={reset}>✕</button>
          </div>
        </div>

        {/* Results panel */}
        <div style={{ flex: 1 }}>
          {/* Stats */}
          {stats && !results && (
            <div style={S.panel}>
              <div style={S.title}>Your Chart Database</div>
              <div style={{ marginBottom: '16px' }}>
                <span style={S.stat}><div style={{ color: '#4a9eff', fontSize: '22px', fontWeight: 'bold' }}>{stats.total_charts}</div><div style={{ color: '#4a6fa5', fontSize: '11px' }}>Total Charts</div></span>
              </div>
              {stats.ascendant_distribution?.length > 0 && (
                <div>
                  <div style={{ color: '#4a6fa5', fontSize: '12px', marginBottom: '8px' }}>Ascendant Distribution</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {stats.ascendant_distribution.map((r: any) => (
                      <span key={r.ascendant_sign} style={S.badge}>{r.ascendant_sign}: {r.count}</span>
                    ))}
                  </div>
                </div>
              )}
              {stats.top_yogas?.length > 0 && (
                <div style={{ marginTop: '14px' }}>
                  <div style={{ color: '#4a6fa5', fontSize: '12px', marginBottom: '8px' }}>Most Common Yogas</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {stats.top_yogas.map((r: any) => (
                      <span key={r.yoga} style={{ ...S.badge, color: '#F39C12' }}>{r.yoga}: {r.count}</span>
                    ))}
                  </div>
                </div>
              )}
              {stats.total_charts === 0 && (
                <div style={{ color: '#4a6fa5', fontSize: '13px' }}>
                  No charts in database yet. Save charts from the Birth Chart tab to start researching patterns.
                </div>
              )}
            </div>
          )}

          {results && (
            <div style={S.panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={S.title}>Results: {results.count} charts found</div>
                <button style={{ ...S.btn, background: '#1a3a5c', fontSize: '12px', padding: '6px 12px' }} onClick={reset}>← Back</button>
              </div>
              {results.charts.length === 0 && (
                <div style={{ color: '#4a6fa5', fontSize: '13px' }}>No charts match these filters.</div>
              )}
              {results.charts.map((c: any) => (
                <div key={c.id} style={S.chartCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ color: '#4a9eff', fontWeight: 'bold', fontSize: '14px' }}>{c.name}</div>
                      <div style={{ color: '#4a6fa5', fontSize: '12px', marginTop: '2px' }}>
                        {c.birth_date} · {c.birth_place} · {c.ascendant_sign} Lagna
                      </div>
                      <div style={{ color: '#6b8fc4', fontSize: '12px' }}>
                        Moon: {c.moon_sign} · AK: {c.atmakaraka} · MD: {c.active_md}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      {c.yogas?.slice(0, 3).map((y: string) => <span key={y} style={S.badge}>{y}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
