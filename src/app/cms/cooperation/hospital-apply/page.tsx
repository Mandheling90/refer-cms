'use client';

import { CooperationListPage } from '../_components/CooperationListPage';

export default function HospitalApplyPage() {
  return (
    <CooperationListPage
      title="협력병원 신청 관리"
      partnerType="H"
      mode="apply"
    />
  );
}
