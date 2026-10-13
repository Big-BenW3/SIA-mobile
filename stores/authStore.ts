import { create } from 'zustand';
import { authApi, type SessionUser } from '@/services/auth.service';
import { usersApi } from '@/services/users.service';
import { ApiError } from '@/services/api';
import { useSessionStore } from '@/stores/sessionStore';
import { usePostsStore } from '@/stores/postsStore';

// ─── Auth store (real backend) ──────────────────────────────────────
// Tokens persist in on-device SQLite (meta table) via the api client,
// so sessions survive restarts. Pending CR responses (manual-approval
// era) land in pendingLevel instead of a session.

interface AuthState {
  user: SessionUser | null;
  pendingLevel: string | null;
  hasOnboarded: boolean;
  status: 'idle' | 'loading';
  error: string;
  completeOnboarding: () => void;
  login: (email: string, password: string) => Promise<void>;
  signupStudent: (fullName: string, email: string, password: string, joinCode: string) => Promise<void>;
  signupCR: (fullName: string, email: string, password: string, level: string) => Promise<void>;
  updateProfile: (fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  pendingLevel: null,
  hasOnboarded: false,
  status: 'idle',
  error: '',
  completeOnboarding: () => set({ hasOnboarded: true }),

  login: async (email, password) => {
    set({ status: 'loading', error: '' });
    try {
      const res = await authApi.login(email, password);
      if ('user' in res) set({ user: res.user, pendingLevel: null, status: 'idle' });
      else set({ user: null, pendingLevel: res.pendingLevel, status: 'idle' });
    } catch (err) {
      set({ status: 'idle', error: err instanceof ApiError ? err.message : 'Could not log in. Check your connection.' });
      throw err;
    }
  },

  signupStudent: async (fullName, email, password, joinCode) => {
    set({ status: 'loading', error: '' });
    try {
      const user = await authApi.signupStudent(fullName, email, password, joinCode);
      set({ user, pendingLevel: null, status: 'idle' });
    } catch (err) {
      set({ status: 'idle', error: err instanceof ApiError ? err.message : 'Could not create your account.' });
      throw err;
    }
  },

  signupCR: async (fullName, email, password, level) => {
    set({ status: 'loading', error: '' });
    try {
      const res = await authApi.signupCR(fullName, email, password, level);
      if ('pendingLevel' in res) set({ user: null, pendingLevel: res.pendingLevel, status: 'idle' });
      else set({ user: res, pendingLevel: null, status: 'idle' });
    } catch (err) {
      set({ status: 'idle', error: err instanceof ApiError ? err.message : 'Could not submit your request.' });
      throw err;
    }
  },

  updateProfile: async (fullName) => {
    set({ status: 'loading', error: '' });
    try {
      await usersApi.updateMe({ fullName });
      set((s) => ({ user: s.user ? { ...s.user, fullName } : s.user, status: 'idle' }));
    } catch (err) {
      set({ status: 'idle', error: err instanceof ApiError ? err.message : 'Could not save. Check your connection.' });
      throw err;
    }
  },

  logout: async () => {    try {
      await authApi.logout();
    } finally {
      useSessionStore.getState().reset();
      usePostsStore.getState().reset();
      set({ user: null, pendingLevel: null, status: 'idle', error: '' });
    }
  },

  clearError: () => set({ error: '' }),
}));
