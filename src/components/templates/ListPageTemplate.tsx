'use client';

import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw } from 'lucide-react';

interface ListPageTemplateProps {
  title: string;
  totalItems?: number;
  searchSection?: ReactNode;
  listContent: ReactNode;
  listHeaderActions?: ReactNode;
  formSection?: ReactNode;
  onSearch?: () => void;
  onReset?: () => void;
}

export function ListPageTemplate({
  title,
  totalItems,
  searchSection,
  listContent,
  listHeaderActions,
  formSection,
  onSearch,
  onReset,
}: ListPageTemplateProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{title}</h1>

      <section className="rounded-xl bg-card shadow-[0_0_12px_rgba(0,0,0,0.1)]">
        {/* 상단 헤더: 전체건수 (좌) + 재검색/조건초기화 (우) */}
        <div className="flex items-center justify-between px-6 py-4">
          <b className="text-base">
            전체 <span className="text-primary">{totalItems ?? 0}</span>건
          </b>
          <div className="flex items-center gap-2">
            {listHeaderActions}
            {onSearch && (
              <Button size="md" onClick={onSearch}>
                <Search className="h-4 w-4" />
                재검색
              </Button>
            )}
            {onReset && (
              <Button variant="outline" size="md" onClick={onReset}>
                <RotateCcw className="h-4 w-4" />
                조건초기화
              </Button>
            )}
          </div>
        </div>

        {/* 검색 조건 */}
        {searchSection && (
          <div className="border-t border-gray-500 px-6 py-5">
            {searchSection}
          </div>
        )}

        {/* 테이블 */}
        <div className="border-t border-gray-500 px-6 py-5">
          {listContent}
        </div>
      </section>

      {formSection}
    </div>
  );
}
