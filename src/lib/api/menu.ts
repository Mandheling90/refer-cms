import apiClient from './client';
import type { Menu } from '@/types/menu';
import type { Board } from '@/types/board';
import type { ApiResponse, PaginationParams } from '@/types/api';
import type { Contents } from './contents';

export const menuApi = {
  list: (params?: PaginationParams & Partial<Menu>) =>
    apiClient.get<ApiResponse<Menu>>('/menu/list.ajax', params),

  save: (data: Partial<Menu>) => apiClient.post<ApiResponse>('/menu/save.ajax', data),

  remove: (list: Partial<Menu>[]) =>
    apiClient.post<ApiResponse>('/menu/remove.ajax', {
      LIST: JSON.stringify(list),
    }),

  sidebarMenus: () =>
    apiClient.get<ApiResponse>('/layout/snb.ajax'),

  list1depth: (params?: PaginationParams) =>
    apiClient.get<ApiResponse<Menu>>('/cms/menu/list1depth.ajax', params),

  list2depth: (params?: PaginationParams & { PARENT_MENU_ID?: string }) =>
    apiClient.get<ApiResponse<Menu>>('/cms/menu/list2depth.ajax', params),

  list3depth: (params?: PaginationParams & { PARENT_MENU_ID?: string }) =>
    apiClient.get<ApiResponse<Menu>>('/cms/menu/list3depth.ajax', params),

  saveOrders: (list: Partial<Menu>[]) =>
    apiClient.post<ApiResponse>('/cms/menu/saveOrders.ajax', {
      LIST: JSON.stringify(list),
    }),

  cmsSave: (data: Partial<Menu>) =>
    apiClient.post<ApiResponse>('/cms/menu/save.ajax', data),

  boardList: (params?: PaginationParams & { BOARD_NAME?: string }) =>
    apiClient.get<ApiResponse<Board>>('/board/configList.ajax', params),

  contentsList: (params?: PaginationParams & { CONTENTS_NAME?: string }) =>
    apiClient.get<ApiResponse<Contents>>('/contents/list.ajax', params),
};
