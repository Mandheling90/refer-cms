'use client';

import { useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { CrudForm } from '@/components/organisms/CrudForm';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/lib/api/client';
import type { AuditFields, ApiResponse, ListResponse } from '@/types/api';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

interface Scheduler extends AuditFields {
  SCHEDULER_ID: string;
  SCHEDULER_NAME: string;
  CRON_EXPRESSION: string;
  USE_YN: string;
  DESCRIPTION: string;
  LAST_EXECUTE_DTTM: string;
}

const columns: ColumnDef<Scheduler, unknown>[] = [
  { accessorKey: 'SCHEDULER_ID', header: 'ID', size: 80 },
  { accessorKey: 'SCHEDULER_NAME', header: '스케줄러 이름', size: 200 },
  { accessorKey: 'CRON_EXPRESSION', header: 'Cron 표현식', size: 150 },
  { accessorKey: 'USE_YN', header: '사용여부', size: 80 },
  { accessorKey: 'LAST_EXECUTE_DTTM', header: '최종 실행일시', size: 160 },
  { accessorKey: 'DESCRIPTION', header: '설명', size: 200 },
];

export default function SchedulerPage() {
  const [data, setData] = useState<Scheduler[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [formData, setFormData] = useState<Partial<Scheduler>>({});

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const res = await apiClient.get<ListResponse<Scheduler>>('/scheduler/list.ajax', { CURRENT_PAGE: page, SHOWN_ENTITY: size });
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  const handleSave = async () => {
    if (!formData.SCHEDULER_NAME?.trim()) {
      toast.error('스케줄러 이름은 필수 입력입니다.');
      return;
    }
    try {
      const res = await apiClient.post<ApiResponse>('/scheduler/save.ajax', formData as Record<string, unknown>);
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
      title="스케줄러 관리"
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
        <CrudForm title="스케줄러 정보 추가/수정" onAdd={() => setFormData({})} onSave={handleSave}>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>스케줄러 ID</Label>
              <Input value={formData.SCHEDULER_ID || ''} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>스케줄러 이름 <span className="text-destructive">*</span></Label>
              <Input
                value={formData.SCHEDULER_NAME || ''}
                onChange={(e) => setFormData({ ...formData, SCHEDULER_NAME: e.target.value })}
                placeholder="스케줄러 이름"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cron 표현식</Label>
              <Input
                value={formData.CRON_EXPRESSION || ''}
                onChange={(e) => setFormData({ ...formData, CRON_EXPRESSION: e.target.value })}
                placeholder="0 0 * * * ?"
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
            <div className="space-y-1.5 col-span-2">
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
  );
}
