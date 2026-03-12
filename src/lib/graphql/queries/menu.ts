import { gql } from '@apollo/client';

/* ─── Menu 필드 ─── */
const MENU_FIELDS = `
  id
  name
  path
  sortOrder
  parentId
  isActive
  hospitalCode
  menuType
  menuTargetType
  targetBoardId
  targetBoardType
  targetContentId
  externalUrl
  gnbExposure
  firstChildPath
  iconName
  accessLevel
  createdAt
  updatedAt
`;

/** 메뉴 목록 조회 (트리 구조) */
export const ADMIN_MENUS = gql`
  query AdminMenus($menuType: MenuType!, $hospitalCode: HospitalCode) {
    adminMenus(menuType: $menuType, hospitalCode: $hospitalCode) {
      ${MENU_FIELDS}
      children {
        ${MENU_FIELDS}
      }
    }
  }
`;

/** 메뉴 생성 */
export const CREATE_MENU = gql`
  mutation CreateMenu($input: CreateMenuInput!) {
    createMenu(input: $input) {
      ${MENU_FIELDS}
    }
  }
`;

/** 메뉴 수정 */
export const UPDATE_MENU = gql`
  mutation UpdateMenu($id: String!, $input: UpdateMenuInput!) {
    updateMenu(id: $id, input: $input) {
      ${MENU_FIELDS}
    }
  }
`;

/** 메뉴 삭제 */
export const DELETE_MENU = gql`
  mutation DeleteMenu($id: String!) {
    deleteMenu(id: $id)
  }
`;

/** 메뉴 순서 변경 */
export const REORDER_MENUS = gql`
  mutation ReorderMenus($input: ReorderMenusInput!) {
    reorderMenus(input: $input)
  }
`;

/** 게시판 설정 목록 조회 */
export const ADMIN_BOARD_SETTINGS = gql`
  query AdminBoardSettings($hospitalCode: HospitalCode) {
    adminBoardSettings(hospitalCode: $hospitalCode) {
      id
      boardId
      name
    }
  }
`;
