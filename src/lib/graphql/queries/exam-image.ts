import { gql } from '@apollo/client';

/** 검사이미지 목록 조회 */
export const GET_ADMIN_EXAM_IMAGES = gql`
  query AdminExamImages(
    $filter: ExamImageFilterInput
    $pagination: PaginationInput
  ) {
    adminExamImages(filter: $filter, pagination: $pagination) {
      items {
        id
        no
        patientName
        residentNo
        patientNo
        examDate
        examName
        imageRequestDate
        partnerDoctor
        approvalStatus
        imageCount
        createdAt
        updatedAt
      }
      totalCount
      hasNextPage
    }
  }
`;

/** 검사이미지 상세 조회 */
export const GET_ADMIN_EXAM_IMAGE_BY_ID = gql`
  query AdminExamImageById($id: String!) {
    adminExamImageById(id: $id) {
      id
      no
      patientName
      residentNo
      patientNo
      examDate
      examName
      imageRequestDate
      partnerDoctor
      approvalStatus
      imageCount
      images {
        id
        fileName
        fileSize
        url
      }
      createdAt
      updatedAt
    }
  }
`;

/** 검사이미지 승인 */
export const APPROVE_EXAM_IMAGE = gql`
  mutation ApproveExamImage($id: String!) {
    approveExamImage(id: $id) {
      id
      approvalStatus
    }
  }
`;

/** 검사이미지 반려 */
export const REJECT_EXAM_IMAGE = gql`
  mutation RejectExamImage($id: String!) {
    rejectExamImage(id: $id) {
      id
      approvalStatus
    }
  }
`;

/** 검사이미지 삭제 */
export const DELETE_EXAM_IMAGES = gql`
  mutation DeleteExamImages($ids: [String!]!) {
    deleteExamImages(ids: $ids)
  }
`;
