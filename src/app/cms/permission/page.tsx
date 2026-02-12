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
import { permissionApi } from '@/lib/api/permission';
import type { Permission } from '@/types/permission';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const columns: ColumnDef<Permission, unknown>[] = [
  { accessorKey: 'PERMISSION_CODE', header: '권한 코드', size: 200 },
  { accessorKey: 'PERMISSION_NAME', header: '권한 이름', size: 200 },
  { accessorKey: 'PERMISSION_LEVEL', header: '권한 레벨', size: 120 },
  { accessorKey: 'DESCRIPTION', header: '설명', size: 250 },
  { accessorKey: 'INSERT_USER', header: '생성자', size: 100 },
  { accessorKey: 'INSERT_DTTM', header: '생성일시', size: 140 },
];

export default function PermissionPage() {
  const [data, setData] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<Permission[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');

  const [formData, setFormData] = useState<Partial<Permission>>({});

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        CURRENT_PAGE: page,
        SHOWN_ENTITY: size,
      };
      if (searchCode) params.PERMISSION_CODE = searchCode;
      if (searchName) params.PERMISSION_NAME = searchName;

      const res = await permissionApi.list(params);
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchCode, searchName]);

  const handleSave = async () => {
    if (!formData.PERMISSION_CODE?.trim()) {
      toast.error('권한 코드는 필수 입력입니다.');
      return;
    }
    if (!formData.PERMISSION_NAME?.trim()) {
      toast.error('권한 이름은 필수 입력입니다.');
      return;
    }
    try {
      const res = await permissionApi.save(formData);
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
      const res = await permissionApi.remove(selectedRows);
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    retrieveList(page, pageSize);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    retrieveList(1, size);
  };

  return (
    <>
      <ListPageTemplate
        title="권한 그룹 설정"
        searchSection={
          <SearchBar
            fields={[
              { name: 'PERMISSION_CODE', label: '권한 코드', value: searchCode, onChange: setSearchCode },
              { name: 'PERMISSION_NAME', label: '권한 이름', value: searchName, onChange: setSearchName },
            ]}
            onSearch={() => { setCurrentPage(1); retrieveList(1, pageSize); }}
          />
        }
        listHeaderActions={
          <ActionButtons
            onDelete={() => {
              if (!selectedRows.length) { toast.error('삭제할 권한을 선택하세요.'); return; }
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
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onRowClick={(row) => setFormData(row)}
            onSelectionChange={setSelectedRows}
          />
        }
        formSection={
          <CrudForm title="권한 정보 추가/수정" onAdd={() => setFormData({})} onSave={handleSave}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>권한 ID</Label>
                <Input value={formData.PERMISSION_ID || ''} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label>권한 레벨</Label>
                <Input
                  value={formData.PERMISSION_LEVEL || ''}
                  onChange={(e) => setFormData({ ...formData, PERMISSION_LEVEL: e.target.value })}
                  placeholder="권한 레벨"
                />
              </div>
              <div className="space-y-1.5">
                <Label>권한 코드 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.PERMISSION_CODE || ''}
                  onChange={(e) => setFormData({ ...formData, PERMISSION_CODE: e.target.value })}
                  placeholder="권한 코드"
                />
              </div>
              <div className="space-y-1.5">
                <Label>권한 이름 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.PERMISSION_NAME || ''}
                  onChange={(e) => setFormData({ ...formData, PERMISSION_NAME: e.target.value })}
                  placeholder="권한 이름"
                />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label>설명</Label>
              <Input
                value={formData.DESCRIPTION || ''}
                onChange={(e) => setFormData({ ...formData, DESCRIPTION: e.target.value })}
                placeholder="설명"
              />
            </div>
          </CrudForm>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="권한 삭제"
        description="선택된 권한을 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
