/* --- e-Consult 타입 정의 --- */

/** e-Consult 답변 상태 */
export type EConsultStatus = 'PENDING' | 'ANSWERED' | 'EXPIRED';

/** e-Consult 답변 상태 라벨 */
export const ECONSULT_STATUS_MAP: Record<EConsultStatus, string> = {
  PENDING: '답변대기',
  ANSWERED: '답변완료',
  EXPIRED: '답변만료',
};

/** e-Consult 답변 상태 검색 옵션 */
export const ECONSULT_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '답변대기' },
  { value: 'ANSWERED', label: '답변완료' },
  { value: 'EXPIRED', label: '답변만료' },
] as const;

/** e-Consult 목록 아이템 (기존) */
export interface EConsultItem {
  id: string;
  title: string;
  content: string;
  requesterName: string;
  requesterEmail: string;
  hospitalName: string;
  hospitalCode?: string;
  consultantId?: string;
  consultantName: string;
  consultantDepartment: string;
  answer?: string;
  status: EConsultStatus;
  createdAt: string;
  answeredAt?: string;
}

/** 목록 응답 (기존) */
export interface EConsultListResponse {
  eConsultList: {
    items: EConsultItem[];
    totalCount: number;
  };
}

/* ─── Admin e-Consult 타입 (adminEConsults) ─── */

/** 신청자 정보 */
export interface AdminEConsultRequester {
  id: string;
  userName: string;
}

/** 자문의 정보 */
export interface AdminEConsultConsultant {
  id: string;
  name: string;
  departmentId: string;
  specialty: string;
}

/** 답변 정보 */
export interface AdminEConsultReply {
  id: string;
  content: string;
  createdAt: string;
}

/** Admin e-Consult 목록 아이템 */
export interface AdminEConsultItem {
  id: string;
  requesterId: string;
  requester: AdminEConsultRequester;
  consultantId: string;
  consultant: AdminEConsultConsultant;
  hospitalCode: string;
  title: string;
  status: EConsultStatus;
  createdAt: string;
  expiresAt: string;
  answeredAt?: string;
  reply?: AdminEConsultReply;
}

/** Admin e-Consult 필터 */
export interface AdminEConsultFilter {
  hospitalCode?: string;
  status?: EConsultStatus;
}

/** Admin e-Consult 목록 응답 */
export interface AdminEConsultListResponse {
  adminEConsults: {
    items: AdminEConsultItem[];
    totalCount: number;
    hasNextPage: boolean;
    cursor?: string;
  };
}
