import { gql } from '@apollo/client';

/** 가입신청 목록 조회 (adminUsers) */
export const GET_ADMIN_USERS = gql`
  query AdminUsers($filter: AdminUserFilterInput, $hospitalCode: HospitalCode, $pagination: PaginationInput) {
    adminUsers(filter: $filter, hospitalCode: $hospitalCode, pagination: $pagination) {
      items {
        id
        userId
        userName
        email
        phone
        userType
        status
        hospitalCode
        createdAt
        updatedAt
        profile {
          licenseNo
        }
      }
      totalCount
      hasNextPage
    }
  }
`;

/** 가입신청 상세 조회 */
export const GET_ADMIN_USER_APPROVAL_BY_ID = gql`
  query AdminUserApprovalById($id: String!) {
    adminUserApprovalById(id: $id) {
      id
      userId
      userName
      email
      phone
      userType
      status
      hospitalCode
      mustChangePw
      rejectReason
      lastLoginAt
      lastLoginIp
      withdrawnAt
      createdAt
      updatedAt
      profile {
        birthDate
        licenseNo
        school
        department
        doctorType
        specialty
        isDirector
        emailConsent
        smsConsent
        replyConsent
        hospName
        hospCode
        hospPhone
        hospAddress
        hospAddressDetail
        hospZipCode
        hospWebsite
        careInstitutionNo
        gender
        representative
      }
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
