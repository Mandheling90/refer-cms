'use client';

import { usePagePermission } from '@/components/molecules/PermissionGuard';
import { UpdateRequestListPage } from '../_components/UpdateRequestListPage';

export default function UpdateRequestPage() {
  const { canEdit } = usePagePermission();

  return (
    <UpdateRequestListPage
      title="수정요청 확인"
      canEdit={canEdit}
    />
  );
}
