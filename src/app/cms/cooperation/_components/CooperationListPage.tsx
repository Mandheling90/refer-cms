'use client';

import { useState, useCallback } from 'react';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import {
  GET_ADMIN_PARTNER_APPLICATIONS,
  GET_ADMIN_PARTNER_APPLICATION_BY_ID,
  APPROVE_PARTNER_APPLICATION,
  REJECT_PARTNER_APPLICATION,
} from '@/lib/graphql/queries/partner';
import type {
  PartnerApplicationModel,
  AdminPartnerApplicationsResponse,
  AdminPartnerApplicationByIdResponse,
  PartnerStatus,
} from '@/types/cooperation';
import {
  PARTNER_STATUS_OPTIONS,
  SPECIALTY_OPTIONS,
  partnerStatusLabel,
  partnerTypeLabel,
} from '@/types/cooperation';

/* ─── Props ─── */
interface CooperationListPageProps {
  title: string;
  /** H: 협력병원, M: 협력의원 */
  partnerType: 'H' | 'M';
  /** apply: 신청관리(승인/반려), edit: 수정관리 */
  mode: 'apply' | 'edit';
}

/* ─── 검색 필드 공통 ─── */
function FieldGroup({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-src-red ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════
   협력병의원 공통 리스트 페이지
   ═══════════════════════════════════════ */
export function CooperationListPage({ title, partnerType, mode }: CooperationListPageProps) {
  const isHospital = partnerType === 'H';
  const isApply = mode === 'apply';

  /* ─── 페이징 ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 조건 ─── */
  const [searchStatus, setSearchStatus] = useState('');

  /* ─── 실제 적용된 필터 ─── */
  const [appliedStatus, setAppliedStatus] = useState<PartnerStatus | undefined>(undefined);

  /* ─── GraphQL 목록 조회 ─── */
  const { data, loading, refetch } = useQuery<AdminPartnerApplicationsResponse>(
    GET_ADMIN_PARTNER_APPLICATIONS,
    {
      variables: {
        pagination: { page: currentPage, limit: pageSize },
        ...(appliedStatus ? { status: appliedStatus } : {}),
      },
      fetchPolicy: 'network-only',
    },
  );

  /* partnerType 으로 클라이언트측 필터링 */
  const allItems = data?.adminPartnerApplications?.items ?? [];
  const filteredItems = allItems.filter((item) => item.hospital?.partnerType === partnerType);
  const totalCount = data?.adminPartnerApplications?.totalCount ?? 0;

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
  const [selectedItem, setSelectedItem] = useState<PartnerApplicationModel | null>(null);

  /* ─── 확인 다이얼로그 ─── */
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  /* ─── 재검색 ─── */
  const handleSearch = useCallback(() => {
    const status = (searchStatus === '__all' ? undefined : searchStatus || undefined) as PartnerStatus | undefined;
    setAppliedStatus(status);
    setCurrentPage(1);
    refetch({
      pagination: { page: 1, limit: pageSize },
      ...(status ? { status } : {}),
    });
  }, [searchStatus, refetch, pageSize]);

  /* ─── 초기화 ─── */
  const handleReset = () => {
    setSearchStatus('');
    setAppliedStatus(undefined);
    setCurrentPage(1);
    refetch({
      pagination: { page: 1, limit: pageSize },
    });
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
    try {
      await approvePartner({ variables: { id: selectedItem.id } });
      toast.success('승인 처리되었습니다.');
      setApproveConfirmOpen(false);
      setDetailOpen(false);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '승인 처리 중 오류가 발생했습니다.';
      toast.error(msg);
      setApproveConfirmOpen(false);
    }
  };

  /* ─── 반려 ─── */
  const handleReject = async () => {
    if (!selectedItem) return;
    if (!rejectReason.trim()) {
      toast.error('반려 사유를 입력해주세요.');
      return;
    }
    try {
      await rejectPartner({
        variables: { id: selectedItem.id, reason: rejectReason.trim() },
      });
      toast.success('반려 처리되었습니다.');
      setRejectOpen(false);
      setDetailOpen(false);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '반려 처리 중 오류가 발생했습니다.';
      toast.error(msg);
      setRejectOpen(false);
    }
  };

  /* ─── 페이징 ─── */
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  /* ─── 테이블 컬럼 ─── */
  const columns: ColumnDef<PartnerApplicationModel, unknown>[] = [
    {
      id: 'rowNum',
      header: 'No',
      size: 60,
      cell: ({ row }) => (currentPage - 1) * pageSize + row.index + 1,
    },
    {
      id: 'partnerType',
      header: '기관구분',
      size: 100,
      cell: ({ row }) => partnerTypeLabel(row.original.hospital?.partnerType),
    },
    {
      id: 'instName',
      header: '기관명',
      size: 180,
      cell: ({ row }) => row.original.hospital?.name || '-',
    },
    {
      id: 'representative',
      header: '대표자',
      size: 100,
      cell: ({ row }) => row.original.hospital?.representative || '-',
    },
    {
      id: 'phone',
      header: '전화번호',
      size: 140,
      cell: ({ row }) => row.original.hospital?.phone || '-',
    },
    {
      id: 'staffName',
      header: '담당자',
      size: 100,
      cell: ({ row }) => row.original.staffName || '-',
    },
    {
      accessorKey: 'status',
      header: '상태',
      size: 90,
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return (
          <span
            className={
              val === 'APPROVED'
                ? 'text-src-point font-medium'
                : val === 'REJECTED'
                  ? 'text-src-red font-medium'
                  : val === 'PENDING'
                    ? 'text-src-blue font-medium'
                    : ''
            }
          >
            {partnerStatusLabel(val)}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: '신청일시',
      size: 160,
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return val ? new Date(val).toLocaleString('ko-KR') : '-';
      },
    },
  ];

  /* ─── 상세 팝업 데이터 ─── */
  const hospital = selectedItem?.hospital;
  const specialties = hospital?.specialties?.split(',').filter(Boolean) ?? [];

  return (
    <>
      <ListPageTemplate
        title={title}
        totalItems={totalCount}
        onSearch={handleSearch}
        onReset={handleReset}
        searchSection={
          <div className="grid grid-cols-4 gap-x-6 gap-y-4">
            <FieldGroup label="상태">
              <Select value={searchStatus} onValueChange={setSearchStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_STATUS_OPTIONS.map((opt) => (
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
            data={filteredItems}
            loading={loading}
            totalItems={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={Math.ceil(totalCount / pageSize) || 1}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onRowClick={handleRowClick}
          />
        }
      />

      {/* ═══ 상세 다이얼로그 ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent size="lg" className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isHospital ? '협력병원' : '협력의원'}{' '}
              {isApply ? '신청 사업체관리등록' : '수정 사업체관리등록'}
            </DialogTitle>
            <DialogDescription>
              {isHospital ? '협력병원' : '협력의원'} 정보를 조회할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5 overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                로딩 중...
              </div>
            ) : selectedItem ? (
              <>
                {/* ─── 구분 ─── */}
                <FieldGroup label="구분" required>
                  <div className="flex items-center h-10 gap-6">
                    <label className="flex items-center gap-1.5 text-sm">
                      <input
                        type="radio"
                        className="accent-primary"
                        checked={hospital?.partnerType === 'H'}
                        disabled
                      />
                      협력병원
                    </label>
                    <label className="flex items-center gap-1.5 text-sm">
                      <input
                        type="radio"
                        className="accent-primary"
                        checked={hospital?.partnerType === 'M'}
                        disabled
                      />
                      협력의원
                    </label>
                  </div>
                </FieldGroup>

                {/* ─── 요양기관번호 ─── */}
                <FieldGroup label="요양기관번호" required>
                  <Input value={hospital?.classificationCode || ''} disabled />
                </FieldGroup>

                {/* ─── 기관명 + 대표자 ─── */}
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label={isHospital ? '기관(병원)명' : '기관명'} required>
                    <Input value={hospital?.name || ''} disabled />
                  </FieldGroup>
                  <FieldGroup label="대표자" required>
                    <Input value={hospital?.representative || ''} disabled />
                  </FieldGroup>
                </div>

                {/* ─── 주소 ─── */}
                <FieldGroup label="주소" required>
                  <div className="flex gap-2 mb-2">
                    <Input value={hospital?.zipCode || ''} placeholder="우편번호" className="w-32" disabled />
                  </div>
                  <Input value={hospital?.address || ''} placeholder="주소" className="mb-2" disabled />
                  <Input value={hospital?.addressDetail || ''} placeholder="상세주소" disabled />
                </FieldGroup>

                {/* ─── 전화번호 + FAX ─── */}
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="전화번호" required>
                    <Input value={hospital?.phone || ''} disabled />
                  </FieldGroup>
                  <FieldGroup label="FAX">
                    <Input value={hospital?.faxNumber || ''} disabled />
                  </FieldGroup>
                </div>

                {/* ─── 홈페이지 ─── */}
                <FieldGroup label="홈페이지주소">
                  <Input value={hospital?.website || ''} disabled />
                </FieldGroup>

                {/* ─── 담당자 정보 ─── */}
                <div className="border-t border-gray-500 pt-5">
                  <h3 className="text-base font-semibold mb-4">담당자 정보</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="담당자명">
                      <Input value={selectedItem.staffName || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="담당자 연락처">
                      <Input value={selectedItem.staffPhone || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="담당자 이메일">
                      <Input value={selectedItem.staffEmail || ''} disabled />
                    </FieldGroup>
                  </div>
                </div>

                {/* ─── 원장 정보 ─── */}
                <div className="border-t border-gray-500 pt-5">
                  <h3 className="text-base font-semibold mb-4">원장 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="원장명">
                      <Input value={selectedItem.directorName || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="원장 연락처">
                      <Input value={selectedItem.directorPhone || ''} disabled />
                    </FieldGroup>
                  </div>
                </div>

                {/* ─── 의원 전용: 진료과목 ─── */}
                {!isHospital && specialties.length > 0 && (
                  <div className="border-t border-gray-500 pt-5">
                    <FieldGroup label="진료과목">
                      <div className="border border-gray-500 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody>
                            {SPECIALTY_OPTIONS.map((group, gi) => (
                              <tr key={group.group} className={gi > 0 ? 'border-t border-gray-500' : ''}>
                                <th className="bg-gray-300 px-4 py-3 text-left font-semibold whitespace-nowrap align-top w-28">
                                  {group.group}
                                </th>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                                    {group.items.map((item) => (
                                      <label
                                        key={item}
                                        className="flex items-center gap-1.5 text-sm whitespace-nowrap"
                                      >
                                        <Checkbox
                                          checked={specialties.includes(item)}
                                          disabled
                                        />
                                        {item}
                                      </label>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </FieldGroup>
                  </div>
                )}

                {/* ─── 상태 정보 테이블 ─── */}
                <div className="border-t border-gray-500 pt-5">
                  <div className="overflow-hidden rounded-lg border border-gray-500">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-gray-500">
                          <th className="bg-gray-300 px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                            신청상태
                          </th>
                          <td className="px-4 py-2.5">
                            <span
                              className={
                                selectedItem.status === 'APPROVED'
                                  ? 'text-src-point font-medium'
                                  : selectedItem.status === 'REJECTED'
                                    ? 'text-src-red font-medium'
                                    : selectedItem.status === 'PENDING'
                                      ? 'text-src-blue font-medium'
                                      : ''
                              }
                            >
                              {partnerStatusLabel(selectedItem.status)}
                            </span>
                          </td>
                          <th className="bg-gray-300 px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                            병원코드
                          </th>
                          <td className="px-4 py-2.5">{selectedItem.hospitalCode || '-'}</td>
                        </tr>
                        <tr className="border-b border-gray-500">
                          <th className="bg-gray-300 px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                            신청일시
                          </th>
                          <td className="px-4 py-2.5">
                            {selectedItem.createdAt
                              ? new Date(selectedItem.createdAt).toLocaleString('ko-KR')
                              : '-'}
                          </td>
                          <th className="bg-gray-300 px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                            승인일시
                          </th>
                          <td className="px-4 py-2.5">
                            {selectedItem.approvedAt
                              ? new Date(selectedItem.approvedAt).toLocaleString('ko-KR')
                              : '-'}
                          </td>
                        </tr>
                        {selectedItem.status === 'REJECTED' && (
                          <tr>
                            <th className="bg-gray-300 px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                              반려사유
                            </th>
                            <td className="px-4 py-2.5" colSpan={3}>
                              {selectedItem.rejectReason || '-'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </DialogBody>

          <DialogFooter className="justify-between">
            {/* 좌측: 신청관리 → 승인/반려 (PENDING 상태만) */}
            {isApply && selectedItem?.status === 'PENDING' ? (
              <div className="flex gap-2">
                <Button variant="blue" onClick={() => setApproveConfirmOpen(true)}>
                  승인
                </Button>
                <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                  반려
                </Button>
              </div>
            ) : (
              <div />
            )}

            {/* 우측 */}
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
        title="승인"
        description="해당 신청을 승인하시겠습니까?"
        onConfirm={handleApprove}
      />

      {/* ═══ 반려사유 입력 ═══ */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>반려사유</DialogTitle>
            <DialogDescription>반려 사유를 입력해주세요.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유를 입력하세요."
              rows={4}
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
