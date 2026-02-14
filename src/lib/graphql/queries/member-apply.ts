import { gql } from '@apollo/client';

/** 가입신청 목록 조회 (adminUsers) */
export const GET_ADMIN_USERS = gql`
  query AdminUsers($filter: AdminUserFilterInput, $pagination: PaginationInput) {
    adminUsers(filter: $filter, pagination: $pagination) {
      items {
        id
        userId
        userName
        email
        userType
        status
        hospitalCode
      }
      totalCount
      hasNextPage
    }
  }
`;

/** 가입 승인 */
export const APPROVE_USER = gql`
  mutation ApproveUser($id: String!) {
    approveUser(id: $id) {
      id
      userId
      status
    }
  }
`;

/** 가입 반려 */
export const REJECT_USER = gql`
  mutation RejectUser($id: String!, $reason: String!) {
    rejectUser(id: $id, reason: $reason) {
      id
      userId
      status
    }
  }
`;
