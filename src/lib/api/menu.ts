import apiClient from './client';
import type { Menu } from '@/types/menu';
import type { ApiResponse, PaginationParams } from '@/types/api';

export const menuApi = {
  list: (params?: PaginationParams & Partial<Menu>) =>
    apiClient.get<ApiResponse<Menu>>('/menu/list.ajax', params),

  save: (data: Partial<Menu>) => apiClient.post<ApiResponse>('/menu/save.ajax', data),

  remove: (list: Partial<Menu>[]) =>
    apiClient.post<ApiResponse>('/menu/remove.ajax', {
      LIST: JSON.stringify(list),
    }),

  sidebarMenus: () =>
    apiClient.get<ApiResponse>('/layout/snb.ajax'),

  list1depth: (params?: PaginationParams) =>
    apiClient.get<ApiResponse<Menu>>('/cms/menu/list1depth.ajax', params),

  list2depth: (params?: PaginationParams & { PARENT_MENU_ID?: string }) =>
    apiClient.get<ApiResponse<Menu>>('/cms/menu/list2depth.ajax', params),

  list3depth: (params?: PaginationParams & { PARENT_MENU_ID?: string }) =>
    apiClient.get<ApiResponse<Menu>>('/cms/menu/list3depth.ajax', params),

  saveOrders: (list: Partial<Menu>[]) =>
    apiClient.post<ApiResponse>('/cms/menu/saveOrders.ajax', {
      LIST: JSON.stringify(list),
    }),
};
