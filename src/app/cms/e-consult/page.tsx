'use client';

import { HospitalSelector } from '@/components/molecules/HospitalSelector';
import { DataTable } from '@/components/organisms/DataTable';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { GET_ADMIN_ECONSULTS } from '@/lib/graphql/queries/e-consult';
import { useAuthStore } from '@/stores/auth-store';
import type {
  AdminEConsultItem,
  AdminEConsultListResponse,
  EConsultStatus,
} from '@/types/e-consult';
import { ECONSULT_STATUS_MAP, ECONSULT_STATUS_OPTIONS } from '@/types/e-consult';
import { useQuery } from '@apollo/client/react';
import { type ColumnDef } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';

/* ─── 검색 필드 공통 ─── */
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

/* ─── 답변 상태 배지 ─── */
function StatusBadge({ status }: { status: EConsultStatus }) {
  const colorMap: Record<EConsultStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ANSWERED: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[status]}`}
    >
      {ECONSULT_STATUS_MAP[status] ?? status}
    </span>
  );
}

/* ─── 날짜 포맷 ─── */
function formatDateTime(val?: string | null) {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/* ═══════════════════════════════════════
   e-Consult 관리 페이지 (Admin)
   ═══════════════════════════════════════ */
export default function EConsultPage() {
  const hospitalCode = useAuthStore((s) => s.getEffectiveHospitalCode());

  /* ─── 페이징 ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 조건 (서버 사이드 필터) ─── */
  const [searchTitle, setSearchTitle] = useState('');
  const [searchRequesterName, setSearchRequesterName] = useState('');
  const [searchRequesterEmail, setSearchRequesterEmail] = useState('');
  const [searchHospitalName, setSearchHospitalName] = useState('');
  const [searchConsultantName, setSearchConsultantName] = useState('');
  const [searchConsultantDept, setSearchConsultantDept] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  /* ─── 적용된 필터 (검색 버튼 클릭 시 반영) ─── */
  const [appliedFilter, setAppliedFilter] = useState<Record<string, string>>({});

  /* ─── 상세 다이얼로그 ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AdminEConsultItem | null>(null);

  /* ─── 필터 변수 구성 ─── */
  const filterVariables = useMemo(() => {
    const f: Record<string, string> = {};
    if (appliedFilter.title) f.title = appliedFilter.title;
    if (appliedFilter.requesterName) f.requesterName = appliedFilter.requesterName;
    if (appliedFilter.requesterEmail) f.requesterEmail = appliedFilter.requesterEmail;
    if (appliedFilter.requesterHospitalName) f.requesterHospitalName = appliedFilter.requesterHospitalName;
    if (appliedFilter.consultantName) f.consultantName = appliedFilter.consultantName;
    if (appliedFilter.consultantDepartment) f.consultantDepartment = appliedFilter.consultantDepartment;
    if (appliedFilter.status) f.status = appliedFilter.status;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [appliedFilter]);

  /* ─── GraphQL 목록 조회 ─── */
  const { data, loading, refetch } = useQuery<AdminEConsultListResponse>(GET_ADMIN_ECONSULTS, {
    variables: {
      hospitalCode,
      filter: filterVariables,
      pagination: { page: currentPage, limit: pageSize },
    },
    fetchPolicy: 'network-only',
  });

  const items = data?.adminEConsults?.items ?? [];
  const totalCount = data?.adminEConsults?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  /* ─── 검색 (서버 필터 적용) ─── */
  const handleSearch = useCallback(() => {
    const f: Record<string, string> = {};
    if (searchTitle.trim()) f.title = searchTitle.trim();
    if (searchRequesterName.trim()) f.requesterName = searchRequesterName.trim();
    if (searchRequesterEmail.trim()) f.requesterEmail = searchRequesterEmail.trim();
    if (searchHospitalName.trim()) f.requesterHospitalName = searchHospitalName.trim();
    if (searchConsultantName.trim()) f.consultantName = searchConsultantName.trim();
    if (searchConsultantDept.trim()) f.consultantDepartment = searchConsultantDept.trim();
    if (searchStatus) f.status = searchStatus;
    setAppliedFilter(f);
    setCurrentPage(1);
  }, [searchTitle, searchRequesterName, searchRequesterEmail, searchHospitalName, searchConsultantName, searchConsultantDept, searchStatus]);

  /* ─── 초기화 ─── */
  const handleReset = () => {
    setSearchTitle('');
    setSearchRequesterName('');
    setSearchRequesterEmail('');
    setSearchHospitalName('');
    setSearchConsultantName('');
    setSearchConsultantDept('');
    setSearchStatus('');
    setAppliedFilter({});
    setCurrentPage(1);
  };

  /* ─── 행 클릭 → 상세 다이얼로그 ─── */
  const handleRowClick = useCallback((row: AdminEConsultItem) => {
    setSelectedItem(row);
    setDetailOpen(true);
  }, []);

  /* ─── 페이징 ─── */
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  /* ─── 테이블 컬럼 ─── */
  const columns: ColumnDef<AdminEConsultItem, unknown>[] = useMemo(
    () => [
      {
        id: 'index',
        header: '번호',
        cell: ({ row }) => {
          const idx = totalCount - ((currentPage - 1) * pageSize + row.index);
          return <span className="text-sm text-muted-foreground">{idx}</span>;
        },
        size: 60,
      },
      {
        id: 'requesterName',
        header: '신청자명',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.requester?.userName ?? '-'}</span>
        ),
        size: 100,
      },
      {
        id: 'title',
        header: 'e-Consult 제목',
        cell: ({ row }) => (
          <button
            className="text-primary underline underline-offset-2 hover:text-primary/90 cursor-pointer text-left truncate max-w-[240px]"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(row.original);
            }}
          >
            {row.original.title}
          </button>
        ),
        size: 240,
      },
      {
        id: 'consultantName',
        header: '자문의',
        cell: ({ row }) => <span className="text-sm">{row.original.consultant?.name ?? '-'}</span>,
        size: 100,
      },
      {
        id: 'specialty',
        header: '전문분야',
        cell: ({ row }) => (
          <span className="text-sm truncate block max-w-[240px]">
            {row.original.consultant?.specialty ?? '-'}
          </span>
        ),
        size: 240,
      },
      {
        id: 'status',
        header: '답변여부',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        size: 80,
      },
      {
        id: 'createdAt',
        header: '신청일시',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
        size: 120,
      },
      {
        id: 'expiresAt',
        header: '만료일시',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.original.expiresAt)}
          </span>
        ),
        size: 120,
      },
      {
        id: 'answeredAt',
        header: '답변일시',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.original.answeredAt)}
          </span>
        ),
        size: 120,
      },
    ],
    [handleRowClick, totalCount, currentPage, pageSize]
  );

  return (
    <>
      <ListPageTemplate
        title="e-Consult 관리"
        hospitalSelector={<HospitalSelector />}
        totalItems={totalCount}
        onSearch={handleSearch}
        onReset={handleReset}
        searchSection={
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <FieldGroup label="e-Consult 제목">
              <Input
                placeholder="제목을 입력해 주세요."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </FieldGroup>
            <FieldGroup label="신청자명">
              <Input
                placeholder="신청자명을 입력해 주세요."
                value={searchRequesterName}
                onChange={(e) => setSearchRequesterName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </FieldGroup>
            <FieldGroup label="신청자 이메일">
              <Input
                placeholder="신청자 이메일을 입력해 주세요."
                value={searchRequesterEmail}
                onChange={(e) => setSearchRequesterEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </FieldGroup>
            <FieldGroup label="의료기관명">
              <Input
                placeholder="의료기관명을 입력해 주세요."
                value={searchHospitalName}
                onChange={(e) => setSearchHospitalName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </FieldGroup>
            <FieldGroup label="자문의">
              <Input
                placeholder="자문의를 입력해 주세요."
                value={searchConsultantName}
                onChange={(e) => setSearchConsultantName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </FieldGroup>
            <FieldGroup label="자문의 진료과">
              <Input
                placeholder="자문의 진료과를 입력해 주세요."
                value={searchConsultantDept}
                onChange={(e) => setSearchConsultantDept(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </FieldGroup>
            <FieldGroup label="답변여부">
              <Select
                value={searchStatus || '__all'}
                onValueChange={(v) => setSearchStatus(v === '__all' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  {ECONSULT_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || '__all'} value={opt.value || '__all'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>
        }
        listContent={
          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            totalItems={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onRowClick={handleRowClick}
            getRowId={(row) => row.id}
          />
        }
      />

      {/* ═══ 상세 다이얼로그 ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-[640px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-normal">
              e-Consult 상세{selectedItem ? ` : ${selectedItem.title}` : ''}
            </DialogTitle>
            <DialogDescription className="sr-only">
              e-Consult 상세 정보를 조회합니다.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="overflow-y-auto space-y-5">
            {selectedItem && (
              <>
                {/* 신청 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="신청자명">
                    <Input value={selectedItem.requester?.userName ?? '-'} disabled />
                  </FieldGroup>
                  <FieldGroup label="병원코드">
                    <Input value={selectedItem.hospitalCode ?? '-'} disabled />
                  </FieldGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="자문의">
                    <Input value={selectedItem.consultant?.name ?? '-'} disabled />
                  </FieldGroup>
                  <FieldGroup label="전문분야">
                    <Input value={selectedItem.consultant?.specialty ?? '-'} disabled />
                  </FieldGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="답변여부">
                    <Input
                      value={ECONSULT_STATUS_MAP[selectedItem.status] ?? selectedItem.status}
                      disabled
                    />
                  </FieldGroup>
                  <FieldGroup label="신청일시">
                    <Input value={formatDateTime(selectedItem.createdAt)} disabled />
                  </FieldGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="만료일시">
                    <Input value={formatDateTime(selectedItem.expiresAt)} disabled />
                  </FieldGroup>
                  <FieldGroup label="답변일시">
                    <Input value={formatDateTime(selectedItem.answeredAt)} disabled />
                  </FieldGroup>
                </div>

                {/* e-Consult 제목 */}
                <FieldGroup label="e-Consult 제목">
                  <Input value={selectedItem.title} disabled />
                </FieldGroup>

                {/* 자문의 답변 */}
                {selectedItem.reply && (
                  <>
                    <FieldGroup label="자문의 답변">
                      <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm whitespace-pre-wrap min-h-[120px]">
                        {selectedItem.reply.content}
                      </div>
                    </FieldGroup>
                    <FieldGroup label="답변 등록일시">
                      <Input value={formatDateTime(selectedItem.reply.createdAt)} disabled />
                    </FieldGroup>
                  </>
                )}

                {!selectedItem.reply && selectedItem.status === 'EXPIRED' && (
                  <FieldGroup label="자문의 답변">
                    <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm text-muted-foreground min-h-[120px]">
                      답변 기한이 만료되었습니다.
                    </div>
                  </FieldGroup>
                )}

                {!selectedItem.reply && selectedItem.status === 'PENDING' && (
                  <FieldGroup label="자문의 답변">
                    <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm text-muted-foreground min-h-[120px]">
                      아직 답변이 등록되지 않았습니다.
                    </div>
                  </FieldGroup>
                )}
              </>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailOpen(false)}
              className="rounded-md border-gray-500 px-4"
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
