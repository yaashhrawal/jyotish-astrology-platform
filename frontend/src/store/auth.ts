import { create } from 'zustand'
import { authApi, type User, type UserRole } from '../api/client'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  initialized: boolean   // true once loadUser has resolved/rejected — prevents login flash
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, phone?: string, role?: UserRole) => Promise<void>
  googleLogin: (credential: string, role?: UserRole) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('jyotish_token'),
  loading: false,
  initialized: false,

  login: async (email, password) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('jyotish_token', data.token)
    set({ token: data.token, user: data.user, initialized: true })
  },

  register: async (email, password, name, phone = '', role = 'astrologer') => {
    const data = await authApi.register(email, password, name, phone, role)
    localStorage.setItem('jyotish_token', data.token)
    set({ token: data.token, user: data.user, initialized: true })
  },

  googleLogin: async (credential, role = 'user') => {
    const data = await authApi.google(credential, role)
    localStorage.setItem('jyotish_token', data.token)
    set({ token: data.token, user: data.user, initialized: true })
  },

  logout: () => {
    localStorage.removeItem('jyotish_token')
    set({ token: null, user: null })
  },

  loadUser: async () => {
    const token = localStorage.getItem('jyotish_token')
    if (!token) { set({ initialized: true }); return }
    try {
      set({ loading: true })
      const user = await authApi.me()
      set({ user, loading: false, initialized: true })
    } catch {
      localStorage.removeItem('jyotish_token')
      set({ token: null, user: null, loading: false, initialized: true })
    }
  },
}))
