import apiClient from './client';
import type { Role, RoleMenu, RoleUser } from '@/types/role';
import type { ApiResponse, PaginationParams } from '@/types/api';

export const roleApi = {
  list: (params?: PaginationParams & Partial<Role>) =>
    apiClient.get<ApiResponse<Role>>('/role/list.ajax', params),

  save: (data: Partial<Role>) => apiClient.post<ApiResponse>('/role/save.ajax', data),

  remove: (list: Partial<Role>[]) =>
    apiClient.post<ApiResponse>('/role/remove.ajax', {
      LIST: JSON.stringify(list),
    }),
};

export const roleMenuApi = {
  list: (params?: { ROLE_ID?: string }) =>
    apiClient.get<ApiResponse<RoleMenu>>('/roleMenu/list.ajax', params),

  save: (data: { ROLE_ID: string; MENU_LIST: string }) =>
    apiClient.post<ApiResponse>('/roleMenu/save.ajax', data),
};

export const roleUserApi = {
  list: (params?: { ROLE_ID?: string }) =>
    apiClient.get<ApiResponse<RoleUser>>('/roleUser/list.ajax', params),

  save: (data: { ROLE_ID: string; USER_LIST: string }) =>
    apiClient.post<ApiResponse>('/roleUser/save.ajax', data),
};
