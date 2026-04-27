import { useEffect, useState } from 'react'
import { crmApi, reportsApi } from '../api/client'
import { useLang } from '../contexts/LanguageContext'
import ClientInviteModal from './business/ClientInviteModal'
import GemPickerForClient from './business/GemPickerForClient'

const S = {
  wrap: { display: 'flex', gap: '20px', height: '600px' },
  sidebar: { width: '260px', background: '#0f1923', border: '1px solid #2a4a6b', borderRadius: '10px', display: 'flex', flexDirection: 'column' as const },
  main: { flex: 1, background: '#0f1923', border: '1px solid #2a4a6b', borderRadius: '10px', padding: '20px', overflowY: 'auto' as const },
  sideHeader: { padding: '16px', borderBottom: '1px solid #1a3a5c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  clientRow: (active: boolean) => ({
    padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #131f2e',
    background: active ? '#1a3a5c' : 'transparent',
  }),
  name: { color: '#c0c0c0', fontSize: '14px', fontWeight: 'bold' },
  meta: { color: '#4a6fa5', fontSize: '12px' },
  btn: { padding: '6px 12px', background: '#1a3a5c', border: '1px solid #2a4a6b', borderRadius: '6px', color: '#4a9eff', cursor: 'pointer', fontSize: '13px' },
  input: { width: '100%', padding: '8px 12px', background: '#07111a', border: '1px solid #2a4a6b', borderRadius: '6px', color: '#e0e0e0', fontSize: '13px', boxSizing: 'border-box' as const, marginBottom: '8px' },
  section: { marginBottom: '20px' },
  sectionTitle: { color: '#4a9eff', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #1a3a5c', paddingBottom: '6px' },
  statBox: { display: 'inline-block', padding: '12px 20px', background: '#07111a', border: '1px solid #1a3a5c', borderRadius: '8px', margin: '4px' },
  statNum: { color: '#4a9eff', fontSize: '24px', fontWeight: 'bold' },
  statLabel: { color: '#4a6fa5', fontSize: '11px' },
}

type View = 'clients' | 'sessions' | 'appointments' | 'invoices' | 'predictions'

export default function CRMPanel() {
  const { t } = useLang()
  const [view, setView] = useState<View>('clients')
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [accuracy, setAccuracy] = useState<any>(null)
  const [showAddClient, setShowAddClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', notes: '', whatsapp_phone: '', birth_date: '', birth_time: '', birth_place: '', birth_lat: '', birth_lon: '', birth_tz: '5.5' })
  const [showInvite, setShowInvite] = useState(false)
  const [editingClient, setEditingClient] = useState(false)
  const [editClient, setEditClient] = useState<any>({})
  const [showGemPicker, setShowGemPicker] = useState(false)
  const [showAddInvoice, setShowAddInvoice] = useState(false)
  const [newInvoice, setNewInvoice] = useState({ client_id: '', amount: 0, currency: 'INR', notes: '', due_on: '' })
  const [showAddSession, setShowAddSession] = useState(false)
  const [newSession, setNewSession] = useState({ client_id: '', session_date: '', duration_mins: 60, fee_charged: 0, notes: '' })
  const [showAddAppt, setShowAddAppt] = useState(false)
  const [newAppt, setNewAppt] = useState({ client_id: '', scheduled_at: '', duration_mins: 60, type: 'reading', fee: 0, notes: '' })

  useEffect(() => {
    crmApi.listClients().then(setClients).catch(() => {})
    crmApi.listSessions().then(setSessions).catch(() => {})
    crmApi.listAppointments().then(setAppointments).catch(() => {})
    crmApi.listInvoices().then(setInvoices).catch(() => {})
    crmApi.listPredictions().then(setPredictions).catch(() => {})
    crmApi.accuracy().then(setAccuracy).catch(() => {})
  }, [])

  const addClient = async () => {
    if (!newClient.name) return
    const payload: any = { ...newClient }
    payload.birth_lat = newClient.birth_lat ? parseFloat(newClient.birth_lat) : null
    payload.birth_lon = newClient.birth_lon ? parseFloat(newClient.birth_lon) : null
    payload.birth_tz = newClient.birth_tz ? parseFloat(newClient.birth_tz) : null
    if (!payload.birth_date) payload.birth_date = null
    if (!payload.birth_time) payload.birth_time = null
    const r = await crmApi.createClient(payload)
    setClients(c => [...c, { id: r.client_id, ...payload }])
    setNewClient({ name: '', phone: '', email: '', notes: '', whatsapp_phone: '', birth_date: '', birth_time: '', birth_place: '', birth_lat: '', birth_lon: '', birth_tz: '5.5' })
    setShowAddClient(false)
  }

  const VIEWS: { id: View; label: string }[] = [
    { id: 'clients', label: t('Clients') },
    { id: 'sessions', label: t('Sessions') },
    { id: 'appointments', label: t('Appointments') },
    { id: 'invoices', label: t('Invoices') },
    { id: 'predictions', label: t('Predictions') },
  ]

  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: '7px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px',
            background: view === v.id ? '#1a3a5c' : '#0a1520',
            color: view === v.id ? '#4a9eff' : '#4a6fa5',
          }}>{v.label}</button>
        ))}
      </div>

      {/* CLIENTS */}
      {view === 'clients' && (
        <div style={S.wrap}>
          <div style={S.sidebar}>
            <div style={S.sideHeader}>
              <span style={{ color: '#4a9eff', fontSize: '14px', fontWeight: 'bold' }}>{t('Clients')} ({clients.length})</span>
              <button style={S.btn} onClick={() => setShowAddClient(true)}>{t('Add')}</button>
            </div>
            {showAddClient && (
              <div style={{ padding: '12px', borderBottom: '1px solid #1a3a5c' }}>
                <input style={S.input} placeholder="Name *" value={newClient.name} onChange={e => setNewClient(c => ({ ...c, name: e.target.value }))} />
                <input style={S.input} placeholder="Phone" value={newClient.phone} onChange={e => setNewClient(c => ({ ...c, phone: e.target.value }))} />
                <input style={S.input} placeholder="WhatsApp (e.g. 919876543210)" value={newClient.whatsapp_phone} onChange={e => setNewClient(c => ({ ...c, whatsapp_phone: e.target.value }))} />
                <input style={S.input} placeholder="Email" value={newClient.email} onChange={e => setNewClient(c => ({ ...c, email: e.target.value }))} />
                <div style={{ fontSize: 11, color: '#4a6fa5', marginTop: 8, marginBottom: 4 }}>Birth Data (for charts/reports)</div>
                <input style={S.input} type="date" placeholder="Birth Date" value={newClient.birth_date} onChange={e => setNewClient(c => ({ ...c, birth_date: e.target.value }))} />
                <input style={S.input} type="time" placeholder="Birth Time" value={newClient.birth_time} onChange={e => setNewClient(c => ({ ...c, birth_time: e.target.value }))} />
                <input style={S.input} placeholder="Birth Place" value={newClient.birth_place} onChange={e => setNewClient(c => ({ ...c, birth_place: e.target.value }))} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <input style={S.input} placeholder="Lat" value={newClient.birth_lat} onChange={e => setNewClient(c => ({ ...c, birth_lat: e.target.value }))} />
                  <input style={S.input} placeholder="Lon" value={newClient.birth_lon} onChange={e => setNewClient(c => ({ ...c, birth_lon: e.target.value }))} />
                  <input style={S.input} placeholder="TZ" value={newClient.birth_tz} onChange={e => setNewClient(c => ({ ...c, birth_tz: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ ...S.btn, background: '#4a9eff', color: '#fff', border: 'none' }} onClick={addClient}>{t('Save')}</button>
                  <button style={S.btn} onClick={() => setShowAddClient(false)}>{t('Cancel')}</button>
                </div>
              </div>
            )}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {clients.map(c => (
                <div key={c.id} style={S.clientRow(selectedClient?.id === c.id)} onClick={() => setSelectedClient(c)}>
                  <div style={S.name}>{c.name}</div>
                  <div style={S.meta}>{c.phone || c.email || t('No contact')}</div>
                </div>
              ))}
              {!clients.length && <div style={{ color: '#4a6fa5', padding: '20px', fontSize: '13px' }}>{t('No clients yet')}</div>}
            </div>
          </div>
          <div style={S.main}>
            {selectedClient ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ color: '#4a9eff', fontSize: '20px', fontWeight: 'bold' }}>{selectedClient.name}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={S.btn} onClick={() => { setEditClient({ ...selectedClient }); setEditingClient(true) }}>Edit</button>
                    <button style={{ ...S.btn, background: '#D97706', color: '#fff', border: 'none' }} onClick={() => setShowGemPicker(true)}>
                      💎 Recommend Gem
                    </button>
                    <button style={{ ...S.btn, background: '#25D366', color: '#fff', border: 'none' }} onClick={() => setShowInvite(true)}>
                      🔗 Invite
                    </button>
                  </div>
                </div>
                {editingClient && (
                  <div style={{ padding: 14, background: '#0a1520', border: '1px solid #1a3a5c', borderRadius: 8, marginBottom: 14 }}>
                    <input style={S.input} placeholder="Name" value={editClient.name || ''} onChange={e => setEditClient({ ...editClient, name: e.target.value })} />
                    <input style={S.input} placeholder="Phone" value={editClient.phone || ''} onChange={e => setEditClient({ ...editClient, phone: e.target.value })} />
                    <input style={S.input} placeholder="WhatsApp" value={editClient.whatsapp_phone || ''} onChange={e => setEditClient({ ...editClient, whatsapp_phone: e.target.value })} />
                    <input style={S.input} placeholder="Email" value={editClient.email || ''} onChange={e => setEditClient({ ...editClient, email: e.target.value })} />
                    <input style={S.input} type="date" value={editClient.birth_date || ''} onChange={e => setEditClient({ ...editClient, birth_date: e.target.value })} />
                    <input style={S.input} type="time" value={(editClient.birth_time || '').slice(0,5)} onChange={e => setEditClient({ ...editClient, birth_time: e.target.value })} />
                    <input style={S.input} placeholder="Birth Place" value={editClient.birth_place || ''} onChange={e => setEditClient({ ...editClient, birth_place: e.target.value })} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input style={S.input} placeholder="Lat" value={editClient.birth_lat ?? ''} onChange={e => setEditClient({ ...editClient, birth_lat: e.target.value })} />
                      <input style={S.input} placeholder="Lon" value={editClient.birth_lon ?? ''} onChange={e => setEditClient({ ...editClient, birth_lon: e.target.value })} />
                      <input style={S.input} placeholder="TZ" value={editClient.birth_tz ?? ''} onChange={e => setEditClient({ ...editClient, birth_tz: e.target.value })} />
                    </div>
                    <textarea style={{ ...S.input, minHeight: 60 }} placeholder="Notes" value={editClient.notes || ''} onChange={e => setEditClient({ ...editClient, notes: e.target.value })} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...S.btn, background: '#4a9eff', color: '#fff', border: 'none' }} onClick={async () => {
                        const payload: any = { ...editClient }
                        payload.birth_lat = editClient.birth_lat ? parseFloat(editClient.birth_lat) : null
                        payload.birth_lon = editClient.birth_lon ? parseFloat(editClient.birth_lon) : null
                        payload.birth_tz = editClient.birth_tz ? parseFloat(editClient.birth_tz) : null
                        if (!payload.birth_date) payload.birth_date = null
                        if (!payload.birth_time) payload.birth_time = null
                        await crmApi.updateClient(selectedClient.id, payload)
                        setClients(cs => cs.map(c => c.id === selectedClient.id ? { ...c, ...payload } : c))
                        setSelectedClient({ ...selectedClient, ...payload })
                        setEditingClient(false)
                      }}>Save</button>
                      <button style={S.btn} onClick={() => setEditingClient(false)}>Cancel</button>
                      <button style={{ ...S.btn, color: '#E74C3C', marginLeft: 'auto' }} onClick={async () => {
                        if (!confirm(`Delete ${selectedClient.name}? Cannot undo.`)) return
                        await crmApi.deleteClient(selectedClient.id)
                        setClients(cs => cs.filter(c => c.id !== selectedClient.id))
                        setSelectedClient(null)
                        setEditingClient(false)
                      }}>Delete</button>
                    </div>
                  </div>
                )}
                <div style={{ color: '#4a6fa5', fontSize: '13px', marginBottom: '20px' }}>
                  {selectedClient.phone && <span>📞 {selectedClient.phone}  </span>}
                  {selectedClient.whatsapp_phone && <span>WA {selectedClient.whatsapp_phone}  </span>}
                  {selectedClient.email && <span>✉ {selectedClient.email}</span>}
                </div>
                {selectedClient.birth_date && (
                  <div style={{ ...S.section }}>
                    <div style={S.sectionTitle}>Birth Data</div>
                    <div style={{ color: '#8899aa', fontSize: '13px' }}>
                      {selectedClient.birth_date} {selectedClient.birth_time || ''} · {selectedClient.birth_place || '—'}
                    </div>
                  </div>
                )}
                {selectedClient.notes && (
                  <div style={{ ...S.section }}>
                    <div style={S.sectionTitle}>{t('Notes')}</div>
                    <div style={{ color: '#8899aa', fontSize: '13px' }}>{selectedClient.notes}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#4a6fa5', textAlign: 'center', marginTop: '80px' }}>{t('Select client')}</div>
            )}
          </div>
        </div>
      )}

      {/* SESSIONS */}
      {view === 'sessions' && (
        <div style={S.main}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={S.sectionTitle}>{t('Reading Sessions')} ({sessions.length})</div>
            <button style={{ ...S.btn, background: '#4a9eff', color: '#fff', border: 'none' }} onClick={() => setShowAddSession(true)}>+ Log Session</button>
          </div>
          {showAddSession && (
            <div style={{ padding: 14, background: '#0a1520', border: '1px solid #1a3a5c', borderRadius: 8, marginBottom: 14 }}>
              <select style={S.input} value={newSession.client_id} onChange={e => setNewSession({ ...newSession, client_id: e.target.value })}>
                <option value="">— Select Client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input style={S.input} type="date" placeholder="Session Date" value={newSession.session_date} onChange={e => setNewSession({ ...newSession, session_date: e.target.value })} />
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={S.input} type="number" placeholder="Duration (min)" value={newSession.duration_mins || ''} onChange={e => setNewSession({ ...newSession, duration_mins: parseInt(e.target.value) || 60 })} />
                <input style={S.input} type="number" placeholder="Fee (₹)" value={newSession.fee_charged || ''} onChange={e => setNewSession({ ...newSession, fee_charged: parseFloat(e.target.value) || 0 })} />
              </div>
              <input style={S.input} placeholder="Notes" value={newSession.notes} onChange={e => setNewSession({ ...newSession, notes: e.target.value })} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ ...S.btn, background: '#4a9eff', color: '#fff', border: 'none' }} onClick={async () => {
                  if (!newSession.session_date) return
                  await crmApi.createSession(newSession)
                  crmApi.listSessions().then(setSessions)
                  setNewSession({ client_id: '', session_date: '', duration_mins: 60, fee_charged: 0, notes: '' })
                  setShowAddSession(false)
                }}>Save</button>
                <button style={S.btn} onClick={() => setShowAddSession(false)}>Cancel</button>
              </div>
            </div>
          )}
          {!sessions.length && <div style={{ color: '#4a6fa5', fontSize: '13px' }}>{t('No sessions')}</div>}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0a1520' }}>
                {[t('Date'), t('Clients'), t('Duration'), t('Fee'), t('Status')].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#4a6fa5', fontWeight: 'normal', borderBottom: '1px solid #1a3a5c' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #131f2e' }}>
                  <td style={{ padding: '8px 12px', color: '#c0c0c0' }}>{s.session_date}</td>
                  <td style={{ padding: '8px 12px', color: '#4a9eff' }}>{s.client_name || '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#8899aa' }}>{s.duration_mins} min</td>
                  <td style={{ padding: '8px 12px', color: '#2ECC71' }}>₹{s.fee_charged || 0}</td>
                  <td style={{ padding: '8px 12px', color: '#4a6fa5' }}>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* APPOINTMENTS */}
      {view === 'appointments' && (
        <div style={S.main}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={S.sectionTitle}>Appointments ({appointments.length})</div>
            <button style={{ ...S.btn, background: '#4a9eff', color: '#fff', border: 'none' }} onClick={() => setShowAddAppt(true)}>+ Schedule</button>
          </div>
          {showAddAppt && (
            <div style={{ padding: 14, background: '#0a1520', border: '1px solid #1a3a5c', borderRadius: 8, marginBottom: 14 }}>
              <select style={S.input} value={newAppt.client_id} onChange={e => setNewAppt({ ...newAppt, client_id: e.target.value })}>
                <option value="">— Select Client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input style={S.input} type="datetime-local" value={newAppt.scheduled_at} onChange={e => setNewAppt({ ...newAppt, scheduled_at: e.target.value })} />
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={S.input} type="number" placeholder="Duration (min)" value={newAppt.duration_mins || ''} onChange={e => setNewAppt({ ...newAppt, duration_mins: parseInt(e.target.value) || 60 })} />
                <input style={S.input} type="number" placeholder="Fee (₹)" value={newAppt.fee || ''} onChange={e => setNewAppt({ ...newAppt, fee: parseFloat(e.target.value) || 0 })} />
              </div>
              <input style={S.input} placeholder="Type (reading/follow-up)" value={newAppt.type} onChange={e => setNewAppt({ ...newAppt, type: e.target.value })} />
              <input style={S.input} placeholder="Notes" value={newAppt.notes} onChange={e => setNewAppt({ ...newAppt, notes: e.target.value })} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ ...S.btn, background: '#4a9eff', color: '#fff', border: 'none' }} onClick={async () => {
                  if (!newAppt.scheduled_at) return
                  await crmApi.createAppointment(newAppt)
                  crmApi.listAppointments().then(setAppointments)
                  setNewAppt({ client_id: '', scheduled_at: '', duration_mins: 60, type: 'reading', fee: 0, notes: '' })
                  setShowAddAppt(false)
                }}>Save</button>
                <button style={S.btn} onClick={() => setShowAddAppt(false)}>Cancel</button>
              </div>
            </div>
          )}
          {!appointments.length && <div style={{ color: '#4a6fa5', fontSize: '13px' }}>No appointments scheduled</div>}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0a1520' }}>
                {['Date & Time', 'Client', 'Type', 'Duration', 'Fee', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#4a6fa5', fontWeight: 'normal', borderBottom: '1px solid #1a3a5c' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #131f2e' }}>
                  <td style={{ padding: '8px 12px', color: '#c0c0c0' }}>{new Date(a.scheduled_at).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '8px 12px', color: '#4a9eff' }}>{a.client_name || '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#8899aa' }}>{a.type}</td>
                  <td style={{ padding: '8px 12px', color: '#8899aa' }}>{a.duration_mins} min</td>
                  <td style={{ padding: '8px 12px', color: '#2ECC71' }}>₹{a.fee || 0}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px', background: a.status === 'confirmed' ? '#1a3a5c' : '#1a2a1a', color: a.status === 'confirmed' ? '#4a9eff' : '#2ECC71' }}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* INVOICES */}
      {view === 'invoices' && (
        <div style={S.main}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={S.sectionTitle}>Invoices</div>
            <button style={{ ...S.btn, background: '#4a9eff', color: '#fff', border: 'none' }} onClick={() => setShowAddInvoice(true)}>+ New Invoice</button>
          </div>
          {showAddInvoice && (
            <div style={{ padding: 14, background: '#0a1520', border: '1px solid #1a3a5c', borderRadius: 8, marginBottom: 14 }}>
              <select style={S.input} value={newInvoice.client_id} onChange={e => setNewInvoice({ ...newInvoice, client_id: e.target.value })}>
                <option value="">— Select Client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input style={S.input} type="number" placeholder="Amount (₹)" value={newInvoice.amount || ''} onChange={e => setNewInvoice({ ...newInvoice, amount: parseFloat(e.target.value) || 0 })} />
              <input style={S.input} type="date" placeholder="Due On" value={newInvoice.due_on} onChange={e => setNewInvoice({ ...newInvoice, due_on: e.target.value })} />
              <input style={S.input} placeholder="Notes / description" value={newInvoice.notes} onChange={e => setNewInvoice({ ...newInvoice, notes: e.target.value })} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ ...S.btn, background: '#4a9eff', color: '#fff', border: 'none' }} onClick={async () => {
                  if (!newInvoice.client_id || !newInvoice.amount) return
                  const r = await crmApi.createInvoice({ ...newInvoice, due_on: newInvoice.due_on || null })
                  setInvoices(ii => [{ id: r.invoice_id, client_name: clients.find(c => c.id === newInvoice.client_id)?.name, amount: newInvoice.amount, currency: 'INR', status: 'unpaid', issued_on: new Date().toISOString().slice(0, 10), due_on: newInvoice.due_on || null }, ...ii])
                  setNewInvoice({ client_id: '', amount: 0, currency: 'INR', notes: '', due_on: '' })
                  setShowAddInvoice(false)
                }}>Save</button>
                <button style={S.btn} onClick={() => setShowAddInvoice(false)}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ marginBottom: '16px' }}>
            <span style={S.statBox}><div style={S.statNum}>{invoices.length}</div><div style={S.statLabel}>Total</div></span>
            <span style={S.statBox}><div style={{ ...S.statNum, color: '#2ECC71' }}>₹{invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString()}</div><div style={S.statLabel}>Collected</div></span>
            <span style={S.statBox}><div style={{ ...S.statNum, color: '#E74C3C' }}>₹{invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString()}</div><div style={S.statLabel}>Unpaid</div></span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0a1520' }}>
                {['Client', 'Amount', 'Issued', 'Due', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#4a6fa5', fontWeight: 'normal', borderBottom: '1px solid #1a3a5c' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #131f2e' }}>
                  <td style={{ padding: '8px 12px', color: '#4a9eff' }}>{inv.client_name || '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#c0c0c0', fontWeight: 'bold' }}>₹{inv.amount}</td>
                  <td style={{ padding: '8px 12px', color: '#8899aa' }}>{inv.issued_on}</td>
                  <td style={{ padding: '8px 12px', color: '#8899aa' }}>{inv.due_on || '—'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px',
                      background: inv.status === 'paid' ? '#1a4a1a' : '#4a1a1a',
                      color: inv.status === 'paid' ? '#2ECC71' : '#E74C3C' }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
                    {inv.status !== 'paid' && (
                      <button style={{ ...S.btn, fontSize: '11px', padding: '3px 8px' }}
                        onClick={async () => { await crmApi.markPaid(inv.id); setInvoices(ii => ii.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i)) }}>
                        Mark Paid
                      </button>
                    )}
                    <button style={{ ...S.btn, fontSize: '11px', padding: '3px 8px' }}
                      onClick={async () => {
                        const blob = await reportsApi.invoicePdf(inv.id)
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${inv.status === 'paid' ? 'receipt' : 'invoice'}-${inv.id.slice(0,8)}.pdf`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}>
                      📄 PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PREDICTIONS */}
      {view === 'predictions' && (
        <div style={S.main}>
          <div style={S.sectionTitle}>Prediction Tracker (Credibility Engine)</div>
          {accuracy && (
            <div style={{ marginBottom: '20px' }}>
              <span style={S.statBox}><div style={{ ...S.statNum, color: '#F39C12' }}>{accuracy.accuracy_pct}%</div><div style={S.statLabel}>Accuracy</div></span>
              <span style={S.statBox}><div style={S.statNum}>{accuracy.total}</div><div style={S.statLabel}>Total</div></span>
              <span style={S.statBox}><div style={{ ...S.statNum, color: '#2ECC71' }}>{accuracy.fulfilled}</div><div style={S.statLabel}>Fulfilled</div></span>
              <span style={S.statBox}><div style={{ ...S.statNum, color: '#E74C3C' }}>{accuracy.unfulfilled}</div><div style={S.statLabel}>Unfulfilled</div></span>
              <span style={S.statBox}><div style={{ ...S.statNum, color: '#4a6fa5' }}>{accuracy.pending}</div><div style={S.statLabel}>Pending</div></span>
            </div>
          )}
          {!predictions.length && <div style={{ color: '#4a6fa5', fontSize: '13px' }}>No predictions logged yet</div>}
          {predictions.map(p => (
            <div key={p.id} style={{ background: '#07111a', border: '1px solid #1a3a5c', borderRadius: '8px', padding: '14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#4a9eff', fontSize: '13px', fontWeight: 'bold' }}>{p.chart_name}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                  background: p.outcome === 'fulfilled' ? '#1a4a1a' : p.outcome === 'unfulfilled' ? '#4a1a1a' : p.outcome === 'partially_fulfilled' ? '#2a2a1a' : '#1a1a2a',
                  color: p.outcome === 'fulfilled' ? '#2ECC71' : p.outcome === 'unfulfilled' ? '#E74C3C' : p.outcome === 'partially_fulfilled' ? '#F39C12' : '#4a6fa5' }}>
                  {p.outcome || 'pending'}
                </span>
              </div>
              <div style={{ color: '#c0c0c0', fontSize: '13px', marginBottom: '4px' }}>{p.prediction_text}</div>
              <div style={{ color: '#4a6fa5', fontSize: '11px' }}>
                {p.category} · {p.predicted_for} · Logged: {p.predicted_on}
              </div>
              {p.outcome === 'pending' && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                  {['fulfilled', 'partially_fulfilled', 'unfulfilled'].map(o => (
                    <button key={o} style={{ ...S.btn, fontSize: '11px', padding: '3px 8px' }}
                      onClick={() => crmApi.updateOutcome(p.id, { outcome: o }).then(() =>
                        setPredictions(pp => pp.map(x => x.id === p.id ? { ...x, outcome: o } : x)))}>
                      {o.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showInvite && selectedClient && (
        <ClientInviteModal
          open={showInvite}
          onClose={() => setShowInvite(false)}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          clientWhatsApp={selectedClient.whatsapp_phone || selectedClient.phone}
        />
      )}

      {showGemPicker && selectedClient && (
        <GemPickerForClient
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          clientWhatsApp={selectedClient.whatsapp_phone || selectedClient.phone}
          onClose={() => setShowGemPicker(false)}
        />
      )}
    </div>
  )
}
