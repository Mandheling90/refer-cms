import { gql } from '@apollo/client';

/** 검사이미지 목록 조회 */
export const GET_IMAGING_REQUESTS = gql`
  query ImagingRequestsForAdmin(
    $hospitalCode: HospitalCode
    $input: ImagingRequestListInput
  ) {
    imagingRequestsForAdmin(hospitalCode: $hospitalCode, input: $input) {
      items {
        id
        hospitalCode
        ptntNo
        orderCode
        examDate
        examType
        pacsAccessNo
        refrSno
        refrYmd
        status
        displayState
        requestedAt
        approvedAt
        rejectedAt
        expiresAt
        examInfo {
          orderName
          doctorName
          departmentName
          orderDate
          pacsAccessNo
          specimenCode
          specimenNo
          grossResult
          resultContent
        }
        referralReply {
          patientName
          frontResidentNo
          backResidentNo
          age
          genderCode
          phoneNo
          departmentName
          doctorName
          diagnosisCode
          diagnosisName
          opinion
          referralDate
          replyDate
          treatmentPeriod
        }
        attachments {
          id
          originalName
          storedPath
          mimeType
          fileSize
          createdAt
        }
        createdAt
        updatedAt
      }
      totalCount
      hasNextPage
    }
  }
`;

/** 검사이미지 상세 조회 */
export const GET_IMAGING_REQUEST_DETAIL = gql`
  query ImagingRequestDetail($id: String!, $hospitalCode: HospitalCode) {
    imagingRequestDetail(id: $id, hospitalCode: $hospitalCode) {
      id
      hospitalCode
      ptntNo
      orderCode
      examDate
      pacsAccessNo
      refrSno
      refrYmd
      status
      displayState
      requestedAt
      approvedAt
      rejectedAt
      expiresAt
      examInfo {
        orderName
        doctorName
        departmentName
        orderDate
        pacsAccessNo
        specimenCode
        specimenNo
        grossResult
        resultContent
      }
      referralReply {
        patientName
        frontResidentNo
        backResidentNo
        age
        genderCode
        phoneNo
        departmentName
        doctorName
        diagnosisCode
        diagnosisName
        opinion
        referralDate
        replyDate
        treatmentPeriod
      }
      attachments {
        id
        originalName
        storedPath
        mimeType
        fileSize
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

/** 검사이미지 승인 */
export const APPROVE_IMAGING_REQUEST = gql`
  mutation ApproveImagingRequest($hospitalCode: HospitalCode, $input: ApproveImagingRequestInput!) {
    approveImagingRequest(hospitalCode: $hospitalCode, input: $input) {
      id
      status
      displayState
      approvedAt
    }
  }
`;

/** 검사이미지 반려 */
export const REJECT_IMAGING_REQUEST = gql`
  mutation RejectImagingRequest($hospitalCode: HospitalCode, $input: RejectImagingRequestInput!) {
    rejectImagingRequest(hospitalCode: $hospitalCode, input: $input) {
      id
      status
      displayState
      rejectedAt
    }
  }
`;

/** 검사이미지 첨부파일 교체 */
export const REPLACE_IMAGING_REQUEST_ATTACHMENTS = gql`
  mutation ReplaceImagingRequestAttachments(
    $hospitalCode: HospitalCode
    $imagingRequestId: String!
    $attachments: [ImagingRequestAttachmentInput!]!
  ) {
    replaceImagingRequestAttachments(
      hospitalCode: $hospitalCode
      imagingRequestId: $imagingRequestId
      attachments: $attachments
    ) {
      id
      status
      displayState
      attachments {
        id
        originalName
        storedPath
        mimeType
        fileSize
        createdAt
      }
    }
  }
`;
