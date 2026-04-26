import { useState } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLOR: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#D97706', Venus: '#7C3AED', Saturn: '#2563EB',
}

export default function SahamPanel({ birthData }: { birthData: any }) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetch = async () => {
    setLoading(true); setError('')
    try {
      const res = await apiPost('/api/calc/sahams', birthData)
      setData(res)
    } catch (e: any) {
      const d = e.response?.data?.detail
      setError(typeof d === 'string' ? d : e.message)
    } finally { setLoading(false) }
  }

  const sahams: any[] = (data?.sahams || []).filter((s: any) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.meaning.toLowerCase().includes(search.toLowerCase()))

  if (!data) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '14px', color: 'var(--text3)', marginBottom: '16px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
        {t('Sahams')} — {t('Vedic Arabic Parts')} (Lots). 20 sensitive points computed from planetary positions.
      </div>
      <button onClick={fetch} disabled={loading} style={{
        padding: '10px 28px', background: 'var(--accent)', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
      }}>{loading ? t('Calculating…') : t('Calculate Sahams')}</button>
      {error && <div style={{ marginTop: '12px', color: 'var(--red)', fontSize: '13px' }}>{error}</div>}
    </div>
  )

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{
        display: 'flex', gap: '20px', alignItems: 'center',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '14px 20px',
      }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Lagna: </span>
          <strong>{data.ascendant?.sign}</strong>
        </div>
        <div>
          <span style={{
            padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
            background: data.is_night_chart ? '#1e3a5f' : '#3a2a00',
            color: data.is_night_chart ? '#60a5fa' : '#fbbf24',
          }}>{data.is_night_chart ? '☽ Night Chart' : '☀ Day Chart'}</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{data.total} Sahams</div>
        <input placeholder="Search sahams…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: '6px',
            border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', width: '180px' }} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              {['Saham', 'Meaning', 'Sign', 'Degree', 'House', 'Lord', 'Formula'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px',
                  color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sahams.map((s: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '9px 14px', fontWeight: '700', color: 'var(--accent)' }}>{s.name}</td>
                <td style={{ padding: '9px 14px', fontSize: '12px', color: 'var(--text3)', maxWidth: '180px' }}>{s.meaning}</td>
                <td style={{ padding: '9px 14px', fontWeight: '500', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(s.sign)}</td>
                <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: 'var(--text2)' }}>{s.degree?.toFixed(2)}°</td>
                <td style={{ padding: '9px 14px' }}>
                  <span style={{
                    background: 'var(--accent-bg)', color: 'var(--accent)',
                    padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                  }}>H{s.house}</span>
                </td>
                <td style={{ padding: '9px 14px', fontWeight: '600', color: PLANET_COLOR[s.lord] || 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(s.lord)}</td>
                <td style={{ padding: '9px 14px', fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace' }}>{s.formula}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
