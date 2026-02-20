import { gql } from '@apollo/client';

/** 의료진 목록 조회 */
export const GET_ADMIN_MEDICAL_STAFFS = gql`
  query AdminMedicalStaffs(
    $filter: MedicalStaffFilterInput
    $pagination: PaginationInput
  ) {
    adminMedicalStaffs(filter: $filter, pagination: $pagination) {
      items {
        id
        staffNo
        name
        hospitalName
        mainDepartment
        profileImageUrl
        isConsultant
        isVisible
        updatedAt
        createdAt
      }
      totalCount
      hasNextPage
    }
  }
`;

/** 의료진 상세 조회 */
export const GET_ADMIN_MEDICAL_STAFF_BY_ID = gql`
  query AdminMedicalStaffById($id: String!) {
    adminMedicalStaffById(id: $id) {
      id
      staffNo
      name
      hospitalName
      mainDepartment
      profileImageUrl
      profileImageFilename
      profileImageSize
      isConsultant
      isVisible
      consultantEmail
      updatedAt
      createdAt
      departmentSpecialists {
        departmentName
        specialistCount
        checked
      }
    }
  }
`;

/** 의료진 수정 */
export const UPDATE_MEDICAL_STAFF = gql`
  mutation UpdateMedicalStaff($id: String!, $input: MedicalStaffUpdateInput!) {
    updateMedicalStaff(id: $id, input: $input) {
      id
      isConsultant
      isVisible
      consultantEmail
    }
  }
`;

/** 의료진 삭제 */
export const DELETE_MEDICAL_STAFFS = gql`
  mutation DeleteMedicalStaffs($ids: [String!]!) {
    deleteMedicalStaffs(ids: $ids)
  }
`;
