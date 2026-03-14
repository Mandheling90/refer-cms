import { gql } from '@apollo/client';

/** 권한 그룹 목록 조회 */
export const GET_PERMISSION_GROUPS = gql`
  query MenuPermissionGroups($hospitalCode: HospitalCode) {
    menuPermissionGroups(hospitalCode: $hospitalCode) {
      id
      name
      hospitalCode
      entries {
        id
        groupId
        menuId
        accessLevel
      }
      createdAt
      updatedAt
    }
  }
`;

/** 권한 그룹 상세 조회 (메뉴 권한 entries) */
export const GET_PERMISSION_GROUP_DETAIL = gql`
  query GroupMenuPermissions($groupId: String!) {
    groupMenuPermissions(groupId: $groupId) {
      id
      groupId
      menuId
      accessLevel
    }
  }
`;

/** 권한 그룹 생성 */
export const CREATE_PERMISSION_GROUP = gql`
  mutation CreateMenuPermissionGroup($hospitalCode: HospitalCode, $input: CreateMenuPermissionGroupInput!) {
    createMenuPermissionGroup(hospitalCode: $hospitalCode, input: $input) {
      id
      name
      hospitalCode
    }
  }
`;

/** 권한 그룹 수정 */
export const UPDATE_PERMISSION_GROUP = gql`
  mutation UpdateMenuPermissionGroup($hospitalCode: HospitalCode, $id: String!, $input: UpdateMenuPermissionGroupInput!) {
    updateMenuPermissionGroup(hospitalCode: $hospitalCode, id: $id, input: $input) {
      id
      name
      hospitalCode
    }
  }
`;

/** 권한 그룹 삭제 */
export const DELETE_PERMISSION_GROUP = gql`
  mutation DeleteMenuPermissionGroup($hospitalCode: HospitalCode, $id: String!) {
    deleteMenuPermissionGroup(hospitalCode: $hospitalCode, id: $id)
  }
`;

/** 메뉴 권한 설정 (메뉴 1개 단위) */
export const SET_MENU_PERMISSION = gql`
  mutation SetMenuPermission($hospitalCode: HospitalCode, $input: SetMenuPermissionInput!) {
    setMenuPermission(hospitalCode: $hospitalCode, input: $input)
  }
`;

/** 관리자에게 권한 그룹 배정 */
export const ASSIGN_PERMISSION_GROUP = gql`
  mutation AssignPermissionGroup($userId: String!, $groupId: String, $hospitalCode: HospitalCode) {
    assignPermissionGroup(userId: $userId, groupId: $groupId, hospitalCode: $hospitalCode)
  }
`;

/** 권한 그룹 멤버 조회 */
export const GET_PERMISSION_GROUP_MEMBERS = gql`
  query PermissionGroupMembers($groupId: String!, $hospitalCode: HospitalCode) {
    permissionGroupMembers(groupId: $groupId, hospitalCode: $hospitalCode) {
      id
      userId
      userName
      email
      status
      hospitalCode
    }
  }
`;

/** 권한 그룹 멤버 일괄 배정 */
export const SET_PERMISSION_GROUP_MEMBERS = gql`
  mutation SetPermissionGroupMembers($groupId: String!, $userIds: [String!]!, $hospitalCode: HospitalCode) {
    setPermissionGroupMembers(groupId: $groupId, userIds: $userIds, hospitalCode: $hospitalCode)
  }
`;

/** 권한 그룹 수정 이력 조회 */
export const GET_PERMISSION_AUDIT_LOGS = gql`
  query AdminPermissionAuditLogs($hospitalCode: HospitalCode, $pagination: PaginationInput) {
    adminPermissionAuditLogs(hospitalCode: $hospitalCode, pagination: $pagination) {
      items {
        id
        action
        target
        detail
        hospitalCode
        adminNumber
        adminName
        ipAddress
        createdAt
        permissionMenuHistories {
          logId
          target
          menuId
          menuName
          accessLevel
          adminNumber
          adminName
          createdAt
        }
        permissionMemberHistories {
          logId
          target
          memberLabels
          adminNumber
          adminName
          createdAt
        }
      }
      totalCount
      hasNextPage
    }
  }
`;
