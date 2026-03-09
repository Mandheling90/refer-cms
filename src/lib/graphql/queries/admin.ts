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
