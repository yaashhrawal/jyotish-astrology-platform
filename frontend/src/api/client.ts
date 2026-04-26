/**
 * Unified API client for Jyotish SaaS backend.
 * Calc endpoints: /api/calc/* (no auth)
 * App endpoints:  /api/* (JWT auth)
 */
import axios from 'axios'

// Dev: empty string → Vite proxy handles /api/* → localhost:8888
// Prod: VITE_API_URL=https://api.yourdomain.com
const BASE_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({ baseURL: BASE_URL })

// Inject JWT token from localStorage
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jyotish_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  plan: string
  ayanamsa_pref: string
  chart_style: string
}

export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post('/api/auth/register', { email, password, name }).then(r => r.data),
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }).then(r => r.data),
  me: () => api.get('/api/auth/me').then(r => r.data),
}

// ── Saved Charts ──────────────────────────────────────────────────────────────

export interface SaveChartPayload {
  name: string
  birth_date: string
  birth_time: string
  birth_tz: number
  birth_place: string
  latitude: number
  longitude: number
  ayanamsa: string
  client_id?: string
  is_public?: boolean
}

export const chartsApi = {
  save: (payload: SaveChartPayload) => api.post('/api/charts/save', payload).then(r => r.data),
  list: () => api.get('/api/charts/list').then(r => r.data),
  get: (id: string) => api.get(`/api/charts/${id}`).then(r => r.data),
  delete: (id: string) => api.delete(`/api/charts/${id}`).then(r => r.data),
}

// ── Shadbala ─────────────────────────────────────────────────────────────────

export const shadbaladApi = {
  compute: (payload: any) => api.post('/api/calc/shadbala', payload).then(r => r.data),
}

// ── CRM ───────────────────────────────────────────────────────────────────────

export const crmApi = {
  // Clients
  createClient: (data: any) => api.post('/api/clients', data).then(r => r.data),
  listClients: () => api.get('/api/clients').then(r => r.data),
  getClient: (id: string) => api.get(`/api/clients/${id}`).then(r => r.data),
  updateClient: (id: string, data: any) => api.patch(`/api/clients/${id}`, data).then(r => r.data),
  deleteClient: (id: string) => api.delete(`/api/clients/${id}`).then(r => r.data),

  // Sessions
  createSession: (data: any) => api.post('/api/sessions', data).then(r => r.data),
  listSessions: () => api.get('/api/sessions').then(r => r.data),

  // Appointments
  createAppointment: (data: any) => api.post('/api/appointments', data).then(r => r.data),
  listAppointments: () => api.get('/api/appointments').then(r => r.data),
  updateAppointmentStatus: (id: string, status: string) =>
    api.patch(`/api/appointments/${id}/status`, null, { params: { status } }).then(r => r.data),

  // Invoices
  createInvoice: (data: any) => api.post('/api/invoices', data).then(r => r.data),
  listInvoices: () => api.get('/api/invoices').then(r => r.data),
  markPaid: (id: string) => api.patch(`/api/invoices/${id}/paid`).then(r => r.data),

  // Predictions
  createPrediction: (data: any) => api.post('/api/predictions', data).then(r => r.data),
  listPredictions: () => api.get('/api/predictions').then(r => r.data),
  updateOutcome: (id: string, data: any) => api.patch(`/api/predictions/${id}/outcome`, data).then(r => r.data),
  accuracy: () => api.get('/api/predictions/accuracy').then(r => r.data),
}

// ── Research ──────────────────────────────────────────────────────────────────

export const researchApi = {
  filter: (params: Record<string, string>) =>
    api.get('/api/research/filter', { params }).then(r => r.data),
  atlas: (params: Record<string, string>) =>
    api.get('/api/research/atlas', { params }).then(r => r.data),
  stats: () => api.get('/api/research/stats').then(r => r.data),
  saveQuery: (data: any) => api.post('/api/research/queries', data).then(r => r.data),
  listQueries: () => api.get('/api/research/queries').then(r => r.data),
}

// ── Prashna ───────────────────────────────────────────────────────────────────

export interface PrashnaPayload {
  year: number; month: number; day: number
  hour: number; minute: number; second?: number
  lat: number; lon: number; tz: number
  ayanamsa?: string
  question?: string
  category?: string
  nimitta?: string
}

export const prashnaApi = {
  chart: (payload: PrashnaPayload) =>
    api.post('/api/calc/prashna/chart', payload).then(r => r.data),
  analyze: (payload: PrashnaPayload & { question: string; category: string; nimitta?: string }) =>
    api.post('/api/calc/prashna/analyze', payload).then(r => r.data),
}

// ── Dasha ─────────────────────────────────────────────────────────────────────

export const dashaApi = {
  get: (payload: any) => api.post('/api/calc/dasha', payload).then(r => r.data),
  sookshma: (payload: any) => api.post('/api/calc/dasha/sookshma', payload).then(r => r.data),
}

// ── Panchanga ─────────────────────────────────────────────────────────────────

export const panchangaApi = {
  get: (payload: any) => api.post('/api/calc/panchanga', payload).then(r => r.data),
}

// ── Doshas ────────────────────────────────────────────────────────────────────

export const doshasApi = {
  get: (payload: any) => api.post('/api/calc/doshas', payload).then(r => r.data),
}

// ── Transit ───────────────────────────────────────────────────────────────────

export const transitApi = {
  get: (payload: any) => api.post('/api/calc/transit', payload).then(r => r.data),
}

// ── Ashtakavarga ──────────────────────────────────────────────────────────────

export const ashtakavargaApi = {
  get: (payload: any) => api.post('/api/calc/ashtakavarga', payload).then(r => r.data),
}

// ── Compatibility ─────────────────────────────────────────────────────────────

export const compatibilityApi = {
  get: (payload: any) => api.post('/api/calc/compatibility', payload).then(r => r.data),
}

// ── Synastry ──────────────────────────────────────────────────────────────────

export const synastryApi = {
  get: (payload: any) => api.post('/api/calc/synastry', payload).then(r => r.data),
  composite: (payload: any) => apiPost('/api/calc/composite', payload),
}

// ── Varshaphal ────────────────────────────────────────────────────────────────

export const varshaphalApi = {
  get: (payload: any) => api.post('/api/calc/varshaphal', payload).then(r => r.data),
}

// ── Muhurta ───────────────────────────────────────────────────────────────────

export const muhurtaApi = {
  get: (payload: any) => api.post('/api/calc/muhurta', payload).then(r => r.data),
}

// ── KP System ─────────────────────────────────────────────────────────────────

export const kpApi = {
  get: (payload: any) => api.post('/api/calc/kp', payload).then(r => r.data),
}

// ── Arudha Lagnas ─────────────────────────────────────────────────────────────

export const arudhaApi = {
  get: (payload: any) => api.post('/api/calc/arudha', payload).then(r => r.data),
}

// ── Yogini Dasha ──────────────────────────────────────────────────────────────

export const yoginiDashaApi = {
  get: (payload: any) => api.post('/api/calc/yogini_dasha', payload).then(r => r.data),
}

// ── Aspects ───────────────────────────────────────────────────────────────────

export const aspectsApi = {
  get: (payload: any) => api.post('/api/calc/aspects', payload).then(r => r.data),
}

// ── Chara Dasha ───────────────────────────────────────────────────────────────

export const charaDashaApi = {
  get: (payload: any) => api.post('/api/calc/chara_dasha', payload).then(r => r.data),
  getKN: (payload: any) => api.post('/api/calc/chara_dasha_kn', payload).then(r => r.data),
}

// ── Sarvatobhadra Chakra ──────────────────────────────────────────────────────

export const sarvatobhadraApi = {
  get: (payload: any) => api.post('/api/calc/sarvatobhadra', payload).then(r => r.data),
}

// ── Generic calc POST helper ──────────────────────────────────────────────────

export const apiPost = (path: string, payload: any) =>
  api.post(path, payload).then(r => r.data)

// ── New calc endpoints ────────────────────────────────────────────────────────

export const bhavaChaliApi = { get: (p: any) => apiPost('/api/calc/bhava_chalit', p) }
export const horaVariantsApi = { get: (p: any) => apiPost('/api/calc/hora_variants', p) }
export const vimshopakaBhavaApi = { get: (p: any) => apiPost('/api/calc/vimshopaka', p) }
export const rectificationApi = { get: (p: any) => apiPost('/api/calc/rectification', p) }
export const vargaDashaApi = { get: (p: any) => apiPost('/api/calc/varga_dasha', p) }
export const classicalSearchApi = {
  search: (q: string, source?: string) => api.get('/api/calc/classical_search', { params: { q, source, limit: 20 } }).then(r => r.data),
  topics: () => api.get('/api/calc/classical_topics').then(r => r.data),
}
export const jaiminiApi = { get: (p: any) => apiPost('/api/calc/jaimini_karakas', p) }
export const karakamshaApi = { get: (p: any) => apiPost('/api/calc/karakamsha', p) }
export const combustionApi = { get: (p: any) => apiPost('/api/calc/combustion', p) }
export const sudarshanApi = { get: (p: any) => apiPost('/api/calc/sudarshana', p) }
export const ashtottariApi = { get: (p: any) => apiPost('/api/calc/ashtottari', p) }
export const narayanaApi = { get: (p: any) => apiPost('/api/calc/narayana_dasha', p) }

// ── AI ────────────────────────────────────────────────────────────────────────

export const remediesApi = { get: (p: any) => apiPost('/api/calc/remedies', p) }
export const sthiraDashaApi = { get: (p: any) => apiPost('/api/calc/sthira_dasha', p) }
export const moolaDashaApi  = { get: (p: any) => apiPost('/api/calc/moola_dasha', p) }
export const taraDashaApi   = { get: (p: any) => apiPost('/api/calc/tara_dasha', p) }

// ── AI ────────────────────────────────────────────────────────────────────────

export const avasthasApi = { get: (p: any) => apiPost('/api/calc/avasthas', p) }

export const numerologyApi = {
  get: (p: any) => apiPost('/api/calc/numerology', p),
}

export const famousChartsApi = {
  list: (params?: { q?: string; category?: string; tag?: string }) =>
    api.get('/api/calc/famous_charts', { params }).then(r => r.data),
  meta: () => api.get('/api/calc/famous_charts/meta').then(r => r.data),
}

export const aiApi = {
  interpret: (question: string, chart_id?: string, chart_data?: any) =>
    api.post('/api/ai/interpret', { question, chart_id, chart_data }).then(r => r.data),
  research: (query: string, filters?: any) =>
    api.post('/api/ai/research', { query, filters }).then(r => r.data),
}
