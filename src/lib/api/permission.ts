import apiClient from './client';
import type { Permission, PermissionGroup } from '@/types/permission';
import type { ApiResponse, PaginationParams } from '@/types/api';

export const permissionApi = {
  list: (params?: PaginationParams & Partial<Permission>) =>
    apiClient.get<ApiResponse<Permission>>('/permission/list.ajax', params),

  save: (data: Partial<Permission>) =>
    apiClient.post<ApiResponse>('/permission/save.ajax', data),

  remove: (list: Partial<Permission>[]) =>
    apiClient.post<ApiResponse>('/permission/remove.ajax', {
      LIST: JSON.stringify(list),
    }),

  groupList: (params?: PaginationParams & Partial<PermissionGroup>) =>
    apiClient.get<ApiResponse<PermissionGroup>>('/permission/groupList.ajax', params),
};
