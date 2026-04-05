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
  allowedIp?: string;
  createdAt?: string;
  updatedAt?: string;
  profile?: {
    licenseNo?: string;
  };
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
  lastLoginAt?: string;
  lastLoginIp?: string;
  withdrawnAt?: string;
  profile?: UserProfile;
}

/** adminUserById 응답 wrapper */
export interface AdminUserByIdResponse {
  adminUserById: AdminUserDetail;
}

/** adminUserApprovalById 응답 wrapper */
export interface AdminUserApprovalByIdResponse {
  adminUserApprovalById: AdminUserDetail;
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

