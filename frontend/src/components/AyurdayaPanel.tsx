import { useState } from 'react'
import { apiPost } from '../api/client'
import { useLang } from '../contexts/LanguageContext'

const PLANET_COLOR: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#D97706', Venus: '#7C3AED', Saturn: '#2563EB',
}

function ContribTable({ label, items, yearKey = 'contribution' }: { label: string; items: any[]; yearKey?: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', fontWeight: '600', fontSize: '12px',
        background: 'var(--bg)', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>{label}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
        <tbody>
          {items.map((it: any, i: number) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '7px 14px', fontWeight: '600', color: PLANET_COLOR[it.planet] || 'var(--text)' }}>{it.planet}</td>
              <td style={{ padding: '7px 14px', color: 'var(--text3)', fontSize: '12px' }}>
                {it.navamsha_sign || it.degree != null ? `${it.navamsha_sign || ''} ${it.degree != null ? it.degree + '°' : ''}` : `×${it.factor}`}
              </td>
              <td style={{ padding: '7px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                {it[yearKey]?.toFixed(1)} yrs
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AyurdayaPanel({ birthData }: { birthData: any }) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetch = async () => {
    setLoading(true); setError('')
    try {
      const res = await apiPost('/api/calc/ayurdaya', birthData)
      setData(res)
    } catch (e: any) {
      const d = e.response?.data?.detail
      setError(typeof d === 'string' ? d : e.message)
    } finally { setLoading(false) }
  }

  if (!data) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '14px', color: 'var(--text3)', marginBottom: '16px', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
        {t('Ayurdaya')} — {t('Longevity')} calculation using Pindayu, Amsayu, Nisargayu methods
      </div>
      <button onClick={fetch} disabled={loading} style={{
        padding: '10px 28px', background: 'var(--accent)', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
        fontFamily: "'Noto Sans Devanagari', sans-serif",
      }}>{loading ? t('Calculating…') : t('Calculate Longevity')}</button>
      {error && <div style={{ marginTop: '12px', color: 'var(--red)', fontSize: '13px' }}>{error}</div>}
    </div>
  )

  const classColor = (c: string) => c.startsWith('Alpa') ? 'var(--red)' : c.startsWith('Poornayu') ? 'var(--green)' : '#D97706'

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Result summary */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '20px 24px',
        display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        {[
          { label: 'Pindayu', years: data.pindayu?.years },
          { label: 'Amsayu', years: data.amsayu?.years },
          { label: 'Nisargayu', years: data.nisargayu?.years },
        ].map(m => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent)' }}>{m.years}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(m.label)}</div>
          </div>
        ))}
        <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--gold)' }}>{data.minimum_years}</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Minimum')}</div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: classColor(data.classification_minimum), marginTop: '4px' }}>
            {data.classification_minimum?.split(' ')[0]}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text2)' }}>{data.average_years}</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('Average')}</div>
        </div>
      </div>

      {/* Classification */}
      <div style={{
        padding: '12px 20px', borderRadius: '8px', fontSize: '13px',
        background: 'var(--accent-bg)', border: '1px solid var(--accent)',
        color: 'var(--accent)', fontWeight: '500',
      }}>
        Classification: <strong>{data.classification_minimum}</strong>
      </div>

      {/* Three method tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <ContribTable label="Pindayu (Planet Degrees)" items={data.pindayu?.contributions || []} />
        <ContribTable label="Amsayu (Navamsha)" items={data.amsayu?.contributions || []} />
        <ContribTable label="Nisargayu (Natural Years)" items={data.nisargayu?.contributions || []} />
      </div>

      {/* Disclaimer */}
      <div style={{ fontSize: '12px', color: 'var(--text4)', padding: '10px 14px',
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px' }}>
        ⚠ {data.note}
      </div>
    </div>
  )
}
