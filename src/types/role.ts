import type { AuditFields } from './api';

export interface Role extends AuditFields {
  ROLE_ID: string;
  ROLE_CODE: string;
  ROLE_CODE_BF?: string;
  ROLE_NAME: string;
  ROLE_TYPE?: string;
}

export interface RoleMenu extends AuditFields {
  ROLE_ID: string;
  ROLE_CODE: string;
  ROLE_NAME: string;
  MENU_ID: string;
  MENU_CODE: string;
  MENU_NAME: string;
  PERMISSION_LEVEL?: string;
  IS_CHECKED?: string;
}

export interface RoleUser extends AuditFields {
  ROLE_ID: string;
  ROLE_CODE: string;
  ROLE_NAME: string;
  USER_ID: string;
  USER_TYPE?: string;
  DESCRIPTION?: string;
  IS_CHECKED?: string;
}
