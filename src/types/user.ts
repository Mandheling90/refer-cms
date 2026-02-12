import type { AuditFields } from './api';

export interface User extends AuditFields {
  USER_ID: string;
  USER_TYPE?: string;
  DESCRIPTION?: string;
  EMPL_ID?: string;
  PASSWORD?: string;
}

export interface SessionUser {
  USER_ID: string;
  USER_NM: string;
  IS_SUPER_ADMIN: boolean;
  IS_HCM_ADMIN: boolean;
  ROLE_TYPE_LIST: string[];
  DISPLAY_NAME?: string;
  PERSON_NUMBER?: string;
}
