/* --- e-Consult 타입 정의 --- */

/** e-Consult 답변 상태 */
export type EConsultStatus = 'PENDING' | 'ANSWERED' | 'EXPIRED';

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
  department: string;
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
  title?: string;
  requesterName?: string;
  requesterEmail?: string;
  requesterHospitalName?: string;
  consultantName?: string;
  consultantDepartment?: string;
  status?: EConsultStatus;
  hospitalCode?: string;
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
