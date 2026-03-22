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
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
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
import {
  UPDATE_REQUEST_STATUS_OPTIONS,
  updateRequestStatusLabel,
} from '@/types/cooperation';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { type ColumnDef } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

/* ─── Props ─── */
interface UpdateRequestListPageProps {
  title: string;
  /** H: 협력병원, M: 협력의원 (미지정 시 전체) */
  partnerType?: 'H' | 'M';
  canEdit?: boolean;
}

/* ─── 검색 필드 공통 ─── */
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

/* ─── 변경사항 비교 표시 ─── */
function ChangedField({
  label,
  oldValue,
  newValue,
}: {
  label: string;
  oldValue?: string;
  newValue?: string;
}) {
  const old = oldValue ?? '-';
  const next = newValue ?? '-';
  const isChanged = old !== next;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">기존</span>
          <Input value={old} disabled />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">변경 요청</span>
          <Input
            value={next}
            disabled
            className={isChanged ? 'border-orange-400 bg-orange-50' : ''}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── 필드 라벨 맵 ─── */
const HOSPITAL_FIELD_LABELS: Record<string, string> = {
  name: '병원명',
  phone: '병원 전화번호',
  faxNumber: '팩스번호',
  address: '주소',
  addressDetail: '상세주소',
  zipCode: '우편번호',
  website: '홈페이지',
  representative: '대표자명',
  specialties: '진료과목',
};

const APPLICATION_FIELD_LABELS: Record<string, string> = {
  directorName: '병원장명',
  directorPhone: '병원장 휴대전화',
  directorLicenseNo: '의사면허번호',
  directorBirthDate: '생년월일',
  directorGender: '성별',
  directorEmail: '이메일',
  directorSchool: '출신학교',
  directorGraduationYear: '졸업년도',
  directorTrainingHospital: '수련병원',
  directorDepartment: '진료과',
  directorSubSpecialty: '세부전공',
  directorCarNo: '차량번호',
  directorEmailConsent: '이메일 수신 동의',
  directorSmsConsent: 'SMS 수신 동의',
  directorReplyConsent: '회신서 수신 동의',
  staffName: '실무자명',
  staffPhone: '실무자 연락처',
  staffEmail: '실무자 이메일',
  staffPosition: '실무자 직급',
  staffTel: '실무자 휴대전화',
  staffDeptType: '부서유형',
  staffDeptValue: '부서',
  institutionType: '의료기관 유형',
  remarks: '비고',
  totalBedCount: '총 병상수',
  activeBedCount: '가동병상수',
  premiumRoomCount: '상급병실',
  multiRoomCount: '다인실',
  icuCount: '중환자실 병상수',
  erCount: '응급실 병상수',
  nurseCount: '간호사 수',
  specialistCount: '전문의 수',
  totalStaffCount: '총 직원 수',
  isolationRoomCount: '격리병실 수',
  isolationSingleCount: '격리병상(1인실)',
  isolationDoubleCount: '격리병상(2인실)',
  isolationTripleCount: '격리병상(다인실)',
};

/* ═══════════════════════════════════════
   수정요청 확인 리스트 페이지
   ═══════════════════════════════════════ */
export function UpdateRequestListPage({ title, partnerType, canEdit = true }: UpdateRequestListPageProps) {
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
    },
  );

  /* 클라이언트측 필터링 */
  const allItems = data?.adminPartnerUpdateRequests ?? [];
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (partnerType && (item.requestedHospitalData?.partnerType as string) !== partnerType) return false;
      if (appliedFilter.hospCode && !item.hospitalCode?.includes(appliedFilter.hospCode)) return false;
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
    { fetchPolicy: 'network-only' },
  );

  /* ─── GraphQL 기존 신청 상세 조회 ─── */
  const [fetchOriginal] = useLazyQuery<AdminPartnerApplicationByIdResponse>(
    GET_ADMIN_PARTNER_APPLICATION_BY_ID,
    { fetchPolicy: 'network-only' },
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
    const status = (searchStatus === '__all' ? undefined : searchStatus || undefined) as UpdateRequestStatus | undefined;
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

  /* ─── 값 포맷 헬퍼 ─── */
  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'boolean') return val ? '예' : '아니오';
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'string') return val || '-';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  /* ─── 테이블 컬럼 (신청관리와 동일) ─── */
  const columns: ColumnDef<PartnerUpdateRequestModel, unknown>[] = [
    {
      id: 'phisCode',
      header: '요양기관번호',
      size: 110,
      cell: ({ row }) => (row.original.requestedHospitalData?.phisCode as string) || '-',
    },
    {
      id: 'hospName',
      header: '병원명',
      size: 120,
      cell: ({ row }) => (row.original.requestedHospitalData?.name as string) || '-',
    },
    {
      id: 'hospPhone',
      header: '병원전화번호',
      size: 120,
      cell: ({ row }) => (row.original.requestedHospitalData?.phone as string) || '-',
    },
    {
      id: 'directorName',
      header: '대표원장명',
      size: 90,
      cell: ({ row }) => (row.original.requestedApplicationData?.directorName as string) || '-',
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
        return <span className="text-muted-foreground">{updateRequestStatusLabel(val)}</span>;
      },
    },
    {
      accessorKey: 'reviewedAt',
      header: '승인일시',
      size: 130,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
  ];

  /* ─── 변경사항 렌더링 ─── */
  const renderChanges = () => {
    if (!selectedRequest) return null;

    const hospData = selectedRequest.requestedHospitalData || {};
    const appData = selectedRequest.requestedApplicationData || {};
    const hospKeys = Object.keys(hospData);
    const appKeys = Object.keys(appData);

    if (hospKeys.length === 0 && appKeys.length === 0) {
      return <p className="text-sm text-muted-foreground py-4">변경된 항목이 없습니다.</p>;
    }

    return (
      <div className="space-y-5">
        {hospKeys.length > 0 && (
          <>
            <div className="-mx-6 border-y border-border px-6 py-3">
              <h3 className="text-sm font-semibold">병원 정보 변경</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {hospKeys.map((key) => (
                <ChangedField
                  key={key}
                  label={HOSPITAL_FIELD_LABELS[key] || key}
                  oldValue={formatValue(originalData?.hospital?.[key as keyof typeof originalData.hospital])}
                  newValue={formatValue(hospData[key])}
                />
              ))}
            </div>
          </>
        )}
        {appKeys.length > 0 && (
          <>
            <div className="-mx-6 border-y border-border px-6 py-3">
              <h3 className="text-sm font-semibold">신청 정보 변경</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {appKeys.map((key) => (
                <ChangedField
                  key={key}
                  label={APPLICATION_FIELD_LABELS[key] || key}
                  oldValue={formatValue(originalData?.[key as keyof PartnerApplicationDetail])}
                  newValue={formatValue(appData[key])}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

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
              수정요청 확인 : {selectedRequest?.hospitalCode || '-'}
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
            ) : (
              <>
                {/* 기본 정보 */}
                <div className="grid grid-cols-3 gap-4">
                  <FieldGroup label="요청 ID">
                    <Input value={selectedRequest?.id || ''} disabled />
                  </FieldGroup>
                  <FieldGroup label="병원코드">
                    <Input value={selectedRequest?.hospitalCode || ''} disabled />
                  </FieldGroup>
                  <FieldGroup label="요청일시">
                    <Input value={formatDateTime(selectedRequest?.createdAt)} disabled />
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FieldGroup label="상태">
                    <Input value={updateRequestStatusLabel(selectedRequest?.status)} disabled />
                  </FieldGroup>
                  <FieldGroup label="기존 병원명">
                    <Input value={originalData?.hospital?.name || ''} disabled />
                  </FieldGroup>
                  <FieldGroup label="신청 ID">
                    <Input value={selectedRequest?.partnerApplicationId || ''} disabled />
                  </FieldGroup>
                </div>
                {(selectedRequest?.reviewedAt || selectedRequest?.reviewedById) && (
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="처리담당자">
                      <Input value={selectedRequest?.reviewedById || '-'} disabled />
                    </FieldGroup>
                    <FieldGroup label="처리일시">
                      <Input value={formatDateTime(selectedRequest?.reviewedAt)} disabled />
                    </FieldGroup>
                  </div>
                )}

                {/* 변경사항 */}
                {renderChanges()}
              </>
            )}
          </DialogBody>

          <DialogFooter className="justify-between">
            {selectedRequest?.status === 'PENDING' ? (
              <div className="flex gap-2">
                <Button variant="blue" onClick={() => setApproveConfirmOpen(true)} disabled={!canEdit}>
                  수정 승인
                </Button>
                <Button variant="destructive" onClick={() => setRejectOpen(true)} disabled={!canEdit}>
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
