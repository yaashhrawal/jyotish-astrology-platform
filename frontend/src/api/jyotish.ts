import axios from 'axios'

const BASE = 'http://localhost:8888/api/calc'

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
