export type AuditAction = 'APPROVE' | 'CREATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'REJECT' | 'UPDATE';

/** 로그 내역 목록 아이템 */
export interface LogItem {
  id: string;
  hospitalCode: string;
  adminNumber: string;
  adminName: string;
  ipAddress: string;
  target: string;
  action: AuditAction;
  detail: string | null;
  userId: string | null;
  createdAt: string;
}

/** 로그 내역 상세 (목록 아이템과 동일 구조) */
export type LogDetail = LogItem;

/** 로그 목록 GraphQL 응답 */
export interface LogListResponse {
  adminAuditLogs: {
    items: LogItem[];
    totalCount: number;
    hasNextPage: boolean;
    cursor: string | null;
  };
}

/** 로그 상세 GraphQL 응답 */
export interface LogDetailResponse {
  adminAuditLogById: LogDetail;
}
