import type { AuditFields } from './api';

/** adminUsers API 응답 아이템 */
export interface AdminUser {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone?: string;
  userType: string;
  status: string;
  hospitalCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** adminUsers API 응답 */
export interface AdminUsersResponse {
  adminUsers: {
    items: AdminUser[];
    totalCount: number;
    hasNextPage: boolean;
  };
}

/** UserProfile (상세 조회용) */
export interface UserProfile {
  birthDate?: string;
  licenseNo?: string;
  school?: string;
  department?: string;
  doctorType?: string;
  specialty?: string;
  isDirector: boolean;
  emailConsent: boolean;
  smsConsent: boolean;
  replyConsent: boolean;
  hospName?: string;
  hospCode?: string;
  hospPhone?: string;
  hospAddress?: string;
  hospAddressDetail?: string;
  hospZipCode?: string;
  hospWebsite?: string;
  careInstitutionNo?: string;
  gender?: string;
  representative?: string;
}

/** adminUserById 상세 응답 */
export interface AdminUserDetail extends AdminUser {
  mustChangePw: boolean;
  rejectReason?: string;
  profile?: UserProfile;
}

/** adminUserById 응답 wrapper */
export interface AdminUserByIdResponse {
  adminUserById: AdminUserDetail;
}

export interface Member extends AuditFields {
  MEMBER_ID: string;
  MEMBER_NO?: string;
  MEMBER_NM: string;
  MEMBER_NM_EN?: string;
  MEMBER_TYPE?: string;
  BIRTH_DATE?: string;
  DOCTOR_LICENSE_NO?: string;
  SCHOOL?: string;
  DEPARTMENT?: string;
  IS_DIRECTOR?: string;
  SPECIALTY?: string;
  EMAIL?: string;
  MOBILE_NO?: string;
  EMAIL_AGREE?: string;
  SMS_AGREE?: string;
  REPLY_AGREE?: string;
  HOSPITAL_NM?: string;
  HOSPITAL_NO?: string;
  HOSPITAL_TEL?: string;
  HOSPITAL_ADDR?: string;
  HOSPITAL_ADDR_DETAIL?: string;
  HOSPITAL_URL?: string;
  STATUS?: string;
  JOIN_TYPE?: string;
  JOIN_DTTM?: string;
  INFO_UPDATE_DTTM?: string;
  WITHDRAW_DTTM?: string;
  LAST_LOGIN_DTTM?: string;
  LAST_LOGIN_IP?: string;
  DORMANT_DTTM?: string;
  MEMO?: string;
  LOGIN_ID?: string;
}

/** 회원 가입신청 추가 필드 */
export interface MemberApply extends Member {
  APPLY_STATUS?: string;
  APPLY_DTTM?: string;
  APPROVE_DTTM?: string;
  REJECT_REASON?: string;
  ADDR?: string;
  ADDR_DETAIL?: string;
}

/** 회원상태 옵션 */
export const MEMBER_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'ACTIVE', label: '정상' },
  { value: 'WITHDRAWN', label: '탈퇴' },
] as const;

/** 가입신청 상태 옵션 */
export const APPLY_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
] as const;

/** 회원구분 옵션 */
export const MEMBER_TYPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'DOCTOR', label: '의사' },
  { value: 'DENTIST', label: '치과의사' },
  { value: 'KMD', label: '한의사' },
] as const;

/** 가입유형 옵션 */
export const JOIN_TYPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'NORMAL', label: '일반회원' },
  { value: 'SMS', label: 'SMS회원' },
] as const;
