import type { AuditFields } from './api';

export interface Board extends AuditFields {
  BOARD_ID: string;
  BOARD_NAME: string;
  BOARD_TYPE?: string;
  BOARD_DESC?: string;
  USE_YN?: string;
  FILE_ATTACH_YN?: string;
  REPLY_YN?: string;
}

export interface BoardArticle extends AuditFields {
  ARTICLE_ID: string;
  BOARD_ID: string;
  TITLE: string;
  CONTENT?: string;
  VIEW_COUNT?: number;
  USE_YN?: string;
  SORT_ORDER?: number;
}
