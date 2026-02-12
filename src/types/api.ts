export interface Pagination {
  TOTAL_ENTITY?: number;
  TOTAL_PAGE?: number;
  PAGE?: number;
}

export interface ServiceResult<T = unknown> {
  IS_SUCCESS: boolean;
  MESSAGE_TEXT?: string;
  MESSAGE_CODE?: string;
  REDIRECT_URI?: string;
  LIST?: T[];
  MAP?: T;
  COUNT?: number;
  PAGINATION?: Pagination;
}

export interface ApiResponse<T = unknown> {
  ServiceResult: ServiceResult<T>;
}

export type ListResponse<T = unknown> = ApiResponse<T>;

export interface PaginationParams {
  FIRST_ENTITY?: number;
  FINAL_ENTITY?: number;
  SHOWN_ENTITY?: number;
  CURRENT_PAGE?: number;
}

export interface CommonCodeItem {
  CODE: string;
  CODE_NAME: string;
}

export interface AuditFields {
  INSERT_USER?: string;
  INSERT_DTTM?: string;
  UPDATE_USER?: string;
  UPDATE_DTTM?: string;
}
