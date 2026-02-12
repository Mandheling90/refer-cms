'use client';

import { useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { CrudForm } from '@/components/organisms/CrudForm';
import { ActionButtons } from '@/components/molecules/ActionButtons';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bannerApi, type Banner } from '@/lib/api/banner';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const columns: ColumnDef<Banner, unknown>[] = [
  { accessorKey: 'BANNER_ID', header: '배너 ID', size: 100 },
  { accessorKey: 'BANNER_NAME', header: '배너 이름', size: 200 },
  { accessorKey: 'LINK_URL', header: '링크 URL', size: 250 },
  { accessorKey: 'USE_YN', header: '사용여부', size: 80 },
  { accessorKey: 'SORT_ORDER', header: '정렬', size: 60 },
  { accessorKey: 'START_DATE', header: '시작일', size: 120 },
  { accessorKey: 'END_DATE', header: '종료일', size: 120 },
];

export default function PopupBannerPage() {
  const [data, setData] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<Banner[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Banner>>({ BANNER_TYPE: 'POPUP' });

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const res = await bannerApi.popupList({ CURRENT_PAGE: page, SHOWN_ENTITY: size });
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  const handleSave = async () => {
    if (!formData.BANNER_NAME?.trim()) {
      toast.error('배너 이름은 필수 입력입니다.');
      return;
    }
    try {
      const res = await bannerApi.save({ ...formData, BANNER_TYPE: 'POPUP' });
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('저장되었습니다.');
        setFormData({ BANNER_TYPE: 'POPUP' });
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
      const res = await bannerApi.remove(selectedRows);
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
        title="팝업 배너 관리"
        listHeaderActions={
          <ActionButtons
            onDelete={() => {
              if (!selectedRows.length) { toast.error('삭제할 배너를 선택하세요.'); return; }
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
          <CrudForm title="팝업 배너 정보 추가/수정" onAdd={() => setFormData({ BANNER_TYPE: 'POPUP' })} onSave={handleSave}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>배너 ID</Label>
                <Input value={formData.BANNER_ID || ''} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label>배너 이름 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.BANNER_NAME || ''}
                  onChange={(e) => setFormData({ ...formData, BANNER_NAME: e.target.value })}
                  placeholder="배너 이름"
                />
              </div>
              <div className="space-y-1.5">
                <Label>링크 URL</Label>
                <Input
                  value={formData.LINK_URL || ''}
                  onChange={(e) => setFormData({ ...formData, LINK_URL: e.target.value })}
                  placeholder="https://"
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
                <Label>시작일</Label>
                <Input
                  type="date"
                  value={formData.START_DATE || ''}
                  onChange={(e) => setFormData({ ...formData, START_DATE: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>종료일</Label>
                <Input
                  type="date"
                  value={formData.END_DATE || ''}
                  onChange={(e) => setFormData({ ...formData, END_DATE: e.target.value })}
                />
              </div>
            </div>
          </CrudForm>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="배너 삭제"
        description="선택된 배너를 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
