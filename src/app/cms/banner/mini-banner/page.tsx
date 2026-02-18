'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { cn } from '@/lib/utils';
import {
  Check,
  GripVertical,
  Minus,
  Pencil,
  Plus,
  Trash2,
  Upload,
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

const PAGE_SIZE = 8;

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
// BannerCard
// ---------------------------------------------------------------------------

function SortableBannerCard({
  banner,
  onEdit,
  onDelete,
}: {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.BANNER_ID,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  const isUsed = banner.USE_YN !== 'N';

  const formatPeriod = () => {
    if (banner.ALWAYS_YN === 'Y') return '상시 노출';
    const start = banner.START_DATE || '';
    const end = banner.END_DATE || '';
    if (!start && !end) return '-';
    return `${start}${banner.START_TIME ? ', ' + banner.START_TIME : ''} ~\n${end}${banner.END_TIME ? ', ' + banner.END_TIME : ''}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col rounded-lg border border-gray-300 bg-white overflow-hidden',
        isDragging && 'shadow-lg'
      )}
    >
      {/* 상단: 사용여부 배지 + 삭제 버튼 */}
      <div className="flex items-center justify-between px-3 py-2">
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
        <button
          className="p-1 text-gray-500 hover:text-red-500 transition-colors"
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
        className="relative mx-3 aspect-square bg-gray-200 rounded cursor-pointer group overflow-hidden"
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
      <div className="flex items-center justify-between px-3 py-2.5">
        <button
          className="cursor-grab active:cursor-grabbing p-0.5 text-gray-400 hover:text-gray-600 touch-none self-center"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs text-gray-600 whitespace-pre-line leading-relaxed text-right">
          {formatPeriod()}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AddBannerCard (+ 신규 등록 카드)
// ---------------------------------------------------------------------------

function AddBannerCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-400 bg-white hover:border-primary hover:bg-gray-100 transition-colors cursor-pointer min-h-[240px]"
      onClick={onClick}
    >
      <Plus className="h-10 w-10 text-gray-400" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// BannerFormDialog (등록/수정 다이얼로그)
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editBanner: Banner | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<BannerFormData>(INITIAL_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
    } else {
      setForm(INITIAL_FORM);
      setImagePreview(null);
    }
  }, [open, editBanner]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('파일 크기는 2MB 이하여야 합니다.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('PNG, JPG 형식만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [errors, setErrors] = useState<{ START_DATE?: boolean; END_DATE?: boolean }>({});

  const handleSave = async () => {
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
      const payload: Partial<Banner> = {
        BANNER_TYPE: 'STRIP',
        USE_YN: form.USE_YN,
        LINK_TYPE: form.LINK_TYPE,
        ALWAYS_YN: form.ALWAYS_YN,
        START_DATE: form.START_DATE,
        START_TIME: form.START_TIME,
        END_DATE: form.END_DATE,
        END_TIME: form.END_TIME,
        LINK_URL: form.LINK_URL,
        IMAGE_URL: form.IMAGE_URL,
      };
      if (form.BANNER_ID) {
        payload.BANNER_ID = form.BANNER_ID;
      }
      const res = await bannerApi.save(payload);
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

  const isEdit = !!form.BANNER_ID;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="default">
        <DialogHeader>
          <DialogTitle>배너 {isEdit ? '수정' : '등록'}</DialogTitle>
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
            <div className="flex gap-5">
              {/* 업로드 영역 (좌) */}
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:border-primary transition-colors w-[150px] h-[150px] shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="미리보기"
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <Plus className="h-8 w-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">이미지 업로드</span>
                  </>
                )}
              </div>
              {/* 안내 텍스트 (우) */}
              <div className="flex flex-col justify-center text-sm text-gray-700 space-y-1">
                <p>이미지 사이즈: 가로 600px, 세로 600px</p>
                <p>파일형식: PNG, JPG</p>
                <p className="mt-2 text-xs text-gray-500">*해상도 600x600 고정입니다.</p>
                <p className="text-xs text-gray-500">*최대 1개 까지 첨부 가능합니다.</p>
                <p className="text-xs text-gray-500">*2MB 미만의 확장자 PNG, JPG 파일만 업로드가 가능합니다.</p>
              </div>
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
// Mock data
// ---------------------------------------------------------------------------

const MOCK_BANNERS: Banner[] = [
  {
    BANNER_ID: 'B001',
    BANNER_NAME: '메인 배너 1',
    BANNER_TYPE: 'STRIP',
    USE_YN: 'Y',
    SORT_ORDER: 1,
    START_DATE: '2025-04-21',
    START_TIME: '09:00',
    END_DATE: '2025-04-25',
    END_TIME: '17:00',
    LINK_URL: 'https://example.com',
    LINK_TYPE: 'NEW',
    ALWAYS_YN: 'N',
    LANG_SET: 'kr',
  },
  {
    BANNER_ID: 'B002',
    BANNER_NAME: '메인 배너 2',
    BANNER_TYPE: 'STRIP',
    USE_YN: 'Y',
    SORT_ORDER: 2,
    START_DATE: '2025-04-21',
    START_TIME: '09:00',
    END_DATE: '2025-04-25',
    END_TIME: '17:00',
    LINK_TYPE: 'SELF',
    ALWAYS_YN: 'N',
    LANG_SET: 'kr',
  },
  {
    BANNER_ID: 'B003',
    BANNER_NAME: '메인 배너 3',
    BANNER_TYPE: 'STRIP',
    USE_YN: 'Y',
    SORT_ORDER: 3,
    START_DATE: '2025-03-21',
    START_TIME: '09:00',
    END_DATE: '2025-03-31',
    END_TIME: '09:00',
    LINK_TYPE: 'NEW',
    ALWAYS_YN: 'N',
    LANG_SET: 'kr',
  },
  {
    BANNER_ID: 'B004',
    BANNER_NAME: '상시 배너',
    BANNER_TYPE: 'STRIP',
    USE_YN: 'Y',
    SORT_ORDER: 4,
    ALWAYS_YN: 'Y',
    LINK_TYPE: 'NEW',
    LANG_SET: 'kr',
  },
  {
    BANNER_ID: 'B005',
    BANNER_NAME: '미사용 배너 1',
    BANNER_TYPE: 'STRIP',
    USE_YN: 'N',
    SORT_ORDER: 5,
    START_DATE: '2025-04-21',
    START_TIME: '09:00',
    END_DATE: '2025-04-22',
    END_TIME: '17:00',
    LINK_TYPE: 'NEW',
    ALWAYS_YN: 'N',
    LANG_SET: 'kr',
  },
  {
    BANNER_ID: 'B006',
    BANNER_NAME: '미사용 배너 2',
    BANNER_TYPE: 'STRIP',
    USE_YN: 'N',
    SORT_ORDER: 6,
    START_DATE: '2025-04-21',
    START_TIME: '09:00',
    END_DATE: '2025-04-25',
    END_TIME: '17:00',
    LINK_TYPE: 'SELF',
    ALWAYS_YN: 'N',
    LANG_SET: 'kr',
  },
  {
    BANNER_ID: 'B007',
    BANNER_NAME: '미사용 배너 3',
    BANNER_TYPE: 'STRIP',
    USE_YN: 'N',
    SORT_ORDER: 7,
    START_DATE: '2025-04-21',
    START_TIME: '09:00',
    END_DATE: '2025-04-25',
    END_TIME: '17:00',
    LINK_TYPE: 'NEW',
    ALWAYS_YN: 'N',
    LANG_SET: 'kr',
  },
  {
    BANNER_ID: 'B008',
    BANNER_NAME: '미사용 배너 4',
    BANNER_TYPE: 'STRIP',
    USE_YN: 'N',
    SORT_ORDER: 8,
    START_DATE: '2025-04-21',
    START_TIME: '09:00',
    END_DATE: '2025-04-25',
    END_TIME: '17:00',
    LINK_TYPE: 'NEW',
    ALWAYS_YN: 'N',
    LANG_SET: 'kr',
  },
];

// ---------------------------------------------------------------------------
// MiniBannerPage
// ---------------------------------------------------------------------------

export default function MiniBannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);

  // 필터
  const [useFilter, setUseFilter] = useState('ALL');

  // 다이얼로그
  const [formOpen, setFormOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  // 데이터 로드
  const loadBanners = useCallback(
    async (page = currentPage) => {
      try {
        const res = await bannerApi.stripList({
          CURRENT_PAGE: page,
          SHOWN_ENTITY: pageSize,
          LANG_SET: 'kr',
          USE_YN: useFilter === 'ALL' ? undefined : useFilter === 'USED' ? 'Y' : 'N',
        });
        if (res.list && res.list.length > 0) {
          setBanners(res.list);
          setTotalItems(res.TOTAL_ENTITY || 0);
        } else {
          // Mock fallback
          let filtered = MOCK_BANNERS;
          if (useFilter === 'USED') filtered = filtered.filter((b) => b.USE_YN === 'Y');
          else if (useFilter === 'UNUSED') filtered = filtered.filter((b) => b.USE_YN === 'N');
          setTotalItems(filtered.length);
          const start = (page - 1) * pageSize;
          setBanners(filtered.slice(start, start + pageSize));
        }
      } catch {
        // Mock fallback
        let filtered = MOCK_BANNERS;
        if (useFilter === 'USED') filtered = filtered.filter((b) => b.USE_YN === 'Y');
        else if (useFilter === 'UNUSED') filtered = filtered.filter((b) => b.USE_YN === 'N');
        setTotalItems(filtered.length);
        const start = (page - 1) * pageSize;
        setBanners(filtered.slice(start, start + pageSize));
      }
    },
    [currentPage, pageSize, useFilter]
  );

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
      const res = await bannerApi.remove([{ BANNER_ID: deleteTarget.BANNER_ID }]);
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('삭제되었습니다.');
        loadBanners();
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setDeleteTarget(null);
  };

  const handleDeleteAll = async () => {
    try {
      const res = await bannerApi.removeAll({ BANNER_TYPE: 'STRIP', LANG_SET: 'kr' });
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('전체 삭제되었습니다.');
        loadBanners();
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setDeleteAllOpen(false);
  };

  // DnD 센서 설정 - 약간의 활성화 거리를 두어 클릭과 드래그를 구분
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = banners.findIndex((b) => b.BANNER_ID === active.id);
    const newIndex = banners.findIndex((b) => b.BANNER_ID === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(banners, oldIndex, newIndex);
    setBanners(reordered);

    // 서버에 순서 저장
    try {
      const orderList = reordered.map((b, i) => ({
        BANNER_ID: b.BANNER_ID,
        SORT_ORDER: i + 1,
      }));
      const res = await bannerApi.saveOrders(orderList);
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('순서가 저장되었습니다.');
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '순서 저장에 실패했습니다.');
        loadBanners(); // 실패 시 원래 순서로 복원
      }
    } catch {
      toast.error('순서 저장에 실패했습니다.');
      loadBanners();
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div className="p-6 space-y-5">
      {/* 페이지 헤더 */}
      <h1 className="text-2xl font-bold text-gray-900">미니배너</h1>

      {/* 검색 결과 */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-3">
        <p className="text-sm text-gray-900">
          <strong className="text-primary">{totalItems}</strong> 건이 조회되었습니다.
        </p>
        <p className="flex items-center gap-1 text-sm text-gray-500">
          각 항목의 <GripVertical className="inline h-4 w-4 text-gray-400" /> 을 드래그 &amp; 드롭하시면 순서를 변경하실 수 있습니다.
        </p>
      </div>

      {/* 사용여부 선택 */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium whitespace-nowrap">사용여부 선택</Label>
        <Select value={useFilter} onValueChange={setUseFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            <SelectItem value="USED">사용 배너</SelectItem>
            <SelectItem value="UNUSED">미사용 배너</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleOpenAdd}>
            <Plus className="h-3.5 w-3.5" />
            팝업등록
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setDeleteAllOpen(true)}
          >
            <Minus className="h-3.5 w-3.5" />
            팝업 전체 삭제
          </Button>
        </div>
      </div>

      {/* 카드 그리드 (DnD 적용) */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={banners.map((b) => b.BANNER_ID)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-4 gap-4">
            {/* 신규 등록 카드 (드래그 대상 아님) */}
            <AddBannerCard onClick={handleOpenAdd} />

            {/* 배너 카드 목록 */}
            {banners.map((banner) => (
              <SortableBannerCard
                key={banner.BANNER_ID}
                banner={banner}
                onEdit={handleOpenEdit}
                onDelete={(b) => setDeleteTarget(b)}
              />
            ))}
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
          onPageChange={(page) => {
            setCurrentPage(page);
            loadBanners(page);
          }}
          onPageSizeChange={() => {}}
        />
      )}

      {/* 등록/수정 다이얼로그 */}
      <BannerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editBanner={editBanner}
        onSaved={() => loadBanners()}
      />

      {/* 개별 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="배너 삭제"
        description="팝업은 삭제 후 복구할 수 없습니다. 정말 삭제하시겠습니까?"
        onConfirm={handleDeleteSingle}
        confirmLabel="삭제"
        destructive
      />

      {/* 전체 삭제 확인 */}
      <ConfirmDialog
        open={deleteAllOpen}
        onOpenChange={setDeleteAllOpen}
        title="전체 삭제"
        description="팝업은 삭제 후 복구할 수 없습니다. 정말 삭제하시겠습니까?"
        onConfirm={handleDeleteAll}
        confirmLabel="삭제"
        destructive
      />
    </div>
  );
}
