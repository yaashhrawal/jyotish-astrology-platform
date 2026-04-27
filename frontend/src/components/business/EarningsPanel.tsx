import { useEffect, useState } from 'react'
import { gemsApi } from '../../api/client'
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
  const [data, setData] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  const reload = () => {
    setLoading(true)
    Promise.all([gemsApi.earnings(), gemsApi.orders(filter || undefined)])
      .then(([e, o]) => { setData(e); setOrders(o) })
      .finally(() => setLoading(false))
  }

  useEffect(reload, [filter])

  if (loading || !data) return <div style={{ padding: 40, color: 'var(--text3)' }}>Loading earnings…</div>

  const s = data.summary

  const updateStatus = async (id: string, status: string) => {
    await gemsApi.updateStatus(id, status)
    toast.success(`Status → ${status}`)
    reload()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>💰 Gem Commission Earnings</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          Plan: <strong>{s.plan}</strong>{s.plan_boost_pct > 0 && <span> (+{s.plan_boost_pct}% boost)</span>}
          {s.volume_bonus_active && <span style={{ color: '#16A34A', fontWeight: 600 }}> · Volume bonus active +2%</span>}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div style={card}>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>PENDING</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#D97706' }}>{fmtINR(s.pending_paise)}</div>
          <div style={{ fontSize: 10, color: 'var(--text4)' }}>Awaiting clearance</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>PAID OUT</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#16A34A' }}>{fmtINR(s.paid_paise)}</div>
          <div style={{ fontSize: 10, color: 'var(--text4)' }}>Settled to your account</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>LIFETIME</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{fmtINR(s.lifetime_paise)}</div>
          <div style={{ fontSize: 10, color: 'var(--text4)' }}>{s.total_orders} orders</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>VOLUME BONUS @ {fmtINR(s.next_volume_threshold_paise)}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: s.volume_bonus_active ? '#16A34A' : 'var(--text3)' }}>
            {s.volume_bonus_active ? 'ACTIVE +2%' : `${Math.min(100, Math.round(s.lifetime_paise / s.next_volume_threshold_paise * 100))}% to unlock`}
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
          <div style={{ fontSize: 13, fontWeight: 700 }}>Recent Orders</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['', 'recommended', 'paid', 'shipped', 'delivered'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '3px 9px', fontSize: 10, borderRadius: 10,
                border: '1px solid var(--border)',
                background: filter === f ? 'var(--accent)' : 'var(--surface2)',
                color: filter === f ? '#fff' : 'var(--text3)',
                cursor: 'pointer',
              }}>{f || 'All'}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Order #','Gem','Client','Carat','Retail','Commission','Status','Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 20, color: 'var(--text4)', textAlign: 'center' }}>No orders yet — recommend a gem from the catalog.</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11 }}>{o.order_number}</td>
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
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {o.status === 'recommended' && <button onClick={() => updateStatus(o.id, 'paid')} style={actionBtn}>Mark paid</button>}
                      {o.status === 'paid' && <button onClick={() => updateStatus(o.id, 'shipped')} style={actionBtn}>Mark shipped</button>}
                      {o.status === 'shipped' && <button onClick={() => updateStatus(o.id, 'delivered')} style={actionBtn}>Mark delivered</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const actionBtn: React.CSSProperties = {
  padding: '3px 8px', fontSize: 10, borderRadius: 4,
  border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer',
  color: 'var(--text2)',
}
