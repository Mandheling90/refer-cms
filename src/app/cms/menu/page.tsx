'use client';

import { Badge } from '@/components/ui/badge';
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
import type { Contents } from '@/lib/api/contents';
import { menuApi } from '@/lib/api/menu';
import { cn } from '@/lib/utils';
import type { Board } from '@/types/board';
import type { Menu } from '@/types/menu';
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
import { ChevronDown, ChevronRight, ChevronUp, GripVertical, Save, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MenuType = 'BOARD' | 'LINK' | 'CONTENTS';

interface AddMenuFormData {
  LANG_SET: string;
  MENU_NAME: string;
  MENU_TYPE: MenuType;
  BOARD_ID: string;
  LINK_URL: string;
  CONTENT_ID: string;
  GNB_YN: string;
  USE_YN: string;
}

const INITIAL_FORM: AddMenuFormData = {
  LANG_SET: 'kr',
  MENU_NAME: '',
  MENU_TYPE: 'BOARD',
  BOARD_ID: '',
  LINK_URL: '',
  CONTENT_ID: '',
  GNB_YN: 'Y',
  USE_YN: 'Y',
};

// ---------------------------------------------------------------------------
// SortableMenuRow
// ---------------------------------------------------------------------------

function SortableMenuRow({
  item,
  isSelected,
  onClick,
}: {
  item: Menu;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.MENU_ID,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isUsed = item.USE_YN !== 'N';
  const isGnb = item.GNB_YN === 'Y';

  // 배지: GNB(빨강) > 사용(파랑) > 미사용(회색)
  const badgeLabel = isGnb ? 'GNB' : isUsed ? '사용' : '미사용';
  const badgeClass = isSelected
    ? 'bg-white/20 text-white border-transparent'
    : isGnb
      ? 'bg-[#DE4841] text-white border-transparent'
      : isUsed
        ? 'bg-[#23B7E5] text-white border-transparent'
        : 'bg-gray-500 text-white border-transparent';

  const childCount = item.CHILD_COUNT ?? 0;
  const countStr = String(childCount).padStart(2, '0');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-300 cursor-pointer select-none',
        isSelected
          ? 'bg-[#23B7E5] text-white'
          : isUsed
            ? 'bg-white hover:bg-gray-100'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      )}
      onClick={onClick}
    >
      {/* 드래그 핸들 */}
      <button
        {...attributes}
        {...listeners}
        className={cn('cursor-grab p-0.5 shrink-0', isSelected ? 'text-white/70' : 'text-gray-400')}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* 배지 (GNB / 사용 / 미사용) */}
      <Badge
        className={cn(
          'text-[10px] leading-none px-1.5 py-0.5 rounded shrink-0 font-medium border',
          badgeClass
        )}
      >
        {badgeLabel}
      </Badge>

      {/* 메뉴명 */}
      <span className="flex-1 text-sm truncate">{item.MENU_NAME}</span>

      {/* > 화살표 */}
      <ChevronRight
        className={cn('h-4 w-4 shrink-0', isSelected ? 'text-white/70' : 'text-gray-400')}
      />

      {/* 카운트 */}
      <span
        className={cn(
          'text-sm font-medium tabular-nums w-6 text-right shrink-0',
          isSelected ? 'text-white' : 'text-gray-700'
        )}
      >
        {countStr}
      </span>
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
  onReorder,
  onSaveOrders,
  onAddNew,
}: {
  title: string;
  items: Menu[];
  selectedId: string | null;
  onSelect: (item: Menu) => void;
  onReorder: (items: Menu[]) => void;
  onSaveOrders: () => void;
  onAddNew: () => void;
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
      const oldIndex = items.findIndex((i) => i.MENU_ID === active.id);
      const newIndex = items.findIndex((i) => i.MENU_ID === over.id);
      const newItems = [...items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      onReorder(newItems);
    }
  };

  const countText = `${String(items.length).padStart(2, '0')} 건`;

  return (
    <div className="flex flex-col border border-gray-300 rounded-lg bg-white min-w-[280px] flex-1">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 bg-gray-100 rounded-t-lg">
        <span className="text-sm font-bold text-gray-900">{title}</span>
        <span className="text-sm font-bold text-gray-900">{countText}</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[calc(100vh-360px)]">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={items.map((i) => i.MENU_ID)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <SortableMenuRow
                key={item.MENU_ID}
                item={item}
                isSelected={selectedId === item.MENU_ID}
                onClick={() => onSelect(item)}
              />
            ))}
          </SortableContext>
        </DndContext>
        {items.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">메뉴가 없습니다.</div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-center gap-2 px-3 py-3 border-t border-gray-300">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onSaveOrders}>
          <Save className="h-3.5 w-3.5" />
          순서 저장
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onAddNew}>
          <Plus className="h-3.5 w-3.5" />
          신규 메뉴 추가
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToggleSwitch (inline)
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
        'relative inline-flex h-7 w-[60px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
        checked ? 'bg-gray-300' : 'bg-gray-700',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && onChange(!checked)}
    >
      {/* ON 텍스트 (체크 해제 시 우측에) */}
      {checked && (
        <span className="absolute right-2 text-[10px] font-semibold text-gray-700 select-none">
          ON
        </span>
      )}
      {/* OFF 텍스트 (체크 해제 시 좌측에) */}
      {!checked && (
        <span className="absolute left-1.5 text-[10px] font-semibold text-white select-none">
          OFF
        </span>
      )}
      {/* 토글 원형 */}
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full shadow transition-transform ml-0.5',
          checked ? 'translate-x-0 bg-white' : 'translate-x-[34px] bg-gray-400'
        )}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// SearchableSelect (Figma: 검색 가능한 드롭다운)
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
            'flex w-full items-center justify-between rounded-md border border-[#ccc] bg-white px-[15px] py-2 text-sm h-9 outline-none transition-colors',
            selectedLabel ? 'text-black' : 'text-[#6F6F6F]'
          )}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          {open ? (
            <ChevronUp className="size-3.5 shrink-0 text-black" />
          ) : (
            <ChevronDown className="size-3.5 shrink-0 text-black" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-md border border-[#ccc] shadow-[5px_5px_9px_0px_rgba(0,0,0,0.35)]"
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
// AddMenuDialog
// ---------------------------------------------------------------------------

function AddMenuDialog({
  open,
  onOpenChange,
  depth,
  parentMenuId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depth: number;
  parentMenuId?: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AddMenuFormData>(INITIAL_FORM);
  const [boards, setBoards] = useState<Board[]>([]);
  const [contents, setContents] = useState<Contents[]>([]);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  // Load board/contents lists when dialog opens
  useEffect(() => {
    if (!open) return;
    setForm(INITIAL_FORM);
    setNameError('');

    menuApi
      .boardList({ SHOWN_ENTITY: 9999 })
      .then((res) => {
        setBoards(res.list && res.list.length > 0 ? res.list : MOCK_BOARDS);
      })
      .catch(() => {
        setBoards(MOCK_BOARDS);
      });

    menuApi
      .contentsList({ SHOWN_ENTITY: 9999 })
      .then((res) => {
        setContents(res.list && res.list.length > 0 ? res.list : MOCK_CONTENTS);
      })
      .catch(() => {
        setContents(MOCK_CONTENTS);
      });
  }, [open]);

  const depthLabel = depth === 1 ? '최상위' : '하위';

  const updateField = <K extends keyof AddMenuFormData>(key: K, value: AddMenuFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // USE_YN OFF → force GNB_YN OFF
      if (key === 'USE_YN' && value === 'N') {
        next.GNB_YN = 'N';
      }
      return next;
    });
    if (key === 'MENU_NAME') setNameError('');
  };

  const validate = (): boolean => {
    if (!form.MENU_NAME.trim()) {
      setNameError('메뉴명을 입력해주세요.');
      return false;
    }
    if (form.MENU_NAME.length > 20) {
      setNameError('메뉴명은 최대 20자까지 입력 가능합니다.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: Partial<Menu> = {
        MENU_NAME: form.MENU_NAME,
        MENU_TYPE: form.MENU_TYPE,
        LANG_SET: form.LANG_SET,
        GNB_YN: form.GNB_YN,
        USE_YN: form.USE_YN,
      };
      if (parentMenuId) {
        payload.PARENT_MENU_ID = parentMenuId;
      }
      if (form.MENU_TYPE === 'BOARD') {
        payload.BOARD_ID = form.BOARD_ID;
      } else if (form.MENU_TYPE === 'LINK') {
        payload.LINK_URL = form.LINK_URL;
      } else if (form.MENU_TYPE === 'CONTENTS') {
        payload.CONTENT_ID = form.CONTENT_ID;
      }

      const res = await menuApi.cmsSave(payload);
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success(res.ServiceResult.MESSAGE_TEXT || '저장되었습니다.');
        onOpenChange(false);
        onSaved();
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>신규 메뉴 추가</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {/* 언어셋 */}
          <div className="space-y-1.5">
            <Label>언어셋</Label>
            <Input value="kr" disabled />
          </div>

          {/* 메뉴명 */}
          <div className="space-y-1.5">
            <Label>
              메뉴명 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.MENU_NAME}
              onChange={(e) => updateField('MENU_NAME', e.target.value)}
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
              {(
                [
                  ['BOARD', '게시판(목록)'],
                  ['LINK', '링크'],
                  ['CONTENTS', '콘텐츠'],
                ] as [MenuType, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-1.5 cursor-pointer text-sm"
                  onClick={() => updateField('MENU_TYPE', value)}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center size-4 rounded-full border-2 shrink-0',
                      form.MENU_TYPE === value ? 'border-primary' : 'border-gray-400'
                    )}
                  >
                    {form.MENU_TYPE === value && (
                      <span className="size-2 rounded-full bg-primary" />
                    )}
                  </span>
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* 조건부 필드 */}
          {form.MENU_TYPE === 'BOARD' && (
            <div className="space-y-1.5">
              <Label>
                연결할 게시판 <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                value={form.BOARD_ID}
                onChange={(v) => updateField('BOARD_ID', v)}
                options={boards.map((b) => ({
                  value: b.BOARD_ID,
                  label: b.BOARD_NAME,
                }))}
                placeholder="게시판 이름을 검색하세요."
              />
            </div>
          )}

          {form.MENU_TYPE === 'LINK' && (
            <div className="space-y-1.5">
              <Label>연결할 링크 주소</Label>
              <Input
                value={form.LINK_URL}
                onChange={(e) => updateField('LINK_URL', e.target.value)}
                placeholder="https://"
              />
            </div>
          )}

          {form.MENU_TYPE === 'CONTENTS' && (
            <div className="space-y-1.5">
              <Label>
                연결할 콘텐츠 <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                value={form.CONTENT_ID}
                onChange={(v) => updateField('CONTENT_ID', v)}
                options={contents.map((c) => ({
                  value: c.CONTENTS_ID,
                  label: c.CONTENTS_NAME,
                }))}
                placeholder="콘텐츠 이름을 검색하세요."
              />
            </div>
          )}

          {/* GNB 노출여부 + 메뉴 사용여부 (한 줄) */}
          <div className="flex gap-6">
            <div className="flex-1 space-y-1.5">
              <Label>
                GNB 노출여부 <span className="text-destructive">*</span>
              </Label>
              <ToggleSwitch
                checked={form.GNB_YN === 'Y'}
                onChange={(v) => updateField('GNB_YN', v ? 'Y' : 'N')}
                disabled={form.USE_YN === 'N'}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>
                메뉴 사용여부 <span className="text-destructive">*</span>
              </Label>
              <ToggleSwitch
                checked={form.USE_YN === 'Y'}
                onChange={(v) => updateField('USE_YN', v ? 'Y' : 'N')}
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="dark" onClick={handleSave} disabled={saving}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Mock data (TODO: API 연동 완료 후 제거)
// ---------------------------------------------------------------------------

const MOCK_1DEPTH: Menu[] = [
  {
    MENU_ID: 'M001',
    MENU_CODE: 'HOME',
    MENU_NAME: '홈',
    MENU_TYPE: 'LINK',
    GNB_YN: 'Y',
    USE_YN: 'Y',
    CHILD_COUNT: 3,
  },
  {
    MENU_ID: 'M002',
    MENU_CODE: 'ABOUT',
    MENU_NAME: '학교소개',
    MENU_TYPE: 'CONTENTS',
    GNB_YN: 'Y',
    USE_YN: 'Y',
    CHILD_COUNT: 5,
  },
  {
    MENU_ID: 'M003',
    MENU_CODE: 'ADMISSION',
    MENU_NAME: '입학안내',
    MENU_TYPE: 'BOARD',
    GNB_YN: 'Y',
    USE_YN: 'Y',
    CHILD_COUNT: 4,
  },
  {
    MENU_ID: 'M004',
    MENU_CODE: 'ACADEMICS',
    MENU_NAME: '학사정보',
    MENU_TYPE: 'BOARD',
    GNB_YN: 'Y',
    USE_YN: 'Y',
    CHILD_COUNT: 6,
  },
  {
    MENU_ID: 'M005',
    MENU_CODE: 'COMMUNITY',
    MENU_NAME: '커뮤니티',
    MENU_TYPE: 'BOARD',
    GNB_YN: 'Y',
    USE_YN: 'Y',
    CHILD_COUNT: 3,
  },
  {
    MENU_ID: 'M006',
    MENU_CODE: 'ARCHIVE',
    MENU_NAME: '자료실',
    MENU_TYPE: 'BOARD',
    GNB_YN: 'N',
    USE_YN: 'N',
    CHILD_COUNT: 0,
  },
];

const MOCK_2DEPTH: Record<string, Menu[]> = {
  M001: [
    {
      MENU_ID: 'M101',
      MENU_CODE: 'MAIN_BANNER',
      MENU_NAME: '메인 배너 관리',
      MENU_TYPE: 'CONTENTS',
      PARENT_MENU_ID: 'M001',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M102',
      MENU_CODE: 'POPUP',
      MENU_NAME: '팝업 관리',
      MENU_TYPE: 'CONTENTS',
      PARENT_MENU_ID: 'M001',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M103',
      MENU_CODE: 'QUICK_MENU',
      MENU_NAME: '퀵메뉴',
      MENU_TYPE: 'LINK',
      PARENT_MENU_ID: 'M001',
      GNB_YN: 'N',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
  ],
  M002: [
    {
      MENU_ID: 'M201',
      MENU_CODE: 'GREETING',
      MENU_NAME: '인사말',
      MENU_TYPE: 'CONTENTS',
      PARENT_MENU_ID: 'M002',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M202',
      MENU_CODE: 'HISTORY',
      MENU_NAME: '연혁',
      MENU_TYPE: 'CONTENTS',
      PARENT_MENU_ID: 'M002',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M203',
      MENU_CODE: 'ORGANIZATION',
      MENU_NAME: '조직도',
      MENU_TYPE: 'CONTENTS',
      PARENT_MENU_ID: 'M002',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M204',
      MENU_CODE: 'LOCATION',
      MENU_NAME: '오시는 길',
      MENU_TYPE: 'LINK',
      PARENT_MENU_ID: 'M002',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M205',
      MENU_CODE: 'CI',
      MENU_NAME: 'CI 소개',
      MENU_TYPE: 'CONTENTS',
      PARENT_MENU_ID: 'M002',
      GNB_YN: 'N',
      USE_YN: 'N',
      CHILD_COUNT: 0,
    },
  ],
  M003: [
    {
      MENU_ID: 'M301',
      MENU_CODE: 'GUIDE',
      MENU_NAME: '모집요강',
      MENU_TYPE: 'BOARD',
      PARENT_MENU_ID: 'M003',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M302',
      MENU_CODE: 'SCHEDULE',
      MENU_NAME: '입학일정',
      MENU_TYPE: 'CONTENTS',
      PARENT_MENU_ID: 'M003',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M303',
      MENU_CODE: 'FAQ',
      MENU_NAME: '자주 묻는 질문',
      MENU_TYPE: 'BOARD',
      PARENT_MENU_ID: 'M003',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M304',
      MENU_CODE: 'CONSULT',
      MENU_NAME: '입학상담',
      MENU_TYPE: 'BOARD',
      PARENT_MENU_ID: 'M003',
      GNB_YN: 'N',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
  ],
  M004: [
    {
      MENU_ID: 'M401',
      MENU_CODE: 'CURRICULUM',
      MENU_NAME: '교육과정',
      MENU_TYPE: 'CONTENTS',
      PARENT_MENU_ID: 'M004',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M402',
      MENU_CODE: 'CALENDAR',
      MENU_NAME: '학사일정',
      MENU_TYPE: 'CONTENTS',
      PARENT_MENU_ID: 'M004',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M403',
      MENU_CODE: 'PROFESSOR',
      MENU_NAME: '교수진 소개',
      MENU_TYPE: 'BOARD',
      PARENT_MENU_ID: 'M004',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M404',
      MENU_CODE: 'SCHOLARSHIP',
      MENU_NAME: '장학제도',
      MENU_TYPE: 'CONTENTS',
      PARENT_MENU_ID: 'M004',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M405',
      MENU_CODE: 'REGULATION',
      MENU_NAME: '학칙/규정',
      MENU_TYPE: 'BOARD',
      PARENT_MENU_ID: 'M004',
      GNB_YN: 'N',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M406',
      MENU_CODE: 'FORM_DOWNLOAD',
      MENU_NAME: '서식 다운로드',
      MENU_TYPE: 'BOARD',
      PARENT_MENU_ID: 'M004',
      GNB_YN: 'N',
      USE_YN: 'N',
      CHILD_COUNT: 0,
    },
  ],
  M005: [
    {
      MENU_ID: 'M501',
      MENU_CODE: 'NOTICE',
      MENU_NAME: '공지사항',
      MENU_TYPE: 'BOARD',
      PARENT_MENU_ID: 'M005',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M502',
      MENU_CODE: 'NEWS',
      MENU_NAME: '학교 소식',
      MENU_TYPE: 'BOARD',
      PARENT_MENU_ID: 'M005',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
    {
      MENU_ID: 'M503',
      MENU_CODE: 'GALLERY',
      MENU_NAME: '갤러리',
      MENU_TYPE: 'BOARD',
      PARENT_MENU_ID: 'M005',
      GNB_YN: 'Y',
      USE_YN: 'Y',
      CHILD_COUNT: 0,
    },
  ],
};

const MOCK_BOARDS: Board[] = [
  { BOARD_ID: 'B001', BOARD_NAME: '공지사항' },
  { BOARD_ID: 'B002', BOARD_NAME: '교육/행사' },
  { BOARD_ID: 'B003', BOARD_NAME: '병원뉴스' },
  { BOARD_ID: 'B004', BOARD_NAME: '건강정보' },
  { BOARD_ID: 'B005', BOARD_NAME: '채용공고' },
  { BOARD_ID: 'B006', BOARD_NAME: '자료실' },
];

const MOCK_CONTENTS: Contents[] = [
  { CONTENTS_ID: 'C001', CONTENTS_GRP_ID: 'G01', CONTENTS_NAME: '인사말' },
  { CONTENTS_ID: 'C002', CONTENTS_GRP_ID: 'G01', CONTENTS_NAME: '병원소개' },
  { CONTENTS_ID: 'C003', CONTENTS_GRP_ID: 'G01', CONTENTS_NAME: '연혁' },
  { CONTENTS_ID: 'C004', CONTENTS_GRP_ID: 'G02', CONTENTS_NAME: '진료안내' },
  { CONTENTS_ID: 'C005', CONTENTS_GRP_ID: 'G02', CONTENTS_NAME: '오시는 길' },
];

// ---------------------------------------------------------------------------
// MenuPage (main)
// ---------------------------------------------------------------------------

export default function MenuPage() {
  const [items1, setItems1] = useState<Menu[]>([]);
  const [items2, setItems2] = useState<Menu[]>([]);

  const [selected1, setSelected1] = useState<Menu | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDepth, setDialogDepth] = useState(1);
  const [dialogParentId, setDialogParentId] = useState<string | undefined>();

  // Load 1depth on mount
  const load1depth = useCallback(async () => {
    try {
      const res = await menuApi.list1depth({ SHOWN_ENTITY: 9999 });
      if (res.list && res.list.length > 0) {
        setItems1(res.list);
      } else {
        setItems1(MOCK_1DEPTH);
      }
    } catch {
      setItems1(MOCK_1DEPTH);
    }
  }, []);

  useEffect(() => {
    load1depth();
  }, [load1depth]);

  // Load 2depth when 1depth selected
  const load2depth = useCallback(async (parentId: string) => {
    try {
      const res = await menuApi.list2depth({
        PARENT_MENU_ID: parentId,
        SHOWN_ENTITY: 9999,
      });
      if (res.list && res.list.length > 0) {
        setItems2(res.list);
      } else {
        setItems2(MOCK_2DEPTH[parentId] || []);
      }
    } catch {
      setItems2(MOCK_2DEPTH[parentId] || []);
    }
  }, []);

  const handleSelect1 = (item: Menu) => {
    setSelected1(item);
    load2depth(item.MENU_ID);
  };

  // Save orders
  const handleSaveOrders = async (items: Menu[]) => {
    const list = items.map((m, idx) => ({
      MENU_ID: m.MENU_ID,
      SORT_ORDER: idx + 1,
    }));
    try {
      const res = await menuApi.saveOrders(list);
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('순서가 저장되었습니다.');
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '순서 저장에 실패했습니다.');
      }
    } catch {
      toast.error('순서 저장에 실패했습니다.');
    }
  };

  // Open add dialog for specific depth
  const openAddDialog = (depth: number) => {
    if (depth === 2 && !selected1) {
      toast.error('최상위 메뉴를 먼저 선택해주세요.');
      return;
    }
    setDialogDepth(depth);
    setDialogParentId(depth === 1 ? undefined : selected1?.MENU_ID);
    setDialogOpen(true);
  };

  // Refresh after save
  const handleDialogSaved = () => {
    if (dialogDepth === 1) {
      load1depth();
    } else if (dialogDepth === 2 && selected1) {
      load2depth(selected1.MENU_ID);
    }
  };

  const subMenuTitle = selected1
    ? `${selected1.MENU_NAME} > 하위 메뉴`
    : '하위 메뉴';

  return (
    <div className="p-6 space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">메뉴관리</h1>
      </div>

      {/* Guide text */}
      <div className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3">
        <p className="text-sm text-gray-700">
          각 항목의 아이콘을 드래그 &amp; 드롭 하시면 순서를 변경하실 수 있습니다.
        </p>
      </div>

      {/* 2-column layout */}
      <div className="flex gap-4">
        {/* 최상위 메뉴 */}
        <MenuColumn
          title="최상위 메뉴"
          items={items1}
          selectedId={selected1?.MENU_ID ?? null}
          onSelect={handleSelect1}
          onReorder={setItems1}
          onSaveOrders={() => handleSaveOrders(items1)}
          onAddNew={() => openAddDialog(1)}
        />

        {/* 하위 메뉴 */}
        <MenuColumn
          title={subMenuTitle}
          items={items2}
          selectedId={null}
          onSelect={() => {}}
          onReorder={setItems2}
          onSaveOrders={() => handleSaveOrders(items2)}
          onAddNew={() => openAddDialog(2)}
        />
      </div>

      {/* Add menu dialog */}
      <AddMenuDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        depth={dialogDepth}
        parentMenuId={dialogParentId}
        onSaved={handleDialogSaved}
      />
    </div>
  );
}
