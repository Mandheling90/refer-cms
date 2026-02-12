'use client';

import { useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { CrudForm } from '@/components/organisms/CrudForm';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { boardApi } from '@/lib/api/board';
import type { Board } from '@/types/board';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const columns: ColumnDef<Board, unknown>[] = [
  { accessorKey: 'BOARD_ID', header: '게시판 ID', size: 100 },
  { accessorKey: 'BOARD_NAME', header: '게시판 이름', size: 200 },
  { accessorKey: 'BOARD_TYPE', header: '유형', size: 100 },
  { accessorKey: 'USE_YN', header: '사용여부', size: 80 },
  { accessorKey: 'FILE_ATTACH_YN', header: '파일첨부', size: 80 },
  { accessorKey: 'REPLY_YN', header: '답글허용', size: 80 },
  { accessorKey: 'INSERT_DTTM', header: '생성일시', size: 140 },
];

export default function BoardConfigPage() {
  const [data, setData] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [formData, setFormData] = useState<Partial<Board>>({});

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const res = await boardApi.configList({ CURRENT_PAGE: page, SHOWN_ENTITY: size });
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  const handleSave = async () => {
    if (!formData.BOARD_NAME?.trim()) {
      toast.error('게시판 이름은 필수 입력입니다.');
      return;
    }
    try {
      const res = await boardApi.configSave(formData);
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

  return (
    <ListPageTemplate
      title="게시판 설정"
      listContent={
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={Math.ceil(totalItems / pageSize) || 1}
          onPageChange={(page) => { setCurrentPage(page); retrieveList(page, pageSize); }}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); retrieveList(1, size); }}
          onRowClick={(row) => setFormData(row)}
        />
      }
      formSection={
        <CrudForm title="게시판 설정 추가/수정" onAdd={() => setFormData({})} onSave={handleSave}>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>게시판 ID</Label>
              <Input value={formData.BOARD_ID || ''} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>게시판 이름 <span className="text-destructive">*</span></Label>
              <Input
                value={formData.BOARD_NAME || ''}
                onChange={(e) => setFormData({ ...formData, BOARD_NAME: e.target.value })}
                placeholder="게시판 이름"
              />
            </div>
            <div className="space-y-1.5">
              <Label>게시판 유형</Label>
              <Input
                value={formData.BOARD_TYPE || ''}
                onChange={(e) => setFormData({ ...formData, BOARD_TYPE: e.target.value })}
                placeholder="유형"
              />
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.USE_YN === 'Y'}
                onCheckedChange={(checked) => setFormData({ ...formData, USE_YN: checked ? 'Y' : 'N' })}
              />
              <Label>사용</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.FILE_ATTACH_YN === 'Y'}
                onCheckedChange={(checked) => setFormData({ ...formData, FILE_ATTACH_YN: checked ? 'Y' : 'N' })}
              />
              <Label>파일첨부</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.REPLY_YN === 'Y'}
                onCheckedChange={(checked) => setFormData({ ...formData, REPLY_YN: checked ? 'Y' : 'N' })}
              />
              <Label>답글허용</Label>
            </div>
          </div>
        </CrudForm>
      }
    />
  );
}
