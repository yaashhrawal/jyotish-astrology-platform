import { useEffect, useState } from 'react'
import { gemsApi } from '../../api/client'
import { useLang } from '../../contexts/LanguageContext'
import toast from 'react-hot-toast'

const fmtINR = (paise: number) => '₹' + (paise / 100).toLocaleString('en-IN')
const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px',
}

const STATUS_COLORS: Record<string, string> = {
  recommended: '#6b7280', paid: '#0891B2', processing: '#7C3AED',
  shipped: '#D97706', delivered: '#16A34A', reviewed: '#16A34A',
  cancelled: '#DC2626', refunded: '#DC2626',
}

export default function EarningsPanel() {
  const { t } = useLang()
  const [data, setData] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const [drillOrder, setDrillOrder] = useState<any>(null)

  const reload = () => {
    setLoading(true)
    Promise.all([gemsApi.earnings(), gemsApi.orders(filter || undefined)])
      .then(([e, o]) => { setData(e); setOrders(o) })
      .finally(() => setLoading(false))
  }

  useEffect(reload, [filter])

  if (loading || !data) return <div style={{ padding: 40, color: 'var(--text3)' }}>{t('Loading earnings…')}</div>

  const s = data.summary

  const updateStatus = async (id: string, status: string) => {
    await gemsApi.updateStatus(id, status)
    toast.success(`${t('Status')} → ${status}`)
    reload()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>💰 {t('Gem Commission Earnings')}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          {t('Plan:')} <strong>{s.plan}</strong>{s.plan_boost_pct > 0 && <span> (+{s.plan_boost_pct}% {t('boost')})</span>}
          {s.volume_bonus_active && <span style={{ color: '#16A34A', fontWeight: 600 }}> · {t('Volume bonus active')} +2%</span>}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div style={card}>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{t('PENDING')}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#D97706' }}>{fmtINR(s.pending_paise)}</div>
          <div style={{ fontSize: 10, color: 'var(--text4)' }}>{t('Awaiting clearance')}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{t('PAID OUT')}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#16A34A' }}>{fmtINR(s.paid_paise)}</div>
          <div style={{ fontSize: 10, color: 'var(--text4)' }}>{t('Settled to your account')}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{t('LIFETIME')}</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{fmtINR(s.lifetime_paise)}</div>
          <div style={{ fontSize: 10, color: 'var(--text4)' }}>{s.total_orders} {t('orders')}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{t('VOLUME BONUS @')} {fmtINR(s.next_volume_threshold_paise)}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: s.volume_bonus_active ? '#16A34A' : 'var(--text3)' }}>
            {s.volume_bonus_active ? t('ACTIVE +2%') : `${Math.min(100, Math.round(s.lifetime_paise / s.next_volume_threshold_paise * 100))}% ${t('to unlock')}`}
          </div>
          <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, marginTop: 6 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${Math.min(100, Math.round(s.lifetime_paise / s.next_volume_threshold_paise * 100))}%`,
              background: s.volume_bonus_active ? '#16A34A' : '#D97706',
            }} />
          </div>
        </div>
      </div>

      {/* Orders */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{t('Recent Orders')}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['', 'recommended', 'paid', 'shipped', 'delivered'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '3px 9px', fontSize: 10, borderRadius: 10,
                border: '1px solid var(--border)',
                background: filter === f ? 'var(--accent)' : 'var(--surface2)',
                color: filter === f ? '#fff' : 'var(--text3)',
                cursor: 'pointer',
              }}>{f || t('All')}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {[t('Order #'),t('Gem'),t('Client'),t('Carat'),t('Retail'),t('Commission'),t('Status'),t('Actions')].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 20, color: 'var(--text4)', textAlign: 'center' }}>{t('No orders yet — recommend a gem from the catalog.')}</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => gemsApi.order(o.id).then(setDrillOrder)}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--accent)' }}>{o.order_number}</td>
                  <td style={{ padding: '8px 12px' }}>{o.gem_name} <span style={{ fontSize: 9, color: 'var(--text4)' }}>({o.gem_tier})</span></td>
                  <td style={{ padding: '8px 12px' }}>{o.client_name || '—'}</td>
                  <td style={{ padding: '8px 12px' }}>{o.carat}</td>
                  <td style={{ padding: '8px 12px' }}>{fmtINR(o.retail_price_paise)}</td>
                  <td style={{ padding: '8px 12px', color: '#16A34A', fontWeight: 600 }}>{fmtINR(o.commission_amount_paise)}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                      background: (STATUS_COLORS[o.status] || '#6b7280') + '22',
                      color: STATUS_COLORS[o.status] || '#6b7280' }}>{o.status}</span>
                  </td>
                  <td style={{ padding: '8px 12px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {o.status === 'recommended' && <button onClick={() => updateStatus(o.id, 'paid')} style={actionBtn}>{t('Mark paid')}</button>}
                      {o.status === 'paid' && <button onClick={() => updateStatus(o.id, 'shipped')} style={actionBtn}>{t('Mark shipped')}</button>}
                      {o.status === 'shipped' && <button onClick={() => updateStatus(o.id, 'delivered')} style={actionBtn}>{t('Mark delivered')}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drillOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDrillOrder(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 22, width: 600, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>{drillOrder.order_number}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: (STATUS_COLORS[drillOrder.status] || '#6b7280') + '22', color: STATUS_COLORS[drillOrder.status] || '#6b7280' }}>{drillOrder.status}</span>
              </div>
              <button onClick={() => setDrillOrder(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text3)' }}>×</button>
            </div>

            {/* Timeline */}
            <div style={{ marginBottom: 16, padding: 14, background: 'var(--surface2)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, marginBottom: 10 }}>{t('ORDER TIMELINE')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {(['recommended', 'paid', 'shipped', 'delivered'] as const).map((step, i, arr) => {
                  const stepStates = ['recommended', 'paid', 'shipped', 'delivered']
                  const currentIdx = stepStates.indexOf(drillOrder.status)
                  const reached = currentIdx >= i
                  const stepTimes: Record<string, string | null> = {
                    recommended: drillOrder.created_at,
                    paid: drillOrder.paid_at,
                    shipped: drillOrder.shipped_at,
                    delivered: drillOrder.delivered_at,
                  }
                  return (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: reached ? '#16A34A' : 'var(--surface3, #d1d5db)',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                        }}>{reached ? '✓' : i + 1}</div>
                        <div style={{ fontSize: 9, marginTop: 4, color: reached ? 'var(--text2)' : 'var(--text4)', fontWeight: reached ? 600 : 400, textTransform: 'capitalize' }}>{step}</div>
                        {stepTimes[step] && (
                          <div style={{ fontSize: 8, color: 'var(--text4)' }}>{new Date(stepTimes[step]!).toLocaleDateString()}</div>
                        )}
                      </div>
                      {i < arr.length - 1 && <div style={{ flex: 1, height: 2, background: currentIdx > i ? '#16A34A' : 'var(--surface3, #d1d5db)', margin: '0 4px' }} />}
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 6, fontSize: 12 }}>
              <div style={{ color: 'var(--text3)' }}>{t('Gem:')}</div><div><strong>{drillOrder.gem_name}</strong> ({drillOrder.gem_tier}) · {drillOrder.carat} ct</div>
              <div style={{ color: 'var(--text3)' }}>{t('Cert:')}</div><div>{drillOrder.gem_cert_authority}</div>
              <div style={{ color: 'var(--text3)' }}>{t('Client:')}</div><div>{drillOrder.client_name || '—'}{drillOrder.client_phone && <span style={{ color: 'var(--text4)' }}> · {drillOrder.client_phone}</span>}</div>
              <div style={{ color: 'var(--text3)' }}>{t('Retail:')}</div><div>{fmtINR(drillOrder.retail_price_paise)}</div>
              <div style={{ color: 'var(--text3)' }}>{t('Commission:')}</div><div style={{ color: '#16A34A', fontWeight: 600 }}>{fmtINR(drillOrder.commission_amount_paise)} ({drillOrder.commission_pct}%)</div>
              <div style={{ color: 'var(--text3)' }}>{t('Created:')}</div><div>{new Date(drillOrder.created_at).toLocaleString()}</div>
              {drillOrder.paid_at && <><div style={{ color: 'var(--text3)' }}>{t('Paid:')}</div><div>{new Date(drillOrder.paid_at).toLocaleString()}</div></>}
              {drillOrder.shipped_at && <><div style={{ color: 'var(--text3)' }}>{t('Shipped:')}</div><div>{new Date(drillOrder.shipped_at).toLocaleString()} · {drillOrder.courier} {drillOrder.tracking_number}</div></>}
              {drillOrder.delivered_at && <><div style={{ color: 'var(--text3)' }}>{t('Delivered:')}</div><div>{new Date(drillOrder.delivered_at).toLocaleString()}</div></>}
            </div>

            {drillOrder.recommendation_reason && (
              <div style={{ marginTop: 14, padding: 12, background: 'var(--surface2)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, marginBottom: 4 }}>{t('RECOMMENDATION REASON')}</div>
                <div style={{ fontSize: 12 }}>{drillOrder.recommendation_reason}</div>
              </div>
            )}
            {drillOrder.astrologer_notes && (
              <div style={{ marginTop: 8, padding: 12, background: 'var(--surface2)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, marginBottom: 4 }}>{t('WEARING INSTRUCTIONS')}</div>
                <div style={{ fontSize: 12 }}>{drillOrder.astrologer_notes}</div>
              </div>
            )}

            {drillOrder.certificate && (
              <div style={{ marginTop: 14, padding: 12, background: '#fef3c7', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>✓ {t('Certificate')} {drillOrder.certificate.cert_number}</div>
                <div style={{ fontSize: 11, color: '#78350f' }}>{t('Issued by')} {drillOrder.certificate.cert_authority} {t('on')} {drillOrder.certificate.issued_on}</div>
              </div>
            )}

            <div style={{ marginTop: 14, padding: 12, background: 'var(--surface2)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, marginBottom: 4 }}>{t('CLIENT PURCHASE LINK')}</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {window.location.origin}/gem-purchase/{drillOrder.order_number}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const actionBtn: React.CSSProperties = {
  padding: '3px 8px', fontSize: 10, borderRadius: 4,
  border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer',
  color: 'var(--text2)',
}
