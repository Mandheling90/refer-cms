'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CmsLayout } from '@/components/templates/CmsLayout';
import { useAuthStore } from '@/stores/auth-store';

export default function CmsRootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <CmsLayout>{children}</CmsLayout>;
}
