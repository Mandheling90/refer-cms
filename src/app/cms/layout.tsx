'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CmsLayout } from '@/components/templates/CmsLayout';
import { PermissionGuard } from '@/components/molecules/PermissionGuard';
import { useAuthStore } from '@/stores/auth-store';

export default function CmsRootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // persist 미들웨어의 rehydration 완료를 기다림
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // 이미 rehydration이 완료된 경우
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) {
    return null;
  }

  return (
    <CmsLayout>
      <PermissionGuard>{children}</PermissionGuard>
    </CmsLayout>
  );
}
