import { create } from 'zustand';
import { User } from '../types';
import api from '../utils/api';

interface AuthState {
  user: User|null; token: string|null; isLoading: boolean; error: string|null;
  login(email: string, password: string): Promise<void>;
  signup(data: Record<string,unknown>): Promise<void>;
  logout(): void;
  updateUser(user: User): void;
  clearError(): void;
  initAuth(): void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, token: null, isLoading: false, error: null,

  initAuth: () => {
    const token = localStorage.getItem('lifeflow_token');
    const u = localStorage.getItem('lifeflow_user');
    if (token && u) { try { set({ token, user: JSON.parse(u) }); } catch { localStorage.clear(); } }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('lifeflow_token', data.token);
      localStorage.setItem('lifeflow_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      set({ error: e.response?.data?.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  signup: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/signup', formData);
      localStorage.setItem('lifeflow_token', data.token);
      localStorage.setItem('lifeflow_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      set({ error: e.response?.data?.message || 'Signup failed', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('lifeflow_token');
    localStorage.removeItem('lifeflow_user');
    set({ user: null, token: null });
  },

  updateUser: (user) => {
    localStorage.setItem('lifeflow_user', JSON.stringify(user));
    set({ user });
  },

  clearError: () => set({ error: null }),
}));
