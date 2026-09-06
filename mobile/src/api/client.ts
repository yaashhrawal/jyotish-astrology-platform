// API layer — talks to the SAME backend as the web app.
// Native screens render JSON; never server HTML.
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE = 'https://grahika.sevasangrah.in';
const TOKEN_KEY = 'grahika_token';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

let _token: string | null = null;

export async function loadToken(): Promise<string | null> {
  if (_token) return _token;
  try { _token = await SecureStore.getItemAsync(TOKEN_KEY); } catch { _token = null; }
  return _token;
}

export async function setToken(token: string | null) {
  _token = token;
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch { /* keychain unavailable */ }
}

api.interceptors.request.use(async (config) => {
  const t = await loadToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

/** Normalize any axios error into a short human message for error states. */
export function apiError(e: any): string {
  if (e?.response?.data?.detail) return String(e.response.data.detail);
  if (e?.response?.status === 401) return 'Please sign in to continue.';
  if (e?.message === 'Network Error') return 'Cannot reach the server. Check your connection.';
  return e?.message || 'Something went wrong.';
}
