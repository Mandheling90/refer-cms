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
import { roleApi } from '@/lib/api/role';
import type { Role } from '@/types/role';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const columns: ColumnDef<Role, unknown>[] = [
  { accessorKey: 'ROLE_CODE', header: '역할 코드', size: 200 },
  { accessorKey: 'ROLE_NAME', header: '역할 이름', size: 200 },
  { accessorKey: 'ROLE_TYPE', header: '역할 유형', size: 200 },
  { accessorKey: 'INSERT_USER', header: '생성자', size: 100 },
  { accessorKey: 'INSERT_DTTM', header: '생성일시', size: 140 },
  { accessorKey: 'UPDATE_USER', header: '수정자', size: 100 },
  { accessorKey: 'UPDATE_DTTM', header: '수정일시', size: 140 },
];

export default function RolePage() {
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<Role[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [searchRoleCode, setSearchRoleCode] = useState('');
  const [searchRoleName, setSearchRoleName] = useState('');
  const [searchRoleType, setSearchRoleType] = useState('');

  const [formData, setFormData] = useState<Partial<Role>>({});

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        CURRENT_PAGE: page,
        SHOWN_ENTITY: size,
      };
      if (searchRoleCode) params.ROLE_CODE = searchRoleCode;
      if (searchRoleName) params.ROLE_NAME = searchRoleName;
      if (searchRoleType) params.ROLE_TYPE = searchRoleType;

      const res = await roleApi.list(params);
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchRoleCode, searchRoleName, searchRoleType]);

  const handleSave = async () => {
    if (!formData.ROLE_CODE?.trim()) {
      toast.error('역할 코드는 필수 입력입니다.');
      return;
    }
    if (!formData.ROLE_NAME?.trim()) {
      toast.error('역할 이름은 필수 입력입니다.');
      return;
    }
    try {
      const res = await roleApi.save(formData);
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
      const res = await roleApi.remove(selectedRows);
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success(res.ServiceResult.MESSAGE_TEXT || '삭제되었습니다.');
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
        title="역할 관리"
        searchSection={
          <SearchBar
            fields={[
              { name: 'ROLE_CODE', label: '역할 코드', value: searchRoleCode, onChange: setSearchRoleCode },
              { name: 'ROLE_NAME', label: '역할 이름', value: searchRoleName, onChange: setSearchRoleName },
              { name: 'ROLE_TYPE', label: '역할 유형', value: searchRoleType, onChange: setSearchRoleType },
            ]}
            onSearch={() => { setCurrentPage(1); retrieveList(1, pageSize); }}
          />
        }
        listHeaderActions={
          <ActionButtons
            onDelete={() => {
              if (!selectedRows.length) { toast.error('삭제할 역할을 선택하세요.'); return; }
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
            onRowClick={(row) => setFormData({ ...row, ROLE_CODE_BF: row.ROLE_CODE })}
            onSelectionChange={setSelectedRows}
          />
        }
        formSection={
          <CrudForm title="역할 정보 추가/수정" onAdd={() => setFormData({})} onSave={handleSave}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>역할 ID</Label>
                <Input value={formData.ROLE_ID || ''} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label>역할 유형</Label>
                <Input
                  value={formData.ROLE_TYPE || ''}
                  onChange={(e) => setFormData({ ...formData, ROLE_TYPE: e.target.value })}
                  placeholder="역할 유형"
                />
              </div>
              <div className="space-y-1.5">
                <Label>역할 코드 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.ROLE_CODE || ''}
                  onChange={(e) => setFormData({ ...formData, ROLE_CODE: e.target.value })}
                  placeholder="역할 코드"
                />
              </div>
              <div className="space-y-1.5">
                <Label>역할 이름 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.ROLE_NAME || ''}
                  onChange={(e) => setFormData({ ...formData, ROLE_NAME: e.target.value })}
                  placeholder="역할 이름"
                />
              </div>
            </div>
          </CrudForm>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="역할 삭제"
        description="선택된 역할을 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
