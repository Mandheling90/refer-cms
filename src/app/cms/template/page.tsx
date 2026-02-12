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
import apiClient from '@/lib/api/client';
import type { AuditFields, ApiResponse, ListResponse } from '@/types/api';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

interface Template extends AuditFields {
  TEMPLATE_ID: string;
  TEMPLATE_NAME: string;
  TEMPLATE_TYPE: string;
  TEMPLATE_BODY: string;
  USE_YN: string;
}

const columns: ColumnDef<Template, unknown>[] = [
  { accessorKey: 'TEMPLATE_ID', header: '템플릿 ID', size: 100 },
  { accessorKey: 'TEMPLATE_NAME', header: '템플릿 이름', size: 200 },
  { accessorKey: 'TEMPLATE_TYPE', header: '유형', size: 120 },
  { accessorKey: 'USE_YN', header: '사용여부', size: 80 },
  { accessorKey: 'INSERT_USER', header: '생성자', size: 100 },
  { accessorKey: 'INSERT_DTTM', header: '생성일시', size: 140 },
  { accessorKey: 'UPDATE_DTTM', header: '수정일시', size: 140 },
];

export default function TemplatePage() {
  const [data, setData] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<Template[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [formData, setFormData] = useState<Partial<Template>>({});

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { CURRENT_PAGE: page, SHOWN_ENTITY: size };
      if (searchName) params.TEMPLATE_NAME = searchName;
      const res = await apiClient.get<ListResponse<Template>>('/template/list.ajax', params);
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchName]);

  const handleSave = async () => {
    if (!formData.TEMPLATE_NAME?.trim()) {
      toast.error('템플릿 이름은 필수 입력입니다.');
      return;
    }
    try {
      const res = await apiClient.post<ApiResponse>('/template/save.ajax', formData as Record<string, unknown>);
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
      const res = await apiClient.post<ApiResponse>('/template/remove.ajax', { LIST: JSON.stringify(selectedRows) });
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
        title="템플릿 관리"
        searchSection={
          <SearchBar
            fields={[
              { name: 'TEMPLATE_NAME', label: '템플릿 이름', value: searchName, onChange: setSearchName },
            ]}
            onSearch={() => { setCurrentPage(1); retrieveList(1, pageSize); }}
          />
        }
        listHeaderActions={
          <ActionButtons
            onDelete={() => {
              if (!selectedRows.length) { toast.error('삭제할 템플릿을 선택하세요.'); return; }
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
          <CrudForm title="템플릿 정보 추가/수정" onAdd={() => setFormData({})} onSave={handleSave}>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>템플릿 ID</Label>
                <Input value={formData.TEMPLATE_ID || ''} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label>템플릿 이름 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.TEMPLATE_NAME || ''}
                  onChange={(e) => setFormData({ ...formData, TEMPLATE_NAME: e.target.value })}
                  placeholder="템플릿 이름"
                />
              </div>
              <div className="space-y-1.5">
                <Label>유형</Label>
                <Input
                  value={formData.TEMPLATE_TYPE || ''}
                  onChange={(e) => setFormData({ ...formData, TEMPLATE_TYPE: e.target.value })}
                  placeholder="유형"
                />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label>템플릿 본문</Label>
              <Textarea
                value={formData.TEMPLATE_BODY || ''}
                onChange={(e) => setFormData({ ...formData, TEMPLATE_BODY: e.target.value })}
                placeholder="템플릿 본문"
                rows={8}
              />
            </div>
          </CrudForm>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="템플릿 삭제"
        description="선택된 템플릿을 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
