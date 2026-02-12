'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, ChevronDown } from 'lucide-react';
import type { MenuTreeItem } from '@/types/menu';
import { cn } from '@/lib/utils';

interface SortableItemProps {
  item: MenuTreeItem;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  hasChildren: boolean;
}

function SortableItem({
  item,
  depth,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  hasChildren,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.MENU_ID,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1 px-2 py-1.5 border-b hover:bg-muted/50 text-sm',
        isSelected && 'bg-primary/10'
      )}
      onClick={onSelect}
    >
      <button {...attributes} {...listeners} className="cursor-grab p-0.5">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div style={{ paddingLeft: `${depth * 20}px` }} className="flex items-center gap-1 flex-1">
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-0.5">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <span className="font-mono text-xs text-muted-foreground mr-2">{item.MENU_CODE}</span>
        <span>{item.MENU_NAME}</span>
      </div>
      <span className="text-xs text-muted-foreground">{item.MENU_TYPE}</span>
    </div>
  );
}

interface MenuTreeGridProps {
  items: MenuTreeItem[];
  onReorder?: (items: MenuTreeItem[]) => void;
  onSelect?: (item: MenuTreeItem) => void;
}

export function MenuTreeGrid({ items, onReorder, onSelect }: MenuTreeGridProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorder) {
      const oldIndex = items.findIndex((i) => i.MENU_ID === active.id);
      const newIndex = items.findIndex((i) => i.MENU_ID === over.id);
      const newItems = [...items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      onReorder(newItems);
    }
  };

  const flatItems = flattenTree(items, expandedIds);

  return (
    <div className="border rounded-md">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={flatItems.map((i) => i.item.MENU_ID)} strategy={verticalListSortingStrategy}>
          {flatItems.map(({ item, depth }) => (
            <SortableItem
              key={item.MENU_ID}
              item={item}
              depth={depth}
              isExpanded={expandedIds.has(item.MENU_ID)}
              isSelected={selectedId === item.MENU_ID}
              onToggle={() => toggleExpand(item.MENU_ID)}
              onSelect={() => {
                setSelectedId(item.MENU_ID);
                onSelect?.(item);
              }}
              hasChildren={!!(item.children && item.children.length > 0)}
            />
          ))}
        </SortableContext>
      </DndContext>
      {flatItems.length === 0 && (
        <div className="p-8 text-center text-muted-foreground text-sm">메뉴가 없습니다.</div>
      )}
    </div>
  );
}

function flattenTree(
  items: MenuTreeItem[],
  expandedIds: Set<string>,
  depth = 0
): { item: MenuTreeItem; depth: number }[] {
  const result: { item: MenuTreeItem; depth: number }[] = [];
  for (const item of items) {
    result.push({ item, depth });
    if (item.children && expandedIds.has(item.MENU_ID)) {
      result.push(...flattenTree(item.children, expandedIds, depth + 1));
    }
  }
  return result;
}
