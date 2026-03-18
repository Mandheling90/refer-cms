'use client';

import { usePagePermission } from '@/components/molecules/PermissionGuard';
import { CooperationListPage } from '../_components/CooperationListPage';

export default function HospitalEditPage() {
  const { canEdit } = usePagePermission();

  return (
    <CooperationListPage
      title="협력병원 수정 관리"
      partnerType="H"
      mode="edit"
      canEdit={canEdit}
    />
  );
}
