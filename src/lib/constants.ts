export const API_BASE = '/api';
export const CMS_API_BASE = '/api/cms';

export const SESSION_KEYS = {
  USER_ID: 'USER_ID',
  USER_NM: 'USER_NM',
  IS_SUPER_ADMIN: 'IS_SUPER_ADMIN',
  IS_HCM_ADMIN: 'IS_HCM_ADMIN',
  ROLE_TYPE_LIST: 'ROLE_TYPE_LIST',
} as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export const USE_YN_OPTIONS = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
] as const;
