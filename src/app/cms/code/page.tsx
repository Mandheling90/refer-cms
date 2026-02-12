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
import { codeApi } from '@/lib/api/code';
import type { Code } from '@/types/code';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const columns: ColumnDef<Code, unknown>[] = [
  { accessorKey: 'CODE_GROUP', header: '코드 그룹', size: 150 },
  { accessorKey: 'CODE', header: '코드', size: 150 },
  { accessorKey: 'CODE_NAME', header: '코드 이름', size: 200 },
  { accessorKey: 'SORT_ORDER', header: '정렬', size: 60 },
  { accessorKey: 'USE_YN', header: '사용여부', size: 80 },
  { accessorKey: 'INSERT_USER', header: '생성자', size: 100 },
  { accessorKey: 'INSERT_DTTM', header: '생성일시', size: 140 },
];

export default function CodePage() {
  const [data, setData] = useState<Code[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<Code[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchGroup, setSearchGroup] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [formData, setFormData] = useState<Partial<Code>>({});

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { CURRENT_PAGE: page, SHOWN_ENTITY: size };
      if (searchGroup) params.CODE_GROUP = searchGroup;
      if (searchCode) params.CODE = searchCode;
      const res = await codeApi.list(params);
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchGroup, searchCode]);

  const handleSave = async () => {
    if (!formData.CODE_GROUP?.trim() || !formData.CODE?.trim()) {
      toast.error('코드 그룹과 코드는 필수 입력입니다.');
      return;
    }
    try {
      const res = await codeApi.save(formData);
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('저장되었습니다.');
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
      const res = await codeApi.remove(selectedRows);
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('삭제되었습니다.');
        setSelectedRows([]);
        retrieveList();
      }
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setConfirmOpen(false);
  };

  return (
    <>
      <ListPageTemplate
        title="코드 관리"
        searchSection={
          <SearchBar
            fields={[
              { name: 'CODE_GROUP', label: '코드 그룹', value: searchGroup, onChange: setSearchGroup },
              { name: 'CODE', label: '코드', value: searchCode, onChange: setSearchCode },
            ]}
            onSearch={() => { setCurrentPage(1); retrieveList(1, pageSize); }}
          />
        }
        listHeaderActions={
          <ActionButtons
            onDelete={() => {
              if (!selectedRows.length) { toast.error('삭제할 코드를 선택하세요.'); return; }
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
          <CrudForm title="코드 정보 추가/수정" onAdd={() => setFormData({})} onSave={handleSave}>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>코드 그룹 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.CODE_GROUP || ''}
                  onChange={(e) => setFormData({ ...formData, CODE_GROUP: e.target.value })}
                  placeholder="코드 그룹"
                />
              </div>
              <div className="space-y-1.5">
                <Label>코드 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.CODE || ''}
                  onChange={(e) => setFormData({ ...formData, CODE: e.target.value })}
                  placeholder="코드"
                />
              </div>
              <div className="space-y-1.5">
                <Label>코드 이름</Label>
                <Input
                  value={formData.CODE_NAME || ''}
                  onChange={(e) => setFormData({ ...formData, CODE_NAME: e.target.value })}
                  placeholder="코드 이름"
                />
              </div>
              <div className="space-y-1.5">
                <Label>정렬 순서</Label>
                <Input
                  type="number"
                  value={formData.SORT_ORDER || ''}
                  onChange={(e) => setFormData({ ...formData, SORT_ORDER: Number(e.target.value) })}
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
              <div className="space-y-1.5">
                <Label>설명</Label>
                <Input
                  value={formData.DESCRIPTION || ''}
                  onChange={(e) => setFormData({ ...formData, DESCRIPTION: e.target.value })}
                  placeholder="설명"
                />
              </div>
            </div>
          </CrudForm>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="코드 삭제"
        description="선택된 코드를 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
