'use client';

import { useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { CrudForm } from '@/components/organisms/CrudForm';
import { SearchBar } from '@/components/molecules/SearchBar';
import { ActionButtons } from '@/components/molecules/ActionButtons';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { boardApi } from '@/lib/api/board';
import type { Board } from '@/types/board';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const columns: ColumnDef<Board, unknown>[] = [
  { accessorKey: 'BOARD_ID', header: '게시판 ID', size: 100 },
  { accessorKey: 'BOARD_NAME', header: '게시판 이름', size: 200 },
  { accessorKey: 'BOARD_TYPE', header: '게시판 유형', size: 120 },
  { accessorKey: 'USE_YN', header: '사용여부', size: 80 },
  { accessorKey: 'INSERT_USER', header: '생성자', size: 100 },
  { accessorKey: 'INSERT_DTTM', header: '생성일시', size: 140 },
  { accessorKey: 'UPDATE_USER', header: '수정자', size: 100 },
  { accessorKey: 'UPDATE_DTTM', header: '수정일시', size: 140 },
];

export default function BoardPage() {
  const [data, setData] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<Board[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [formData, setFormData] = useState<Partial<Board>>({});

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { CURRENT_PAGE: page, SHOWN_ENTITY: size };
      if (searchName) params.BOARD_NAME = searchName;
      const res = await boardApi.list(params);
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchName]);

  const handleSave = async () => {
    if (!formData.BOARD_NAME?.trim()) {
      toast.error('게시판 이름은 필수 입력입니다.');
      return;
    }
    try {
      const res = await boardApi.save(formData);
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success(res.ServiceResult.MESSAGE_TEXT || '저장되었습니다.');
        setFormData({});
        retrieveList();
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('저장에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    try {
      const res = await boardApi.remove(selectedRows);
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('삭제되었습니다.');
        setSelectedRows([]);
        retrieveList();
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setConfirmOpen(false);
  };

  return (
    <>
      <ListPageTemplate
        title="게시판 관리"
        searchSection={
          <SearchBar
            fields={[
              { name: 'BOARD_NAME', label: '게시판 이름', value: searchName, onChange: setSearchName },
            ]}
            onSearch={() => { setCurrentPage(1); retrieveList(1, pageSize); }}
          />
        }
        listHeaderActions={
          <ActionButtons
            onDelete={() => {
              if (!selectedRows.length) { toast.error('삭제할 게시판을 선택하세요.'); return; }
              setConfirmOpen(true);
            }}
            showAdd={false}
            showSave={false}
          />
        }
        listContent={
          <DataTable
            columns={columns}
            data={data}
            loading={loading}
            totalItems={totalItems}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={Math.ceil(totalItems / pageSize) || 1}
            enableSelection
            onPageChange={(page) => { setCurrentPage(page); retrieveList(page, pageSize); }}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); retrieveList(1, size); }}
            onRowClick={(row) => setFormData(row)}
            onSelectionChange={setSelectedRows}
          />
        }
        formSection={
          <CrudForm title="게시판 정보 추가/수정" onAdd={() => setFormData({})} onSave={handleSave}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>게시판 ID</Label>
                <Input value={formData.BOARD_ID || ''} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label>게시판 유형</Label>
                <Input
                  value={formData.BOARD_TYPE || ''}
                  onChange={(e) => setFormData({ ...formData, BOARD_TYPE: e.target.value })}
                  placeholder="게시판 유형"
                />
              </div>
              <div className="space-y-1.5">
                <Label>게시판 이름 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.BOARD_NAME || ''}
                  onChange={(e) => setFormData({ ...formData, BOARD_NAME: e.target.value })}
                  placeholder="게시판 이름"
                />
              </div>
              <div className="space-y-1.5">
                <Label>사용여부</Label>
                <Input
                  value={formData.USE_YN || ''}
                  onChange={(e) => setFormData({ ...formData, USE_YN: e.target.value })}
                  placeholder="Y/N"
                />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label>설명</Label>
              <Textarea
                value={formData.BOARD_DESC || ''}
                onChange={(e) => setFormData({ ...formData, BOARD_DESC: e.target.value })}
                placeholder="게시판 설명"
                rows={3}
              />
            </div>
          </CrudForm>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="게시판 삭제"
        description="선택된 게시판을 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
