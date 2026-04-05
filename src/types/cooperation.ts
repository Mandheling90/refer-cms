/* ─── GraphQL 응답 타입 (실제 API 스키마 기반) ─── */

/** 병원 모델 */
export interface HospitalModel {
  id: string;
  name: string;
  representative?: string;
  phone?: string;
  faxNumber?: string;
  address?: string;
  addressDetail?: string;
  zipCode?: string;
  website?: string;
  specialties?: string;
  /** A: 협력병원, B: 협력의원 */
  partnerType?: 'A' | 'B';
  classificationCode?: string;
  phisCode?: string;
  hospitalCode?: string;
}

/** 협력병의원 신청 모델 (목록용 기본 필드) */
export interface PartnerApplicationModel {
  id: string;
  status: PartnerStatus;
  hospitalCode: string;
  hospitalId: string;
  applicantId?: string;
  staffName?: string;
  staffPhone?: string;
  staffEmail?: string;
  directorName?: string;
  directorPhone?: string;
  approvedAt?: string;
  terminatedAt?: string;
  reviewedAt?: string;
  reviewedById?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  hospital: HospitalModel;
}

/** 협력병의원 신청 상세 모델 (PartnerHospitalModel) */
export interface PartnerApplicationDetail extends PartnerApplicationModel {
  /* 병원장 추가 정보 */
  directorLicenseNo?: string;
  directorBirthDate?: string;
  directorGender?: string;
  directorEmail?: string;
  directorSchool?: string;
  directorGraduationYear?: string;
  directorTrainingHospital?: string;
  directorDepartment?: string;
  directorSubSpecialty?: string;
  directorCarNo?: string;
  directorEmailConsent?: boolean;
  directorSmsConsent?: boolean;
  directorReplyConsent?: boolean;
  isDirector?: boolean;
  /* 실무자 추가 */
  staffPosition?: string;
  staffTel?: string;
  staffDeptType?: string;
  staffDeptValue?: string;
  institutionType?: string;
  /* 기타 */
  remarks?: string;
  attachments?: Array<{ url?: string; filename?: string; name?: string; originalName?: string }> | unknown;
  /* 체크리스트: 병상 운영 현황 */
  activeBedCount?: number;
  totalBedCount?: number;
  premiumRoomCount?: number;
  multiRoomCount?: number;
  icuCount?: number;
  erCount?: number;
  /* 인력 현황 */
  nurseCount?: number;
  specialistCount?: number;
  totalStaffCount?: number;
  /* 시설 운영 현황 */
  hasDialysisRoom?: boolean;
  hasEr?: boolean;
  hasHospice?: boolean;
  hasIcu?: boolean;
  hasOperatingRoom?: boolean;
  hasPhysicalTherapy?: boolean;
  hasPsychClosed?: boolean;
  hasPsychGeneral?: boolean;
  /* 간병시스템 */
  hasIntegratedNursing?: boolean;
  hasGuardianCare?: boolean;
  hasSharedCare?: boolean;
  /* 격리병상 */
  hasRehabIsolation?: boolean;
  hasRehabOt?: boolean;
  hasRehabPt?: boolean;
  hasRehabSt?: boolean;
  hasRehabSwallow?: boolean;
  isolationRoomCount?: number;
  isolationSingleCount?: number;
  isolationDoubleCount?: number;
  isolationTripleCount?: number;
  isolationTypes?: unknown;
  isolationCareType?: string;
  isolationRehabType?: string;
  /* 장비 & 처치 */
  majorEquipment?: string;
  availableTreatments?: unknown;
  departmentSpecialists?: unknown;
  /* 협력의원 체크리스트 (실제 API 스키마) */
  clinicHasExcimerLaser?: boolean;
  clinicHasHemodialysis?: boolean;
  clinicHasPeritoneal?: boolean;
  clinicHasPhototherapy?: boolean;
  clinicMedicationType?: string;
  /* 기타 */
  attachmentRows?: unknown[];
}

/** 신청 목록 응답 */
export interface AdminPartnerApplicationsResponse {
  adminPartnerApplications: {
    items: PartnerApplicationModel[];
    totalCount: number;
    hasNextPage: boolean;
  };
}

/** 신청 상세 응답 */
export interface AdminPartnerApplicationByIdResponse {
  adminPartnerApplicationById: PartnerApplicationDetail;
}

/* ─── 수정요청 타입 ─── */

export type UpdateRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** 협력병의원 수정요청 모델 */
export interface PartnerUpdateRequestModel {
  id: string;
  status: UpdateRequestStatus;
  partnerApplicationId: string;
  hospitalCode: string;
  requestedHospitalData?: Record<string, unknown>;
  requestedApplicationData?: Record<string, unknown>;
  reviewedAt?: string;
  reviewedById?: string;
  directorName?: string;
  createdAt: string;
  hospital?: HospitalModel;
}

/** 수정요청 목록 응답 */
export interface AdminPartnerUpdateRequestsResponse {
  adminPartnerUpdateRequests: PartnerUpdateRequestModel[];
}

/** 수정요청 상세 응답 */
export interface AdminPartnerUpdateRequestByIdResponse {
  adminPartnerUpdateRequestById: PartnerUpdateRequestModel;
}

/* ─── Enum ─── */

export type PartnerStatus = 'APPROVED' | 'DRAFT' | 'PENDING' | 'REJECTED' | 'TERMINATED';

/** 진료과목 옵션 (의원용) */
export const SPECIALTY_OPTIONS = [
  { group: '내과', items: ['내과', '소화기내과', '순환기내과', '호흡기내과', '내분비내과', '신장내과', '혈액종양내과', '감염내과', '류마티스내과', '알레르기내과'] },
  { group: '외과', items: ['외과', '흉부외과', '신경외과', '정형외과', '성형외과', '소아외과'] },
  { group: '기타 진료과', items: ['산부인과', '소아청소년과', '안과', '이비인후과', '피부과', '비뇨의학과', '정신건강의학과', '재활의학과', '마취통증의학과', '영상의학과', '방사선종양학과', '병리과', '진단검사의학과', '가정의학과', '응급의학과', '핵의학과', '직업환경의학과'] },
] as const;
