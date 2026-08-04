/**
 * Unified API client for Jyotish SaaS backend.
 * Calc endpoints: /api/calc/* (no auth)
 * App endpoints:  /api/* (JWT auth)
 *
 * Mobile (Capacitor): VITE_API_URL must be set to production backend URL.
 * Web dev: empty string → Vite proxy handles /api/* → localhost:8888
 * Web prod: VITE_API_URL=https://grahika.sevasangrah.in
 *
 * ACCURACY CONTRACT: ALL calculations run on Python/pyswisseph backend.
 * Never compute planet positions or dashas client-side.
 */
import axios from 'axios'
import { Capacitor } from '@capacitor/core'
import { isOnline } from '../lib/network'

// On native Capacitor, relative URLs don't work — must use absolute API URL.
// VITE_API_URL is required in .env.android and .env.ios builds.
function resolveBaseUrl(): string {
  if (Capacitor.isNativePlatform()) {
    const url = import.meta.env.VITE_API_URL
    if (!url) console.error('[Jyotish] VITE_API_URL not set — API calls will fail on device')
    return url || ''
  }
  // Web: empty string → Vite proxy in dev, VITE_API_URL in prod
  return import.meta.env.VITE_API_URL || ''
}

export const BASE_URL = resolveBaseUrl()

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30s — slower on mobile networks
})

// Inject JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jyotish_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Offline guard — return clear error instead of hanging
api.interceptors.request.use(config => {
  if (!isOnline() && !config.url?.includes('/api/calc/')) {
    return Promise.reject(new Error('OFFLINE'))
  }
  return config
})

// ── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'astrologer' | 'user'

export interface User {
  id: string
  email: string
  name: string
  plan: string
  role: UserRole
  phone?: string
  ayanamsa_pref: string
  chart_style: string
  board_layout?: number[] | null
}

export const authApi = {
  register: (email: string, password: string, name: string, phone = '', role: UserRole = 'astrologer') =>
    api.post('/api/auth/register', { email, password, name, phone, role }).then(r => r.data),
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }).then(r => r.data),
  me: () => api.get('/api/auth/me').then(r => r.data),
  saveBoardLayout: (layout: number[]) =>
    api.patch('/api/auth/board-layout', { layout }).then(r => r.data),
  google: (credential: string, role: UserRole = 'user') =>
    api.post('/api/auth/google', { credential, role }).then(r => r.data),
  googleConfig: (): Promise<{ enabled: boolean; client_id: string }> =>
    api.get('/api/auth/google/config').then(r => r.data),
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

// ── Business: Astrologer Profile ───────────────────────────────────────────────

export interface AstrologerProfile {
  display_name?: string
  title?: string
  qualifications?: string[]
  registration_no?: string
  photo_url?: string
  signature_url?: string
  logo_url?: string
  tagline?: string
  bio?: string
  languages?: string[]
  phone?: string
  whatsapp?: string
  email?: string
  website?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  pincode?: string
  gst_number?: string
  pan_number?: string
  primary_color?: string
  secondary_color?: string
  font_family?: string
  youtube_url?: string
  instagram_url?: string
  facebook_url?: string
  show_powered_by?: boolean
  pdf_footer_quote?: string
}

export const profileApi = {
  get: () => api.get('/api/business/profile').then(r => r.data),
  save: (p: AstrologerProfile) => api.put('/api/business/profile', p).then(r => r.data),
  upload: (kind: 'logo' | 'photo' | 'signature', file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post(`/api/business/profile/upload/${kind}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}

// ── Business: Reports & PDFs ───────────────────────────────────────────────────

export const reportsApi = {
  sections: () => api.get('/api/business/report-sections').then(r => r.data),
  templates: () => api.get('/api/business/report-templates').then(r => r.data),
  saveTemplate: (name: string, sections: string[], is_default = false) =>
    api.post('/api/business/report-templates', { name, sections, is_default }).then(r => r.data),
  deleteTemplate: (id: string) => api.delete(`/api/business/report-templates/${id}`).then(r => r.data),
  generate: (payload: any) => api.post('/api/business/reports/generate', payload, {
    responseType: 'blob',
  }).then(r => ({ blob: r.data, reportId: r.headers['x-report-id'] })),
  invoicePdf: (id: string) => api.get(`/api/business/invoices/${id}/pdf`, { responseType: 'blob' }).then(r => r.data),
}

// ── Business: Client Portal Invites ────────────────────────────────────────────

// ── Business: Gem Marketplace ──────────────────────────────────────────────────

export interface Gem {
  id: string
  sku: string
  name: string
  sanskrit_name?: string
  planet: string
  rashi: string[]
  color?: string
  carat_min: number
  carat_max: number
  carat_default?: number
  tier: 'premium' | 'standard' | 'budget'
  cert_authority: string
  retail_price_paise: number
  base_commission_pct: number
  image_url?: string
  description?: string
  benefits?: string
  contraindications?: string
  in_stock: boolean
  your_commission_pct?: number
  your_commission_paise?: number
}

export const gemsApi = {
  catalog: (params?: { planet?: string; tier?: string }) =>
    api.get('/api/gems/catalog', { params }).then(r => r.data),
  get: (id: string) => api.get(`/api/gems/catalog/${id}`).then(r => r.data),
  recommend: (payload: {
    gem_id: string; client_id?: string; chart_id?: string; carat: number;
    recommendation_reason?: string; astrologer_notes?: string;
    client_name?: string; client_phone?: string; client_email?: string;
  }) => api.post('/api/gems/recommend', payload).then(r => r.data),
  orders: (status?: string) => api.get('/api/gems/orders', { params: status ? { status } : {} }).then(r => r.data),
  order: (id: string) => api.get(`/api/gems/orders/${id}`).then(r => r.data),
  updateStatus: (id: string, status: string, extras?: { tracking_number?: string; courier?: string }) =>
    api.patch(`/api/gems/orders/${id}/status`, { status, ...extras }).then(r => r.data),
  earnings: () => api.get('/api/gems/earnings').then(r => r.data),
  suggest: (birthData: any) => api.post('/api/gems/suggest', birthData).then(r => r.data),
}

export const portalApi = {
  invite: (clientId: string, expiresDays = 90) =>
    api.post(`/api/business/clients/${clientId}/invite`, { client_id: clientId, expires_days: expiresDays })
       .then(r => r.data),
  listInvites: (clientId: string) =>
    api.get(`/api/business/clients/${clientId}/invites`).then(r => r.data),
  revoke: (inviteId: string) => api.delete(`/api/business/invites/${inviteId}`).then(r => r.data),
  view: (token: string) => api.get(`/api/portal/${token}`).then(r => r.data),
}

export const aiApi = {
  interpret: (question: string, chart_id?: string, chart_data?: any) =>
    api.post('/api/ai/interpret', { question, chart_id, chart_data }).then(r => r.data),
  research: (query: string, filters?: any) =>
    api.post('/api/ai/research', { query, filters }).then(r => r.data),
}
