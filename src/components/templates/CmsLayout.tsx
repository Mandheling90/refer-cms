'use client';

import { type ReactNode } from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { TopBar } from '@/components/organisms/TopBar';
import { useMenuStore } from '@/stores/menu-store';
import { cn } from '@/lib/utils';

interface CmsLayoutProps {
  children: ReactNode;
}

export function CmsLayout({ children }: CmsLayoutProps) {
  const { sidebarOpen } = useMenuStore();

  return (
    <div
      className={cn(
        'grid min-h-screen transition-[grid-template-columns] duration-300',
        sidebarOpen
          ? 'grid-cols-[250px_minmax(0,1fr)]'
          : 'grid-cols-[0_minmax(0,1fr)]'
      )}
      style={{
        gridTemplateRows: '75px minmax(0, 1fr)',
        gridTemplateAreas: '"aside header" "aside contents"',
      }}
    >
      <Sidebar />
      <TopBar />
      <main
        className="overflow-auto bg-gray-200 p-6"
        style={{ gridArea: 'contents' }}
      >
        {children}
      </main>
    </div>
  );
}
