/** GraphQL 공통 응답 타입 */
export interface MutationResponse {
  success: boolean;
  message?: string;
}

/** 로그인 응답 */
export interface LoginResponse {
  login: {
    accessToken: string;
    refreshToken: string;
  };
}

/** 페이징 목록 응답 */
export interface PaginatedList<T> {
  list: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
