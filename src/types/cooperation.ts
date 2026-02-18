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
  /** H: 협력병원, M: 협력의원 */
  partnerType?: 'H' | 'M';
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
  staffName?: string;
  staffPhone?: string;
  staffEmail?: string;
  directorName?: string;
  directorPhone?: string;
  directorLicenseNo?: string;
  institutionType?: string;
  approvedAt?: string;
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
  /* 협력의원 체크리스트: 병원 세부 정보 */
  clinicPhysicalTherapyRoom?: boolean;
  clinicDialysisCount?: number | string;
  clinicMedicationInjectable?: boolean;
  clinicDermatologyCount?: number | string;
  clinicLightTherapy?: boolean;
  clinicExcimerLaser?: boolean;
  clinicEntCount?: number | string;
  clinicEarSurgeryDressing?: boolean;
  clinicBetadineSoaking?: boolean;
  clinicOtherCount?: number | string;
  clinicSurgicalDressing?: boolean;
  clinicStitchOut?: boolean;
  clinicWoundCare?: boolean;
  clinicEmail?: string;
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

/* ─── Enum ─── */

export type PartnerStatus = 'APPROVED' | 'DRAFT' | 'PENDING' | 'REJECTED' | 'TERMINATED';

/** 상태 옵션 */
export const PARTNER_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '신청대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
  { value: 'TERMINATED', label: '해지' },
] as const;

/** PartnerType: H=협력병원, M=협력의원 */
export const PARTNER_TYPE_OPTIONS = [
  { value: 'H', label: '협력병원' },
  { value: 'M', label: '협력의원' },
] as const;

/** 상태 라벨 변환 */
export const partnerStatusLabel = (val?: string) => {
  const found = PARTNER_STATUS_OPTIONS.find((o) => o.value === val);
  return found?.label ?? val ?? '-';
};

/** 기관구분 라벨 변환 */
export const partnerTypeLabel = (val?: string) => {
  const found = PARTNER_TYPE_OPTIONS.find((o) => o.value === val);
  return found?.label ?? val ?? '-';
};

/** 진료과목 옵션 (의원용) */
export const SPECIALTY_OPTIONS = [
  { group: '내과', items: ['내과', '소화기내과', '순환기내과', '호흡기내과', '내분비내과', '신장내과', '혈액종양내과', '감염내과', '류마티스내과', '알레르기내과'] },
  { group: '외과', items: ['외과', '흉부외과', '신경외과', '정형외과', '성형외과', '소아외과'] },
  { group: '기타 진료과', items: ['산부인과', '소아청소년과', '안과', '이비인후과', '피부과', '비뇨의학과', '정신건강의학과', '재활의학과', '마취통증의학과', '영상의학과', '방사선종양학과', '병리과', '진단검사의학과', '가정의학과', '응급의학과', '핵의학과', '직업환경의학과'] },
] as const;
