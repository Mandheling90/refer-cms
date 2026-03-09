import apiClient from './client';
import type { Admin } from '@/types/admin';
import type { ApiResponse, PaginationParams } from '@/types/api';

export const adminApi = {
  list: (params?: PaginationParams & Partial<Admin>) =>
    apiClient.get<ApiResponse<Admin>>('/user/list.ajax', params),

  save: (data: Partial<Admin>) =>
    apiClient.post<ApiResponse>('/user/save.ajax', data),

  remove: (list: Partial<Admin>[]) =>
    apiClient.post<ApiResponse>('/user/remove.ajax', {
      LIST: JSON.stringify(list),
    }),
};
