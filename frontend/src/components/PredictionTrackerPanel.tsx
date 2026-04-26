import { useState } from 'react'

type Status = 'pending' | 'fulfilled' | 'partial' | 'missed'
type Category = 'career' | 'marriage' | 'health' | 'finance' | 'travel' | 'education' | 'family' | 'spiritual' | 'general'

interface Prediction {
  id: string
  created_at: string
  client_name: string
  dob: string
  prediction_text: string
  category: Category
  timeframe: string
  dasha: string
  transit_planets: string
  confidence: number     // 1-5
  status: Status
  outcome_notes: string
  outcome_date: string
  tags: string[]
}

const CATEGORIES: Category[] = ['career', 'marriage', 'health', 'finance', 'travel', 'education', 'family', 'spiritual', 'general']
const STATUS_LABELS: Record<Status, string> = { pending: '⏳ Pending', fulfilled: '✅ Fulfilled', partial: '◑ Partial', missed: '❌ Missed' }
const STATUS_COLORS: Record<Status, string> = { pending: '#F59E0B', fulfilled: '#16A34A', partial: '#0891B2', missed: '#DC2626' }
const CAT_ICONS: Record<Category, string> = {
  career: '💼', marriage: '💍', health: '🏥', finance: '💰',
  travel: '✈️', education: '📚', family: '👨‍👩‍👧', spiritual: '🕉️', general: '⭐',
}
const STORAGE_KEY = 'jyotish_predictions'

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

function loadAll(): Prediction[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveAll(ps: Prediction[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(ps)) }

const BLANK: Omit<Prediction, 'id' | 'created_at'> = {
  client_name: '', dob: '', prediction_text: '', category: 'general',
  timeframe: '', dasha: '', transit_planets: '', confidence: 3,
  status: 'pending', outcome_notes: '', outcome_date: '', tags: [],
}

function AccuracyChart({ preds }: { preds: Prediction[] }) {
  const decided = preds.filter(p => p.status !== 'pending')
  if (decided.length === 0) return null
  const fulfilled = decided.filter(p => p.status === 'fulfilled').length
  const partial = decided.filter(p => p.status === 'partial').length
  const missed = decided.filter(p => p.status === 'missed').length
  const score = ((fulfilled + partial * 0.5) / decided.length * 100).toFixed(1)

  const byCat: Record<string, { ok: number; total: number }> = {}
  for (const p of decided) {
    if (!byCat[p.category]) byCat[p.category] = { ok: 0, total: 0 }
    byCat[p.category].total++
    if (p.status === 'fulfilled') byCat[p.category].ok++
    if (p.status === 'partial') byCat[p.category].ok += 0.5
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', padding: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>📊 Prediction Accuracy</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
        {[
          { label: 'Accuracy Score', val: `${score}%`, color: parseFloat(score) >= 70 ? '#16A34A' : parseFloat(score) >= 50 ? '#F59E0B' : '#DC2626' },
          { label: 'Fulfilled', val: fulfilled, color: '#16A34A' },
          { label: 'Partial', val: partial, color: '#0891B2' },
          { label: 'Missed', val: missed, color: '#DC2626' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--surface2)', borderRadius: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: '900', color }}>{val}</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>By Category</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {Object.entries(byCat).sort((a, b) => b[1].total - a[1].total).map(([cat, { ok, total }]) => {
          const pct = ok / total * 100
          return (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '80px', fontSize: '11px', color: 'var(--text2)', flexShrink: 0 }}>
                {CAT_ICONS[cat as Category]} {cat}
              </div>
              <div style={{ flex: 1, height: '8px', background: 'var(--surface2)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? '#16A34A' : pct >= 50 ? '#F59E0B' : '#DC2626', borderRadius: '4px' }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', width: '40px', textAlign: 'right' }}>{pct.toFixed(0)}%</div>
              <div style={{ fontSize: '10px', color: 'var(--text4)', width: '30px' }}>{total}x</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PredictionTrackerPanel() {
  const [predictions, setPredictions] = useState<Prediction[]>(() => loadAll())
  const [view, setView] = useState<'list' | 'new' | 'edit' | 'stats'>('list')
  const [form, setForm] = useState<Omit<Prediction, 'id' | 'created_at'>>(BLANK)
  const [editId, setEditId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all')
  const [filterClient, setFilterClient] = useState('')
  const [tagInput, setTagInput] = useState('')

  const save = (ps: Prediction[]) => { setPredictions(ps); saveAll(ps) }

  const submit = () => {
    if (!form.prediction_text.trim() || !form.client_name.trim()) return
    if (editId) {
      save(predictions.map(p => p.id === editId ? { ...form, id: editId, created_at: p.created_at } : p))
    } else {
      save([{ ...form, id: uid(), created_at: new Date().toISOString() }, ...predictions])
    }
    setView('list'); setForm(BLANK); setEditId(null)
  }

  const del = (id: string) => { if (confirm('Delete this prediction?')) save(predictions.filter(p => p.id !== id)) }

  const startEdit = (p: Prediction) => {
    setForm({ ...p }); setEditId(p.id); setView('edit')
  }

  const cycleStatus = (p: Prediction) => {
    const order: Status[] = ['pending', 'fulfilled', 'partial', 'missed']
    const next = order[(order.indexOf(p.status) + 1) % order.length]
    save(predictions.map(x => x.id === p.id ? { ...x, status: next } : x))
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }

  const visible = predictions.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterCat !== 'all' && p.category !== filterCat) return false
    if (filterClient && !p.client_name.toLowerCase().includes(filterClient.toLowerCase())) return false
    return true
  })

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{label}</div>
      {children}
    </div>
  )

  const inputStyle = { width: '100%', padding: '9px 10px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' as const }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '2px' }}>Prediction Tracker</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Log predictions · track outcomes · measure accuracy — stored locally</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['list', 'new', 'stats'] as const).map(v => (
            <button key={v} onClick={() => { setView(v); setEditId(null); setForm(BLANK) }} style={{
              padding: '7px 14px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)',
              background: view === v ? 'var(--accent)' : 'var(--surface)', color: view === v ? '#fff' : 'var(--text)',
              fontSize: '12px', fontWeight: view === v ? '700' : '500', cursor: 'pointer',
            }}>
              {v === 'list' ? `📋 All (${predictions.length})` : v === 'new' ? '+ New' : '📊 Stats'}
            </button>
          ))}
        </div>
      </div>

      {/* Form (new / edit) */}
      {(view === 'new' || view === 'edit') && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700' }}>{editId ? 'Edit Prediction' : 'New Prediction'}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <F label="Client Name *">
              <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} style={inputStyle} placeholder="e.g. Ramesh Patel" />
            </F>
            <F label="Date of Birth">
              <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} style={inputStyle} />
            </F>
          </div>

          <F label="Prediction *">
            <textarea value={form.prediction_text} onChange={e => setForm(f => ({ ...f, prediction_text: e.target.value }))}
              rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Describe the prediction in detail…" />
          </F>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <F label="Category">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))} style={selectStyle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
              </select>
            </F>
            <F label="Timeframe">
              <input value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))} style={inputStyle} placeholder="e.g. 2025 Q1, within 6 months" />
            </F>
            <F label="Confidence (1–5)">
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm(f => ({ ...f, confidence: n }))} style={{
                    flex: 1, padding: '7px 0', borderRadius: '6px', border: '1px solid var(--border)',
                    background: form.confidence >= n ? '#F59E0B' : 'var(--surface2)',
                    color: form.confidence >= n ? '#fff' : 'var(--text3)', cursor: 'pointer', fontSize: '13px',
                  }}>{'★'}</button>
                ))}
              </div>
            </F>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <F label="Active Dasha / Antardasha">
              <input value={form.dasha} onChange={e => setForm(f => ({ ...f, dasha: e.target.value }))} style={inputStyle} placeholder="e.g. Saturn-Jupiter" />
            </F>
            <F label="Transit Planets">
              <input value={form.transit_planets} onChange={e => setForm(f => ({ ...f, transit_planets: e.target.value }))} style={inputStyle} placeholder="e.g. Jupiter 9th, Saturn 10th" />
            </F>
          </div>

          {/* Tags */}
          <F label="Tags">
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
              {form.tags.map(t => (
                <span key={t} onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} style={{
                  fontSize: '11px', padding: '2px 10px', borderRadius: '20px', background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                }}>{t} ×</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} style={{ ...inputStyle, flex: 1 }} placeholder="Add tag, press Enter" />
              <button onClick={addTag} style={{ padding: '9px 14px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: '12px' }}>Add</button>
            </div>
          </F>

          {editId && (
            <>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Outcome (update when result known)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <F label="Status">
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))} style={selectStyle}>
                      {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </F>
                  <F label="Outcome Date">
                    <input type="date" value={form.outcome_date} onChange={e => setForm(f => ({ ...f, outcome_date: e.target.value }))} style={inputStyle} />
                  </F>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <F label="Outcome Notes">
                    <textarea value={form.outcome_notes} onChange={e => setForm(f => ({ ...f, outcome_notes: e.target.value }))}
                      rows={2} style={{ ...inputStyle, resize: 'vertical', marginTop: '4px' }} placeholder="What actually happened?" />
                  </F>
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => { setView('list'); setForm(BLANK); setEditId(null) }} style={{ padding: '9px 18px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text3)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
            <button onClick={submit} style={{ padding: '9px 24px', borderRadius: 'var(--radius-m)', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
              {editId ? 'Update' : 'Save Prediction'}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      {view === 'stats' && <AccuracyChart preds={predictions} />}

      {/* List */}
      {view === 'list' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input value={filterClient} onChange={e => setFilterClient(e.target.value)} style={{ flex: 1, minWidth: '120px', padding: '8px 10px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '12px' }} placeholder="Filter by client…" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as Status | 'all')} style={{ padding: '8px 10px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '12px' }}>
              <option value="all">All Status</option>
              {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value as Category | 'all')} style={{ padding: '8px 10px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '12px' }}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
            </select>
          </div>

          {visible.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text3)', fontSize: '13px' }}>
              {predictions.length === 0 ? 'No predictions yet. Click "+ New" to add your first prediction.' : 'No predictions match the filter.'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visible.map(p => {
              const sc = STATUS_COLORS[p.status]
              return (
                <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `4px solid ${sc}`, borderRadius: 'var(--radius-m)', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      {/* Top row */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{p.client_name}</span>
                        {p.dob && <span style={{ fontSize: '10px', color: 'var(--text3)' }}>b. {p.dob}</span>}
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: sc + '18', color: sc, fontWeight: '700' }}>{STATUS_LABELS[p.status]}</span>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'var(--surface2)', color: 'var(--text3)' }}>{CAT_ICONS[p.category as Category]} {p.category}</span>
                        <span style={{ fontSize: '10px', color: '#F59E0B' }}>{'★'.repeat(p.confidence)}{'☆'.repeat(5 - p.confidence)}</span>
                      </div>

                      {/* Prediction */}
                      <div style={{ fontSize: '12.5px', color: 'var(--text)', marginBottom: '6px', lineHeight: 1.6 }}>{p.prediction_text}</div>

                      {/* Meta */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text3)' }}>
                        {p.timeframe && <span>⏱ {p.timeframe}</span>}
                        {p.dasha && <span>🌀 {p.dasha}</span>}
                        {p.transit_planets && <span>🪐 {p.transit_planets}</span>}
                        <span>📅 {new Date(p.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Tags */}
                      {p.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {p.tags.map(t => <span key={t} style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px', background: 'var(--surface2)', color: 'var(--text3)', border: '1px solid var(--border)' }}>{t}</span>)}
                        </div>
                      )}

                      {/* Outcome */}
                      {p.outcome_notes && (
                        <div style={{ marginTop: '8px', padding: '8px 10px', background: sc + '10', borderRadius: '6px', fontSize: '11.5px', color: 'var(--text2)', fontStyle: 'italic' }}>
                          <span style={{ fontStyle: 'normal', fontWeight: '700', color: sc }}>Outcome: </span>{p.outcome_notes}
                          {p.outcome_date && <span style={{ color: 'var(--text3)', marginLeft: '8px' }}>({p.outcome_date})</span>}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                      <button onClick={() => cycleStatus(p)} title="Cycle status" style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${sc}`, background: sc + '18', color: sc, fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>
                        {p.status === 'pending' ? '✅' : p.status === 'fulfilled' ? '◑' : p.status === 'partial' ? '❌' : '⏳'}
                      </button>
                      <button onClick={() => startEdit(p)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', fontSize: '11px', cursor: 'pointer' }}>✏️</button>
                      <button onClick={() => del(p.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #DC262640', background: '#DC262610', color: '#DC2626', fontSize: '11px', cursor: 'pointer' }}>🗑</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
