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
