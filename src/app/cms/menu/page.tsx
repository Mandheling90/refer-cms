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
import { menuApi } from '@/lib/api/menu';
import type { Menu } from '@/types/menu';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const columns: ColumnDef<Menu, unknown>[] = [
  { accessorKey: 'MENU_CODE', header: '메뉴 코드', size: 200 },
  { accessorKey: 'MENU_NAME', header: '메뉴 이름', size: 200 },
  { accessorKey: 'MENU_TYPE', header: '메뉴 유형', size: 120, meta: { align: 'center' } },
  { accessorKey: 'INSERT_USER', header: '생성자', size: 100, meta: { align: 'center' } },
  { accessorKey: 'INSERT_DTTM', header: '생성일시', size: 140, meta: { align: 'center' } },
  { accessorKey: 'UPDATE_USER', header: '수정자', size: 100, meta: { align: 'center' } },
  { accessorKey: 'UPDATE_DTTM', header: '수정일시', size: 140, meta: { align: 'center' } },
];

export default function MenuPage() {
  const [data, setData] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<Menu[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Search fields
  const [searchMenuCode, setSearchMenuCode] = useState('');
  const [searchMenuName, setSearchMenuName] = useState('');
  const [searchMenuType, setSearchMenuType] = useState('');

  // Form fields
  const [formData, setFormData] = useState<Partial<Menu>>({});

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        CURRENT_PAGE: page,
        SHOWN_ENTITY: size,
      };
      if (searchMenuCode) params.MENU_CODE = searchMenuCode;
      if (searchMenuName) params.MENU_NAME = searchMenuName;
      if (searchMenuType) params.MENU_TYPE = searchMenuType;

      const res = await menuApi.list(params);
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchMenuCode, searchMenuName, searchMenuType]);

  const handleSave = async () => {
    if (!formData.MENU_CODE?.trim()) {
      toast.error('메뉴 코드는 필수 입력입니다.');
      return;
    }
    if (!formData.MENU_NAME?.trim()) {
      toast.error('메뉴 이름은 필수 입력입니다.');
      return;
    }
    try {
      const res = await menuApi.save(formData);
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
      const res = await menuApi.remove(selectedRows);
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
        title="메뉴 관리"
        searchSection={
          <SearchBar
            fields={[
              { name: 'MENU_CODE', label: '메뉴 코드', value: searchMenuCode, onChange: setSearchMenuCode },
              { name: 'MENU_NAME', label: '메뉴 이름', value: searchMenuName, onChange: setSearchMenuName },
              { name: 'MENU_TYPE', label: '메뉴 유형', value: searchMenuType, onChange: setSearchMenuType },
            ]}
            onSearch={() => { setCurrentPage(1); retrieveList(1, pageSize); }}
          />
        }
        listHeaderActions={
          <ActionButtons
            onDelete={() => {
              if (!selectedRows.length) {
                toast.error('삭제할 메뉴를 선택하세요.');
                return;
              }
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
          <CrudForm
            title="메뉴 정보 추가/수정"
            onAdd={() => setFormData({})}
            onSave={handleSave}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>메뉴 ID</Label>
                <Input value={formData.MENU_ID || ''} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label>메뉴 유형</Label>
                <Input
                  value={formData.MENU_TYPE || ''}
                  onChange={(e) => setFormData({ ...formData, MENU_TYPE: e.target.value })}
                  placeholder="메뉴 유형"
                />
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
            </div>
          </CrudForm>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="메뉴 삭제"
        description="선택된 메뉴를 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
