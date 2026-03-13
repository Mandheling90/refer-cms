import { gql } from '@apollo/client';

/** 의료진 목록 조회 (전체 조회 후 프론트에서 필터/페이징) */
export const GET_MEDICAL_STAFF_LIST = gql`
  query MedicalStaffList($filter: AdmapMedicalStaffFilterInput) {
    medicalStaffList(filter: $filter) {
      items {
        doctorId
        doctorName
        photoUrl
        departmentCode
        departmentName
        bio
        hospitalCode
        mcdpAbrvCd
        mcdpDvsnCd
        mcdpSqncVl
        apstYmd
        apfnYmd
        smcrYn
        frvsMdcrPsblYn
        revsMdcrPsblYn
        fastMdcrDt
      }
      totalCount
    }
  }
`;

/** 자문의(e-consult) 목록 조회 */
export const GET_ADMIN_ECONSULT_CONSULTANTS = gql`
  query AdminEconsultConsultants($hospitalCode: HospitalCode) {
    adminEconsultConsultants(hospitalCode: $hospitalCode) {
      id
      doctorId
      name
      email
      isActive
      hospitalCode
    }
  }
`;

/** 자문의 지정 (자문의 여부 On + 이메일 수정) */
export const DESIGNATE_ECONSULT_CONSULTANT = gql`
  mutation DesignateEconsultConsultant($input: DesignateEconsultConsultantInput!) {
    designateEconsultConsultant(input: $input) {
      id
      doctorId
      name
      email
      isActive
      hospitalCode
    }
  }
`;

/** 자문의 해제 (자문의 여부 Off) */
export const DEACTIVATE_ECONSULT_CONSULTANT = gql`
  mutation DeactivateEconsultConsultant($id: String!) {
    deactivateEconsultConsultant(id: $id)
  }
`;
