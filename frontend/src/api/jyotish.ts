import axios from 'axios'

// Use VITE_API_URL in prod/mobile; '' in dev → Vite proxy forwards /api → :8888
const BASE = (import.meta.env.VITE_API_URL || '') + '/api/calc'

export interface BirthData {
  name: string
  year: number; month: number; day: number
  hour: number; minute: number
  tz_offset: number
  latitude: number; longitude: number
  place: string
  ayanamsa?: string
  house_system?: string
  node_type?: string
}

export interface Planet {
  longitude: number
  sign: string
  sign_index: number
  degree: number
  nakshatra: string
  nakshatra_lord: string
  pada: number
  retrograde: boolean
  speed: number
  status: string
  house: number
}

export interface ChartResponse {
  name: string
  birth: string
  place: string
  ayanamsa: string
  ascendant: { longitude: number; sign: string; sign_index: number; degree: number }
  planets: Record<string, Planet>
  houses: Record<string, { cusp_longitude: number; sign: string; sign_index: number; degree: number }>
  planet_house_map: Record<string, string[]>
  atmakaraka: string
  dashas: Array<{ lord: string; start: string; end: string; years: number }>
}

export interface SkyResponse {
  timestamp: string
  planets: Record<string, Planet>
  tithi: { tithi: number; name: string; paksha: string }
  hora_lord: string
  current_nakshatra: string
  nakshatra_lord: string
  moon_sign: string
  sun_sign: string
}

export const getChart = (data: BirthData) =>
  axios.post<ChartResponse>(`${BASE}/chart`, data).then(r => r.data)

export const getCurrentSky = (ayanamsa = 'lahiri') =>
  axios.get<SkyResponse>(`${BASE}/sky`, { params: { ayanamsa } }).then(r => r.data)

export const getDasha = (data: Omit<BirthData, 'name' | 'place'>) =>
  axios.post(`${BASE}/dasha`, data).then(r => r.data)

export const getYogas = (data: Omit<BirthData, 'name' | 'place'>) =>
  axios.post(`${BASE}/yogas`, data).then(r => r.data)

export const getAshtakavarga = (data: Omit<BirthData, 'name' | 'place'>) =>
  axios.post(`${BASE}/ashtakavarga`, data).then(r => r.data)

// ── Rule-based interpretation engine ─────────────────────────────────────────
export interface Factor {
  subject: string; claim: string; effect?: string; polarity: number; strength: number
  topics: string[]; source: string; conditions: string[]
  dasha_active: boolean; weight: number
}
export interface Statement { kind: string; text: string; detail?: string; rule?: string }
export interface TopicResult {
  topic: string; label: string; houses?: number[]; varga?: string
  net: number; tension: boolean
  narrative: {
    headline: string
    statements: Statement[]
    paragraphs: string[]
    drivers: Array<{ claim: string; effect?: string; source: string; weight: number; polarity: number }>
  }
  factors: Factor[]
  active_dasha?: string[]
}
export interface InterpretResponse {
  topic: string; varga: string; scheme: string; ascendant: string
  results: TopicResult[]
}
export interface TopicMeta { key: string; label: string; house?: number; houses?: number[]; primary_varga?: number }

export const getInterpretTopics = () =>
  axios.get<{ topics: TopicMeta[] }>(`${BASE}/interpret/topics`).then(r => r.data.topics)

export const getInterpretation = (
  data: Omit<BirthData, 'place'> & { topic: string; varga?: number; scheme?: string }
) => axios.post<InterpretResponse>(`${BASE}/interpret`, data).then(r => r.data)

export interface DashaTimelineItem {
  lord: string; start: string; end: string; years: number
  net: number; tension: boolean; headline: string; running: boolean
}
export interface DashaPredictResponse {
  ascendant: string
  current: TopicResult & {
    maha: string; antar: string | null
    period: { maha: string; antar: string | null; maha_start: string; maha_end: string; antar_start: string | null; antar_end: string | null }
  }
  timeline: DashaTimelineItem[]
}
export const getDashaPrediction = (
  data: Omit<BirthData, 'place'> & { scheme?: string }
) => axios.post<DashaPredictResponse>(`${BASE}/dasha-predict`, data).then(r => r.data)
