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
import apiClient from '@/lib/api/client';
import type { AuditFields, ApiResponse, ListResponse } from '@/types/api';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

interface SystemMenu extends AuditFields {
  MENU_ID: string;
  MENU_CODE: string;
  MENU_NAME: string;
  MENU_PID: string;
  PROG_PATH: string;
  SORT_ORDER: number;
  USE_YN: string;
}

const columns: ColumnDef<SystemMenu, unknown>[] = [
  { accessorKey: 'MENU_ID', header: '메뉴 ID', size: 80 },
  { accessorKey: 'MENU_CODE', header: '메뉴 코드', size: 150 },
  { accessorKey: 'MENU_NAME', header: '메뉴 이름', size: 200 },
  { accessorKey: 'MENU_PID', header: '상위 메뉴', size: 80 },
  { accessorKey: 'PROG_PATH', header: '프로그램 경로', size: 250 },
  { accessorKey: 'SORT_ORDER', header: '정렬', size: 60 },
  { accessorKey: 'USE_YN', header: '사용여부', size: 80 },
];

export default function SystemMenuPage() {
  const [data, setData] = useState<SystemMenu[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<SystemMenu[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [formData, setFormData] = useState<Partial<SystemMenu>>({});

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { CURRENT_PAGE: page, SHOWN_ENTITY: size };
      if (searchName) params.MENU_NAME = searchName;
      const res = await apiClient.get<ListResponse<SystemMenu>>('/systemMenu/list.ajax', params);
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchName]);

  const handleSave = async () => {
    if (!formData.MENU_CODE?.trim() || !formData.MENU_NAME?.trim()) {
      toast.error('메뉴 코드와 이름은 필수 입력입니다.');
      return;
    }
    try {
      const res = await apiClient.post<ApiResponse>('/systemMenu/save.ajax', formData as Record<string, unknown>);
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
      const res = await apiClient.post<ApiResponse>('/systemMenu/remove.ajax', { LIST: JSON.stringify(selectedRows) });
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
        title="시스템 메뉴 관리"
        searchSection={
          <SearchBar
            fields={[
              { name: 'MENU_NAME', label: '메뉴 이름', value: searchName, onChange: setSearchName },
            ]}
            onSearch={() => { setCurrentPage(1); retrieveList(1, pageSize); }}
          />
        }
        listHeaderActions={
          <ActionButtons
            onDelete={() => {
              if (!selectedRows.length) { toast.error('삭제할 메뉴를 선택하세요.'); return; }
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
          <CrudForm title="시스템 메뉴 추가/수정" onAdd={() => setFormData({})} onSave={handleSave}>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>메뉴 ID</Label>
                <Input value={formData.MENU_ID || ''} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label>메뉴 코드 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.MENU_CODE || ''}
                  onChange={(e) => setFormData({ ...formData, MENU_CODE: e.target.value })}
                  placeholder="메뉴 코드"
                />
              </div>
              <div className="space-y-1.5">
                <Label>메뉴 이름 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.MENU_NAME || ''}
                  onChange={(e) => setFormData({ ...formData, MENU_NAME: e.target.value })}
                  placeholder="메뉴 이름"
                />
              </div>
              <div className="space-y-1.5">
                <Label>상위 메뉴 ID</Label>
                <Input
                  value={formData.MENU_PID || ''}
                  onChange={(e) => setFormData({ ...formData, MENU_PID: e.target.value })}
                  placeholder="상위 메뉴 ID"
                />
              </div>
              <div className="space-y-1.5">
                <Label>프로그램 경로</Label>
                <Input
                  value={formData.PROG_PATH || ''}
                  onChange={(e) => setFormData({ ...formData, PROG_PATH: e.target.value })}
                  placeholder="프로그램 경로"
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
            </div>
          </CrudForm>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="시스템 메뉴 삭제"
        description="선택된 메뉴를 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
