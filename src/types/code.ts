import type { AuditFields } from './api';

export interface CodeGroup extends AuditFields {
  CODE_GROUP: string;
  CODE_GROUP_NAME: string;
  DESCRIPTION?: string;
  USE_YN?: string;
}

export interface Code extends AuditFields {
  CODE_GROUP: string;
  CODE: string;
  CODE_NAME: string;
  DESCRIPTION?: string;
  SORT_ORDER?: number;
  USE_YN?: string;
  ATTR1?: string;
  ATTR2?: string;
  ATTR3?: string;
}

export interface CommonCode extends AuditFields {
  CODE_GROUP: string;
  CODE_GROUP_NAME?: string;
  CODE: string;
  CODE_NAME: string;
  SORT_ORDER?: number;
  USE_YN?: string;
}
