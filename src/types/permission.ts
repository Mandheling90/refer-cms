import type { AuditFields } from './api';

export interface Permission extends AuditFields {
  PERMISSION_ID: string;
  PERMISSION_CODE: string;
  PERMISSION_NAME: string;
  PERMISSION_LEVEL?: string;
  DESCRIPTION?: string;
}

export interface PermissionGroup extends AuditFields {
  GROUP_ID: string;
  GROUP_CODE: string;
  GROUP_NAME: string;
  DESCRIPTION?: string;
  PERMISSIONS?: Permission[];
}
