'use client';

import { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionButtons } from '@/components/molecules/ActionButtons';

interface CrudFormProps {
  title: string;
  children: ReactNode;
  onAdd?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  showAdd?: boolean;
  showSave?: boolean;
  showDelete?: boolean;
}

export function CrudForm({
  title,
  children,
  onAdd,
  onSave,
  onDelete,
  showAdd = true,
  showSave = true,
  showDelete = false,
}: CrudFormProps) {
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <ActionButtons
            onAdd={onAdd}
            onSave={onSave}
            onDelete={onDelete}
            showAdd={showAdd}
            showSave={showSave}
            showDelete={showDelete}
          />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">{children}</CardContent>
    </Card>
  );
}
