import { gql } from '@apollo/client';

/** 회원 목록 조회 (adminUsers 재사용) */
export const GET_ADMIN_USERS_MEMBERS = gql`
  query AdminUsersMembers($filter: AdminUserFilterInput, $pagination: PaginationInput) {
    adminUsers(filter: $filter, pagination: $pagination) {
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
      }
      totalCount
      hasNextPage
    }
  }
`;

/** 회원 상세 조회 */
export const GET_ADMIN_USER_BY_ID = gql`
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
      mustChangePw
      rejectReason
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

/** 회원 정보 수정 */
export const ADMIN_UPDATE_USER = gql`
  mutation AdminUpdateUser($id: String!, $input: AdminUpdateUserInput!) {
    adminUpdateUser(id: $id, input: $input) {
      id
      userId
      userName
      email
      phone
      userType
      status
    }
  }
`;
