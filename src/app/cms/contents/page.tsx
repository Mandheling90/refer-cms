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
import { contentsApi, type Contents } from '@/lib/api/contents';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const columns: ColumnDef<Contents, unknown>[] = [
  { accessorKey: 'CONTENTS_ID', header: '콘텐츠 ID', size: 100 },
  { accessorKey: 'CONTENTS_GRP_ID', header: '그룹 ID', size: 100 },
  { accessorKey: 'CONTENTS_NAME', header: '콘텐츠 이름', size: 200 },
  { accessorKey: 'CONTENTS_TYPE', header: '유형', size: 100 },
  { accessorKey: 'USE_YN', header: '사용여부', size: 80 },
  { accessorKey: 'INSERT_USER', header: '생성자', size: 100 },
  { accessorKey: 'INSERT_DTTM', header: '생성일시', size: 140 },
];

export default function ContentsPage() {
  const [data, setData] = useState<Contents[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<Contents[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [formData, setFormData] = useState<Partial<Contents>>({});

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { CURRENT_PAGE: page, SHOWN_ENTITY: size };
      if (searchName) params.CONTENTS_NAME = searchName;
      const res = await contentsApi.list(params);
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchName]);

  const handleSave = async () => {
    if (!formData.CONTENTS_NAME?.trim()) {
      toast.error('콘텐츠 이름은 필수 입력입니다.');
      return;
    }
    try {
      const res = await contentsApi.save(formData);
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
      const res = await contentsApi.remove(selectedRows);
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
        title="콘텐츠 관리"
        searchSection={
          <SearchBar
            fields={[
              { name: 'CONTENTS_NAME', label: '콘텐츠 이름', value: searchName, onChange: setSearchName },
            ]}
            onSearch={() => { setCurrentPage(1); retrieveList(1, pageSize); }}
          />
        }
        listHeaderActions={
          <ActionButtons
            onDelete={() => {
              if (!selectedRows.length) { toast.error('삭제할 콘텐츠를 선택하세요.'); return; }
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
          <CrudForm title="콘텐츠 정보 추가/수정" onAdd={() => setFormData({})} onSave={handleSave}>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>콘텐츠 ID</Label>
                <Input value={formData.CONTENTS_ID || ''} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label>그룹 ID</Label>
                <Input
                  value={formData.CONTENTS_GRP_ID || ''}
                  onChange={(e) => setFormData({ ...formData, CONTENTS_GRP_ID: e.target.value })}
                  placeholder="그룹 ID"
                />
              </div>
              <div className="space-y-1.5">
                <Label>콘텐츠 이름 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.CONTENTS_NAME || ''}
                  onChange={(e) => setFormData({ ...formData, CONTENTS_NAME: e.target.value })}
                  placeholder="콘텐츠 이름"
                />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label>콘텐츠 본문</Label>
              <Textarea
                value={formData.CONTENTS_BODY || ''}
                onChange={(e) => setFormData({ ...formData, CONTENTS_BODY: e.target.value })}
                placeholder="콘텐츠 본문"
                rows={6}
              />
            </div>
          </CrudForm>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="콘텐츠 삭제"
        description="선택된 콘텐츠를 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
