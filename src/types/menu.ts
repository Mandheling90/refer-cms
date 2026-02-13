import type { AuditFields } from './api';

export interface Menu extends AuditFields {
  MENU_ID: string;
  MENU_CODE: string;
  MENU_NAME: string;
  MENU_TYPE: string;
  MENU_PID?: number;
  PROG_PATH?: string;
  SORT_ORDER?: number;
  PERMISSION_LEVEL?: string;
  PARENT_MENU_ID?: string;
  LANG_SET?: string;
  LINK_URL?: string;
  BOARD_ID?: string;
  BOARD_NAME?: string;
  CONTENT_ID?: string;
  CONTENT_NAME?: string;
  GNB_YN?: string;
  USE_YN?: string;
  CHILD_COUNT?: number;
}

export interface MenuTreeItem {
  MENU_ID: string;
  MENU_CODE: string;
  MENU_NAME: string;
  MENU_TYPE: string;
  MENU_PID: number;
  PROG_PATH: string;
  SORT_ORDER: number;
  children?: MenuTreeItem[];
}

export interface SidebarMenuItem {
  MENU_ID: string;
  MENU_NAME: string;
  MENU_PID: number;
  PROG_PATH: string;
  PERMISSION_LEVEL: string;
  children?: SidebarMenuItem[];
}
