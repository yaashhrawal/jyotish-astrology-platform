import { useEffect, useState } from 'react'
import axios from 'axios'

const fmtINR = (paise: number) => '₹' + (paise / 100).toLocaleString('en-IN')
const BASE = import.meta.env.VITE_API_URL || ''

const STATUS_LABELS: Record<string, string> = {
  recommended: 'Awaiting Payment',
  paid: 'Payment Received',
  processing: 'Preparing for Shipment',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function GemPurchasePage({ orderNumber }: { orderNumber: string }) {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get(`${BASE}/api/gem-order/${orderNumber}`)
      .then(r => setData(r.data))
      .catch(e => setError(e?.response?.data?.detail || 'Order not found'))
  }, [orderNumber])

  if (error) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#DC2626' }}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Order not found</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>{error}</div>
    </div>
  )
  if (!data) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)' }}>Loading order…</div>

  const accent = '#7C2D12'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ borderBottom: `2px solid ${accent}`, padding: '20px 24px', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 14 }}>
        {data.logo_url && <img src={data.logo_url} alt="" style={{ width: 50, height: 50, objectFit: 'contain' }} />}
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: accent }}>{data.astrologer_name || 'Astrologer'}</div>
          {data.tagline && <div style={{ fontSize: 11, color: 'var(--text4)', fontStyle: 'italic' }}>{data.tagline}</div>}
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {data.image_url ? (
              <img src={data.image_url} alt="" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div style={{ width: 140, height: 140, borderRadius: 8, background: 'linear-gradient(135deg, #fde68a, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>💎</div>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{data.gem_name}</div>
              {data.sanskrit_name && <div style={{ fontSize: 14, color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari', serif" }}>{data.sanskrit_name}</div>}
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>{data.color}</div>
              <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 12, background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700 }}>
                ✓ {data.cert_authority}
              </div>
              <div style={{ marginTop: 16, fontSize: 24, fontWeight: 700 }}>{fmtINR(data.retail_price_paise)}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{data.carat} carat · Order #{data.order_number}</div>
            </div>
          </div>

          <div style={{ marginTop: 20, padding: 14, background: 'var(--surface2)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>Status</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: data.status === 'paid' || data.status === 'delivered' ? '#16A34A' : accent }}>
              {STATUS_LABELS[data.status] || data.status}
            </div>
          </div>

          {data.description && (
            <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              {data.description}
            </div>
          )}
        </div>

        {data.status === 'recommended' && (
          <div style={{ background: '#16A34A', color: '#fff', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Ready to purchase?</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 14 }}>
              Payment integration coming soon. Contact your astrologer to complete payment.
            </div>
            <button style={{
              padding: '10px 24px', background: '#fff', color: '#16A34A',
              border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Pay {fmtINR(data.retail_price_paise)}</button>
          </div>
        )}

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Authenticity Guaranteed</div>
          <ul style={{ fontSize: 12, color: 'var(--text3)', margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
            <li>Lab-certified by <strong>{data.cert_authority}</strong> — original PDF cert ships with stone</li>
            <li>15-day return window, no questions asked</li>
            <li>Insured shipping</li>
            <li>80% buyback guarantee for 1 year</li>
          </ul>
        </div>

        <footer style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: 'var(--text4)' }}>
          Recommended by {data.astrologer_name || 'your astrologer'} · Powered by JyotishApp
        </footer>
      </main>
    </div>
  )
}
