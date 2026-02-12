import apiClient from './client';
import type { User } from '@/types/user';
import type { ApiResponse, PaginationParams } from '@/types/api';

export const userApi = {
  list: (params?: PaginationParams & Partial<User>) =>
    apiClient.get<ApiResponse<User>>('/user/list.ajax', params),

  save: (data: Partial<User>) => apiClient.post<ApiResponse>('/user/save.ajax', data),

  remove: (list: Partial<User>[]) =>
    apiClient.post<ApiResponse>('/user/remove.ajax', {
      LIST: JSON.stringify(list),
    }),

  login: (data: { USER_ID: string; PASSWORD: string }) =>
    apiClient.post<ApiResponse>('/cms/vktmTlwps/login.do', data),

  logout: () => apiClient.get<ApiResponse>('/cms/logout.do'),
};
