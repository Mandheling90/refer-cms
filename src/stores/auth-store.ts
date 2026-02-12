'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionUser } from '@/types/user';

interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  login: (user: SessionUser) => void;
  logout: () => void;
  setUser: (user: SessionUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user: SessionUser) =>
        set({
          user,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
      setUser: (user: SessionUser) => set({ user }),
    }),
    {
      name: 'ehr-auth',
    }
  )
);
