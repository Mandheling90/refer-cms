'use client';

import { usePagePermission } from '@/components/molecules/PermissionGuard';
import { CooperationListPage } from '../_components/CooperationListPage';

export default function HospitalApplyPage() {
  const { canEdit } = usePagePermission();

  return (
    <CooperationListPage
      title="협력병원 신청 관리"
      partnerType="H"
      mode="apply"
      canEdit={canEdit}
    />
  );
}
