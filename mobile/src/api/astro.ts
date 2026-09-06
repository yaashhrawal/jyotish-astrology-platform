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
  planets: Record<string, Planet>;      // keyed by planet name
  planet_house_map: Record<string, number>;
  houses?: any[];
  dashas?: { lord: string; start: string; end: string; years: number }[];
}

const CALC = '/api/calc';

export const getChart = (d: BirthData) =>
  api.post<ChartResponse>(`${CALC}/chart`, d).then((r) => r.data);

export const getDasha = (d: BirthData) =>
  api.post(`${CALC}/dasha`, d).then((r) => r.data);

export const getYogas = (d: BirthData) =>
  api.post(`${CALC}/yogas`, d).then((r) => r.data);

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
