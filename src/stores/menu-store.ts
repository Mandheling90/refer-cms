'use client';

import { create } from 'zustand';
import type { SidebarMenuItem } from '@/types/menu';

interface MenuState {
  menus: SidebarMenuItem[];
  activeMenuId: string | null;
  expandedGroups: number[];
  sidebarOpen: boolean;
  setMenus: (menus: SidebarMenuItem[]) => void;
  setActiveMenuId: (menuId: string | null) => void;
  toggleGroup: (index: number) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useMenuStore = create<MenuState>()((set) => ({
  menus: [],
  activeMenuId: null,
  expandedGroups: [],
  sidebarOpen: true,
  setMenus: (menus) => set({ menus }),
  setActiveMenuId: (menuId) => set({ activeMenuId: menuId }),
  toggleGroup: (index) =>
    set((state) => ({
      expandedGroups: state.expandedGroups.includes(index)
        ? state.expandedGroups.filter((i) => i !== index)
        : [...state.expandedGroups, index],
    })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
