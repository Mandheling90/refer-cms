/* --- 의료진 타입 정의 --- */

/** 의료진 목록 아이템 (API 응답 그대로) */
export interface MedicalStaffItem {
  doctorId: string;
  doctorName: string;
  photoUrl?: string;
  departmentCode?: string;
  departmentName?: string;
  bio?: string;
  hospitalCode?: string;
  /** 진료과 약어 코드 */
  mcdpAbrvCd?: string;
  /** 진료과 구분 코드 */
  mcdpDvsnCd?: string;
  /** 진료과 순서 */
  mcdpSqncVl?: string;
  /** 발령시작일 */
  apstYmd?: string;
  /** 발령종료일 */
  apfnYmd?: string;
  /** 자문의 여부 (Y/N) */
  smcrYn?: string;
  /** 초진 가능 여부 (Y/N) */
  frvsMdcrPsblYn?: string;
  /** 재진 가능 여부 (Y/N) */
  revsMdcrPsblYn?: string;
  /** 빠른진료일 */
  fastMdcrDt?: string;
}

/** 목록 응답 */
export interface MedicalStaffListResponse {
  medicalStaffList: {
    items: MedicalStaffItem[];
    totalCount: number;
  };
}

/** 자문의 여부 옵션 */
export const CONSULTANT_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'Y', label: '예' },
  { value: 'N', label: '아니오' },
] as const;

/** 병원코드 → 병원명 매핑 */
export const HOSPITAL_CODE_MAP: Record<string, string> = {
  ANAM: '고려대학교 안암병원',
  GURO: '고려대학교 구로병원',
  ANSAN: '고려대학교 안산병원',
};
