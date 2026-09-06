import { api } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  role: string;
  ayanamsa_pref?: string;
  chart_style?: string;
}
export interface AuthResult { token: string; user: User; }

export const login = (email: string, password: string) =>
  api.post<AuthResult>('/api/auth/login', { email, password }).then((r) => r.data);

export const register = (name: string, email: string, password: string, role = 'user') =>
  api.post<AuthResult>('/api/auth/register', { name, email, password, role }).then((r) => r.data);

export const me = () => api.get<User>('/api/auth/me').then((r) => r.data);
