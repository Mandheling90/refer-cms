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
  APPROVE_PARTNER_APPLICATION,
  GET_ADMIN_PARTNER_APPLICATIONS,
  GET_ADMIN_PARTNER_APPLICATION_BY_ID,
  REJECT_PARTNER_APPLICATION,
} from '@/lib/graphql/queries/partner';
import type {
  AdminPartnerApplicationByIdResponse,
  AdminPartnerApplicationsResponse,
  PartnerApplicationDetail,
  PartnerApplicationModel,
  PartnerStatus,
} from '@/types/cooperation';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { type ColumnDef } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

/* ─── Props ─── */
interface CooperationListPageProps {
  title: string;
  /** H: 협력병원, M: 협력의원 */
  partnerType: 'H' | 'M';
  /** apply: 신청관리(승인/반려), edit: 수정관리 */
  mode: 'apply' | 'edit';
  /** 편집 권한 여부 */
  canEdit?: boolean;
}

/* ═══════════════════════════════════════
   협력병의원 공통 리스트 페이지
   ═══════════════════════════════════════ */
export function CooperationListPage({ title, partnerType, mode, canEdit = true }: CooperationListPageProps) {
  const { labelOf, optionsOf } = useEnums();
  const isHospital = partnerType === 'H';
  const isApply = mode === 'apply';

  /* ─── 페이징 ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 조건 (입력 중) ─── */
  const [searchHospName, setSearchHospName] = useState('');
  const [searchDirectorName, setSearchDirectorName] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  /* ─── 실제 적용된 필터 ─── */
  const [appliedFilter, setAppliedFilter] = useState<{
    hospName?: string;
    directorName?: string;
    status?: PartnerStatus;
  }>({});

  /* ─── GraphQL 목록 조회 (전체 조회 후 클라이언트 필터링) ─── */
  const { data, loading, refetch } = useQuery<AdminPartnerApplicationsResponse>(
    GET_ADMIN_PARTNER_APPLICATIONS,
    {
      variables: {
        partnerType,
        ...(appliedFilter.status ? { status: appliedFilter.status } : {}),
      },
      fetchPolicy: 'network-only',
    },
  );

  /* 클라이언트측 필터링 (검색 조건) */
  const allItems = data?.adminPartnerApplications?.items ?? [];
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (appliedFilter.hospName && !item.hospitalName?.includes(appliedFilter.hospName)) return false;
      if (appliedFilter.directorName && !item.directorName?.includes(appliedFilter.directorName)) return false;
      return true;
    });
  }, [allItems, appliedFilter]);
  const totalCount = filteredItems.length;

  /* ─── 클라이언트 페이징 ─── */
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  /* 필터 변경 시 1페이지로 리셋 */
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilter]);

  /* ─── GraphQL 상세 조회 ─── */
  const [fetchDetail] = useLazyQuery<AdminPartnerApplicationByIdResponse>(
    GET_ADMIN_PARTNER_APPLICATION_BY_ID,
    { fetchPolicy: 'network-only' },
  );

  /* ─── Mutations ─── */
  const [approvePartner] = useMutation(APPROVE_PARTNER_APPLICATION);
  const [rejectPartner] = useMutation(REJECT_PARTNER_APPLICATION);

  /* ─── 상세 다이얼로그 ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PartnerApplicationDetail | null>(null);

  /* ─── 확인 다이얼로그 ─── */
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [mutating, setMutating] = useState(false);

  /* ─── 재검색 ─── */
  const handleSearch = useCallback(() => {
    const status = (searchStatus === '__all' ? undefined : searchStatus || undefined) as PartnerStatus | undefined;
    const newFilter = {
      hospName: searchHospName.trim() || undefined,
      directorName: searchDirectorName.trim() || undefined,
      status,
    };
    setAppliedFilter(newFilter);
    setCurrentPage(1);
    refetch({
      partnerType,
      ...(status ? { status } : {}),
    });
  }, [searchHospName, searchDirectorName, searchStatus, partnerType, refetch]);

  /* ─── 초기화 ─── */
  const handleReset = () => {
    setSearchHospName('');
    setSearchDirectorName('');
    setSearchStatus('');
    setAppliedFilter({});
    setCurrentPage(1);
    refetch({ partnerType });
  };

  /* ─── 행 클릭 → 상세 조회 ─── */
  const handleRowClick = async (row: PartnerApplicationModel) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const { data: detailData } = await fetchDetail({ variables: { id: row.id } });
      if (detailData?.adminPartnerApplicationById) {
        setSelectedItem(detailData.adminPartnerApplicationById);
        setRejectReason('');
      }
    } catch {
      toast.error('상세 정보를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  /* ─── 승인 ─── */
  const handleApprove = async () => {
    if (!selectedItem) return;
    setMutating(true);
    try {
      await approvePartner({ variables: { id: selectedItem.id } });
      toast.success('승인 처리되었습니다.');
      setApproveConfirmOpen(false);
      setDetailOpen(false);
      refetch({ partnerType });
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
    if (!selectedItem) return;
    setMutating(true);
    try {
      await rejectPartner({
        variables: { id: selectedItem.id, reason: rejectReason.trim() || '반려 처리' },
      });
      toast.success('반려 처리되었습니다.');
      setRejectOpen(false);
      setDetailOpen(false);
      refetch({ partnerType });
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
  const columns: ColumnDef<PartnerApplicationModel, unknown>[] = [
    {
      id: 'phisCode',
      header: '요양기관번호',
      size: 110,
      cell: ({ row }) => row.original.careInstitutionNo || '-',
    },
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
      accessorKey: 'createdAt',
      header: '신청일시',
      size: 130,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
    {
      accessorKey: 'reviewedById',
      header: '승인담당자',
      size: 100,
      cell: ({ getValue }) => getValue() as string || '-',
    },
    {
      accessorKey: 'status',
      header: '승인여부',
      size: 80,
      cell: ({ getValue }) => {
        const val = getValue() as string;
        if (val === 'APPROVED') return <span className="text-src-point text-lg">✓</span>;
        if (val === 'REJECTED') return <span className="text-src-red text-lg">✗</span>;
        return <span className="text-muted-foreground">{labelOf('PartnerStatus', val)}</span>;
      },
    },
    {
      accessorKey: 'approvedAt',
      header: '승인일시',
      size: 130,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
  ];

  /* ─── 상세 팝업 데이터 ─── */

  return (
    <>
      <ListPageTemplate
        title={title}
        totalItems={totalCount}
        onSearch={handleSearch}
        onReset={handleReset}
        searchSection={
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <FieldGroup label="병원명">
              <Input
                value={searchHospName}
                onChange={(e) => setSearchHospName(e.target.value)}
                placeholder="병원명 검색"
              />
            </FieldGroup>
            <FieldGroup label="대표원장명">
              <Input
                value={searchDirectorName}
                onChange={(e) => setSearchDirectorName(e.target.value)}
                placeholder="대표원장명 검색"
              />
            </FieldGroup>
<FieldGroup label="승인여부">
              <Select value={searchStatus} onValueChange={setSearchStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  {optionsOf('PartnerStatus', true).map((opt) => (
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
          />
        }
      />

      {/* ═══ 상세 다이얼로그 ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent size="lg" className="max-h-[90vh] grid-rows-[auto_1fr_auto]">
          <DialogHeader>
            <DialogTitle>
              {isHospital ? '협력병원' : '협력의원'}{' '}
              {isApply ? '신청' : '수정'} : {selectedItem?.hospitalName || '-'}
            </DialogTitle>
            <DialogDescription>
              {isHospital ? '협력병원' : '협력의원'} 정보를 조회할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5 overflow-y-auto min-h-0">
            {detailLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                로딩 중...
              </div>
            ) : selectedItem ? (
              <PartnerDetailContent selectedItem={selectedItem} isHospital={isHospital} />
            ) : null}
          </DialogBody>

          <DialogFooter className="justify-between">

            {selectedItem?.status === 'PENDING' ? (
              <div className="flex gap-2">
                <Button variant="blue" onClick={() => setApproveConfirmOpen(true)} disabled={!canEdit}>
                  {isApply ? '체결 승인' : '수정 승인'}
                </Button>
                <Button variant="destructive" onClick={() => setRejectOpen(true)} disabled={!canEdit}>
                  {isApply ? '체결 반려' : '수정 반려'}
                </Button>
              </div>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                취소
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ 승인 확인 ═══ */}
      <ConfirmDialog
        open={approveConfirmOpen}
        onOpenChange={setApproveConfirmOpen}
        title={isApply ? '체결 승인 처리' : '수정 승인 처리'}
        description={
          isApply ? (
            <>
              해당 협력병원 체결 신청을 승인하시겠습니까?
              <br />
              승인 사실은 협력병원에 안내되며,
              <br />
              승인 후에는 신청 정보가 PHIS에 등록됩니다.
            </>
          ) : (
            <>
              해당 수정 요청을 승인하시겠습니까?
              <br />
              승인 시 변경된 정보가 반영됩니다.
            </>
          )
        }
        onConfirm={handleApprove}
        loading={mutating}
      />

      {/* ═══ 반려 확인 ═══ */}
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={isApply ? '체결 반려 처리' : '수정 반려 처리'}
        description={
          isApply ? (
            <>
              해당 협력병원 체결 신청을 반려하시겠습니까?
              <br />
              반려 사실은 협력병원에 안내되며,
              <br />
              반려 후에는 동일 신청 건으로 재처리가 불가합니다.
            </>
          ) : (
            <>
              해당 수정 요청을 반려하시겠습니까?
              <br />
              반려 후에는 되돌릴 수 없습니다.
            </>
          )
        }
        onConfirm={handleReject}
        destructive
        loading={mutating}
      />
    </>
  );
}
