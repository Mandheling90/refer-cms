'use client';

import { CooperationListPage } from '../_components/CooperationListPage';

export default function HospitalEditPage() {
  return (
    <CooperationListPage
      title="협력병원 수정 관리"
      partnerType="H"
      mode="edit"
    />
  );
}
