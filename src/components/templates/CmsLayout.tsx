'use client';

import { type ReactNode } from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { TopBar } from '@/components/organisms/TopBar';

interface CmsLayoutProps {
  children: ReactNode;
}

export function CmsLayout({ children }: CmsLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 p-6 bg-muted/30 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
