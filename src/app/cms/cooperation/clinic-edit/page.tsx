'use client';

import { usePagePermission } from '@/components/molecules/PermissionGuard';
import { CooperationListPage } from '../_components/CooperationListPage';

export default function ClinicEditPage() {
  const { canEdit } = usePagePermission();

  return (
    <CooperationListPage
      title="협력의원 수정 관리"
      partnerType="M"
      mode="edit"
      canEdit={canEdit}
    />
  );
}
