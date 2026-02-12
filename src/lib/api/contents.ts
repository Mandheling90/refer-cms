import apiClient from './client';
import type { ApiResponse, ListResponse, PaginationParams, AuditFields } from '@/types/api';

export interface Contents extends AuditFields {
  CONTENTS_ID: string;
  CONTENTS_GRP_ID: string;
  CONTENTS_NAME: string;
  CONTENTS_TYPE?: string;
  CONTENTS_BODY?: string;
  USE_YN?: string;
  SORT_ORDER?: number;
}

export const contentsApi = {
  list: (params?: PaginationParams & Partial<Contents>) =>
    apiClient.get<ListResponse<Contents>>('/contents/list.ajax', params),

  save: (data: Partial<Contents>) =>
    apiClient.post<ApiResponse>('/contents/save.ajax', data),

  remove: (list: Partial<Contents>[]) =>
    apiClient.post<ApiResponse>('/contents/remove.ajax', {
      LIST: JSON.stringify(list),
    }),
};
