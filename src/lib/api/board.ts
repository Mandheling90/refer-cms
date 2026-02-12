import apiClient from './client';
import type { Board, BoardArticle } from '@/types/board';
import type { ApiResponse, PaginationParams } from '@/types/api';

export const boardApi = {
  list: (params?: PaginationParams & Partial<Board>) =>
    apiClient.get<ApiResponse<Board>>('/board/list.ajax', params),

  save: (data: Partial<Board>) => apiClient.post<ApiResponse>('/board/save.ajax', data),

  remove: (list: Partial<Board>[]) =>
    apiClient.post<ApiResponse>('/board/remove.ajax', {
      LIST: JSON.stringify(list),
    }),

  configList: (params?: PaginationParams) =>
    apiClient.get<ApiResponse<Board>>('/board/configList.ajax', params),

  configSave: (data: Partial<Board>) =>
    apiClient.post<ApiResponse>('/board/configSave.ajax', data),
};

export const boardArticleApi = {
  list: (params?: PaginationParams & { BOARD_ID?: string }) =>
    apiClient.get<ApiResponse<BoardArticle>>('/board/articleList.ajax', params),

  save: (data: Partial<BoardArticle>) =>
    apiClient.post<ApiResponse>('/board/articleSave.ajax', data),

  remove: (list: Partial<BoardArticle>[]) =>
    apiClient.post<ApiResponse>('/board/articleRemove.ajax', {
      LIST: JSON.stringify(list),
    }),
};
