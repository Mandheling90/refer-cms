'use client';

import { usePagePermission } from '@/components/molecules/PermissionGuard';
import { CooperationListPage } from '../_components/CooperationListPage';

export default function ClinicApplyPage() {
  const { canEdit } = usePagePermission();

  return (
    <CooperationListPage
      title="협력의원 신청 관리"
      partnerType="B"
      mode="apply"
      canEdit={canEdit}
    />
  );
}
