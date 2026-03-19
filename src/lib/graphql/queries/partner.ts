import { gql } from '@apollo/client';

/** 관리자 협력병의원 신청 목록 조회 */
export const GET_ADMIN_PARTNER_APPLICATIONS = gql`
  query AdminPartnerApplications($status: PartnerStatus, $hospitalCode: HospitalCode, $partnerType: PartnerType, $pagination: PaginationInput) {
    adminPartnerApplications(status: $status, hospitalCode: $hospitalCode, partnerType: $partnerType, pagination: $pagination) {
      items {
        id
        hospitalId
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
        hospital {
          id
          name
          phisCode
          classificationCode
          address
          addressDetail
          phone
          zipCode
          faxNumber
          website
          representative
          partnerType
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
      hospitalId
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
      majorEquipment
      availableTreatments
      departmentSpecialists
      # 협력의원 체크리스트 항목
      clinicHasExcimerLaser
      clinicHasHemodialysis
      clinicHasPeritoneal
      clinicHasPhototherapy
      clinicMedicationType
      hospital {
        id
        name
        phisCode
        classificationCode
        address
        addressDetail
        phone
        zipCode
        faxNumber
        website
        representative
        partnerType
        specialties
        hospitalCode
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
