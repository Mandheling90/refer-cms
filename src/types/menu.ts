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
