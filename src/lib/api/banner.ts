import apiClient from './client';
import type { ApiResponse, ListResponse, PaginationParams, AuditFields } from '@/types/api';

export interface Banner extends AuditFields {
  BANNER_ID: string;
  BANNER_NAME: string;
  BANNER_TYPE: string;
  IMAGE_URL?: string;           // PC 배너 이미지 (라이트모드)
  MOBILE_IMAGE_URL?: string;    // Mobile 배너 이미지 (라이트모드)
  PC_IMAGE_DARK?: string;       // PC 배너 이미지 (다크모드)
  MOBILE_IMAGE_DARK?: string;   // Mobile 배너 이미지 (다크모드)
  VIDEO_URL?: string;           // 배너 영상 URL (라이트모드)
  VIDEO_URL_DARK?: string;      // 배너 영상 URL (다크모드)
  MEDIA_TYPE?: string;          // 'IMAGE' | 'VIDEO'
  MEDIA_DESC?: string;          // 이미지/영상 설명
  MAIN_SLOGAN?: string;         // 메인 슬로건
  SUB_SLOGAN?: string;          // 서브 슬로건(부제)
  LINK_URL?: string;
  LINK_TYPE?: string;           // 'NEW' | 'SELF'
  USE_YN?: string;
  SORT_ORDER?: number;
  START_DATE?: string;
  END_DATE?: string;
  START_TIME?: string;
  END_TIME?: string;
  ALWAYS_YN?: string;           // 상시노출 여부
  LANG_SET?: string;
  SITE_CD?: string;             // 기관코드 (anam | guro | ansan)
}

export const bannerApi = {
  mainList: (params?: PaginationParams & Partial<Banner>) =>
    apiClient.get<ListResponse<Banner>>('/banner/mainList.ajax', params),

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

  removeAll: (params: { BANNER_TYPE: string; LANG_SET?: string; SITE_CD?: string }) =>
    apiClient.post<ApiResponse>('/banner/removeAll.ajax', params),

  saveOrders: (list: { BANNER_ID: string; SORT_ORDER: number }[]) =>
    apiClient.post<ApiResponse>('/banner/saveOrders.ajax', {
      LIST: JSON.stringify(list),
    }),
};
