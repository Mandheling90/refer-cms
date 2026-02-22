'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionUser } from '@/types/user';

interface AuthState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  hospitalCode: string | null;
  isAuthenticated: boolean;
  login: (tokens: { accessToken: string; refreshToken: string }, hospitalCode?: string, user?: SessionUser) => void;
  logout: () => void;
  setUser: (user: SessionUser) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setHospitalCode: (code: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hospitalCode: null,
      isAuthenticated: false,
      login: (tokens, hospitalCode, user) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          hospitalCode: hospitalCode ?? null,
          user: user ?? null,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          hospitalCode: null,
          isAuthenticated: false,
        }),
      setUser: (user: SessionUser) => set({ user }),
      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
      setHospitalCode: (code: string) => set({ hospitalCode: code }),
    }),
    {
      name: 'ehr-auth',
    }
  )
);
