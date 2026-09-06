import { api } from './client';

export interface BirthData {
  name: string;
  year: number; month: number; day: number;
  hour: number; minute: number;
  tz_offset: number;
  latitude: number; longitude: number;
  place: string;
  ayanamsa: string;
  node_type?: string;
  house_system?: string;
}

export interface Planet {
  longitude: number;
  sign: string;
  sign_index: number;
  degree: number;
  nakshatra: string;
  nakshatra_lord?: string;
  pada?: number;
  retrograde?: boolean;
  speed?: number;
  status?: string;
}

export interface ChartResponse {
  name: string;
  birth?: string;
  place?: string;
  ayanamsa: string;
  julian_day?: number;
  ascendant: { longitude: number; sign: string; sign_index: number; degree: number; nakshatra?: string };
  atmakaraka?: string;
  planets: Record<string, Planet>;             // keyed by planet name
  planet_house_map: Record<string, string[]>;  // keyed by house "1".."12" → planet names
  houses?: any[];
  dashas?: { lord: string; start: string; end: string; years: number }[];
}

const CALC = '/api/calc';

export const getChart = (d: BirthData) =>
  api.post<ChartResponse>(`${CALC}/chart`, d).then((r) => r.data);

export const getDasha = (d: BirthData) =>
  api.post(`${CALC}/dasha`, d).then((r) => r.data);

export interface VargaResponse {
  d: number; name: string; domain?: string;
  ascendant: { sign: string; sign_index: number; degree: number };
  planets: Record<string, Planet>;
  planet_house_map: Record<string, string[]>;
  vargottama?: string[];
}
export const getVarga = (d: BirthData, num: number) =>
  api.post<VargaResponse>(`${CALC}/varga`, { ...d, d: num }).then((r) => r.data);

// ── Matchmaking (Aṣṭakoota) ──────────────────────────────────────────────
export interface CompatPayload {
  p1_name: string; p1_year: number; p1_month: number; p1_day: number; p1_hour: number; p1_minute: number; p1_tz_offset: number; p1_lat: number; p1_lon: number;
  p2_name: string; p2_year: number; p2_month: number; p2_day: number; p2_hour: number; p2_minute: number; p2_tz_offset: number; p2_lat: number; p2_lon: number;
  ayanamsa?: string;
}
export interface CompatResult {
  person1: { name: string; moon_sign: string; nakshatra: string };
  person2: { name: string; moon_sign: string; nakshatra: string };
  score: number; max_score: number; percentage: number; verdict: string;
  kootas: Record<string, { score: number; max: number }>;
}
export const matchCompatibility = (p: CompatPayload) =>
  api.post<CompatResult>(`${CALC}/compatibility`, { ayanamsa: 'lahiri', ...p }).then((r) => r.data);

// ── Prashna (horary) ─────────────────────────────────────────────────────
export interface PrashnaPayload {
  latitude: number; longitude: number; tz_offset: number; ayanamsa?: string;
  question_category: string; question_text?: string;
}
export const prashnaChart = (p: PrashnaPayload) =>
  api.post(`${CALC}/prashna/chart`, { ayanamsa: 'lahiri', ...p }).then((r) => r.data);
export const prashnaAnalyze = (p: PrashnaPayload & { prashna_data?: any }) =>
  api.post(`${CALC}/prashna/analyze`, { ayanamsa: 'lahiri', ...p }).then((r) => r.data);

export interface SaveChartPayload {
  name: string; birth_date: string; birth_time: string; birth_tz: number;
  birth_place: string; latitude: number; longitude: number; ayanamsa: string;
  chart_data: ChartResponse; is_public?: boolean;
}
export const saveChart = (p: SaveChartPayload) =>
  api.post('/api/charts/save', p).then((r) => r.data);

export const getYogas = (d: BirthData) =>
  api.post(`${CALC}/yogas`, d).then((r) => r.data);
export const getAshtakavarga = (d: BirthData) =>
  api.post(`${CALC}/ashtakavarga`, d).then((r) => r.data);
export const getShadbala = (d: BirthData) =>
  api.post(`${CALC}/shadbala`, d).then((r) => r.data);
export const getAspects = (d: BirthData) =>
  api.post(`${CALC}/aspects`, d).then((r) => r.data);
export const getDoshas = (d: BirthData) =>
  api.post(`${CALC}/doshas`, d).then((r) => r.data);
export const getArudha = (d: BirthData) =>
  api.post(`${CALC}/arudha`, d).then((r) => r.data);
export const getKarakas = (d: BirthData) =>
  api.post(`${CALC}/jaimini_karakas`, d).then((r) => r.data);
export const getGochara = (d: BirthData) =>
  api.post(`${CALC}/gochara`, d).then((r) => r.data);

export const gemsCatalog = () =>
  api.get<any[]>(`/api/gems/catalog`).then((r) => r.data);

export const synastry = (p: CompatPayload) =>
  api.post(`${CALC}/synastry`, { ayanamsa: 'lahiri', ...p }).then((r) => r.data);

// Full nested Vimśottarī tree: dashas[].antardashas[].pratyantardashas[]
export interface DashaNode { lord: string; start: string; end: string; years: number; antardashas?: DashaNode[]; pratyantardashas?: DashaNode[]; }
export const getDashaTree = (d: BirthData) =>
  api.post<{ dashas: DashaNode[]; dasha_balance?: any }>(`${CALC}/dasha`, d).then((r) => r.data);

// City → lat/lon via OpenStreetMap Nominatim (same source the web form uses).
export interface Place { display: string; latitude: number; longitude: number; }
export async function searchPlaces(q: string): Promise<Place[]> {
  if (q.trim().length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=7&addressdetails=1`,
      { headers: { 'User-Agent': 'Grahika/1.0 (astrology app)' } }
    );
    const data: any[] = await res.json();
    return data.map((r) => ({
      display: r.display_name,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}
