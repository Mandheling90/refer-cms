'use client';

import { usePagePermission } from '@/components/molecules/PermissionGuard';
import { UpdateRequestListPage } from '../_components/UpdateRequestListPage';

export default function ClinicEditPage() {
  const { canEdit } = usePagePermission();

  return (
    <UpdateRequestListPage
      title="협력의원 수정요청 확인"
      partnerType="M"
      canEdit={canEdit}
    />
  );
}
