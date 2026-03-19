/* --- 의료진 타입 정의 --- */

/** 의료진 목록 아이템 (medicalStaffList API 응답) */
export interface MedicalStaffItem {
  doctorId: string;
  doctorName: string;
  photoUrl?: string;
  departmentCode?: string;
  departmentName?: string;
  bio?: string;
  specialty?: string;
  hospitalCode?: string;
  mcdpAbrvCd?: string;
  mcdpDvsnCd?: string;
  mcdpSqncVl?: string;
  apstYmd?: string;
  apfnYmd?: string;
  smcrYn?: string;
  frvsMdcrPsblYn?: string;
  revsMdcrPsblYn?: string;
  fastMdcrDt?: string;
  drNo?: string;
  isVisible?: boolean;
  updatedAt?: string;
}

/** 목록 응답 */
export interface MedicalStaffListResponse {
  medicalStaffList: {
    items: MedicalStaffItem[];
    totalCount: number;
  };
}

/** @deprecated adminDoctors용 - 호환용 */
export interface AdminDoctorItem {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  licenseNo?: string;
  departmentName?: string;
  specialty?: string;
  photoUrl?: string;
  hospitalCode?: string;
  isActive: boolean;
  status: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated */
export interface AdminDoctorsResponse {
  adminDoctors: {
    items: AdminDoctorItem[];
    totalCount: number;
    hasNextPage: boolean;
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
