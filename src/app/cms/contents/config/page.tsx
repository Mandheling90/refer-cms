'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { SearchBar } from '@/components/molecules/SearchBar';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ADMIN_CONTENT_GROUPS,
  CREATE_CONTENT_GROUP,
  UPDATE_CONTENT_GROUP,
  DELETE_CONTENT_GROUP,
} from '@/lib/graphql/queries/content';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { Plus, Trash2 } from 'lucide-react';

// ── 타입 ──
interface ContentGroup {
  id: string;
  hospitalCode: string;
  name: string;
  sortOrder: number;
  contentCount: number;
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

// ── 컬럼 정의 ──
const columns: ColumnDef<ContentGroup, unknown>[] = [
  {
    accessorKey: 'ROW_NUM',
    header: '번호',
    size: 70,
    cell: ({ row }) => row.index + 1,
  },
  { accessorKey: 'id', header: '아이디', size: 200 },
  { accessorKey: 'name', header: '콘텐츠(그룹)명', size: 240 },
  { accessorKey: 'sortOrder', header: '정렬순서', size: 100 },
  {
    accessorKey: 'contentCount',
    header: '콘텐츠 수',
    size: 100,
    cell: ({ getValue }) => `${getValue()}건`,
  },
  {
    accessorKey: 'createdAt',
    header: '등록일시',
    size: 180,
    cell: ({ getValue }) => formatDateTime(getValue() as string),
  },
];

export default function ContentsConfigPage() {
  // ── 리스트 상태 ──
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<ContentGroup[]>([]);

  // ── 검색 상태 ──
  const [searchName, setSearchName] = useState('');

  // ── 다이얼로그 상태 ──
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [formName, setFormName] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── GraphQL ──
  const { data: queryData, loading, refetch } = useQuery<{
    adminContentGroups: ContentGroup[];
  }>(ADMIN_CONTENT_GROUPS);

  const [createGroup] = useMutation(CREATE_CONTENT_GROUP);
  const [updateGroup] = useMutation(UPDATE_CONTENT_GROUP);
  const [deleteGroup] = useMutation(DELETE_CONTENT_GROUP);

  // ── 클라이언트 필터링 + 페이징 ──
  const allItems = queryData?.adminContentGroups ?? [];

  const filtered = useMemo(() => {
    let items = allItems;
    if (searchName) {
      items = items.filter((i) => i.name.includes(searchName));
    }
    return items;
  }, [allItems, searchName]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // ── 검색 ──
  const handleSearch = () => setCurrentPage(1);

  const handleReset = () => {
    setSearchName('');
    setCurrentPage(1);
  };

  // ── 신규 등록 다이얼로그 ──
  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingId('');
    setFormName('');
    setFormSortOrder(allItems.length + 1);
    setDialogOpen(true);
  };

  // ── 수정 다이얼로그 (행 클릭) ──
  const handleRowClick = (row: ContentGroup) => {
    setIsEditMode(true);
    setEditingId(row.id);
    setFormName(row.name);
    setFormSortOrder(row.sortOrder);
    setDialogOpen(true);
  };

  // ── 저장 ──
  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('콘텐츠(그룹) 명은 필수 입력입니다.');
      return;
    }
    try {
      if (isEditMode) {
        await updateGroup({
          variables: {
            id: editingId,
            input: { name: formName.trim(), sortOrder: formSortOrder },
          },
        });
      } else {
        await createGroup({
          variables: {
            input: { name: formName.trim(), sortOrder: formSortOrder },
          },
        });
      }
      toast.success('저장되었습니다.');
      setDialogOpen(false);
      refetch();
    } catch {
      toast.error('저장에 실패했습니다.');
    }
  };

  // ── 선택 삭제 ──
  const handleDelete = async () => {
    const hasContents = selectedRows.filter((row) => row.contentCount > 0);
    if (hasContents.length > 0) {
      const names = hasContents.map((r) => r.name).join(', ');
      toast.error(`하위 콘텐츠가 존재하는 그룹은 삭제할 수 없습니다. (${names})`);
      setConfirmOpen(false);
      return;
    }
    try {
      await Promise.all(
        selectedRows.map((row) =>
          deleteGroup({ variables: { id: row.id } }),
        ),
      );
      toast.success('삭제되었습니다.');
      setSelectedRows([]);
      refetch();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setConfirmOpen(false);
  };

  return (
    <ListPageTemplate
      title="콘텐츠 설정"
      totalItems={totalItems}
      onSearch={handleSearch}
      onReset={handleReset}
      listHeaderActions={
        <>
          <Button
            variant="outline-red"
            size="md"
            onClick={() => setConfirmOpen(true)}
            disabled={selectedRows.length === 0}
          >
            <Trash2 className="h-4 w-4" />
            선택한 항목 삭제
          </Button>
          <Button size="md" onClick={handleOpenCreate}>
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
              label: '콘텐츠(그룹) 명',
              value: searchName,
              onChange: setSearchName,
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
              {isEditMode
                ? '콘텐츠(그룹) 설정 수정'
                : '콘텐츠(그룹) 설정 등록'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-5 overflow-y-auto flex-1">
            {/* 아이디 (수정 시만 표시) */}
            {isEditMode && (
              <div className="space-y-1.5">
                <Label>콘텐츠(그룹) 아이디</Label>
                <Input
                  value={editingId}
                  readOnly
                  className="bg-gray-200 text-muted-foreground"
                />
              </div>
            )}

            {/* 콘텐츠(그룹) 명 */}
            <div className="space-y-1.5">
              <Label>
                콘텐츠(그룹) 명{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formName}
                onChange={(e) => {
                  if (e.target.value.length <= 20) setFormName(e.target.value);
                }}
                placeholder="20자 이내로 입력해 주세요"
                maxLength={20}
              />
            </div>

            {/* 정렬순서 */}
            <div className="space-y-1.5">
              <Label>정렬순서</Label>
              <Input
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(Number(e.target.value))}
                min={0}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" size="md" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button size="md" onClick={handleSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 팝업 */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="콘텐츠 그룹 삭제"
        description={`선택한 ${selectedRows.length}개 항목을 삭제하시겠습니까? 삭제 시 콘텐츠 관리의 해당 그룹도 함께 삭제됩니다.`}
        onConfirm={handleDelete}
        destructive
      />
    </ListPageTemplate>
  );
}
