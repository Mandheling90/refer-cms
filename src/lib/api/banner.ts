import apiClient from './client';
import type { ApiResponse, ListResponse, PaginationParams, AuditFields } from '@/types/api';

export interface Banner extends AuditFields {
  BANNER_ID: string;
  BANNER_NAME: string;
  BANNER_TYPE: string;
  IMAGE_URL?: string;
  LINK_URL?: string;
  LINK_TYPE?: string; // 'NEW' | 'SELF'
  USE_YN?: string;
  SORT_ORDER?: number;
  START_DATE?: string;
  END_DATE?: string;
  START_TIME?: string;
  END_TIME?: string;
  ALWAYS_YN?: string; // 상시노출 여부
  LANG_SET?: string;
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

  removeAll: (params: { BANNER_TYPE: string; LANG_SET?: string }) =>
    apiClient.post<ApiResponse>('/banner/removeAll.ajax', params),

  saveOrders: (list: { BANNER_ID: string; SORT_ORDER: number }[]) =>
    apiClient.post<ApiResponse>('/banner/saveOrders.ajax', {
      LIST: JSON.stringify(list),
    }),
};
