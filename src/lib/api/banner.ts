import apiClient from './client';
import type { ApiResponse, ListResponse, PaginationParams, AuditFields } from '@/types/api';

export interface Banner extends AuditFields {
  BANNER_ID: string;
  BANNER_NAME: string;
  BANNER_TYPE: string;
  IMAGE_URL?: string;
  LINK_URL?: string;
  USE_YN?: string;
  SORT_ORDER?: number;
  START_DATE?: string;
  END_DATE?: string;
}

export const bannerApi = {
  stripList: (params?: PaginationParams & Partial<Banner>) =>
    apiClient.get<ListResponse<Banner>>('/banner/stripList.ajax', params),

  popupList: (params?: PaginationParams & Partial<Banner>) =>
    apiClient.get<ListResponse<Banner>>('/banner/popupList.ajax', params),

  save: (data: Partial<Banner>) =>
    apiClient.post<ApiResponse>('/banner/save.ajax', data),

  remove: (list: Partial<Banner>[]) =>
    apiClient.post<ApiResponse>('/banner/remove.ajax', {
      LIST: JSON.stringify(list),
    }),
};
