'use client';

import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
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
import { useEnums } from '@/hooks/use-enums';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { FieldGroup, PartnerDetailContent } from './PartnerDetailContent';
import {
  APPROVE_PARTNER_UPDATE_REQUEST,
  GET_ADMIN_PARTNER_UPDATE_REQUESTS,
  GET_ADMIN_PARTNER_UPDATE_REQUEST_BY_ID,
  GET_ADMIN_PARTNER_APPLICATION_BY_ID,
  REJECT_PARTNER_UPDATE_REQUEST,
} from '@/lib/graphql/queries/partner';
import type {
  AdminPartnerApplicationByIdResponse,
  AdminPartnerUpdateRequestByIdResponse,
  AdminPartnerUpdateRequestsResponse,
  PartnerApplicationDetail,
  PartnerUpdateRequestModel,
  UpdateRequestStatus,
} from '@/types/cooperation';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { type ColumnDef } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

/* ─── PartnerUpdateRequestStatus 라벨 ─── */
const UPDATE_REQUEST_STATUS_LABEL: Record<string, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '반려',
};

const UPDATE_REQUEST_STATUS_OPTIONS = [
  { value: '__all', label: '전체' },
  ...Object.entries(UPDATE_REQUEST_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

/* ─── Props ─── */
interface UpdateRequestListPageProps {
  title: string;
  /** A: 협력병원, B: 협력의원 (미지정 시 전체) */
  partnerType?: 'A' | 'B';
  canEdit?: boolean;
}

/* ═══════════════════════════════════════
   수정요청 확인 리스트 페이지
   ═══════════════════════════════════════ */
export function UpdateRequestListPage({
  title,
  partnerType,
  canEdit = true,
}: UpdateRequestListPageProps) {
  const { labelOf, optionsOf } = useEnums();
  const isHospital = partnerType === 'A';

  /* ─── 페이징 ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 조건 ─── */
  const [searchHospCode, setSearchHospCode] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  /* ─── 실제 적용된 필터 ─── */
  const [appliedFilter, setAppliedFilter] = useState<{
    hospCode?: string;
    status?: UpdateRequestStatus;
  }>({});

  /* ─── GraphQL 목록 조회 ─── */
  const { data, loading, refetch } = useQuery<AdminPartnerUpdateRequestsResponse>(
    GET_ADMIN_PARTNER_UPDATE_REQUESTS,
    {
      variables: {
        ...(appliedFilter.status ? { status: appliedFilter.status } : {}),
      },
      fetchPolicy: 'network-only',
    }
  );

  /* 클라이언트측 필터링 */
  const allItems = data?.adminPartnerUpdateRequests ?? [];
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (partnerType) {
        const itemPartnerType = (item.requestedHospitalData as Record<string, unknown>)
          ?.partnerType;
        if (itemPartnerType && itemPartnerType !== partnerType) return false;
      }
      if (appliedFilter.hospCode && !item.hospitalCode?.includes(appliedFilter.hospCode))
        return false;
      return true;
    });
  }, [allItems, partnerType, appliedFilter]);
  const totalCount = filteredItems.length;

  /* ─── 클라이언트 페이징 ─── */
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilter]);

  /* ─── GraphQL 수정요청 상세 조회 ─── */
  const [fetchUpdateDetail] = useLazyQuery<AdminPartnerUpdateRequestByIdResponse>(
    GET_ADMIN_PARTNER_UPDATE_REQUEST_BY_ID,
    { fetchPolicy: 'network-only' }
  );

  /* ─── GraphQL 기존 신청 상세 조회 ─── */
  const [fetchOriginal] = useLazyQuery<AdminPartnerApplicationByIdResponse>(
    GET_ADMIN_PARTNER_APPLICATION_BY_ID,
    { fetchPolicy: 'network-only' }
  );

  /* ─── Mutations ─── */
  const [approveRequest] = useMutation(APPROVE_PARTNER_UPDATE_REQUEST);
  const [rejectRequest] = useMutation(REJECT_PARTNER_UPDATE_REQUEST);

  /* ─── 상세 다이얼로그 ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PartnerUpdateRequestModel | null>(null);
  const [originalData, setOriginalData] = useState<PartnerApplicationDetail | null>(null);

  /* ─── 확인 다이얼로그 ─── */
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [mutating, setMutating] = useState(false);

  /* ─── 재검색 ─── */
  const handleSearch = useCallback(() => {
    const status = (searchStatus === '__all' ? undefined : searchStatus || undefined) as
      | UpdateRequestStatus
      | undefined;
    const newFilter = {
      hospCode: searchHospCode.trim() || undefined,
      status,
    };
    setAppliedFilter(newFilter);
    setCurrentPage(1);
    refetch({
      ...(status ? { status } : {}),
    });
  }, [searchHospCode, searchStatus, refetch]);

  /* ─── 초기화 ─── */
  const handleReset = () => {
    setSearchHospCode('');
    setSearchStatus('');
    setAppliedFilter({});
    setCurrentPage(1);
    refetch({});
  };

  /* ─── 행 클릭 → 상세 조회 ─── */
  const handleRowClick = async (row: PartnerUpdateRequestModel) => {
    setDetailLoading(true);
    setDetailOpen(true);
    setSelectedRequest(null);
    setOriginalData(null);
    try {
      const [updateResult, originalResult] = await Promise.all([
        fetchUpdateDetail({ variables: { id: row.id } }),
        fetchOriginal({ variables: { id: row.partnerApplicationId } }),
      ]);
      if (updateResult.data?.adminPartnerUpdateRequestById) {
        setSelectedRequest(updateResult.data.adminPartnerUpdateRequestById);
      }
      if (originalResult.data?.adminPartnerApplicationById) {
        setOriginalData(originalResult.data.adminPartnerApplicationById);
      }
    } catch {
      toast.error('수정요청 정보를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  /* ─── 승인 ─── */
  const handleApprove = async () => {
    if (!selectedRequest) return;
    setMutating(true);
    try {
      await approveRequest({ variables: { id: selectedRequest.id } });
      toast.success('수정요청이 승인되었습니다.');
      setApproveConfirmOpen(false);
      setDetailOpen(false);
      refetch({});
    } catch (err) {
      const msg = err instanceof Error ? err.message : '승인 처리 중 오류가 발생했습니다.';
      toast.error(msg);
      setApproveConfirmOpen(false);
    } finally {
      setMutating(false);
    }
  };

  /* ─── 반려 ─── */
  const handleReject = async () => {
    if (!selectedRequest) return;
    setMutating(true);
    try {
      await rejectRequest({
        variables: { id: selectedRequest.id },
      });
      toast.success('수정요청이 반려되었습니다.');
      setRejectOpen(false);
      setDetailOpen(false);
      refetch({});
    } catch (err) {
      const msg = err instanceof Error ? err.message : '반려 처리 중 오류가 발생했습니다.';
      toast.error(msg);
      setRejectOpen(false);
    } finally {
      setMutating(false);
    }
  };

  /* ─── 페이징 ─── */
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

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
    return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
  };

  /* ─── 테이블 컬럼 ─── */
  const columns: ColumnDef<PartnerUpdateRequestModel, unknown>[] = [
    {
      id: 'hospName',
      header: '병원명',
      size: 120,
      cell: ({ row }) => row.original.hospitalName || '-',
    },
    {
      id: 'hospPhone',
      header: '병원전화번호',
      size: 120,
      cell: ({ row }) => row.original.hospitalPhone || '-',
    },
    {
      id: 'directorName',
      header: '대표원장명',
      size: 90,
      cell: ({ row }) => row.original.directorName || '-',
    },
    {
      id: 'applicantName',
      header: '신청자명',
      size: 100,
      cell: ({ row }) => row.original.applicantName || '-',
    },
    {
      id: 'applicantEmail',
      header: '신청자 이메일',
      size: 180,
      cell: ({ row }) => row.original.applicantEmail || '-',
    },
    {
      id: 'applicantPhone',
      header: '신청자 휴대폰',
      size: 120,
      cell: ({ row }) => row.original.applicantPhone || '-',
    },
    {
      accessorKey: 'createdAt',
      header: '요청일시',
      size: 130,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
    {
      accessorKey: 'reviewedById',
      header: '승인담당자',
      size: 100,
      cell: ({ getValue }) => (getValue() as string) || '-',
    },
    {
      accessorKey: 'status',
      header: '승인여부',
      size: 80,
      cell: ({ getValue }) => {
        const val = getValue() as string;
        if (val === 'APPROVED') return <span className="text-src-point text-lg">✓</span>;
        if (val === 'REJECTED') return <span className="text-src-red text-lg">✗</span>;
        return (
          <span className="text-muted-foreground">{UPDATE_REQUEST_STATUS_LABEL[val] ?? val}</span>
        );
      },
    },
    {
      accessorKey: 'reviewedAt',
      header: '승인일시',
      size: 130,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
  ];

  return (
    <>
      <ListPageTemplate
        title={title}
        totalItems={totalCount}
        onSearch={handleSearch}
        onReset={handleReset}
        searchSection={
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <FieldGroup label="병원코드">
              <Input
                value={searchHospCode}
                onChange={(e) => setSearchHospCode(e.target.value)}
                placeholder="병원코드 검색"
              />
            </FieldGroup>
            <FieldGroup label="상태">
              <Select value={searchStatus} onValueChange={setSearchStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  {UPDATE_REQUEST_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
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
          />
        }
      />

      {/* ═══ 상세 다이얼로그 ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent size="lg" className="max-h-[90vh] grid-rows-[auto_1fr_auto]">
          <DialogHeader>
            <DialogTitle>
              수정요청 확인 :{' '}
              {originalData?.hospitalName ||
                labelOf('HospitalCode', selectedRequest?.hospitalCode, '-')}
            </DialogTitle>
            <DialogDescription>
              협력병의원이 요청한 수정 내역을 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5 overflow-y-auto min-h-0">
            {detailLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                로딩 중...
              </div>
            ) : originalData ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <FieldGroup label="신청자명">
                    <Input value={selectedRequest?.applicantName || ''} disabled />
                  </FieldGroup>
                  <FieldGroup label="신청자 이메일">
                    <Input value={selectedRequest?.applicantEmail || ''} disabled />
                  </FieldGroup>
                  <FieldGroup label="신청자 휴대폰">
                    <Input value={selectedRequest?.applicantPhone || ''} disabled />
                  </FieldGroup>
                </div>
                <PartnerDetailContent
                  selectedItem={(() => {
                    const hospData = (selectedRequest?.requestedHospitalData ?? {}) as Record<
                      string,
                      unknown
                    >;
                    const appData = (selectedRequest?.requestedApplicationData ?? {}) as Record<
                      string,
                      unknown
                    >;
                    // snapshot 키 → PartnerApplicationDetail 키 변환
                    const { phisCode, ...restHospData } = hospData;
                    const { attachments: reqAttachments, ...restAppData } = appData;
                    return {
                      ...originalData,
                      ...restHospData,
                      ...restAppData,
                      ...(phisCode !== undefined ? { careInstitutionNo: phisCode as string } : {}),
                      // 차량번호는 수정요청 모델의 최신 값으로 덮어쓰기
                      ...(selectedRequest?.directorCarNo !== undefined
                        ? { directorCarNo: selectedRequest.directorCarNo ?? '' }
                        : {}),
                      // 수정 요청의 첨부파일이 있으면 원본 대신 표시
                      ...(Array.isArray(reqAttachments) ? { attachmentRows: reqAttachments } : {}),
                    } as PartnerApplicationDetail;
                  })()}
                  isHospital={isHospital}
                />
              </>
            ) : null}
          </DialogBody>

          <DialogFooter className="justify-between">
            {selectedRequest?.status === 'PENDING' ? (
              <div className="flex gap-2">
                <Button
                  variant="blue"
                  onClick={() => setApproveConfirmOpen(true)}
                  disabled={!canEdit}
                >
                  수정 승인
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setRejectOpen(true)}
                  disabled={!canEdit}
                >
                  수정 반려
                </Button>
              </div>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                닫기
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ 승인 확인 ═══ */}
      <ConfirmDialog
        open={approveConfirmOpen}
        onOpenChange={setApproveConfirmOpen}
        title="수정요청 승인"
        description={
          <>
            해당 수정요청을 승인하시겠습니까?
            <br />
            승인 시 변경된 정보가 반영됩니다.
          </>
        }
        onConfirm={handleApprove}
        loading={mutating}
      />

      {/* ═══ 반려 확인 ═══ */}
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="수정요청 반려"
        description={
          <>
            해당 수정요청을 반려하시겠습니까?
            <br />
            반려 후에는 되돌릴 수 없습니다.
          </>
        }
        onConfirm={handleReject}
        destructive
        loading={mutating}
      />
    </>
  );
}
