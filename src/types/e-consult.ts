/* --- e-Consult 타입 정의 --- */

/** e-Consult 답변 상태 */
export type EConsultStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED';

/** e-Consult 답변 상태 라벨 */
export const ECONSULT_STATUS_MAP: Record<EConsultStatus, string> = {
  PENDING: '답변대기',
  COMPLETED: '답변완료',
  EXPIRED: '답변만료',
};

/** e-Consult 답변 상태 검색 옵션 */
export const ECONSULT_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '답변대기' },
  { value: 'COMPLETED', label: '답변완료' },
  { value: 'EXPIRED', label: '답변만료' },
] as const;

/** e-Consult 목록 아이템 */
export interface EConsultItem {
  id: string;
  /** e-Consult 제목 */
  title: string;
  /** e-Consult 내용 */
  content: string;
  /** 신청자명 */
  requesterName: string;
  /** 신청자 이메일 */
  requesterEmail: string;
  /** 의료기관명 */
  hospitalName: string;
  hospitalCode?: string;
  /** 자문의 ID */
  consultantId?: string;
  /** 자문의 */
  consultantName: string;
  /** 자문의 진료과 */
  consultantDepartment: string;
  /** 자문의 답변 */
  answer?: string;
  /** 답변 상태 */
  status: EConsultStatus;
  /** 신청일시 */
  createdAt: string;
  /** 답변일시 */
  answeredAt?: string;
}

/** 목록 응답 */
export interface EConsultListResponse {
  eConsultList: {
    items: EConsultItem[];
    totalCount: number;
  };
}
