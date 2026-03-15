import { gql } from '@apollo/client';

const ECONSULT_FIELDS = `
  id
  title
  content
  requesterName
  requesterEmail
  hospitalName
  hospitalCode
  consultantId
  consultantName
  consultantDepartment
  answer
  status
  createdAt
  answeredAt
`;

/** e-Consult 목록 조회 */
export const GET_ECONSULT_LIST = gql`
  query EConsultList($hospitalCode: HospitalCode) {
    eConsultList(hospitalCode: $hospitalCode) {
      items {
        ${ECONSULT_FIELDS}
      }
      totalCount
    }
  }
`;

/** e-Consult 상세 조회 */
export const GET_ECONSULT_DETAIL = gql`
  query EConsultDetail($id: String!) {
    eConsultDetail(id: $id) {
      ${ECONSULT_FIELDS}
    }
  }
`;

/** e-Consult 답변 등록 */
export const ANSWER_ECONSULT = gql`
  mutation AnswerEConsult($id: String!, $answer: String!) {
    answerEConsult(id: $id, answer: $answer) {
      ${ECONSULT_FIELDS}
    }
  }
`;

/** Admin e-Consult 목록 조회 (서버 사이드 필터링/페이징) */
export const GET_ADMIN_ECONSULTS = gql`
  query AdminEConsults(
    $hospitalCode: HospitalCode
    $filter: EConsultFilterInput
    $pagination: PaginationInput
  ) {
    adminEConsults(
      hospitalCode: $hospitalCode
      filter: $filter
      pagination: $pagination
    ) {
      items {
        id
        requesterId
        requester {
          id
          userName
        }
        consultantId
        consultant {
          id
          name
          departmentId
          specialty
        }
        hospitalCode
        title
        status
        createdAt
        expiresAt
        answeredAt
        reply {
          id
          content
          createdAt
        }
      }
      totalCount
      hasNextPage
      cursor
    }
  }
`;
