import { gql } from '@apollo/client';

/** 가입신청 목록 조회 */
export const GET_MEMBER_APPLIES = gql`
  query GetMemberApplies(
    $page: Int
    $pageSize: Int
    $searchKeyword: String
    $applyStatus: String
    $memberType: String
  ) {
    memberApplies(
      page: $page
      pageSize: $pageSize
      searchKeyword: $searchKeyword
      applyStatus: $applyStatus
      memberType: $memberType
    ) {
      list {
        MEMBER_ID
        MEMBER_NM
        MEMBER_TYPE
        EMAIL
        MOBILE_NO
        HOSPITAL_NM
        APPLY_STATUS
        APPLY_DTTM
        APPROVE_DTTM
        REJECT_REASON
      }
      totalCount
      page
      pageSize
    }
  }
`;

/** 가입신청 상세 조회 */
export const GET_MEMBER_APPLY = gql`
  query GetMemberApply($memberId: String!) {
    memberApply(memberId: $memberId) {
      MEMBER_ID
      MEMBER_NM
      MEMBER_NM_EN
      MEMBER_TYPE
      BIRTH_DATE
      DOCTOR_LICENSE_NO
      SCHOOL
      DEPARTMENT
      SPECIALTY
      EMAIL
      MOBILE_NO
      EMAIL_AGREE
      SMS_AGREE
      REPLY_AGREE
      HOSPITAL_NM
      HOSPITAL_NO
      HOSPITAL_TEL
      HOSPITAL_ADDR
      HOSPITAL_ADDR_DETAIL
      HOSPITAL_URL
      ADDR
      ADDR_DETAIL
      APPLY_STATUS
      APPLY_DTTM
      APPROVE_DTTM
      REJECT_REASON
      INSERT_DTTM
      UPDATE_DTTM
    }
  }
`;

/** 가입 승인 */
export const APPROVE_MEMBER = gql`
  mutation ApproveMember($memberId: String!) {
    approveMember(memberId: $memberId) {
      success
      message
    }
  }
`;

/** 가입 반려 */
export const REJECT_MEMBER = gql`
  mutation RejectMember($memberId: String!, $rejectReason: String!) {
    rejectMember(memberId: $memberId, rejectReason: $rejectReason) {
      success
      message
    }
  }
`;
