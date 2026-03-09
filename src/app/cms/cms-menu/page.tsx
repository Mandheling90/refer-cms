'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Button } from '@/components/ui/button';
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
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import {
  ADMIN_MENUS,
  CREATE_MENU,
  UPDATE_MENU,
  DELETE_MENU,
  REORDER_MENUS,
} from '@/lib/graphql/queries/menu';
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
  ChevronRight,
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

interface CmsMenuFormData {
  name: string;
  hospitalCode: string;
  menuTargetType: 'PARENT' | 'LINK';
  externalUrl: string;
  linkTarget: '_self' | '_blank';
  iconClass: string;
  isActive: boolean;
}

const INITIAL_FORM: CmsMenuFormData = {
  name: '',
  hospitalCode: '',
  menuTargetType: 'PARENT',
  externalUrl: '',
  linkTarget: '_blank',
  iconClass: '',
  isActive: false,
};

const MENU_TARGET_OPTIONS = [
  { value: 'PARENT' as const, label: '상위메뉴' },
  { value: 'LINK' as const, label: '링크' },
];

const HOSPITAL_OPTIONS = [
  { value: 'ANAM', label: '안암' },
  { value: 'GURO', label: '구로' },
  { value: 'ANSAN', label: '안산' },
];

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

  const badgeLabel = item.isActive ? '사용' : '미사용';
  const badgeClass = item.isActive
    ? 'bg-[#9F1836] text-white'
    : 'bg-[#8b8d98] text-white';

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
          ? 'border-[#9F1836] bg-[rgba(159,24,54,0.05)]'
          : item.isActive
            ? 'border-gray-200 bg-white hover:border-[#9F1836]'
            : 'border-gray-200 bg-gray-100 hover:border-[#9F1836]'
      )}
      onClick={onClick}
    >
      {/* 드래그 핸들 */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab flex items-center justify-center text-gray-600"
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
          {badgeLabel === '사용' ? 'Y' : '미'}
        </span>
        <span className={cn(
          'text-sm font-semibold truncate',
          !item.isActive && 'text-gray-400'
        )}>
          {item.name}
        </span>
        {showChildCount && (
          <span className="ml-auto text-xs text-gray-500 tabular-nums shrink-0">
            {countStr}건
          </span>
        )}
      </div>

      {/* 수정 버튼 */}
      <button
        className="flex items-center justify-center text-gray-600 hover:text-[#9F1836] transition-colors rounded-lg hover:bg-gray-100 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Pencil className="h-4 w-4" />
      </button>

      {/* 삭제 버튼 */}
      <button
        className="flex items-center justify-center text-gray-600 hover:text-[#DE4841] transition-colors rounded-lg hover:bg-gray-100 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* 하위 메뉴 화살표 (최상위 메뉴만) */}
      {showChildCount && (
        <div className="flex items-center justify-center text-gray-600 cursor-pointer">
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
    <div className="flex flex-col border border-gray-200 rounded-xl bg-white flex-1 shadow-[0_0_12px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[rgba(159,24,54,0.1)] rounded-t-xl">
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        <span className="text-sm font-semibold text-gray-700">{countText}</span>
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
          <div className="p-8 text-center text-gray-500 text-sm">메뉴가 없습니다.</div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-end gap-2 px-3 py-3 border-t border-gray-200">
        <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-lg px-4 text-sm" onClick={onSaveOrders}>
          <Save className="h-4 w-4" />
          순서 저장
        </Button>
        <Button size="sm" className="gap-1.5 h-9 rounded-lg px-4 text-sm bg-[#9F1836] hover:bg-[#8a1530] text-white" onClick={onAddNew}>
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
  onLabel = 'ON',
  offLabel = 'OFF',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  onLabel?: string;
  offLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-7 w-[64px] shrink-0 cursor-pointer items-center rounded-[14px] transition-colors duration-200',
        checked ? 'bg-[#9F1836]' : 'bg-[#e0e0e0]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && onChange(!checked)}
    >
      {checked && (
        <span className="absolute left-1.5 text-[10px] font-semibold text-white select-none">
          {onLabel}
        </span>
      )}
      {!checked && (
        <span className="absolute right-1.5 text-[10px] font-semibold text-gray-500 select-none">
          {offLabel}
        </span>
      )}
      <span
        className={cn(
          'pointer-events-none absolute h-6 w-6 rounded-full bg-white shadow transition-[left] duration-200',
          checked ? 'left-[38px]' : 'left-[2px]'
        )}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// CmsMenuDialog (등록/수정 공용)
// ---------------------------------------------------------------------------

function CmsMenuDialog({
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

  const [form, setForm] = useState<CmsMenuFormData>(INITIAL_FORM);
  const [nameError, setNameError] = useState('');

  const hospitalCode = useAuthStore((s: { hospitalCode: string | null }) => s.hospitalCode);
  const activeHospitalCode = useAuthStore((s: { activeHospitalCode: string | null }) => s.activeHospitalCode);
  const isAllHospital = hospitalCode === 'ALL';
  const effectiveHospitalCode = isAllHospital ? (activeHospitalCode || 'ANAM') : hospitalCode?.toUpperCase();

  const [createMenu, { loading: creating }] = useMutation(CREATE_MENU);
  const [updateMenu, { loading: updating }] = useMutation(UPDATE_MENU);
  const saving = creating || updating;

  useEffect(() => {
    if (!open) return;
    setNameError('');
    if (editItem) {
      setForm({
        name: editItem.name,
        hospitalCode: editItem.hospitalCode || effectiveHospitalCode || 'ANAM',
        menuTargetType: (editItem.menuTargetType as 'PARENT' | 'LINK') || 'PARENT',
        externalUrl: editItem.externalUrl || '',
        linkTarget: editItem.gnbExposure ? '_blank' : '_self',
        iconClass: editItem.path || '',
        isActive: editItem.isActive,
      });
    } else {
      setForm({
        ...INITIAL_FORM,
        hospitalCode: effectiveHospitalCode || 'ANAM',
      });
    }
  }, [open, editItem, effectiveHospitalCode]);

  const updateField = <K extends keyof CmsMenuFormData>(key: K, value: CmsMenuFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      const isParent = form.menuTargetType === 'PARENT';
      if (isEditMode && editItem) {
        const input: Record<string, unknown> = {
          name: form.name.trim(),
          menuTargetType: form.menuTargetType,
          isActive: form.isActive,
          ...(!isParent ? {
            externalUrl: form.externalUrl || null,
            gnbExposure: form.linkTarget === '_blank',
          } : {}),
        };
        await updateMenu({
          variables: { id: editItem.id, input },
        });
      } else {
        await createMenu({
          variables: {
            input: {
              menuType: 'ADMIN',
              hospitalCode: form.hospitalCode,
              name: form.name.trim(),
              menuTargetType: form.menuTargetType,
              ...(parentId ? { parentId } : {}),
              ...(!isParent ? {
                gnbExposure: form.linkTarget === '_blank',
                ...(form.externalUrl ? { externalUrl: form.externalUrl } : {}),
              } : {}),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'CMS 메뉴 수정' : 'CMS 신규 메뉴 추가'}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {/* 사용하는 기관 */}
          <div className="space-y-1.5">
            <Label>
              사용하는 기관 <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-4">
              {HOSPITAL_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-1.5 cursor-pointer text-sm"
                  onClick={() => updateField('hospitalCode', opt.value)}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center size-4 rounded-full border-2 shrink-0',
                      form.hospitalCode === opt.value ? 'border-[#9F1836]' : 'border-gray-400'
                    )}
                  >
                    {form.hospitalCode === opt.value && (
                      <span className="size-2 rounded-full bg-[#9F1836]" />
                    )}
                  </span>
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* CMS 메뉴명 */}
          <div className="space-y-1.5">
            <Label>
              CMS 메뉴명 <span className="text-destructive">*</span>
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
            <Label>
              메뉴 타입 <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-4">
              {MENU_TARGET_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-1.5 cursor-pointer text-sm"
                  onClick={() => updateField('menuTargetType', opt.value)}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center size-4 rounded-full border-2 shrink-0',
                      form.menuTargetType === opt.value ? 'border-[#9F1836]' : 'border-gray-400'
                    )}
                  >
                    {form.menuTargetType === opt.value && (
                      <span className="size-2 rounded-full bg-[#9F1836]" />
                    )}
                  </span>
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* 연결 URL 주소 (링크일 때만) */}
          {form.menuTargetType === 'LINK' && (
            <div className="space-y-1.5">
              <Label>연결 URL 주소</Label>
              <Input
                value={form.externalUrl}
                onChange={(e) => updateField('externalUrl', e.target.value)}
                placeholder="/cms/example 또는 https://..."
              />
            </div>
          )}

          {/* 연결 방식 (링크일 때만) */}
          {form.menuTargetType === 'LINK' && (
            <div className="space-y-1.5">
              <Label>연결 방식</Label>
              <ToggleSwitch
                checked={form.linkTarget === '_blank'}
                onChange={(v) => updateField('linkTarget', v ? '_blank' : '_self')}
                onLabel="새창"
                offLabel="현재창"
              />
            </div>
          )}

          {/* 아이콘 클래스 */}
          <div className="space-y-1.5">
            <Label>아이콘 클래스</Label>
            <Input
              value={form.iconClass}
              onChange={(e) => updateField('iconClass', e.target.value)}
              placeholder="아이콘 클래스를 입력해주세요"
            />
          </div>

          {/* 메뉴 사용여부 */}
          <div className="space-y-1.5">
            <Label>
              메뉴 사용여부 <span className="text-destructive">*</span>
            </Label>
            <ToggleSwitch
              checked={form.isActive}
              onChange={(v) => updateField('isActive', v)}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button className="bg-[#9F1836] hover:bg-[#8a1530] text-white" onClick={handleSave} disabled={saving}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// CmsMenuPage (main)
// ---------------------------------------------------------------------------

export default function CmsMenuPage() {
  const { hospitalCode } = useAuthStore();
  const isSuperAdmin = hospitalCode === 'ALL';

  // ── 로컬 상태 ──
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
    variables: { menuType: 'ADMIN' },
  });

  const [reorderMenus] = useMutation(REORDER_MENUS);
  const [deleteMenu] = useMutation(DELETE_MENU);

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

  // ── 권한 체크 ──
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">접근 권한이 없습니다.</p>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">CMS 메뉴관리</h1>
        <HospitalSelector />
      </div>

      {/* Guide text + Legend */}
      <div className="bg-white border border-gray-300 rounded-xl px-4 py-3 space-y-2">
        <p className="text-sm text-gray-600">
          각 항목의 아이콘을 드래그 &amp; 드롭 하시면 순서를 변경하실 수 있습니다.
        </p>
        <div className="flex items-center gap-5 flex-wrap text-sm text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <Pencil className="h-4 w-4 text-gray-400" />
            <span>= 설정하기</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span>= 하위메뉴 보기</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[12px] font-semibold bg-[#9F1836] text-white">Y</span>
            <span>= 사용</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[12px] font-semibold bg-[#8b8d98] text-white">미</span>
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
      <CmsMenuDialog
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
