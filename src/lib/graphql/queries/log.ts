import { gql } from '@apollo/client';

/** 로그 내역 목록 조회 */
export const GET_ADMIN_AUDIT_LOGS = gql`
  query AdminAuditLogs($filter: AuditLogFilterInput, $hospitalCode: HospitalCode, $pagination: PaginationInput) {
    adminAuditLogs(filter: $filter, hospitalCode: $hospitalCode, pagination: $pagination) {
      items {
        id
        hospitalCode
        adminNumber
        adminName
        ipAddress
        target
        action
        detail
        userId
        createdAt
      }
      totalCount
      hasNextPage
      cursor
    }
  }
`;

/** 로그 내역 상세 조회 */
export const GET_ADMIN_AUDIT_LOG_BY_ID = gql`
  query AdminAuditLogById($id: String!, $hospitalCode: HospitalCode) {
    adminAuditLogById(id: $id, hospitalCode: $hospitalCode) {
      id
      hospitalCode
      adminNumber
      adminName
      ipAddress
      target
      detail
      createdAt
    }
  }
`;
