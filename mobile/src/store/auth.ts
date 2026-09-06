import { create } from 'zustand';
import { setToken, loadToken } from '../api/client';
import * as authApi from '../api/auth';

interface AuthState {
  user: authApi.User | null;
  initializing: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  init: async () => {
    const t = await loadToken();
    if (!t) { set({ initializing: false }); return; }
    try {
      const user = await authApi.me();
      set({ user, initializing: false });
    } catch {
      await setToken(null);
      set({ user: null, initializing: false });
    }
  },
  login: async (email, password) => {
    const { token, user } = await authApi.login(email, password);
    await setToken(token);
    set({ user });
  },
  register: async (name, email, password, role = 'user') => {
    const { token, user } = await authApi.register(name, email, password, role);
    await setToken(token);
    set({ user });
  },
  logout: async () => {
    await setToken(null);
    set({ user: null });
  },
}));
