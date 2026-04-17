import { gql } from '@apollo/client';

/** 회원 목록 조회 (adminUsers 재사용) */
export const GET_ADMIN_USERS_MEMBERS = gql`
  query AdminUsersMembers($filter: AdminUserFilterInput, $hospitalCode: HospitalCode, $pagination: PaginationInput) {
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

/** 회원 상세 조회 */
export const GET_ADMIN_USER_BY_ID = gql`
  query AdminUserById($id: String!, $hospitalCode: HospitalCode) {
    adminUserById(id: $id, hospitalCode: $hospitalCode) {
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

/** 비밀번호 초기화 (관리자) */
export const ADMIN_RESET_PASSWORD = gql`
  mutation AdminResetPassword($id: String!) {
    adminResetPassword(id: $id) {
      success
      message
    }
  }
`;

/** 회원 탈퇴 처리 (관리자) */
export const ADMIN_WITHDRAW_MEMBER = gql`
  mutation AdminWithdrawMember($id: String!) {
    adminWithdrawMember(id: $id)
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
