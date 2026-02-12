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
import { userApi } from '@/lib/api/user';
import type { User } from '@/types/user';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const columns: ColumnDef<User, unknown>[] = [
  { accessorKey: 'USER_ID', header: 'Login ID', size: 150 },
  { accessorKey: 'USER_TYPE', header: '사용자 유형', size: 120 },
  { accessorKey: 'DESCRIPTION', header: '계정 설명', size: 250 },
  { accessorKey: 'INSERT_USER', header: '생성자', size: 100 },
  { accessorKey: 'INSERT_DTTM', header: '생성일시', size: 140 },
  { accessorKey: 'UPDATE_USER', header: '수정자', size: 100 },
  { accessorKey: 'UPDATE_DTTM', header: '수정일시', size: 140 },
];

export default function UserPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<User[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [searchUserType, setSearchUserType] = useState('');

  const [formData, setFormData] = useState<Partial<User>>({});

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        CURRENT_PAGE: page,
        SHOWN_ENTITY: size,
      };
      if (searchUserType) params.USER_TYPE = searchUserType;

      const res = await userApi.list(params);
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchUserType]);

  const handleSave = async () => {
    if (!formData.USER_ID?.trim()) {
      toast.error('로그인 아이디는 필수 입력입니다.');
      return;
    }
    try {
      const res = await userApi.save(formData);
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
      const res = await userApi.remove(selectedRows);
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
        title="사용자 관리"
        searchSection={
          <SearchBar
            fields={[
              { name: 'USER_TYPE', label: '사용자 유형', value: searchUserType, onChange: setSearchUserType },
            ]}
            onSearch={() => { setCurrentPage(1); retrieveList(1, pageSize); }}
          />
        }
        listHeaderActions={
          <ActionButtons
            onDelete={() => {
              if (!selectedRows.length) { toast.error('삭제할 사용자를 선택하세요.'); return; }
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
            onRowClick={(row) => setFormData({ ...row, PASSWORD: '' })}
            onSelectionChange={setSelectedRows}
          />
        }
        formSection={
          <CrudForm title="사용자 정보 추가/수정" onAdd={() => setFormData({})} onSave={handleSave}>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Login ID <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.USER_ID || ''}
                  onChange={(e) => setFormData({ ...formData, USER_ID: e.target.value })}
                  placeholder="Login ID"
                />
              </div>
              <div className="space-y-1.5">
                <Label>사용자 유형</Label>
                <Input
                  value={formData.USER_TYPE || ''}
                  onChange={(e) => setFormData({ ...formData, USER_TYPE: e.target.value })}
                  placeholder="사용자 유형"
                />
              </div>
              <div className="space-y-1.5">
                <Label>비밀번호</Label>
                <Input
                  type="password"
                  value={formData.PASSWORD || ''}
                  onChange={(e) => setFormData({ ...formData, PASSWORD: e.target.value })}
                  placeholder="비밀번호"
                />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label>계정 설명</Label>
              <Textarea
                value={formData.DESCRIPTION || ''}
                onChange={(e) => setFormData({ ...formData, DESCRIPTION: e.target.value })}
                placeholder="계정 설명"
                rows={3}
              />
            </div>
          </CrudForm>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="사용자 삭제"
        description="선택된 사용자 정보를 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
