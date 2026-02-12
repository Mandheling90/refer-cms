import apiClient from './client';
import type { Code, CodeGroup, CommonCode } from '@/types/code';
import type { ApiResponse, ListResponse, PaginationParams, CommonCodeItem } from '@/types/api';

export const codeApi = {
  list: (params?: PaginationParams & Partial<Code>) =>
    apiClient.get<ListResponse<Code>>('/code/list.ajax', params),

  save: (data: Partial<Code>) => apiClient.post<ApiResponse>('/code/save.ajax', data),

  remove: (list: Partial<Code>[]) =>
    apiClient.post<ApiResponse>('/code/remove.ajax', {
      LIST: JSON.stringify(list),
    }),

  commonCodeList: (codeGroup: string) =>
    apiClient.get<CommonCodeItem[]>('/code/commonCodeList.ajax', {
      CODE_GROUP: codeGroup,
    }),
};

export const codeGroupApi = {
  list: (params?: PaginationParams & Partial<CodeGroup>) =>
    apiClient.get<ListResponse<CodeGroup>>('/codeGroup/list.ajax', params),

  save: (data: Partial<CodeGroup>) =>
    apiClient.post<ApiResponse>('/codeGroup/save.ajax', data),

  remove: (list: Partial<CodeGroup>[]) =>
    apiClient.post<ApiResponse>('/codeGroup/remove.ajax', {
      LIST: JSON.stringify(list),
    }),
};

export const commonCodeApi = {
  list: (params?: PaginationParams & Partial<CommonCode>) =>
    apiClient.get<ListResponse<CommonCode>>('/commonCode/list.ajax', params),

  save: (data: Partial<CommonCode>) =>
    apiClient.post<ApiResponse>('/commonCode/save.ajax', data),

  remove: (list: Partial<CommonCode>[]) =>
    apiClient.post<ApiResponse>('/commonCode/remove.ajax', {
      LIST: JSON.stringify(list),
    }),
};
