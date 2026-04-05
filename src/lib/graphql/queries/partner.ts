import { gql } from '@apollo/client';

/** 관리자 협력병의원 신청 목록 조회 */
export const GET_ADMIN_PARTNER_APPLICATIONS = gql`
  query AdminPartnerApplications($status: PartnerStatus, $hospitalCode: HospitalCode, $partnerType: PartnerType, $pagination: PaginationInput) {
    adminPartnerApplications(status: $status, hospitalCode: $hospitalCode, partnerType: $partnerType, pagination: $pagination) {
      items {
        id
        hospitalCode
        status
        applicantId
        rejectReason
        reviewedAt
        reviewedById
        directorName
        directorPhone
        staffName
        staffPhone
        staffEmail
        approvedAt
        terminatedAt
        createdAt
        updatedAt
        partnerType
        hospitalName
        careInstitutionNo
        hospitalPhone
        hospitalAddress
        hospitalAddressDetail
        hospitalZipCode
        hospitalFaxNumber
        hospitalWebsite
        hospitalRepresentative
        clbrDvsnCd1
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
      hospitalCode
      status
      applicantId
      rejectReason
      reviewedAt
      reviewedById
      directorName
      directorPhone
      directorLicenseNo
      directorBirthDate
      directorGender
      directorEmail
      directorSchool
      directorGraduationYear
      directorTrainingHospital
      directorDepartment
      directorSubSpecialty
      directorCarNo
      directorEmailConsent
      directorSmsConsent
      directorReplyConsent
      isDirector
      institutionType
      institutionCode
      staffName
      staffPhone
      staffEmail
      staffPosition
      staffTel
      staffDeptType
      staffDeptValue
      remarks
      attachments
      attachmentRows {
        id
        originalName
        storedPath
        mimeType
        fileSize
        createdAt
      }
      approvedAt
      terminatedAt
      createdAt
      updatedAt
      partnerType
      hospitalName
      careInstitutionNo
      hospitalPhone
      hospitalAddress
      hospitalAddressDetail
      hospitalZipCode
      hospitalFaxNumber
      hospitalWebsite
      hospitalRepresentative
      hospitalSpecialties
      clbrDvsnCd1
      medicalDepartment
      # 체크리스트 항목
      activeBedCount
      totalBedCount
      premiumRoomCount
      multiRoomCount
      icuCount
      erCount
      nurseCount
      specialistCount
      totalStaffCount
      hasDialysisRoom
      hasEr
      hasHospice
      hasIcu
      hasOperatingRoom
      hasPhysicalTherapy
      hasPsychClosed
      hasPsychGeneral
      hasIntegratedNursing
      hasGuardianCare
      hasSharedCare
      hasRehabIsolation
      hasRehabOt
      hasRehabPt
      hasRehabSt
      hasRehabSwallow
      isolationRoomCount
      isolationSingleCount
      isolationDoubleCount
      isolationTripleCount
      isolationTypes
      isolationCareType
      isolationRehabType
      isolationWardOperation
      majorEquipment
      availableTreatments
      departmentSpecialists
      # 협력의원 체크리스트 항목
      clinicHasExcimerLaser
      clinicHasHemodialysis
      clinicHasPeritoneal
      clinicHasPhototherapy
      clinicMedicationType
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

/** 관리자 협력병의원 수정요청 목록 조회 */
export const GET_ADMIN_PARTNER_UPDATE_REQUESTS = gql`
  query AdminPartnerUpdateRequests($status: PartnerUpdateRequestStatus) {
    adminPartnerUpdateRequests(status: $status) {
      id
      status
      partnerApplicationId
      hospitalCode
      requestedHospitalData
      requestedApplicationData
      createdAt
    }
  }
`;

/** 관리자 협력병의원 수정요청 상세 조회 */
export const GET_ADMIN_PARTNER_UPDATE_REQUEST_BY_ID = gql`
  query AdminPartnerUpdateRequestById($id: String!) {
    adminPartnerUpdateRequestById(id: $id) {
      id
      status
      partnerApplicationId
      hospitalCode
      requestedHospitalData
      requestedApplicationData
      reviewedAt
      reviewedById
    }
  }
`;

/** 수정요청 승인 */
export const APPROVE_PARTNER_UPDATE_REQUEST = gql`
  mutation ApprovePartnerUpdateRequest($id: String!) {
    approvePartnerUpdateRequest(id: $id) {
      id
      status
      reviewedAt
      reviewedById
      partnerApplicationId
    }
  }
`;

/** 수정요청 반려 */
export const REJECT_PARTNER_UPDATE_REQUEST = gql`
  mutation RejectPartnerUpdateRequest($id: String!) {
    rejectPartnerUpdateRequest(id: $id) {
      id
      status
      reviewedAt
      reviewedById
      partnerApplicationId
    }
  }
`;
