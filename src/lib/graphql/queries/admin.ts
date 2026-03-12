import { gql } from '@apollo/client';

/** 관리자 목록 조회 */
export const GET_ADMIN_USERS = gql`
  query AdminUsers($hospitalCode: HospitalCode, $filter: AdminUserFilterInput, $pagination: PaginationInput) {
    adminUsers(hospitalCode: $hospitalCode, filter: $filter, pagination: $pagination) {
      items {
        id
        userId
        userName
        email
        phone
        userType
        status
        hospitalCode
        rejectReason
        createdAt
        updatedAt
      }
      totalCount
      hasNextPage
    }
  }
`;

/** 관리자 등록 */
export const ADMIN_CREATE_USER = gql`
  mutation AdminCreateUser($input: AdminCreateUserInput!) {
    adminCreateUser(input: $input) {
      id
      userId
      userName
      email
      phone
      userType
      status
      hospitalCode
      createdAt
    }
  }
`;

/** 아이디 중복 확인 */
export const CHECK_USER_ID_AVAILABLE = gql`
  query CheckUserIdAvailable($userId: String!) {
    checkUserIdAvailable(userId: $userId) {
      available
      existsInDb
      existsInEhr
    }
  }
`;

/** 관리자 삭제 */
export const ADMIN_DELETE_USER = gql`
  mutation AdminDeleteUser($id: String!) {
    adminDeleteUser(id: $id)
  }
`;

/** 관리자 상세 조회 */
export const GET_ADMIN_USER_DETAIL = gql`
  query AdminUserById($id: String!) {
    adminUserById(id: $id) {
      id
      userId
      userName
      email
      phone
      userType
      status
      hospitalCode
      allowedIp
      rejectReason
      profile {
        licenseNo
        department
        specialty
      }
      createdAt
      updatedAt
    }
  }
`;
