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
import { codeGroupApi } from '@/lib/api/code';
import type { CodeGroup } from '@/types/code';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const columns: ColumnDef<CodeGroup, unknown>[] = [
  { accessorKey: 'CODE_GROUP', header: '코드 그룹', size: 200 },
  { accessorKey: 'CODE_GROUP_NAME', header: '그룹 이름', size: 250 },
  { accessorKey: 'USE_YN', header: '사용여부', size: 80 },
  { accessorKey: 'INSERT_USER', header: '생성자', size: 100 },
  { accessorKey: 'INSERT_DTTM', header: '생성일시', size: 140 },
  { accessorKey: 'UPDATE_USER', header: '수정자', size: 100 },
  { accessorKey: 'UPDATE_DTTM', header: '수정일시', size: 140 },
];

export default function CodeGroupPage() {
  const [data, setData] = useState<CodeGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<CodeGroup[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchGroup, setSearchGroup] = useState('');
  const [formData, setFormData] = useState<Partial<CodeGroup>>({});

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { CURRENT_PAGE: page, SHOWN_ENTITY: size };
      if (searchGroup) params.CODE_GROUP = searchGroup;
      const res = await codeGroupApi.list(params);
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchGroup]);

  const handleSave = async () => {
    if (!formData.CODE_GROUP?.trim()) {
      toast.error('코드 그룹은 필수 입력입니다.');
      return;
    }
    try {
      const res = await codeGroupApi.save(formData);
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
      const res = await codeGroupApi.remove(selectedRows);
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
        title="코드 그룹 관리"
        searchSection={
          <SearchBar
            fields={[
              { name: 'CODE_GROUP', label: '코드 그룹', value: searchGroup, onChange: setSearchGroup },
            ]}
            onSearch={() => { setCurrentPage(1); retrieveList(1, pageSize); }}
          />
        }
        listHeaderActions={
          <ActionButtons
            onDelete={() => {
              if (!selectedRows.length) { toast.error('삭제할 코드 그룹을 선택하세요.'); return; }
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
          <CrudForm title="코드 그룹 추가/수정" onAdd={() => setFormData({})} onSave={handleSave}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>코드 그룹 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.CODE_GROUP || ''}
                  onChange={(e) => setFormData({ ...formData, CODE_GROUP: e.target.value })}
                  placeholder="코드 그룹"
                />
              </div>
              <div className="space-y-1.5">
                <Label>그룹 이름</Label>
                <Input
                  value={formData.CODE_GROUP_NAME || ''}
                  onChange={(e) => setFormData({ ...formData, CODE_GROUP_NAME: e.target.value })}
                  placeholder="그룹 이름"
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
        title="코드 그룹 삭제"
        description="선택된 코드 그룹을 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
