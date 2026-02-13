import { gql } from '@apollo/client';

/** 회원 목록 조회 */
export const GET_MEMBERS = gql`
  query GetMembers(
    $page: Int
    $pageSize: Int
    $searchKeyword: String
    $memberType: String
    $status: String
    $joinType: String
  ) {
    members(
      page: $page
      pageSize: $pageSize
      searchKeyword: $searchKeyword
      memberType: $memberType
      status: $status
      joinType: $joinType
    ) {
      list {
        MEMBER_ID
        MEMBER_NO
        MEMBER_NM
        MEMBER_NM_EN
        MEMBER_TYPE
        BIRTH_DATE
        EMAIL
        MOBILE_NO
        HOSPITAL_NM
        STATUS
        JOIN_TYPE
        JOIN_DTTM
        LAST_LOGIN_DTTM
        INSERT_DTTM
        UPDATE_DTTM
      }
      totalCount
      page
      pageSize
    }
  }
`;

/** 회원 상세 조회 */
export const GET_MEMBER = gql`
  query GetMember($memberId: String!) {
    member(memberId: $memberId) {
      MEMBER_ID
      MEMBER_NO
      MEMBER_NM
      MEMBER_NM_EN
      MEMBER_TYPE
      BIRTH_DATE
      DOCTOR_LICENSE_NO
      SCHOOL
      DEPARTMENT
      IS_DIRECTOR
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
      STATUS
      JOIN_TYPE
      JOIN_DTTM
      INFO_UPDATE_DTTM
      WITHDRAW_DTTM
      LAST_LOGIN_DTTM
      LAST_LOGIN_IP
      DORMANT_DTTM
      MEMO
      LOGIN_ID
      INSERT_USER
      INSERT_DTTM
      UPDATE_USER
      UPDATE_DTTM
    }
  }
`;

/** 회원 저장 */
export const SAVE_MEMBER = gql`
  mutation SaveMember($input: MemberInput!) {
    saveMember(input: $input) {
      success
      message
    }
  }
`;

/** 회원 삭제 */
export const REMOVE_MEMBERS = gql`
  mutation RemoveMembers($memberIds: [String!]!) {
    removeMembers(memberIds: $memberIds) {
      success
      message
    }
  }
`;
