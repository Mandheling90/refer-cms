import type { AuditFields } from './api';

export interface Member extends AuditFields {
  MEMBER_ID: string;
  MEMBER_NM: string;
  MEMBER_NM_EN?: string;
  BIRTH_DATE?: string;
  MOBILE_NO?: string;
  PHONE_NO?: string;
  FAX_NO?: string;
  EMAIL?: string;
  DOCTOR_LICENSE_NO?: string;
  DEPT_CODE?: string;
  DEPT_NM?: string;
  POSITION?: string;
  STATUS?: string;
  JOIN_TYPE?: string;
  MEMO?: string;
  PASSWORD?: string;
  PASSWORD_CONFIRM?: string;
  MEMBER_TYPE?: string;
  IS_DOCTOR?: string;
  AUTH_LEVEL?: string;
  IS_ADMIN?: string;
  LOGIN_ID?: string;
  ORG_CODE?: string;
  HOMEPAGE?: string;
}

/** 회원상태 옵션 */
export const MEMBER_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'ACTIVE', label: '정상' },
  { value: 'WITHDRAWN', label: '탈퇴' },
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
