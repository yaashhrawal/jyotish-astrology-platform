import { useState } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const KIND_COLOR: Record<string, string> = {
  shadow: 'var(--red)', gulika: '#7C3AED', neutral: 'var(--text3)',
}

const HOUSE_MEANING: Record<number, string> = {
  1: 'Self', 2: 'Wealth', 3: 'Siblings', 4: 'Home', 5: 'Children',
  6: 'Enemies', 7: 'Spouse', 8: 'Longevity', 9: 'Fortune',
  10: 'Career', 11: 'Gains', 12: 'Loss',
}

export default function UpagrahaPanel({ birthData }: { birthData: any }) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetch = async () => {
    setLoading(true); setError('')
    try {
      const res = await apiPost('/api/calc/upagrahas', birthData)
      setData(res)
    } catch (e: any) {
      const d = e.response?.data?.detail
      setError(typeof d === 'string' ? d : e.message)
    } finally { setLoading(false) }
  }

  if (!data) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '14px', color: 'var(--text3)', marginBottom: '16px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
        {t('Upagrahas')} — shadow sub-planets derived from Sun's position
      </div>
      <button onClick={fetch} disabled={loading} style={{
        padding: '10px 28px', background: 'var(--accent)', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
      }}>{loading ? t('Calculating…') : t('Calculate Upagrahas')}</button>
      {error && <div style={{ marginTop: '12px', color: 'var(--red)', fontSize: '13px' }}>{error}</div>}
    </div>
  )

  const upagrahas: any[] = data.upagrahas || []

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '16px 20px',
        display: 'flex', gap: '32px', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Lagna</div>
          <div style={{ fontSize: '15px', fontWeight: '700', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(data.ascendant?.sign)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Weekday</div>
          <div style={{ fontSize: '15px', fontWeight: '700' }}>{data.weekday}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Gulika in</div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#7C3AED' }}>
            {data.gulika_sign} · H{data.gulika_house}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)', maxWidth: '280px' }}>
          {data.note}
        </div>
      </div>

      {/* Upagraha table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {['Upagraha', 'Abbr', 'Sign', 'Degree', 'House', 'Meaning', 'Nature'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px',
                  color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {upagrahas.map((u, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid var(--border)',
                background: u.kind === 'gulika' ? '#7C3AED08' : 'transparent',
              }}>
                <td style={{ padding: '10px 14px', fontWeight: '600',
                  color: u.kind === 'gulika' ? '#7C3AED' : 'var(--text)' }}>{u.name}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text3)', fontFamily: 'monospace' }}>{u.abbr}</td>
                <td style={{ padding: '10px 14px', fontWeight: '500', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(u.sign)}</td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'var(--text2)' }}>{u.degree?.toFixed(2)}°</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    background: 'var(--accent-bg)', color: 'var(--accent)',
                    padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                  }}>H{u.house}</span>
                  <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--text3)' }}>
                    {HOUSE_MEANING[u.house] || ''}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text3)', maxWidth: '260px' }}>{u.meaning}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                    background: u.kind === 'gulika' ? '#7C3AED18' : 'var(--red-bg)',
                    color: KIND_COLOR[u.kind] || 'var(--text3)',
                    fontWeight: '600',
                  }}>{u.kind}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gulika highlight */}
      <div style={{
        background: '#7C3AED0A', border: '1px solid #7C3AED30',
        borderRadius: '10px', padding: '16px 20px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#7C3AED', marginBottom: '6px' }}>
          Gulika (Mandi) — Most Malefic Upagraha
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>
          Son of Saturn. Position in <strong>{data.gulika_sign}</strong> (House {data.gulika_house} — {HOUSE_MEANING[data.gulika_house]})
          indicates the life area most afflicted by Gulika's separative, poison-like energy.
          Planets conjunct Gulika in natal chart are weakened in the matters of that house.
        </div>
      </div>
    </div>
  )
}
