import { useEffect, useState } from 'react'
import { portalApi } from '../../api/client'
import { useLang } from '../../contexts/LanguageContext'

export default function ClientPortalPage({ token }: { token: string }) {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    portalApi.view(token)
      .then(setData)
      .catch(e => setError(e?.response?.data?.detail || t('Link invalid or expired')))
  }, [token])

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#DC2626' }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('Cannot access portal')}</div>
      <div style={{ fontSize: 13, color: 'var(--text3)' }}>{error}</div>
    </div>
  )
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>{t('Loading…')}</div>

  const a = data.astrologer
  const c = data.client
  const accent = a.primary_color || '#7C2D12'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 0 }}>
      {/* Astrologer-branded header */}
      <header style={{ borderBottom: `2px solid ${accent}`, padding: '20px 24px', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 14 }}>
        {a.logo_url && <img src={a.logo_url} alt="" style={{ width: 50, height: 50, objectFit: 'contain' }} />}
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: accent }}>{a.display_name || t('Astrologer Portal')}</div>
          {a.title && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{a.title}</div>}
          {a.tagline && <div style={{ fontSize: 11, color: 'var(--text4)', fontStyle: 'italic' }}>{a.tagline}</div>}
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{t('Welcome')}, {c.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', display: 'grid', gridTemplateColumns: '120px 1fr', gap: 4 }}>
            <span>{t('Date of Birth')}:</span><span>{c.birth_date || '—'}</span>
            <span>{t('Time of Birth')}:</span><span>{c.birth_time || '—'}</span>
            <span>{t('Place of Birth')}:</span><span>{c.birth_place || '—'}</span>
            {data.ascendant_sign && (<><span>{t('Ascendant')}:</span><span style={{ color: accent, fontWeight: 700 }}>{data.ascendant_sign}</span></>)}
          </div>
        </div>

        {data.chart_svg && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{t('Your Birth Chart (Rashi)')}</div>
            <div dangerouslySetInnerHTML={{ __html: data.chart_svg }} />
          </div>
        )}

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{t('Your Reports')}</div>
          {data.reports.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t('No reports yet.')}</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
              {data.reports.map((r: any) => (
                <li key={r.id} style={{ marginBottom: 4 }}>
                  {t('Report')} — {new Date(r.created_at).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{t('Invoices')}</div>
          {data.invoices.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t('No invoices yet.')}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ background: 'var(--surface2)' }}>
                <th style={{ padding: 6, textAlign: 'left' }}>{t('Date')}</th>
                <th style={{ padding: 6, textAlign: 'left' }}>{t('Amount')}</th>
                <th style={{ padding: 6, textAlign: 'left' }}>{t('Status')}</th>
              </tr></thead>
              <tbody>
                {data.invoices.map((i: any) => (
                  <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 6 }}>{i.issued_on}</td>
                    <td style={{ padding: 6 }}>{i.currency} {i.amount}</td>
                    <td style={{ padding: 6, color: i.status === 'paid' ? '#16A34A' : '#DC2626' }}>{i.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: 'var(--text4)' }}>
          {a.phone && <span>📞 {a.phone}  </span>}
          {a.whatsapp && <span>{t('WA')} {a.whatsapp}  </span>}
          {a.email && <span>✉ {a.email}</span>}
        </footer>
      </main>
    </div>
  )
}
