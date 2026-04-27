import { useEffect, useState } from 'react'
import { gemsApi, crmApi, type Gem } from '../../api/client'
import toast from 'react-hot-toast'

interface Props {
  gem: Gem
  clientId?: string
  clientName?: string
  clientWhatsApp?: string
  onClose: () => void
}

const fmtINR = (paise: number) => '₹' + (paise / 100).toLocaleString('en-IN')

export default function GemRecommendModal({ gem, clientId, clientName, clientWhatsApp, onClose }: Props) {
  const [carat, setCarat] = useState(gem.carat_default || gem.carat_min)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedClientId, setSelectedClientId] = useState(clientId || '')
  const [clients, setClients] = useState<any[]>([])
  const [adhocName, setAdhocName] = useState(clientName || '')
  const [adhocPhone, setAdhocPhone] = useState(clientWhatsApp || '')
  const [adhocEmail, setAdhocEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<any>(null)
  const [commissionPreview, setCommissionPreview] = useState<{ pct: number; paise: number } | null>(null)

  useEffect(() => {
    if (!clientId) crmApi.listClients().then(setClients).catch(() => {})
    gemsApi.get(gem.id).then(d => setCommissionPreview({ pct: d.your_commission_pct, paise: d.your_commission_paise }))
  }, [gem.id, clientId])

  const submit = async () => {
    if (!selectedClientId && !adhocName) { toast.error('Pick a client or enter name'); return }
    setSubmitting(true)
    try {
      const payload: any = {
        gem_id: gem.id, carat,
        recommendation_reason: reason, astrologer_notes: notes,
      }
      if (selectedClientId) payload.client_id = selectedClientId
      else {
        payload.client_name = adhocName
        payload.client_phone = adhocPhone
        payload.client_email = adhocEmail
      }
      const res = await gemsApi.recommend(payload)
      setSuccess(res)
      toast.success(`Recommended! Order ${res.order_number}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed')
    } finally { setSubmitting(false) }
  }

  const sendWA = () => {
    const phone = (adhocPhone || clientWhatsApp || '').replace(/[^0-9]/g, '')
    const url = `${window.location.origin}${success.purchase_url_path || ''}`
    const msg = encodeURIComponent(
      `Namaste,\n\nBased on your chart analysis, I recommend wearing a ${gem.name} (${carat} carat) as a remedial gemstone.\n\nOrder #${success.order_number}\nLab-certified by ${gem.cert_authority}\nPurchase: ${url}\n\nFor any questions, please reach out.`
    )
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  }
  const panel: React.CSSProperties = {
    background: 'var(--surface)', borderRadius: 12, padding: 20, width: 560,
    maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
  }
  const label: React.CSSProperties = { fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 4, marginTop: 10 }
  const input: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)',
    background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box',
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Recommend {gem.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{gem.cert_authority} · For {gem.planet}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text3)' }}>×</button>
        </div>

        {!success ? (
          <>
            {!clientId && (
              <>
                <div style={label}>Client</div>
                <select style={input} value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                  <option value="">— Select Client (or enter ad-hoc below) —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {!selectedClientId && (
                  <div style={{ marginTop: 8 }}>
                    <input style={input} placeholder="Client name" value={adhocName} onChange={e => setAdhocName(e.target.value)} />
                    <input style={{ ...input, marginTop: 6 }} placeholder="Phone / WhatsApp" value={adhocPhone} onChange={e => setAdhocPhone(e.target.value)} />
                    <input style={{ ...input, marginTop: 6 }} placeholder="Email" value={adhocEmail} onChange={e => setAdhocEmail(e.target.value)} />
                  </div>
                )}
              </>
            )}

            <div style={label}>Carat ({gem.carat_min}–{gem.carat_max})</div>
            <input style={input} type="number" min={gem.carat_min} max={gem.carat_max} step={0.5}
                   value={carat} onChange={e => setCarat(parseFloat(e.target.value) || gem.carat_min)} />

            <div style={label}>Reason for Recommendation (visible to client)</div>
            <textarea style={{ ...input, minHeight: 60 }} placeholder="e.g., Weak Jupiter in 6th house, transiting Saturn over natal Jupiter…"
                      value={reason} onChange={e => setReason(e.target.value)} />

            <div style={label}>Wearing Instructions / Notes</div>
            <textarea style={{ ...input, minHeight: 60 }} placeholder="e.g., Wear on right index finger, Thursday morning, after sunrise puja."
                      value={notes} onChange={e => setNotes(e.target.value)} />

            {commissionPreview && (
              <div style={{ marginTop: 14, padding: 12, background: '#16A34A18', border: '1px solid #16A34A44', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Your commission preview</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#16A34A' }}>
                  {fmtINR(commissionPreview.paise)} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text3)' }}>({commissionPreview.pct}%)</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text4)' }}>
                  Retail {fmtINR(gem.retail_price_paise)}. Paid on delivery. Auto-approved after 15-day return window.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={submit} disabled={submitting} style={{
                padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
              }}>{submitting ? 'Creating…' : 'Create Recommendation'}</button>
            </div>
          </>
        ) : (
          <div>
            <div style={{ padding: 14, background: '#16A34A18', border: '1px solid #16A34A44', borderRadius: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 700 }}>✓ Order {success.order_number} created</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                Commission: {fmtINR(success.commission_paise)} ({success.commission_pct}%)
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Share purchase link with client:</div>
            <div style={{ padding: 10, background: 'var(--surface2)', borderRadius: 6, fontSize: 12, wordBreak: 'break-all', marginBottom: 14 }}>
              {window.location.origin}{success.purchase_url_path}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${success.purchase_url_path}`); toast.success('Copied') }}
                      style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer', fontSize: 12 }}>
                Copy Link
              </button>
              {(adhocPhone || clientWhatsApp) && (
                <button onClick={sendWA} style={{ padding: '8px 14px', borderRadius: 6, background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  Send via WhatsApp
                </button>
              )}
              <button onClick={onClose} style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
