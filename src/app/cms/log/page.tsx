'use client';

import { useCallback, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { toast } from 'sonner';

import { DataTable } from '@/components/organisms/DataTable';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { GET_ADMIN_AUDIT_LOGS, GET_ADMIN_AUDIT_LOG_BY_ID } from '@/lib/graphql/queries/log';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { useEnums } from '@/hooks/use-enums';
import type { LogItem, LogListResponse, LogDetail, LogDetailResponse } from '@/types/log';

/* ─── 날짜 포맷 ─── */
const formatDateTime = (val?: string | null) => {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd}, ${HH}:${mm}:${ss}`;
};

/* ─── 검색 필드 그룹 ─── */
function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

/* ─── 상세 팝업 읽기전용 필드 ─── */
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <Input value={value} disabled />
    </div>
  );
}

/* ═══════════════════════════════════════
   로그내역 페이지
   ═══════════════════════════════════════ */
export default function LogPage() {
  const { labelOf, optionsOf } = useEnums();

  /* ─── 페이징 상태 ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 조건 (입력 중) ─── */
  const [searchAdminNumber, setSearchAdminNumber] = useState('');
  const [searchAdminName, setSearchAdminName] = useState('');
  const [searchHospital, setSearchHospital] = useState('');
  const [searchTarget, setSearchTarget] = useState('');

  /* ─── 실제 적용된 필터 ─── */
  const [appliedFilter, setAppliedFilter] = useState<Record<string, string | undefined>>({});

  /* ─── GraphQL 목록 조회 ─── */
  const buildFilterVars = (filter: Record<string, string | undefined>) => {
    const vars: Record<string, string | undefined> = {};
    if (filter.adminNumber) vars.adminNumber = filter.adminNumber;
    if (filter.adminName) vars.adminName = filter.adminName;
    if (filter.logName) vars.logName = filter.logName;
    return vars;
  };

  const { data, loading, refetch } = useQuery<LogListResponse>(GET_ADMIN_AUDIT_LOGS, {
    variables: {
      filter: buildFilterVars(appliedFilter),
      pagination: {
        page: currentPage,
        limit: pageSize,
      },
    },
    fetchPolicy: 'network-only',
  });

  const items = data?.adminAuditLogs?.items ?? [];
  const totalItems = data?.adminAuditLogs?.totalCount ?? 0;

  /* ─── GraphQL 상세 조회 ─── */
  const [fetchDetail] = useLazyQuery<LogDetailResponse>(GET_ADMIN_AUDIT_LOG_BY_ID, {
    fetchPolicy: 'network-only',
  });

  /* ─── 상세 다이얼로그 ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogDetail | null>(null);

  /* ─── 재검색 ─── */
  const handleSearch = useCallback(() => {
    const newFilter: Record<string, string | undefined> = {
      adminNumber: searchAdminNumber.trim() || undefined,
      adminName: searchAdminName.trim() || undefined,
      logName: searchTarget.trim() || undefined,
    };
    setAppliedFilter(newFilter);
    setCurrentPage(1);
    refetch({
      filter: buildFilterVars(newFilter),
      pagination: { page: 1, limit: pageSize },
    });
  }, [searchAdminNumber, searchAdminName, searchHospital, searchTarget, refetch, pageSize]);

  /* ─── 검색초기화 ─── */
  const handleReset = () => {
    setSearchAdminNumber('');
    setSearchAdminName('');
    setSearchHospital('');
    setSearchTarget('');
    setAppliedFilter({});
    setCurrentPage(1);
    refetch({
      filter: {},
      pagination: { page: 1, limit: pageSize },
    });
  };

  /* ─── 로그명 클릭 → 상세 조회 ─── */
  const handleTargetClick = async (row: LogItem) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const { data: detailData } = await fetchDetail({ variables: { id: row.id } });
      if (detailData?.adminAuditLogById) {
        setSelectedLog(detailData.adminAuditLogById);
      }
    } catch {
      toast.error('로그 상세 정보를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  /* ─── 페이징 ─── */
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  /* ─── 테이블 컬럼 ─── */
  const columns: ColumnDef<LogItem, unknown>[] = [
    {
      id: 'rowNum',
      header: 'No',
      size: 60,
      cell: ({ row }) => (currentPage - 1) * pageSize + row.index + 1,
    },
    {
      accessorKey: 'hospitalCode',
      header: '기관',
      size: 100,
      cell: ({ getValue }) => labelOf('HospitalCode', getValue() as string),
    },
    { accessorKey: 'adminNumber', header: '관리자번호', size: 120 },
    { accessorKey: 'adminName', header: '관리자명', size: 100 },
    { accessorKey: 'ipAddress', header: 'IP주소', size: 120 },
    {
      accessorKey: 'target',
      header: '로그명',
      size: 250,
      cell: ({ row }) => (
        <button
          type="button"
          className="text-left text-primary hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleTargetClick(row.original);
          }}
        >
          {row.original.target}
        </button>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: '활동일시',
      size: 180,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
  ];

  return (
    <>
      <ListPageTemplate
        title="로그내역"
        totalItems={totalItems}
        onSearch={handleSearch}
        onReset={handleReset}
        searchSection={
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <FieldGroup label="페이지당 행 수">
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  const size = Number(val);
                  setPageSize(size);
                  setCurrentPage(1);
                  refetch({
                    filter: buildFilterVars(appliedFilter),
                    pagination: { page: 1, limit: size },
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 30, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="관리자번호">
              <Input
                value={searchAdminNumber}
                onChange={(e) => setSearchAdminNumber(e.target.value)}
                placeholder="관리자번호를 입력해 주세요."
                maxLength={20}
              />
            </FieldGroup>
            <FieldGroup label="관리자명">
              <Input
                value={searchAdminName}
                onChange={(e) => setSearchAdminName(e.target.value)}
                placeholder="관리자명을 입력해 주세요."
                maxLength={20}
              />
            </FieldGroup>
            <FieldGroup label="소속병원">
              <Select value={searchHospital || '__all'} onValueChange={(v) => setSearchHospital(v === '__all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {optionsOf('HospitalCode', true).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="로그명">
              <Input
                value={searchTarget}
                onChange={(e) => setSearchTarget(e.target.value)}
                placeholder="로그명을 입력해 주세요."
                maxLength={20}
              />
            </FieldGroup>
          </div>
        }
        listContent={
          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            totalItems={totalItems}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={Math.ceil(totalItems / pageSize) || 1}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onRowClick={handleTargetClick}
            getRowId={(row) => row.id}
          />
        }
      />

      {/* ═══ 로그 내역 상세 다이얼로그 ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent size="md" className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>로그 내역 상세</DialogTitle>
            <DialogDescription>
              로그 상세 정보를 확인합니다.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                로딩 중...
              </div>
            ) : selectedLog ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <ReadOnlyField label="기관" value={labelOf('HospitalCode', selectedLog.hospitalCode)} />
                  <ReadOnlyField label="관리자명" value={selectedLog.adminName || '-'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ReadOnlyField label="관리자 번호" value={selectedLog.adminNumber || '-'} />
                  <ReadOnlyField label="IP주소" value={selectedLog.ipAddress || '-'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ReadOnlyField label="로그명" value={selectedLog.target || '-'} />
                  <ReadOnlyField label="로그생성일시" value={formatDateTime(selectedLog.createdAt)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-foreground">로그내용</label>
                  <textarea
                    className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedLog.detail || '-'}
                    disabled
                  />
                </div>
              </>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button
              variant="dark"
              onClick={() => setDetailOpen(false)}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
