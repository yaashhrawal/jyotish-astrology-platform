import { useEffect, useState } from 'react'
import { portalApi } from '../../api/client'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  clientId: string
  clientName?: string
  clientWhatsApp?: string
}

export default function ClientInviteModal({ open, onClose, clientId, clientName, clientWhatsApp }: Props) {
  const [link, setLink] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [days, setDays] = useState(90)
  const [history, setHistory] = useState<any[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    portalApi.listInvites(clientId).then(setHistory).catch(() => {})
  }, [open, clientId])

  if (!open) return null

  const create = async () => {
    setBusy(true)
    try {
      const res = await portalApi.invite(clientId, days)
      const url = `${window.location.origin}${res.portal_url_path}`
      setLink(url)
      setExpiresAt(res.expires_at)
      toast.success('Invite created')
      portalApi.listInvites(clientId).then(setHistory)
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Failed') }
    finally { setBusy(false) }
  }

  const copy = () => { navigator.clipboard.writeText(link); toast.success('Copied') }
  const sendWA = () => {
    const phone = (clientWhatsApp || '').replace(/[^0-9]/g, '')
    const msg = encodeURIComponent(`Namaste ${clientName || ''},\n\nView your astrological reports here:\n${link}`)
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  const panel: React.CSSProperties = {
    background: 'var(--surface)', borderRadius: 12, padding: 20, width: 520,
    maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Invite {clientName || 'Client'} to Portal</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text3)' }}>×</button>
        </div>

        {!link ? (
          <>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
              Generates a unique link. Client views their charts, reports, and invoices — no signup required.
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Link expires after</div>
              <select value={days} onChange={e => setDays(Number(e.target.value))} style={{
                padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--surface2)', color: 'var(--text)', fontSize: 13,
              }}>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>
            <button onClick={create} disabled={busy} style={{
              padding: '10px 20px', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{busy ? 'Creating…' : 'Generate Invite Link'}</button>
          </>
        ) : (
          <>
            <div style={{ padding: 10, background: 'var(--surface2)', borderRadius: 6, fontSize: 12, wordBreak: 'break-all', marginBottom: 8 }}>
              {link}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>
              Expires {new Date(expiresAt).toLocaleDateString()}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={copy} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer', fontSize: 12 }}>Copy Link</button>
              {clientWhatsApp && (
                <button onClick={sendWA} style={{ padding: '8px 14px', borderRadius: 6, background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  Send via WhatsApp
                </button>
              )}
            </div>
          </>
        )}

        {history.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Previous Invites</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
              {history.map(h => (
                <div key={h.id} style={{ padding: 8, background: 'var(--surface2)', borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Created {new Date(h.created_at).toLocaleDateString()} · {h.view_count} views</span>
                  {h.revoked_at ? <span style={{ color: '#DC2626' }}>Revoked</span>
                    : <button onClick={async () => { await portalApi.revoke(h.id); portalApi.listInvites(clientId).then(setHistory); toast.success('Revoked') }}
                              style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 11 }}>Revoke</button>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
