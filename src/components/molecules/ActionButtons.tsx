'use client';

import { Button } from '@/components/ui/button';
import { Plus, Save, Trash2 } from 'lucide-react';

interface ActionButtonsProps {
  onAdd?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  addLabel?: string;
  saveLabel?: string;
  deleteLabel?: string;
  showAdd?: boolean;
  showSave?: boolean;
  showDelete?: boolean;
}

export function ActionButtons({
  onAdd,
  onSave,
  onDelete,
  addLabel = '추가',
  saveLabel = '저장',
  deleteLabel = '삭제',
  showAdd = true,
  showSave = true,
  showDelete = true,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      {showDelete && onDelete && (
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          {deleteLabel}
        </Button>
      )}
      {showAdd && onAdd && (
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" />
          {addLabel}
        </Button>
      )}
      {showSave && onSave && (
        <Button size="sm" onClick={onSave}>
          <Save className="h-4 w-4 mr-1" />
          {saveLabel}
        </Button>
      )}
    </div>
  );
}
