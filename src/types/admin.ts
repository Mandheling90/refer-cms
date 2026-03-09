import type { AuditFields } from './api';

export interface Admin extends AuditFields {
  USER_ID: string;
  USER_NM?: string;
  PASSWORD?: string;
  USE_YN?: string;
  DESCRIPTION?: string;
  EMPL_ID?: string;
}
