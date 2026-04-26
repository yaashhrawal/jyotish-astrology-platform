import { create } from 'zustand'
import { authApi, type User } from '../api/client'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('jyotish_token'),
  loading: false,

  login: async (email, password) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('jyotish_token', data.token)
    set({ token: data.token, user: data.user })
  },

  register: async (email, password, name) => {
    const data = await authApi.register(email, password, name)
    localStorage.setItem('jyotish_token', data.token)
    set({ token: data.token, user: data.user })
  },

  logout: () => {
    localStorage.removeItem('jyotish_token')
    set({ token: null, user: null })
  },

  loadUser: async () => {
    const token = localStorage.getItem('jyotish_token')
    if (!token) return
    try {
      set({ loading: true })
      const user = await authApi.me()
      set({ user, loading: false })
    } catch {
      localStorage.removeItem('jyotish_token')
      set({ token: null, user: null, loading: false })
    }
  },
}))
