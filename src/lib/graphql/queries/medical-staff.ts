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
