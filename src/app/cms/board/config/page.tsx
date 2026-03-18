'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { SearchBar } from '@/components/molecules/SearchBar';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ADMIN_BOARD_SETTINGS_FULL,
  CREATE_BOARD_SETTING,
  UPDATE_BOARD_SETTING,
  DELETE_BOARD_SETTING,
} from '@/lib/graphql/queries/board';
import { usePagePermission } from '@/components/molecules/PermissionGuard';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';
import { Plus, Trash2 } from 'lucide-react';

// ── 타입 ──
interface BoardSetting {
  id: string;
  boardId: string;
  name: string;
  templateType: 'BASIC' | 'THUMBNAIL';
  allowAttachments: boolean;
  description: string | null;
  hospitalCode: string;
  createdAt: string;
  updatedAt: string;
}

// ── 날짜 포맷 ──
function formatDateTime(iso: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── 게시판 타입 옵션 ──
const BOARD_TYPE_OPTIONS = [
  { value: 'BASIC', label: '기본형' },
  { value: 'THUMBNAIL', label: '썸네일형' },
] as const;

// ── 컬럼 정의 ──
const columns: ColumnDef<BoardSetting, unknown>[] = [
  {
    accessorKey: 'ROW_NUM',
    header: '번호',
    size: 70,
    cell: ({ row }) => row.index + 1,
  },
  { accessorKey: 'boardId', header: '아이디', size: 140 },
  {
    accessorKey: 'templateType',
    header: '타입',
    size: 100,
    cell: ({ getValue }) => {
      const val = getValue() as string;
      return BOARD_TYPE_OPTIONS.find((o) => o.value === val)?.label || val || '-';
    },
  },
  { accessorKey: 'name', header: '게시판명', size: 200 },
  {
    accessorKey: 'allowAttachments',
    header: '첨부파일',
    size: 90,
    cell: ({ getValue }) => (
      <StatusBadge
        status={(getValue() as boolean) ? 'Y' : 'N'}
        activeLabel="허용"
        inactiveLabel="미허용"
      />
    ),
  },
  {
    accessorKey: 'createdAt',
    header: '등록일시',
    size: 160,
    cell: ({ getValue }) => formatDateTime(getValue() as string),
  },
];

// ── 폼 타입 ──
interface FormData {
  name: string;
  templateType: string;
  allowAttachments: boolean;
  description: string;
}

const INITIAL_FORM: FormData = {
  name: '',
  templateType: 'BASIC',
  allowAttachments: false,
  description: '',
};

export default function BoardConfigPage() {
  // ── 리스트 상태 ──
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<BoardSetting[]>([]);

  // ── 검색 상태 ──
  const [searchBoardName, setSearchBoardName] = useState('');

  // ── 다이얼로그 상태 ──
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── 권한 ──
  const { canEdit } = usePagePermission();

  // ── 인증 정보 ──
  const hospitalCode = useAuthStore((s) => s.getEffectiveHospitalCode());

  // ── GraphQL ──
  const { data, loading, refetch } = useQuery<{
    adminBoardSettings: BoardSetting[];
  }>(ADMIN_BOARD_SETTINGS_FULL, {
    variables: { hospitalCode: hospitalCode || undefined },
  });

  const [createSetting] = useMutation(CREATE_BOARD_SETTING);
  const [updateSetting] = useMutation(UPDATE_BOARD_SETTING);
  const [deleteSetting] = useMutation(DELETE_BOARD_SETTING);

  // ── 데이터 필터링 + 페이징 ──
  const allSettings = data?.adminBoardSettings ?? [];

  const filteredData = useMemo(() => {
    let items = [...allSettings];
    if (searchBoardName) {
      items = items.filter((i) => i.name.includes(searchBoardName));
    }
    return items;
  }, [allSettings, searchBoardName]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // ── 검색 ──
  const handleSearch = () => {
    setCurrentPage(1);
  };

  // ── 검색 초기화 ──
  const handleReset = () => {
    setSearchBoardName('');
    setCurrentPage(1);
  };

  // ── 신규 등록 다이얼로그 ──
  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingId('');
    setFormData(INITIAL_FORM);
    setDialogOpen(true);
  };

  // ── 수정 다이얼로그 (행 클릭) ──
  const handleRowClick = (row: BoardSetting) => {
    setIsEditMode(true);
    setEditingId(row.id);
    setFormData({
      name: row.name,
      templateType: row.templateType,
      allowAttachments: row.allowAttachments,
      description: row.description || '',
    });
    setDialogOpen(true);
  };

  // ── 저장 ──
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('게시판명은 필수 입력입니다.');
      return;
    }
    if (!formData.templateType) {
      toast.error('게시판 타입을 선택해 주세요.');
      return;
    }

    try {
      if (isEditMode) {
        await updateSetting({
          variables: {
            id: editingId,
            input: {
              name: formData.name.trim(),
              templateType: formData.templateType,
              allowAttachments: formData.allowAttachments,
              description: formData.description || undefined,
            },
          },
        });
      } else {
        await createSetting({
          variables: {
            input: {
              hospitalCode: hospitalCode?.toUpperCase(),
              name: formData.name.trim(),
              templateType: formData.templateType,
              allowAttachments: formData.allowAttachments,
              description: formData.description || undefined,
            },
          },
        });
      }
      toast.success('저장되었습니다.');
      setDialogOpen(false);
      setFormData(INITIAL_FORM);
      refetch();
    } catch {
      toast.error('저장에 실패했습니다.');
    }
  };

  // ── 선택 삭제 ──
  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedRows.map((row) =>
          deleteSetting({ variables: { id: row.id } }),
        ),
      );
      toast.success('삭제되었습니다.');
      setSelectedRows([]);
      setCurrentPage(1);
      refetch();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setConfirmOpen(false);
  };

  return (
    <ListPageTemplate
      title="게시판 설정"
      totalItems={totalItems}
      onSearch={handleSearch}
      onReset={handleReset}
      listHeaderActions={
        <>
          <Button
            variant="outline-red"
            size="md"
            onClick={() => setConfirmOpen(true)}
            disabled={!canEdit || selectedRows.length === 0}
          >
            <Trash2 className="h-4 w-4" />
            선택한 항목 삭제
          </Button>
          <Button size="md" onClick={handleOpenCreate} disabled={!canEdit}>
            <Plus className="h-4 w-4" />
            신규 등록
          </Button>
        </>
      }
      searchSection={
        <SearchBar
          fields={[
            {
              name: 'name',
              label: '게시판명',
              value: searchBoardName,
              onChange: setSearchBoardName,
            },
          ]}
          onSearch={handleSearch}
        />
      }
      listContent={
        <DataTable
          columns={columns}
          data={pagedData}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          enableSelection
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          onRowClick={handleRowClick}
          onSelectionChange={setSelectedRows}
        />
      }
    >
      {/* 등록/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent size="md" className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? '게시판 설정 수정' : '게시판 설정 등록'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-5 overflow-y-auto flex-1">
            {/* 게시판명 */}
            <div className="space-y-1.5">
              <Label>
                게시판명 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="게시판명을 입력해 주세요"
              />
            </div>

            {/* 게시판 타입 */}
            <div className="space-y-1.5">
              <Label>
                게시판 타입 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.templateType}
                onValueChange={(val) =>
                  setFormData({ ...formData, templateType: val })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {BOARD_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 첨부파일 사용여부 */}
            <div className="space-y-1.5">
              <Label>첨부파일 사용여부</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.allowAttachments}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allowAttachments: checked })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {formData.allowAttachments ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* 게시판 설명 */}
            <div className="space-y-1.5">
              <Label>게시판 설명</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 300) {
                    setFormData({ ...formData, description: e.target.value });
                  }
                }}
                placeholder="게시판 설명을 입력해 주세요 (300자 이내)"
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.description.length} / 300
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" size="md" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button size="md" onClick={handleSave} disabled={!canEdit}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 팝업 */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="게시판 삭제"
        description={`선택한 ${selectedRows.length}개 항목을 삭제하시겠습니까? 삭제 후 복구가 불가능합니다.`}
        onConfirm={handleDelete}
        destructive
      />
    </ListPageTemplate>
  );
}
