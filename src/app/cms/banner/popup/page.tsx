'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { Pagination } from '@/components/molecules/Pagination';
import { bannerApi, type Banner } from '@/lib/api/banner';
import { uploadFile } from '@/lib/api/graphql';
import { cn } from '@/lib/utils';
import {
  ArrowUpDown,
  Check,
  CheckSquare,
  GripVertical,
  Pencil,
  Plus,
  RotateCcw,
  Upload,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 12;
const MAX_ACTIVE_COUNT = 12;

const SITE_OPTIONS = [
  { value: 'anam', label: '안암' },
  { value: 'guro', label: '구로' },
  { value: 'ansan', label: '안산' },
] as const;

type SiteCode = (typeof SITE_OPTIONS)[number]['value'];

// ---------------------------------------------------------------------------
// ToggleSwitch (ON/OFF 텍스트 포함)
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
      {checked && (
        <span className="absolute right-2 text-[10px] font-semibold text-gray-700 select-none">
          ON
        </span>
      )}
      {!checked && (
        <span className="absolute left-1.5 text-[10px] font-semibold text-white select-none">
          OFF
        </span>
      )}
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
// LinkTypeToggle (새 창 / 현재 창)
// ---------------------------------------------------------------------------

function LinkTypeToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isNew = value === 'NEW';
  return (
    <button
      type="button"
      className="relative inline-flex h-8 w-[100px] shrink-0 cursor-pointer items-center rounded-full bg-gray-300 transition-colors"
      onClick={() => onChange(isNew ? 'SELF' : 'NEW')}
    >
      <span
        className={cn(
          'absolute z-10 text-[11px] font-medium select-none transition-colors',
          !isNew ? 'left-3 text-white' : 'left-3 text-gray-500'
        )}
      >
        현재 창
      </span>
      <span
        className={cn(
          'absolute z-10 text-[11px] font-medium select-none transition-colors',
          isNew ? 'right-3.5 text-white' : 'right-3.5 text-gray-500'
        )}
      >
        새 창
      </span>
      <span
        className={cn(
          'pointer-events-none absolute h-7 w-[52px] rounded-full bg-gray-800 shadow transition-all',
          isNew ? 'left-[46px]' : 'left-[2px]'
        )}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// BannerCardContent (공통 카드 UI)
// ---------------------------------------------------------------------------

function BannerCardContent({
  banner,
  onEdit,
  onDelete,
  dragHandleProps,
  selectable,
  selected,
  onSelect,
  index,
}: {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleProps?: { attributes: Record<string, any>; listeners: Record<string, any> | undefined };
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  index: number;
}) {
  const isUsed = banner.USE_YN !== 'N';

  const formatPeriod = () => {
    if (banner.ALWAYS_YN === 'Y') return '상시 노출';
    const start = banner.START_DATE || '';
    const end = banner.END_DATE || '';
    if (!start && !end) return '-';
    return { start, end };
  };

  return (
    <>
      {/* 상단: 인덱스 + 체크박스/배지 + 삭제 버튼 */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5">
          {selectable && (
            <Checkbox
              checked={selected}
              onCheckedChange={() => onSelect?.(banner.BANNER_ID)}
              className="mr-1"
            />
          )}
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-900 text-white text-[11px] font-bold shrink-0">
            {index}
          </span>
          {isUsed ? (
            <Badge className="gap-1 bg-white text-green-600 border-green-300 text-xs px-2 py-0.5" variant="outline">
              <Check className="h-3 w-3" />
              사용 중
            </Badge>
          ) : (
            <Badge className="gap-1 bg-white text-red-500 border-red-300 text-xs px-2 py-0.5" variant="outline">
              <X className="h-3 w-3" />
              미사용
            </Badge>
          )}
        </div>
        <button
          className="p-1 text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(banner);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* 이미지 영역 */}
      <div
        className="relative mx-3 aspect-[16/9] bg-gray-200 rounded cursor-pointer group overflow-hidden"
        onClick={() => onEdit(banner)}
      >
        {banner.IMAGE_URL ? (
          <img
            src={banner.IMAGE_URL}
            alt={banner.BANNER_NAME}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
            <Pencil className="h-5 w-5 mb-1" />
            <span>팝업 이미지</span>
            <span>조회 및 수정</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      {/* 하단: 드래그 핸들 + 기간 */}
      <div className="flex items-center px-3 py-2.5 min-h-[52px]">
        {dragHandleProps ? (
          <button
            className="cursor-grab active:cursor-grabbing p-0.5 text-gray-400 hover:text-gray-600 touch-none shrink-0"
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : (
          <div
            className="p-0.5 text-gray-300 shrink-0"
            title={banner.USE_YN === 'N' ? '미사용 팝업은 순서변경이 불가합니다' : ''}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 text-center">
          {(() => {
            const period = formatPeriod();
            if (typeof period === 'string') {
              return <span className="text-xs text-gray-600">{period}</span>;
            }
            return (
              <div className="text-xs text-gray-600 leading-relaxed">
                <div>시작일 : {period.start}</div>
                <div>종료일 : {period.end}</div>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// SortableBannerCard (사용 배너 전용 - DnD 참여)
// ---------------------------------------------------------------------------

function SortableBannerCard({
  banner,
  onEdit,
  onDelete,
  dragDisabled,
  selectable,
  selected,
  onSelect,
  index,
}: {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
  dragDisabled?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.BANNER_ID,
    disabled: dragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col rounded-lg border bg-white overflow-hidden',
        selected ? 'border-primary border-2' : 'border-gray-300',
        isDragging && 'shadow-lg'
      )}
    >
      <BannerCardContent
        banner={banner}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={!dragDisabled ? { attributes, listeners } : undefined}
        selectable={selectable}
        selected={selected}
        onSelect={onSelect}
        index={index}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// StaticBannerCard (미사용 배너 전용 - DnD 미참여)
// ---------------------------------------------------------------------------

function StaticBannerCard({
  banner,
  onEdit,
  onDelete,
  selectable,
  selected,
  onSelect,
  index,
}: {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  index: number;
}) {
  return (
    <div className={cn(
      'flex flex-col rounded-lg border bg-white overflow-hidden',
      selected ? 'border-primary border-2' : 'border-gray-300',
    )}>
      <BannerCardContent
        banner={banner}
        onEdit={onEdit}
        onDelete={onDelete}
        selectable={selectable}
        selected={selected}
        onSelect={onSelect}
        index={index}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AddBannerCard (+ 신규 등록 카드)
// ---------------------------------------------------------------------------

function AddBannerCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-col rounded-lg border border-gray-300 bg-white overflow-hidden">
      {/* 상단: 배지 영역과 높이 맞춤 */}
      <div className="flex items-center px-3 py-2">
        <Badge className="gap-1 text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/30" variant="outline">
          <Plus className="h-3 w-3" />
          신규
        </Badge>
      </div>

      {/* 중앙: 등록 영역 */}
      <div
        className="relative mx-3 aspect-[16/9] bg-gray-100 border-2 border-dashed border-gray-300 rounded cursor-pointer group overflow-hidden hover:border-primary hover:bg-primary/5 transition-colors"
        onClick={onClick}
      >
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 group-hover:bg-primary/10 transition-colors">
            <Plus className="h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
          </div>
          <span className="text-sm font-medium text-gray-500 group-hover:text-primary transition-colors">
            팝업 등록
          </span>
        </div>
      </div>

      {/* 하단: 높이 맞춤 */}
      <div className="px-3 py-2.5 min-h-[52px] flex items-center">
        <span className="text-xs text-gray-400">새로운 팝업을 등록합니다.</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BannerFormDialog (등록/수정 다이얼로그) - 기존 유지
// ---------------------------------------------------------------------------

interface BannerFormData {
  BANNER_ID?: string;
  USE_YN: string;
  LINK_TYPE: string;
  ALWAYS_YN: string;
  START_DATE: string;
  START_TIME: string;
  END_DATE: string;
  END_TIME: string;
  LINK_URL: string;
  IMAGE_URL: string;
  INSERT_DTTM?: string;
  UPDATE_DTTM?: string;
}

const INITIAL_FORM: BannerFormData = {
  USE_YN: 'Y',
  LINK_TYPE: 'NEW',
  ALWAYS_YN: 'N',
  START_DATE: '',
  START_TIME: '',
  END_DATE: '',
  END_TIME: '',
  LINK_URL: '',
  IMAGE_URL: '',
};

function BannerFormDialog({
  open,
  onOpenChange,
  editBanner,
  onSaved,
  activeCount,
  siteCd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editBanner: Banner | null;
  onSaved: () => void;
  activeCount: number;
  siteCd: SiteCode;
}) {
  const [form, setForm] = useState<BannerFormData>(INITIAL_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editBanner) {
      setForm({
        BANNER_ID: editBanner.BANNER_ID,
        USE_YN: editBanner.USE_YN || 'Y',
        LINK_TYPE: editBanner.LINK_TYPE || 'NEW',
        ALWAYS_YN: editBanner.ALWAYS_YN || 'N',
        START_DATE: editBanner.START_DATE || '',
        START_TIME: editBanner.START_TIME || '',
        END_DATE: editBanner.END_DATE || '',
        END_TIME: editBanner.END_TIME || '',
        LINK_URL: editBanner.LINK_URL || '',
        IMAGE_URL: editBanner.IMAGE_URL || '',
        INSERT_DTTM: editBanner.INSERT_DTTM,
        UPDATE_DTTM: editBanner.UPDATE_DTTM,
      });
      setImagePreview(editBanner.IMAGE_URL || null);
      setPendingFile(null);
    } else {
      setForm(INITIAL_FORM);
      setImagePreview(null);
      setPendingFile(null);
    }
  }, [open, editBanner]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.png') && !fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg')) {
      alert('PNG, JPG 확장자 파일만 업로드 가능합니다.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      alert('PNG, JPG 형식만 업로드 가능합니다.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('파일 크기는 2MB 미만이어야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        if (img.width !== 588 || img.height !== 439) {
          alert(`이미지 사이즈가 맞지 않습니다.\n(588x439px 필요, 현재 ${img.width}x${img.height}px)`);
          return;
        }
        setImagePreview(dataUrl);
        setPendingFile(file);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const [errors, setErrors] = useState<{ START_DATE?: boolean; END_DATE?: boolean }>({});

  const handleSave = async () => {
    // 사용중 배너 수 제한 체크
    const isNewActive = form.USE_YN === 'Y';
    const wasAlreadyActive = editBanner?.USE_YN === 'Y';
    if (isNewActive && !wasAlreadyActive && activeCount >= MAX_ACTIVE_COUNT) {
      toast.error(`사용중인 팝업은 최대 ${MAX_ACTIVE_COUNT}개까지 등록 가능합니다.`);
      return;
    }

    if (form.ALWAYS_YN !== 'Y') {
      const newErrors = {
        START_DATE: !form.START_DATE,
        END_DATE: !form.END_DATE,
      };
      if (newErrors.START_DATE || newErrors.END_DATE) {
        setErrors(newErrors);
        return;
      }
    }
    setErrors({});
    setSaving(true);
    try {
      // 새 파일이 선택된 경우 업로드
      let imageUrl = form.IMAGE_URL;
      if (pendingFile) {
        const uploadRes = await uploadFile(pendingFile);
        imageUrl = uploadRes.url;
      }

      const payload: Partial<Banner> = {
        BANNER_TYPE: 'POPUP',
        SITE_CD: siteCd,
        USE_YN: form.USE_YN,
        LINK_TYPE: form.LINK_TYPE,
        ALWAYS_YN: form.ALWAYS_YN,
        START_DATE: form.START_DATE,
        START_TIME: form.START_TIME,
        END_DATE: form.END_DATE,
        END_TIME: form.END_TIME,
        LINK_URL: form.LINK_URL,
        IMAGE_URL: imageUrl,
      };
      if (form.BANNER_ID) {
        payload.BANNER_ID = form.BANNER_ID;
      }
      if (form.USE_YN === 'N') {
        payload.SORT_ORDER = 0;
      }
      const res = await bannerApi.save(payload);
      if (res.success) {
        toast.success(res.message || '저장되었습니다.');
        onOpenChange(false);
        onSaved();
      } else {
        toast.error(res.message || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!form.BANNER_ID;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="default">
        <DialogHeader>
          <DialogTitle>팝업 {isEdit ? '수정' : '등록'}</DialogTitle>
        </DialogHeader>
        <DialogBody className="max-h-[70vh] overflow-y-auto p-0">
          {/* 사용여부 + 연결 방식 */}
          <div className="flex gap-6 px-6 py-5">
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-bold">
                사용여부 <span className="text-destructive">*</span>
              </Label>
              <ToggleSwitch
                checked={form.USE_YN === 'Y'}
                onChange={(v) => setForm((p) => ({ ...p, USE_YN: v ? 'Y' : 'N' }))}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-bold">
                연결 방식 <span className="text-destructive">*</span>
                <span className="text-gray-500 font-normal text-xs ml-1">(현재 창 / 새 창)</span>
              </Label>
              <LinkTypeToggle
                value={form.LINK_TYPE}
                onChange={(v) => setForm((p) => ({ ...p, LINK_TYPE: v }))}
              />
            </div>
          </div>

          <hr className="border-gray-300" />

          {/* 기간 */}
          <div className="px-6 py-5 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold">
                기간 <span className="text-destructive">*</span>
              </Label>
              <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                <Checkbox
                  checked={form.ALWAYS_YN === 'Y'}
                  onCheckedChange={(v) => {
                    setForm((p) => ({ ...p, ALWAYS_YN: v ? 'Y' : 'N' }));
                    if (v) setErrors({});
                  }}
                />
                상시노출
              </label>
            </div>
            {form.ALWAYS_YN !== 'Y' && (
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-1">
                  <Input
                    type="date"
                    value={form.START_DATE}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, START_DATE: e.target.value }));
                      setErrors((p) => ({ ...p, START_DATE: false }));
                    }}
                    placeholder="시작일을 선택해주세요."
                    className={cn(errors.START_DATE && 'border-destructive')}
                  />
                  {errors.START_DATE && (
                    <p className="text-xs text-destructive">시작일시는 필수 입니다.</p>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <Input
                    type="date"
                    value={form.END_DATE}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, END_DATE: e.target.value }));
                      setErrors((p) => ({ ...p, END_DATE: false }));
                    }}
                    placeholder="종료일을 선택해주세요."
                    className={cn(errors.END_DATE && 'border-destructive')}
                  />
                  {errors.END_DATE && (
                    <p className="text-xs text-destructive">종료일시는 필수 입니다.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <hr className="border-gray-300" />

          {/* 팝업 이미지 */}
          <div className="px-6 py-5 space-y-2">
            <Label className="text-sm font-bold">
              팝업 이미지 <span className="text-destructive">*</span>
            </Label>
            <div
              className={cn(
                'flex flex-col items-center justify-center w-full min-h-[180px] border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                dragOver ? 'border-primary bg-primary/5' : 'border-gray-400 hover:border-primary'
              )}
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (!file) return;
                const dt = new DataTransfer();
                dt.items.add(file);
                const synth = { target: { files: dt.files } } as React.ChangeEvent<HTMLInputElement>;
                handleFileChange(synth);
              }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="미리보기"
                    className="max-w-full object-contain rounded-lg my-2"
                  />
                  <p className="text-sm text-gray-700 font-medium">
                    {pendingFile
                      ? `${pendingFile.name} (${pendingFile.size < 1024 * 1024 ? `${(pendingFile.size / 1024).toFixed(0)}KB` : `${(pendingFile.size / (1024 * 1024)).toFixed(1)}MB`})`
                      : form.IMAGE_URL ? decodeURIComponent(form.IMAGE_URL.split('/').pop() || '') : ''}
                  </p>
                  <button
                    type="button"
                    className="mt-2 px-4 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    파일선택
                  </button>
                  <p className="mt-1.5 text-xs text-gray-400">
                    이곳에 파일을 드래그&드롭 하거나 버튼으로 선택하세요
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    {dragOver ? '여기에 파일을 놓으세요.' : '이곳에 파일을 드래그&드롭 하거나 버튼으로 선택하세요.'}
                  </p>
                </>
              )}
            </div>
            <div className="space-y-0.5 text-xs text-gray-500">
              <p>이미지 사이즈: 가로 588px, 세로 439px / 파일 형식: png, jpg</p>
              <p>※ 해상도 588 x 439 고정입니다.</p>
              <p>※ 최대 1개 까지 첨부 가능합니다.</p>
              <p>※ 2MB 미만의 확장자 png, jpg파일만 업로드 가능합니다.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <hr className="border-gray-300" />

          {/* 연결 링크 주소 */}
          <div className="px-6 py-5 space-y-2">
            <Label className="text-sm font-bold">연결 링크 주소</Label>
            <Input
              value={form.LINK_URL}
              onChange={(e) => setForm((p) => ({ ...p, LINK_URL: e.target.value }))}
              placeholder="연결할 링크 주소를 입력해주세요. ex) www.youtube.com"
            />
          </div>

          <hr className="border-gray-300" />

          {/* 등록일 / 수정일 */}
          <div className="flex gap-4 px-6 py-5">
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-bold">최초등록일</Label>
              <Input value={isEdit ? form.INSERT_DTTM || '-' : '-'} readOnly className="bg-gray-100" />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-bold">마지막 수정일</Label>
              <Input value={isEdit ? form.UPDATE_DTTM || '-' : '-'} readOnly className="bg-gray-100" />
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
// PopupBannerPage
// ---------------------------------------------------------------------------

export default function PopupBannerPage() {
  const [allBanners, setAllBanners] = useState<Banner[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);

  // 필터 UI 상태
  const [selectedSite, setSelectedSite] = useState<SiteCode>('anam');
  const [useFilter, setUseFilter] = useState('ALL');

  // 적용된 검색 파라미터
  const [appliedSite, setAppliedSite] = useState<SiteCode>('anam');
  const [appliedUseFilter, setAppliedUseFilter] = useState('ALL');

  // 모드: normal | sort | select
  const [mode, setMode] = useState<'normal' | 'sort' | 'select'>('normal');
  const [sortModeBanners, setSortModeBanners] = useState<Banner[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);

  // 다이얼로그
  const [formOpen, setFormOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  // 파생 데이터
  const filteredBanners = useMemo(() => {
    let result = [...allBanners];
    if (appliedUseFilter === 'USED') result = result.filter((b) => b.USE_YN === 'Y');
    else if (appliedUseFilter === 'UNUSED') result = result.filter((b) => b.USE_YN === 'N');
    return result;
  }, [allBanners, appliedUseFilter]);

  const totalItems = filteredBanners.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activeCount = allBanners.filter((b) => b.USE_YN === 'Y').length;

  const banners = mode === 'sort'
    ? sortModeBanners
    : filteredBanners.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 검색 버튼 클릭
  const handleSearch = () => {
    setAppliedSite(selectedSite);
    setAppliedUseFilter(useFilter);
    setCurrentPage(1);
  };

  // 조건 초기화 버튼 클릭
  const handleReset = () => {
    setSelectedSite('anam');
    setUseFilter('ALL');
    setAppliedSite('anam');
    setAppliedUseFilter('ALL');
    setCurrentPage(1);
  };

  // 데이터 로드
  const loadBanners = useCallback(async () => {
    try {
      const res = await bannerApi.list({
        popupType: 'POPUP',
        hospitalCode: appliedSite,
      });
      setAllBanners(res.list);
    } catch {
      toast.error('데이터를 불러오는데 실패했습니다.');
    }
  }, [appliedSite]);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  // 핸들러
  const handleOpenAdd = () => {
    setEditBanner(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditBanner(banner);
    setFormOpen(true);
  };

  const handleDeleteSingle = async () => {
    if (!deleteTarget) return;
    try {
      const res = await bannerApi.remove([deleteTarget.BANNER_ID]);
      if (res.success) {
        toast.success(res.message || '삭제되었습니다.');
        loadBanners();
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setDeleteTarget(null);
  };

  // --- 순서변경 모드 ---
  const handleEnterSortMode = () => {
    setSortModeBanners(filteredBanners.slice((currentPage - 1) * pageSize, currentPage * pageSize));
    setMode('sort');
  };

  const handleCancelSort = () => {
    setSortModeBanners([]);
    setMode('normal');
  };

  const handleSaveSort = async () => {
    try {
      const orderedIds = sortModeBanners
        .filter((b) => b.USE_YN !== 'N')
        .map((b) => b.BANNER_ID);
      const res = await bannerApi.reorder({
        hospitalCode: appliedSite,
        popupType: 'POPUP',
        orderedIds,
      });
      if (res.success) {
        toast.success(res.message || '순서가 저장되었습니다.');
        loadBanners();
      } else {
        toast.error(res.message || '순서 저장에 실패했습니다.');
      }
    } catch {
      toast.error('순서 저장에 실패했습니다.');
      loadBanners();
    }
    setSortModeBanners([]);
    setMode('normal');
  };

  // --- 배너 선택 모드 ---
  const handleEnterSelectMode = () => {
    setSelectedIds(new Set());
    setMode('select');
  };

  const handleCancelSelect = () => {
    setSelectedIds(new Set());
    setMode('normal');
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    const allIds = banners.map((b) => b.BANNER_ID);
    const allSelected = allIds.every((id) => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(allIds));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      const ids = Array.from(selectedIds);
      const res = await bannerApi.remove(ids);
      if (res.success) {
        toast.success(res.message || '선택한 팝업이 삭제되었습니다.');
        setSelectedIds(new Set());
        setMode('normal');
        loadBanners();
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setDeleteSelectedOpen(false);
  };

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (mode !== 'sort') return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeBanner = sortModeBanners.find((b) => b.BANNER_ID === active.id);
    const overBanner = sortModeBanners.find((b) => b.BANNER_ID === over.id);
    if (activeBanner?.USE_YN === 'N' || overBanner?.USE_YN === 'N') return;

    const oldIndex = sortModeBanners.findIndex((b) => b.BANNER_ID === active.id);
    const newIndex = sortModeBanners.findIndex((b) => b.BANNER_ID === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setSortModeBanners(arrayMove(sortModeBanners, oldIndex, newIndex));
  };

  const isSortMode = mode === 'sort';
  const isSelectMode = mode === 'select';
  const allSelected = banners.length > 0 && banners.every((b) => selectedIds.has(b.BANNER_ID));

  return (
    <div className="p-6 space-y-5">
      {/* 페이지 헤더 */}
      <h1 className="text-2xl font-bold text-gray-900">팝업</h1>

      {/* 검색 필터 영역 */}
      <div className="rounded-lg border border-gray-300 bg-gray-50 p-5 space-y-4">
        {/* 기관 선택 */}
        <div className="flex items-center gap-4">
          <Label className="text-sm font-bold whitespace-nowrap w-[90px]">기관 선택</Label>
          <div className="flex">
            {SITE_OPTIONS.map((site) => (
              <button
                key={site.value}
                type="button"
                onClick={() => setSelectedSite(site.value)}
                className={cn(
                  'px-6 py-2 text-sm font-medium border transition-colors',
                  'first:rounded-l-md last:rounded-r-md',
                  '-ml-px first:ml-0',
                  selectedSite === site.value
                    ? 'bg-gray-900 text-white border-gray-900 relative z-10'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                )}
              >
                {site.label}
              </button>
            ))}
          </div>
        </div>

        {/* 사용여부 선택 */}
        <div className="flex items-center gap-4">
          <Label className="text-sm font-bold whitespace-nowrap w-[90px]">사용여부</Label>
          <Select value={useFilter} onValueChange={setUseFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              <SelectItem value="USED">사용 팝업</SelectItem>
              <SelectItem value="UNUSED">미사용 팝업</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 조건초기화 / 검색 버튼 */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" />
            조건초기화
          </Button>
          <Button variant="dark" size="sm" className="gap-1.5" onClick={handleSearch}>
            <Search className="h-3.5 w-3.5" />
            검색
          </Button>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-3">
        <p className="text-sm text-gray-900">
          <strong className="text-primary">{totalItems}</strong> 건이 조회되었습니다.
        </p>
        {isSortMode && (
          <p className="flex items-center gap-1 text-sm text-gray-500">
            각 항목의 <GripVertical className="inline h-4 w-4 text-gray-400" /> 을 드래그 &amp; 드롭하여 순서를 변경 후
            <strong className="text-gray-700 ml-0.5">순서저장</strong> 버튼을 눌러주세요.
          </p>
        )}
        {isSelectMode && (
          <p className="text-sm text-gray-500">
            삭제할 팝업을 선택 후 <strong className="text-gray-700">선택 삭제</strong> 버튼을 눌러주세요.
          </p>
        )}
      </div>

      {/* 액션 버튼 - 모드별 */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          {mode === 'normal' && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleEnterSortMode}>
                <ArrowUpDown className="h-3.5 w-3.5" />
                순서변경
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleEnterSelectMode}>
                <CheckSquare className="h-3.5 w-3.5" />
                팝업 선택
              </Button>
            </>
          )}
          {mode === 'sort' && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCancelSort}>
                <X className="h-3.5 w-3.5" />
                취소
              </Button>
              <Button variant="dark" size="sm" className="gap-1.5" onClick={handleSaveSort}>
                <Save className="h-3.5 w-3.5" />
                순서저장
              </Button>
            </>
          )}
          {mode === 'select' && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCancelSelect}>
                <X className="h-3.5 w-3.5" />
                선택취소
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleToggleSelectAll}>
                <CheckSquare className="h-3.5 w-3.5" />
                {allSelected ? '선택 해제' : '전체 선택'}
              </Button>
              <Button
                variant="dark"
                size="sm"
                className="gap-1.5"
                disabled={selectedIds.size === 0}
                onClick={() => setDeleteSelectedOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                선택 삭제 ({selectedIds.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 카드 그리드 (DnD 적용) */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={banners.filter((b) => b.USE_YN !== 'N').map((b) => b.BANNER_ID)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-4 gap-4">
            {/* 신규 등록 카드 (1페이지 + normal 모드에서만 표시) */}
            {currentPage === 1 && mode === 'normal' && <AddBannerCard onClick={handleOpenAdd} />}

            {/* 사용 배너 (DnD 참여) */}
            {banners.filter((b) => b.USE_YN !== 'N').map((banner, i) => (
              <SortableBannerCard
                key={banner.BANNER_ID}
                banner={banner}
                onEdit={handleOpenEdit}
                onDelete={(b) => setDeleteTarget(b)}
                dragDisabled={!isSortMode}
                selectable={isSelectMode}
                selected={selectedIds.has(banner.BANNER_ID)}
                onSelect={handleToggleSelect}
                index={(currentPage - 1) * pageSize + i + 1}
              />
            ))}

            {/* 미사용 배너 (DnD 미참여) */}
            {(() => {
              const usedCount = banners.filter((b) => b.USE_YN !== 'N').length;
              return banners.filter((b) => b.USE_YN === 'N').map((banner, i) => (
                <StaticBannerCard
                  key={banner.BANNER_ID}
                  banner={banner}
                  onEdit={handleOpenEdit}
                  onDelete={(b) => setDeleteTarget(b)}
                  selectable={isSelectMode}
                  selected={selectedIds.has(banner.BANNER_ID)}
                  onSelect={handleToggleSelect}
                  index={(currentPage - 1) * pageSize + usedCount + i + 1}
                />
              ));
            })()}
          </div>
        </SortableContext>
      </DndContext>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={() => {}}
          hidePageSize
        />
      )}

      {/* 등록/수정 다이얼로그 */}
      <BannerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editBanner={editBanner}
        onSaved={() => loadBanners()}
        activeCount={activeCount}
        siteCd={appliedSite}
      />

      {/* 개별 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="팝업 삭제"
        description="팝업은 삭제 후 복구할 수 없습니다. 정말 삭제하시겠습니까?"
        onConfirm={handleDeleteSingle}
        confirmLabel="삭제"
        destructive
      />

      {/* 선택 삭제 확인 */}
      <ConfirmDialog
        open={deleteSelectedOpen}
        onOpenChange={setDeleteSelectedOpen}
        title="선택 삭제"
        description={`선택한 ${selectedIds.size}개의 팝업을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.`}
        onConfirm={handleDeleteSelected}
        confirmLabel="삭제"
        destructive
      />
    </div>
  );
}
