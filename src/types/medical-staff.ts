/* --- 의료진 타입 정의 --- */

/** 의료진 목록 모델 */
export interface MedicalStaffModel {
  id: string;
  staffNo: string;
  name: string;
  hospitalName: string;
  mainDepartment: string;
  profileImageUrl?: string;
  isConsultant: boolean;
  isVisible: boolean;
  updatedAt: string;
  createdAt: string;
}

/** 의료진 상세 모델 */
export interface MedicalStaffDetail extends MedicalStaffModel {
  profileImageFilename?: string;
  profileImageSize?: number;
  consultantEmail?: string;
  departmentSpecialists?: DepartmentSpecialist[];
}

/** 진료과 전문의 수 */
export interface DepartmentSpecialist {
  departmentName: string;
  specialistCount: number;
  checked: boolean;
}

/** 목록 응답 */
export interface AdminMedicalStaffResponse {
  adminMedicalStaffs: {
    items: MedicalStaffModel[];
    totalCount: number;
    hasNextPage: boolean;
  };
}

/** 상세 응답 */
export interface AdminMedicalStaffByIdResponse {
  adminMedicalStaffById: MedicalStaffDetail;
}

/** 자문의 여부 옵션 */
export const CONSULTANT_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'Y', label: '예' },
  { value: 'N', label: '아니오' },
] as const;
