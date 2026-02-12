'use client';

import { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormPageTemplateProps {
  title: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function FormPageTemplate({ title, headerActions, children }: FormPageTemplateProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title}</CardTitle>
            {headerActions}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">{children}</CardContent>
      </Card>
    </div>
  );
}
