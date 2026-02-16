import { gql } from '@apollo/client';

/** 관리자 협력병의원 신청 목록 조회 */
export const GET_ADMIN_PARTNER_APPLICATIONS = gql`
  query AdminPartnerApplications($pagination: PaginationInput, $status: PartnerStatus) {
    adminPartnerApplications(pagination: $pagination, status: $status) {
      items {
        id
        status
        hospitalCode
        hospitalId
        staffName
        staffPhone
        staffEmail
        directorName
        directorPhone
        approvedAt
        reviewedAt
        rejectReason
        createdAt
        updatedAt
        hospital {
          id
          name
          representative
          phone
          faxNumber
          address
          addressDetail
          zipCode
          website
          specialties
          partnerType
          classificationCode
        }
      }
      totalCount
      hasNextPage
    }
  }
`;

/** 관리자 협력병의원 신청 상세 조회 */
export const GET_ADMIN_PARTNER_APPLICATION_BY_ID = gql`
  query AdminPartnerApplicationById($id: String!) {
    adminPartnerApplicationById(id: $id) {
      id
      status
      hospitalCode
      hospitalId
      staffName
      staffPhone
      staffEmail
      directorName
      directorPhone
      approvedAt
      reviewedAt
      rejectReason
      createdAt
      updatedAt
      hospital {
        id
        name
        representative
        phone
        faxNumber
        address
        addressDetail
        zipCode
        website
        specialties
        partnerType
        classificationCode
      }
    }
  }
`;

/** 협력병의원 신청 승인 */
export const APPROVE_PARTNER_APPLICATION = gql`
  mutation ApprovePartnerApplication($id: String!) {
    approvePartnerApplication(id: $id) {
      id
      status
    }
  }
`;

/** 협력병의원 신청 반려 */
export const REJECT_PARTNER_APPLICATION = gql`
  mutation RejectPartnerApplication($id: String!, $reason: String!) {
    rejectPartnerApplication(id: $id, reason: $reason) {
      id
      status
    }
  }
`;
