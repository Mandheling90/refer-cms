'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionUser } from '@/types/user';

interface AuthState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  hospitalCode: string | null;
  /** 통합관리자(ALL)일 때 현재 선택한 기관코드 */
  activeHospitalCode: string | null;
  isAuthenticated: boolean;
  login: (tokens: { accessToken: string; refreshToken: string }, hospitalCode?: string, user?: SessionUser) => void;
  logout: () => void;
  setUser: (user: SessionUser) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setHospitalCode: (code: string) => void;
  setActiveHospitalCode: (code: string) => void;
  /** API 호출 시 실제 사용할 기관코드 (ALL이면 activeHospitalCode 사용) */
  getEffectiveHospitalCode: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hospitalCode: null,
      activeHospitalCode: null,
      isAuthenticated: false,
      login: (tokens, hospitalCode, user) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          hospitalCode: hospitalCode ?? null,
          activeHospitalCode: hospitalCode === 'ALL' ? 'ANAM' : (hospitalCode ?? null),
          user: user ?? null,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          hospitalCode: null,
          activeHospitalCode: null,
          isAuthenticated: false,
        }),
      setUser: (user: SessionUser) => set({ user }),
      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
      setHospitalCode: (code: string) => set({ hospitalCode: code }),
      setActiveHospitalCode: (code: string) => set({ activeHospitalCode: code }),
      getEffectiveHospitalCode: () => {
        const state = useAuthStore.getState();
        if (state.hospitalCode === 'ALL') {
          return state.activeHospitalCode ?? 'ANAM';
        }
        return state.hospitalCode;
      },
    }),
    {
      name: 'ehr-auth',
    }
  )
);
