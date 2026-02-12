'use client';

import { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ListPageTemplateProps {
  title: string;
  searchSection?: ReactNode;
  listHeaderActions?: ReactNode;
  listContent: ReactNode;
  formSection?: ReactNode;
}

export function ListPageTemplate({
  title,
  searchSection,
  listHeaderActions,
  listContent,
  formSection,
}: ListPageTemplateProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{title}</h1>

      {searchSection && (
        <Card>
          <CardContent className="p-4">{searchSection}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title} 목록</CardTitle>
            {listHeaderActions}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">{listContent}</CardContent>
      </Card>

      {formSection}
    </div>
  );
}
