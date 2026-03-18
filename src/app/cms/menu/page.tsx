'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import {
  ADMIN_MENUS,
  CREATE_MENU,
  UPDATE_MENU,
  DELETE_MENU,
  REORDER_MENUS,
  ADMIN_BOARD_SETTINGS,
} from '@/lib/graphql/queries/menu';
import { ADMIN_CONTENTS } from '@/lib/graphql/queries/content';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { HospitalSelector } from '@/components/molecules/HospitalSelector';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MenuItem {
  id: string;
  name: string;
  path: string | null;
  sortOrder: number;
  parentId: string | null;
  isActive: boolean;
  hospitalCode: string;
  menuTargetType: string | null;
  targetBoardId: string | null;
  targetContentId: string | null;
  externalUrl: string | null;
  gnbExposure: boolean;
  firstChildPath: string | null;
  children?: MenuItem[];
}

interface BoardSetting {
  id: string;
  boardId: string;
  name: string;
}

interface Content {
  id: string;
  title: string;
  contentGroupName: string;
}

type MenuTargetType = 'BOARD' | 'CONTENT' | 'LINK' | 'PARENT';

interface MenuFormData {
  name: string;
  menuTargetType: MenuTargetType;
  targetBoardId: string;
  targetContentId: string;
  externalUrl: string;
  gnbExposure: boolean;
  isActive: boolean;
}

const INITIAL_FORM: MenuFormData = {
  name: '',
  menuTargetType: 'BOARD',
  targetBoardId: '',
  targetContentId: '',
  externalUrl: '',
  gnbExposure: false,
  isActive: false,
};

// ---------------------------------------------------------------------------
// SortableMenuRow
// ---------------------------------------------------------------------------

function SortableMenuRow({
  item,
  isSelected,
  onClick,
  onEdit,
  onDelete,
  showChildCount,
}: {
  item: MenuItem;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showChildCount?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const badgeLabel = item.gnbExposure ? 'GNB' : item.isActive ? '사용' : '미사용';
  const badgeClass = item.gnbExposure
    ? 'bg-destructive text-white'
    : item.isActive
      ? 'bg-primary text-white'
      : 'bg-gray-500 text-white';

  const childCount = item.children?.length ?? 0;
  const countStr = String(childCount).padStart(2, '0');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'grid items-center gap-0 p-3 rounded-xl border cursor-pointer select-none mt-1 transition-colors',
        showChildCount
          ? 'grid-cols-[36px_1fr_36px_36px_36px]'
          : 'grid-cols-[36px_1fr_36px_36px]',
        isSelected
          ? 'border-primary bg-primary/5'
          : item.isActive
            ? 'border-border bg-card hover:border-primary'
            : 'border-border bg-muted hover:border-primary'
      )}
      onClick={onClick}
    >
      {/* 드래그 핸들 */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab flex items-center justify-center text-muted-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* 메뉴명 + 배지 + 카운트 */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-lg text-[12px] font-semibold shrink-0',
            badgeClass
          )}
        >
          {badgeLabel === 'GNB' ? 'G' : badgeLabel === '사용' ? 'Y' : '미'}
        </span>
        <span className={cn(
          'text-sm font-semibold truncate',
          !item.isActive && 'text-muted-foreground'
        )}>
          {item.name}
        </span>
        {showChildCount && (
          <span className="ml-auto text-xs text-muted-foreground tabular-nums shrink-0">
            {countStr}건
          </span>
        )}
      </div>

      {/* 수정 버튼 */}
      <button
        className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Pencil className="h-4 w-4" />
      </button>

      {/* 삭제 버튼 */}
      <button
        className="flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-accent cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* 하위 메뉴 화살표 (최상위 메뉴만) */}
      {showChildCount && (
        <div className="flex items-center justify-center text-muted-foreground cursor-pointer">
          <ChevronRight className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MenuColumn
// ---------------------------------------------------------------------------

function MenuColumn({
  title,
  items,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onReorder,
  onSaveOrders,
  onAddNew,
  showChildCount,
}: {
  title: string;
  items: MenuItem[];
  selectedId: string | null;
  onSelect: (item: MenuItem) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onReorder: (items: MenuItem[]) => void;
  onSaveOrders: () => void;
  onAddNew: () => void;
  showChildCount?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newItems = [...items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      onReorder(newItems);
    }
  };

  const countText = `${String(items.length).padStart(2, '0')} 건`;

  return (
    <div className="flex flex-col border border-border rounded-xl bg-card flex-1 shadow-[0_0_12px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/10 rounded-t-xl">
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        <span className="text-sm font-semibold text-foreground">{countText}</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[calc(100vh-360px)] px-3 py-1">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <SortableMenuRow
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onClick={() => onSelect(item)}
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item)}
                showChildCount={showChildCount}
              />
            ))}
          </SortableContext>
        </DndContext>
        {items.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">메뉴가 없습니다.</div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-end gap-2 px-3 py-3 border-t border-border">
        <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-lg px-4 text-sm" onClick={onSaveOrders}>
          <Save className="h-4 w-4" />
          순서 저장
        </Button>
        <Button size="sm" className="gap-1.5 h-9 rounded-lg px-4 text-sm bg-primary hover:bg-primary/90 text-white" onClick={onAddNew}>
          <Plus className="h-4 w-4" />
          신규 메뉴 추가
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToggleSwitch
// ---------------------------------------------------------------------------

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer items-center rounded-[14px] transition-colors duration-200',
        checked ? 'bg-primary' : 'bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && onChange(!checked)}
    >
      {checked && (
        <span className="absolute left-1.5 text-[10px] font-semibold text-white select-none">
          ON
        </span>
      )}
      {!checked && (
        <span className="absolute right-1.5 text-[10px] font-semibold text-gray-500 select-none">
          OFF
        </span>
      )}
      <span
        className={cn(
          'pointer-events-none absolute h-6 w-6 rounded-full bg-card shadow transition-[left] duration-200',
          checked ? 'left-[26px]' : 'left-[2px]'
        )}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// SearchableSelect
// ---------------------------------------------------------------------------

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-border bg-card px-[15px] py-2 text-sm h-9 outline-none transition-colors',
            selectedLabel ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          {open ? (
            <ChevronUp className="size-3.5 shrink-0 text-foreground" />
          ) : (
            <ChevronDown className="size-3.5 shrink-0 text-foreground" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-md border border-border shadow-[5px_5px_9px_0px_rgba(0,0,0,0.35)]"
        align="start"
        sideOffset={-1}
      >
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'px-[15px] py-2 text-sm cursor-pointer rounded-none',
                    value === opt.value && 'bg-accent'
                  )}
                >
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// MenuDialog (등록/수정 공용)
// ---------------------------------------------------------------------------

function MenuDialog({
  open,
  onOpenChange,
  editItem,
  parentId,
  itemCount,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: MenuItem | null;
  parentId?: string;
  itemCount: number;
  onSaved: () => void;
}) {
  const isEditMode = !!editItem;
  const isTopLevel = !parentId && !editItem?.parentId;

  const [form, setForm] = useState<MenuFormData>(INITIAL_FORM);
  const [nameError, setNameError] = useState('');

  const hospitalCode = useAuthStore((s: { hospitalCode: string | null }) => s.hospitalCode);
  const activeHospitalCode = useAuthStore((s: { activeHospitalCode: string | null }) => s.activeHospitalCode);
  const isAllHospital = hospitalCode === 'ALL';
  const effectiveHospitalCode = isAllHospital ? (activeHospitalCode || 'ANAM') : hospitalCode?.toUpperCase();

  // GraphQL
  const { data: boardData } = useQuery<{ adminBoardSettings: BoardSetting[] }>(
    ADMIN_BOARD_SETTINGS,
    { variables: { hospitalCode: effectiveHospitalCode || undefined }, skip: !open },
  );
  const { data: contentData } = useQuery<{ adminContents: Content[] }>(
    ADMIN_CONTENTS,
    { skip: !open },
  );
  const [createMenu, { loading: creating }] = useMutation(CREATE_MENU);
  const [updateMenu, { loading: updating }] = useMutation(UPDATE_MENU);

  const boards = boardData?.adminBoardSettings ?? [];
  const contents = contentData?.adminContents ?? [];
  const saving = creating || updating;

  // 다이얼로그 열릴 때 폼 초기화
  useEffect(() => {
    if (!open) return;
    setNameError('');
    if (editItem) {
      setForm({
        name: editItem.name,
        menuTargetType: (editItem.menuTargetType as MenuTargetType) || 'BOARD',
        targetBoardId: editItem.targetBoardId || '',
        targetContentId: editItem.targetContentId || '',
        externalUrl: editItem.externalUrl || '',
        gnbExposure: editItem.gnbExposure,
        isActive: editItem.isActive,
      });
    } else {
      setForm({
        ...INITIAL_FORM,
        menuTargetType: isTopLevel ? 'PARENT' : 'BOARD',
      });
    }
  }, [open, editItem, isTopLevel]);

  const updateField = <K extends keyof MenuFormData>(key: K, value: MenuFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'isActive' && value === false) {
        next.gnbExposure = false;
      }
      return next;
    });
    if (key === 'name') setNameError('');
  };

  const validate = (): boolean => {
    if (!form.name.trim()) {
      setNameError('메뉴명을 입력해주세요.');
      return false;
    }
    if (form.name.length > 20) {
      setNameError('메뉴명은 최대 20자까지 입력 가능합니다.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      if (isEditMode && editItem) {
        const input: Record<string, unknown> = {
              name: form.name.trim(),
              menuTargetType: form.menuTargetType,
              gnbExposure: form.gnbExposure,
              isActive: form.isActive,
            };
            if (form.menuTargetType === 'BOARD') {
              input.targetBoardId = form.targetBoardId || null;
            } else if (form.menuTargetType === 'CONTENT') {
              input.targetContentId = form.targetContentId || null;
            } else if (form.menuTargetType === 'LINK') {
              input.externalUrl = form.externalUrl || null;
            }
        await updateMenu({
          variables: {
            id: editItem.id,
            input,
          },
        });
      } else {
        await createMenu({
          variables: {
            input: {
              name: form.name.trim(),
              menuType: 'USER',
              hospitalCode: effectiveHospitalCode,
              parentId: parentId || undefined,
              menuTargetType: form.menuTargetType,
              targetBoardId: form.menuTargetType === 'BOARD' ? form.targetBoardId || undefined : undefined,
              targetContentId: form.menuTargetType === 'CONTENT' ? form.targetContentId || undefined : undefined,
              externalUrl: form.menuTargetType === 'LINK' ? form.externalUrl || undefined : undefined,
              gnbExposure: form.gnbExposure,
              sortOrder: itemCount + 1,
            },
          },
        });
      }
      toast.success('저장되었습니다.');
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error('저장에 실패했습니다.');
    }
  };

  // 메뉴 타입 옵션
  const targetTypeOptions: [MenuTargetType, string][] = isTopLevel
    ? [['PARENT', '상위 메뉴'], ['BOARD', '게시판(목록)'], ['CONTENT', '콘텐츠'], ['LINK', '링크']]
    : [['BOARD', '게시판(목록)'], ['CONTENT', '콘텐츠'], ['LINK', '링크']];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '메뉴 수정' : '신규 메뉴 추가'}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {/* 메뉴명 */}
          <div className="space-y-1.5">
            <Label>
              메뉴명 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="메뉴명을 입력해주세요"
              maxLength={20}
              aria-invalid={!!nameError}
            />
            {nameError && <p className="text-destructive text-xs">{nameError}</p>}
          </div>

          {/* 메뉴 타입 */}
          <div className="space-y-1.5">
            <Label>메뉴 타입</Label>
            <div className="flex gap-4">
              {targetTypeOptions.map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-1.5 cursor-pointer text-sm"
                  onClick={() => updateField('menuTargetType', value)}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center size-4 rounded-full border-2 shrink-0',
                      form.menuTargetType === value ? 'border-primary' : 'border-muted-foreground'
                    )}
                  >
                    {form.menuTargetType === value && (
                      <span className="size-2 rounded-full bg-primary" />
                    )}
                  </span>
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* 게시판 선택 */}
          {form.menuTargetType === 'BOARD' && (
            <div className="space-y-1.5">
              <Label>
                연결할 게시판 <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                value={form.targetBoardId}
                onChange={(v) => updateField('targetBoardId', v)}
                options={boards.map((b) => ({
                  value: b.boardId,
                  label: b.name,
                }))}
                placeholder="게시판 이름을 검색하세요."
              />
            </div>
          )}

          {/* 링크 입력 */}
          {form.menuTargetType === 'LINK' && (
            <div className="space-y-1.5">
              <Label>연결할 링크 주소</Label>
              <Input
                value={form.externalUrl}
                onChange={(e) => updateField('externalUrl', e.target.value)}
                placeholder="https://"
              />
            </div>
          )}

          {/* 콘텐츠 선택 */}
          {form.menuTargetType === 'CONTENT' && (
            <div className="space-y-1.5">
              <Label>
                연결할 콘텐츠 <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                value={form.targetContentId}
                onChange={(v) => updateField('targetContentId', v)}
                options={contents.map((c) => ({
                  value: c.id,
                  label: c.contentGroupName ? `[${c.contentGroupName}] ${c.title}` : c.title,
                }))}
                placeholder="콘텐츠 이름을 검색하세요."
              />
            </div>
          )}

          {/* GNB 노출여부 */}
          <div className="space-y-1.5">
            <Label>
              GNB 노출여부 <span className="text-destructive">*</span>
            </Label>
            <ToggleSwitch
              checked={form.gnbExposure}
              onChange={(v) => updateField('gnbExposure', v)}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleSave} disabled={saving}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// MenuPage (main)
// ---------------------------------------------------------------------------

export default function MenuPage() {
  // ── 로컬 상태 (드래그 순서를 위한 로컬 복사본) ──
  const [items1, setItems1] = useState<MenuItem[]>([]);
  const [items2, setItems2] = useState<MenuItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // ── 다이얼로그 상태 ──
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogParentId, setDialogParentId] = useState<string | undefined>();
  const [dialogEditItem, setDialogEditItem] = useState<MenuItem | null>(null);
  const [dialogItemCount, setDialogItemCount] = useState(0);

  // ── 삭제 확인 상태 ──
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // ── GraphQL ──
  const { data, refetch } = useQuery<{ adminMenus: MenuItem[] }>(ADMIN_MENUS, {
    variables: { menuType: 'USER' },
  });

  const [reorderMenus] = useMutation(REORDER_MENUS);
  const [deleteMenu] = useMutation(DELETE_MENU);

  // 선택된 상위 메뉴 ID를 ref로 보관 (useEffect 의존성 이슈 방지)
  const selectedIdRef = useRef<string | null>(null);

  // ── 쿼리 데이터 → 로컬 상태 동기화 ──
  useEffect(() => {
    if (data?.adminMenus) {
      setItems1(data.adminMenus);
      if (selectedIdRef.current) {
        const parent = data.adminMenus.find((m) => m.id === selectedIdRef.current);
        if (parent) {
          setItems2(parent.children ?? []);
        } else {
          selectedIdRef.current = null;
          setSelectedId(null);
          setItems2([]);
        }
      }
    }
  }, [data]);

  // ── 상위 메뉴 선택 ──
  const handleSelect1 = (item: MenuItem) => {
    selectedIdRef.current = item.id;
    setSelectedId(item.id);
    const children = item.children ?? [];
    setItems2(children);
    setSelectedChildId(children.length > 0 ? children[0].id : null);
  };

  // ── 순서 저장 ──
  const handleSaveOrders = async (items: MenuItem[]) => {
    try {
      await reorderMenus({
        variables: {
          input: {
            items: items.map((m, idx) => ({ id: m.id, sortOrder: idx + 1 })),
          },
        },
      });
      toast.success('순서가 저장되었습니다.');
      refetch();
    } catch {
      toast.error('순서 저장에 실패했습니다.');
    }
  };

  // ── 삭제 ──
  const handleDeleteRequest = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      toast.error(`하위 메뉴가 존재하는 메뉴는 삭제할 수 없습니다. (${item.name})`);
      return;
    }
    setDeleteTarget(item);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMenu({ variables: { id: deleteTarget.id } });
      toast.success('삭제되었습니다.');
      refetch();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  // ── 신규 등록 다이얼로그 열기 ──
  const openAddDialog = (parentId?: string) => {
    if (parentId && !selectedId) {
      toast.error('최상위 메뉴를 먼저 선택해주세요.');
      return;
    }
    setDialogEditItem(null);
    setDialogParentId(parentId);
    setDialogItemCount(parentId ? items2.length : items1.length);
    setDialogOpen(true);
  };

  // ── 수정 다이얼로그 열기 ──
  const openEditDialog = (item: MenuItem) => {
    setDialogEditItem(item);
    setDialogParentId(undefined);
    setDialogItemCount(0);
    setDialogOpen(true);
  };

  // ── 저장 후 새로고침 ──
  const handleDialogSaved = () => {
    refetch();
  };

  const selected1 = items1.find((i) => i.id === selectedId);
  const subMenuTitle = selected1
    ? `${selected1.name} > 하위 메뉴`
    : '하위 메뉴';

  const deleteDescription = deleteTarget
    ? deleteTarget.children && deleteTarget.children.length > 0
      ? `"${deleteTarget.name}" 메뉴에 하위 메뉴 ${deleteTarget.children.length}건이 포함되어 있습니다. 삭제하시겠습니까?`
      : `"${deleteTarget.name}" 메뉴를 삭제하시겠습니까?`
    : '';

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">메뉴관리</h1>
        <HospitalSelector />
      </div>

      {/* Guide text + Legend */}
      <div className="bg-card border border-border rounded-xl px-4 py-3 space-y-2">
        <p className="text-sm text-muted-foreground">
          각 항목의 아이콘을 드래그 &amp; 드롭 하시면 순서를 변경하실 수 있습니다.
        </p>
        <div className="flex items-center gap-5 flex-wrap text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Pencil className="h-4 w-4 text-muted-foreground" />
            <span>= 설정하기</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span>= 하위메뉴 보기</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[12px] font-semibold bg-destructive text-white">G</span>
            <span>= GNB 사용</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[12px] font-semibold bg-primary text-white">Y</span>
            <span>= 사용</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[12px] font-semibold bg-gray-500 text-white">미</span>
            <span>= 미사용</span>
          </span>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="flex gap-6">
        {/* 최상위 메뉴 */}
        <MenuColumn
          title="최상위 메뉴"
          items={items1}
          selectedId={selectedId}
          onSelect={handleSelect1}
          onEdit={openEditDialog}
          onDelete={handleDeleteRequest}
          onReorder={setItems1}
          onSaveOrders={() => handleSaveOrders(items1)}
          onAddNew={() => openAddDialog()}
          showChildCount
        />

        {/* 하위 메뉴 */}
        <MenuColumn
          title={subMenuTitle}
          items={items2}
          selectedId={selectedChildId}
          onSelect={(item) => setSelectedChildId(item.id)}
          onEdit={openEditDialog}
          onDelete={handleDeleteRequest}
          onReorder={setItems2}
          onSaveOrders={() => handleSaveOrders(items2)}
          onAddNew={() => {
            if (selected1 && selected1.menuTargetType !== 'PARENT') {
              toast.error('상위 메뉴 타입이 "상위메뉴"인 경우에만 하위 메뉴를 추가할 수 있습니다.');
              return;
            }
            openAddDialog(selectedId ?? undefined);
          }}
        />
      </div>

      {/* 등록/수정 다이얼로그 */}
      <MenuDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editItem={dialogEditItem}
        parentId={dialogParentId}
        itemCount={dialogItemCount}
        onSaved={handleDialogSaved}
      />

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="메뉴 삭제"
        description={deleteDescription}
        onConfirm={handleDeleteConfirm}
        destructive
      />
    </div>
  );
}
