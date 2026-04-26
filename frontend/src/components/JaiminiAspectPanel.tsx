import { useState } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLOR: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#D97706', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E',
  Ascendant: 'var(--accent)',
}

const TYPE_COLOR: Record<string, string> = {
  movable: '#16A34A', fixed: '#DC2626', dual: '#7C3AED',
}

export default function JaiminiAspectPanel({ birthData }: { birthData: any }) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'matrix' | 'mutual' | 'grid'>('matrix')

  const fetch = async () => {
    setLoading(true); setError('')
    try {
      const res = await apiPost('/api/calc/jaimini_aspects', birthData)
      setData(res)
    } catch (e: any) {
      const d = e.response?.data?.detail
      setError(typeof d === 'string' ? d : e.message)
    } finally { setLoading(false) }
  }

  if (!data) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '14px', color: 'var(--text3)', marginBottom: '8px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
        {t('Jaimini Aspects')} — sign-to-sign aspects (not degree-based)
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '16px' }}>
        Movable ↔ Fixed (non-adjacent) · Dual ↔ Dual · All ↔ 7th
      </div>
      <button onClick={fetch} disabled={loading} style={{
        padding: '10px 28px', background: 'var(--accent)', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
      }}>{loading ? 'Calculating…' : 'Calculate'}</button>
      {error && <div style={{ marginTop: '12px', color: 'var(--red)', fontSize: '13px' }}>{error}</div>}
    </div>
  )

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {(['matrix', 'mutual', 'grid'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '6px 16px', borderRadius: '6px', border: '1px solid var(--border)',
            background: view === v ? 'var(--accent)' : 'transparent',
            color: view === v ? '#fff' : 'var(--text3)',
            cursor: 'pointer', fontSize: '12.5px', textTransform: 'capitalize',
          }}>{v === 'matrix' ? 'Planet Matrix' : v === 'mutual' ? 'Mutual Aspects' : 'Sign Grid'}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)', alignSelf: 'center' }}>
          Lagna: {data.ascendant?.sign} · {data.mutual_aspects?.length} mutual aspects
        </span>
      </div>

      {view === 'matrix' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {[t('Planet'), t('Sign'), t('Type'), t('House'), t('Aspects Signs'), t('Aspects Planets')].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px',
                    color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.aspect_matrix || []).map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '9px 14px', fontWeight: '700', color: PLANET_COLOR[row.from] || 'var(--text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(row.from)}</td>
                  <td style={{ padding: '9px 14px', fontWeight: '500', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(row.from_sign)}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600',
                      background: TYPE_COLOR[row.from_type] + '18', color: TYPE_COLOR[row.from_type],
                    }}>{row.from_type}</span>
                  </td>
                  <td style={{ padding: '9px 14px', color: 'var(--accent)', fontWeight: '600' }}>H{row.from_house}</td>
                  <td style={{ padding: '9px 14px', fontSize: '12px', color: 'var(--text2)' }}>
                    {row.aspects_signs?.join(', ') || '—'}
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(row.aspects_planets || []).map((p: string) => (
                        <span key={p} style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                          background: (PLANET_COLOR[p] || '#666') + '18',
                          color: PLANET_COLOR[p] || 'var(--text)',
                          fontWeight: '600',
                        }}>{p}</span>
                      ))}
                      {!row.aspects_planets?.length && <span style={{ color: 'var(--text4)', fontSize: '11px' }}>none</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'mutual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.mutual_aspects?.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px' }}>No mutual aspects found</div>
          )}
          {(data.mutual_aspects || []).map((m: any, i: number) => (
            <div key={i} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontWeight: '700', color: PLANET_COLOR[m.planet1] || 'var(--text)' }}>{m.planet1}</span>
              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{m.sign1}</span>
              <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '16px' }}>⟺</span>
              <span style={{ fontWeight: '700', color: PLANET_COLOR[m.planet2] || 'var(--text)' }}>{m.planet2}</span>
              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{m.sign2}</span>
              <span style={{
                marginLeft: 'auto', fontSize: '11px', padding: '2px 10px', borderRadius: '20px',
                background: 'var(--green-bg)', color: 'var(--green)', fontWeight: '600',
              }}>Mutual Aspect</span>
            </div>
          ))}
        </div>
      )}

      {view === 'grid' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{ padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)' }}>→</th>
                {(data.sign_grid || []).map((s: any) => (
                  <th key={s.sign} style={{ padding: '6px 8px', background: 'var(--bg)',
                    border: '1px solid var(--border)', fontSize: '10px', writingMode: 'vertical-rl',
                    whiteSpace: 'nowrap', textAlign: 'left', height: '70px' }}>{s.sign.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.sign_grid || []).map((row: any) => (
                <tr key={row.sign}>
                  <td style={{ padding: '6px 10px', fontWeight: '600', fontSize: '11px',
                    background: 'var(--bg)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    {row.sign.slice(0, 3)}
                  </td>
                  {row.aspects.map((aspected: boolean, j: number) => (
                    <td key={j} style={{
                      width: '28px', height: '28px', textAlign: 'center',
                      border: '1px solid var(--border)',
                      background: row.sign_index === j ? 'var(--border)' : aspected ? 'var(--accent-bg)' : 'transparent',
                      color: aspected ? 'var(--accent)' : 'transparent',
                      fontSize: '12px', fontWeight: '700',
                    }}>{aspected && row.sign_index !== j ? '●' : ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text3)' }}>
            ● = aspected sign. Rows = aspecting sign. Columns = aspected sign.
          </div>
        </div>
      )}

      <div style={{ fontSize: '12px', color: 'var(--text4)', padding: '8px 14px',
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px' }}>
        {data.note}
      </div>
    </div>
  )
}
