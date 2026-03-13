'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation } from '@apollo/client/react';
import { DataTable } from '@/components/organisms/DataTable';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { HospitalSelector } from '@/components/molecules/HospitalSelector';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import {
  GET_ECONSULT_LIST,
  ANSWER_ECONSULT,
} from '@/lib/graphql/queries/e-consult';
import type { EConsultItem, EConsultListResponse, EConsultStatus } from '@/types/e-consult';
import { ECONSULT_STATUS_MAP, ECONSULT_STATUS_OPTIONS } from '@/types/e-consult';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { Trash2 } from 'lucide-react';

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
    COMPLETED: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[status]}`}>
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
   e-Consult 관리 페이지
   ═══════════════════════════════════════ */
export default function EConsultPage() {
  const hospitalCode = useAuthStore((s) => s.getEffectiveHospitalCode());

  /* ─── 페이징 ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 조건 (입력 즉시 필터링) ─── */
  const [searchRequesterName, setSearchRequesterName] = useState('');
  const [searchRequesterEmail, setSearchRequesterEmail] = useState('');
  const [searchHospitalName, setSearchHospitalName] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [searchConsultant, setSearchConsultant] = useState('');
  const [searchDepartment, setSearchDepartment] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  /* ─── 상세 다이얼로그 ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EConsultItem | null>(null);

  /* ─── 답변 폼 상태 ─── */
  const [editAnswer, setEditAnswer] = useState('');

  /* ─── 선택 행 / 확인 다이얼로그 ─── */
  const [selectedRows, setSelectedRows] = useState<EConsultItem[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  /* ─── GraphQL 목록 조회 ─── */
  const { data, loading, refetch } = useQuery<EConsultListResponse>(
    GET_ECONSULT_LIST,
    {
      variables: { hospitalCode },
      fetchPolicy: 'network-only',
    },
  );

  /* ─── GraphQL 답변 등록 ─── */
  const [answerEConsult] = useMutation(ANSWER_ECONSULT);

  const allItems = data?.eConsultList?.items ?? [];

  /* ─── 프론트 필터링 (입력 즉시 반영) ─── */
  const filteredItems = useMemo(() => {
    const nameTrim = searchRequesterName.trim();
    const emailTrim = searchRequesterEmail.trim();
    const hospTrim = searchHospitalName.trim();
    const titleTrim = searchTitle.trim();
    const consultTrim = searchConsultant.trim();
    const deptTrim = searchDepartment.trim();
    const statusVal = searchStatus === '__all' ? '' : searchStatus;

    return allItems.filter((item) => {
      if (nameTrim && !item.requesterName.includes(nameTrim)) return false;
      if (emailTrim && !item.requesterEmail.includes(emailTrim)) return false;
      if (hospTrim && !item.hospitalName.includes(hospTrim)) return false;
      if (titleTrim && !item.title.includes(titleTrim)) return false;
      if (consultTrim && !item.consultantName.includes(consultTrim)) return false;
      if (deptTrim && !item.consultantDepartment.includes(deptTrim)) return false;
      if (statusVal && item.status !== statusVal) return false;
      return true;
    });
  }, [allItems, searchRequesterName, searchRequesterEmail, searchHospitalName, searchTitle, searchConsultant, searchDepartment, searchStatus]);

  const totalCount = filteredItems.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  /* 필터 변경 시 1페이지로 리셋 */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchRequesterName, searchRequesterEmail, searchHospitalName, searchTitle, searchConsultant, searchDepartment, searchStatus]);

  /* ─── 프론트 페이징 ─── */
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  /* ─── 재검색 (API 재조회) ─── */
  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    refetch();
  }, [refetch]);

  /* ─── 초기화 ─── */
  const handleReset = () => {
    setSearchRequesterName('');
    setSearchRequesterEmail('');
    setSearchHospitalName('');
    setSearchTitle('');
    setSearchConsultant('');
    setSearchDepartment('');
    setSearchStatus('');
    setCurrentPage(1);
  };

  /* ─── 행 클릭 → 상세 다이얼로그 ─── */
  const handleRowClick = useCallback((row: EConsultItem) => {
    setSelectedItem(row);
    setEditAnswer(row.answer ?? '');
    setDetailOpen(true);
  }, []);

  /* ─── 답변 저장 ─── */
  const handleSave = async () => {
    if (!selectedItem) return;
    try {
      if (!editAnswer.trim()) {
        toast.error('답변 내용을 입력해 주세요.');
        setSaveConfirmOpen(false);
        return;
      }
      await answerEConsult({
        variables: {
          id: selectedItem.id,
          answer: editAnswer.trim(),
        },
      });
      toast.success('답변이 저장되었습니다.');
      setSaveConfirmOpen(false);
      setDetailOpen(false);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.';
      toast.error(message);
      setSaveConfirmOpen(false);
    }
  };

  /* ─── 일괄 삭제 (TODO: 삭제 API 연동 시 교체) ─── */
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    toast.success(`${selectedRows.length}건이 삭제되었습니다.`);
    setDeleteConfirmOpen(false);
    setSelectedRows([]);
    refetch();
  };

  /* ─── 페이징 ─── */
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  /* ─── 테이블 컬럼 ─── */
  const columns: ColumnDef<EConsultItem, unknown>[] = useMemo(
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
        cell: ({ row }) => <span className="text-sm">{row.original.requesterName}</span>,
        size: 90,
      },
      {
        id: 'hospitalName',
        header: '의료기관명',
        cell: ({ row }) => <span className="text-sm">{row.original.hospitalName}</span>,
        size: 120,
      },
      {
        id: 'requesterEmail',
        header: '신청자 이메일',
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.requesterEmail}</span>,
        size: 160,
      },
      {
        id: 'title',
        header: 'e-Consult 제목',
        cell: ({ row }) => (
          <button
            className="text-primary underline underline-offset-2 hover:text-primary/90 cursor-pointer text-left truncate max-w-[200px]"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(row.original);
            }}
          >
            {row.original.title}
          </button>
        ),
        size: 200,
      },
      {
        id: 'createdAt',
        header: '신청일시',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
        ),
        size: 150,
      },
      {
        id: 'consultantName',
        header: '자문의',
        cell: ({ row }) => <span className="text-sm">{row.original.consultantName}</span>,
        size: 80,
      },
      {
        id: 'consultantDepartment',
        header: '자문의 진료과',
        cell: ({ row }) => <span className="text-sm">{row.original.consultantDepartment}</span>,
        size: 110,
      },
      {
        id: 'status',
        header: '답변여부',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        size: 90,
      },
      {
        id: 'answeredAt',
        header: '답변일시',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDateTime(row.original.answeredAt)}</span>
        ),
        size: 150,
      },
    ],
    [handleRowClick, totalCount, currentPage, pageSize],
  );

  return (
    <>
      <ListPageTemplate
        title="e-Consult"
        hospitalSelector={<HospitalSelector />}
        totalItems={totalCount}
        onSearch={handleSearch}
        onReset={handleReset}
        listHeaderActions={
          <Button
            variant="outline-red"
            size="md"
            onClick={() => {
              if (selectedRows.length === 0) {
                toast.error('삭제할 항목을 선택해주세요.');
                return;
              }
              setDeleteConfirmOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            일괄 삭제
          </Button>
        }
        searchSection={
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <FieldGroup label="신청자명">
              <Input
                placeholder="신청자명을 입력해 주세요."
                value={searchRequesterName}
                onChange={(e) => setSearchRequesterName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </FieldGroup>
            <FieldGroup label="의료기관명">
              <Input
                placeholder="의료기관명을 입력해 주세요."
                value={searchHospitalName}
                onChange={(e) => setSearchHospitalName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </FieldGroup>
            <FieldGroup label="신청자 이메일">
              <Input
                placeholder="신청자 이메일을 입력해 주세요."
                value={searchRequesterEmail}
                onChange={(e) => setSearchRequesterEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </FieldGroup>
            <FieldGroup label="e-Consult 제목">
              <Input
                placeholder="e-Consult 제목을 입력해 주세요."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </FieldGroup>
            <FieldGroup label="자문의">
              <Input
                placeholder="자문의를 입력해 주세요."
                value={searchConsultant}
                onChange={(e) => setSearchConsultant(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </FieldGroup>
            <FieldGroup label="자문의 진료과">
              <Input
                placeholder="자문의 진료과를 입력해 주세요."
                value={searchDepartment}
                onChange={(e) => setSearchDepartment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
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
            data={pagedItems}
            loading={loading}
            totalItems={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onRowClick={handleRowClick}
            enableSelection
            onSelectionChange={setSelectedRows}
            getRowId={(row) => row.id}
          />
        }
      />

      {/* ═══ 상세/답변 다이얼로그 ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-[640px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-normal">
              e-Consult 상세{selectedItem ? ` : ${selectedItem.title}` : ''}
            </DialogTitle>
            <DialogDescription className="sr-only">
              e-Consult 상세 정보를 조회하고 답변합니다.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="overflow-y-auto space-y-5">
            {selectedItem && (
              <>
                {/* 신청 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="신청자명">
                    <Input value={selectedItem.requesterName} disabled />
                  </FieldGroup>
                  <FieldGroup label="의료기관명">
                    <Input value={selectedItem.hospitalName} disabled />
                  </FieldGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="신청자 이메일">
                    <Input value={selectedItem.requesterEmail} disabled />
                  </FieldGroup>
                  <FieldGroup label="신청일시">
                    <Input value={formatDateTime(selectedItem.createdAt)} disabled />
                  </FieldGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="자문의">
                    <Input value={selectedItem.consultantName} disabled />
                  </FieldGroup>
                  <FieldGroup label="자문의 진료과">
                    <Input value={selectedItem.consultantDepartment} disabled />
                  </FieldGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="답변여부">
                    <Input value={ECONSULT_STATUS_MAP[selectedItem.status] ?? selectedItem.status} disabled />
                  </FieldGroup>
                  <FieldGroup label="답변일시">
                    <Input value={formatDateTime(selectedItem.answeredAt)} disabled />
                  </FieldGroup>
                </div>

                {/* e-Consult 제목 */}
                <FieldGroup label="e-Consult 제목">
                  <Input value={selectedItem.title} disabled />
                </FieldGroup>

                {/* e-Consult 내용 */}
                <FieldGroup label="e-Consult 내용">
                  <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm whitespace-pre-wrap min-h-[120px]">
                    {selectedItem.content}
                  </div>
                </FieldGroup>

                {/* 자문의 답변 */}
                <FieldGroup label="자문의 답변">
                  {selectedItem.status === 'COMPLETED' ? (
                    <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm whitespace-pre-wrap min-h-[120px]">
                      {selectedItem.answer}
                    </div>
                  ) : selectedItem.status === 'EXPIRED' ? (
                    <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm text-muted-foreground min-h-[120px]">
                      답변 기한이 만료되었습니다.
                    </div>
                  ) : (
                    <Textarea
                      placeholder="답변 내용을 입력해 주세요."
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      className="min-h-[120px]"
                    />
                  )}
                </FieldGroup>
              </>
            )}
          </DialogBody>

          <DialogFooter className="gap-1.5">
            <Button
              variant="outline"
              onClick={() => setDetailOpen(false)}
              className="rounded-md border-gray-500 px-4"
            >
              취소
            </Button>
            {selectedItem?.status === 'PENDING' && (
              <Button
                variant="dark"
                onClick={() => setSaveConfirmOpen(true)}
                className="rounded-md px-4"
              >
                답변 저장
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 저장 확인 */}
      <ConfirmDialog
        open={saveConfirmOpen}
        onOpenChange={setSaveConfirmOpen}
        title="답변 저장 확인"
        description="답변을 저장하시겠습니까?"
        onConfirm={handleSave}
      />

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="삭제 확인"
        description={`선택한 ${selectedRows.length}건을 삭제하시겠습니까?`}
        onConfirm={handleBulkDelete}
      />
    </>
  );
}
