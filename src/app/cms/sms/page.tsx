'use client';

import { useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { SearchBar } from '@/components/molecules/SearchBar';
import apiClient from '@/lib/api/client';
import type { AuditFields, ListResponse } from '@/types/api';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

interface SmsRecord extends AuditFields {
  SMS_ID: string;
  SEND_PHONE: string;
  RECV_PHONE: string;
  MESSAGE: string;
  SEND_STATUS: string;
  SEND_DTTM: string;
}

const columns: ColumnDef<SmsRecord, unknown>[] = [
  { accessorKey: 'SMS_ID', header: 'ID', size: 80 },
  { accessorKey: 'SEND_PHONE', header: '발신번호', size: 140 },
  { accessorKey: 'RECV_PHONE', header: '수신번호', size: 140 },
  { accessorKey: 'MESSAGE', header: '메시지', size: 300 },
  { accessorKey: 'SEND_STATUS', header: '발송상태', size: 100 },
  { accessorKey: 'SEND_DTTM', header: '발송일시', size: 160 },
];

export default function SmsPage() {
  const [data, setData] = useState<SmsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchPhone, setSearchPhone] = useState('');

  const retrieveList = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { CURRENT_PAGE: page, SHOWN_ENTITY: size };
      if (searchPhone) params.RECV_PHONE = searchPhone;
      const res = await apiClient.get<ListResponse<SmsRecord>>('/sms/list.ajax', params);
      setData(res.list || []);
      setTotalItems(res.TOTAL_ENTITY || 0);
    } catch {
      toast.error('목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchPhone]);

  return (
    <ListPageTemplate
      title="SMS 관리"
      searchSection={
        <SearchBar
          fields={[
            { name: 'RECV_PHONE', label: '수신번호', value: searchPhone, onChange: setSearchPhone },
          ]}
          onSearch={() => { setCurrentPage(1); retrieveList(1, pageSize); }}
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
          onPageChange={(page) => { setCurrentPage(page); retrieveList(page, pageSize); }}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); retrieveList(1, size); }}
        />
      }
    />
  );
}
