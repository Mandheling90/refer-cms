'use client';

import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { DataTable } from '@/components/organisms/DataTable';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
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
import {
  PARTNER_STATUS_OPTIONS,
  partnerStatusLabel
} from '@/types/cooperation';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { type ColumnDef } from '@tanstack/react-table';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

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

/* ─── 섹션 헤더 ─── */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-6 border-y border-gray-300 px-6 py-3">
      <h3 className="text-sm font-semibold">{children}</h3>
    </div>
  );
}

/* ─── 라디오 필드 (유/무 또는 동의/미동의) ─── */
function RadioField({ label, value, inline }: { label: string; value?: boolean | null; inline?: boolean }) {
  const radioContent = (
    <div className="flex items-center h-10 gap-4">
      <label className="flex items-center gap-1.5 text-sm">
        <input type="radio" className="accent-primary" checked={value === true} disabled />
        {label.includes('동의') ? '수신 동의' : '유'}
      </label>
      <label className="flex items-center gap-1.5 text-sm">
        <input type="radio" className="accent-primary" checked={value !== true} disabled />
        {label.includes('동의') ? '수신 미동의' : '무'}
      </label>
    </div>
  );

  if (inline) return radioContent;

  return (
    <FieldGroup label={label}>
      {radioContent}
    </FieldGroup>
  );
}

/* ─── 체크 아이템 ─── */
function CheckItem({ label, checked }: { label: string; checked?: boolean | null }) {
  return (
    <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
      <Checkbox checked={!!checked} disabled />
      {label}
    </label>
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

  /* ─── 검색 조건 (입력 중) ─── */
  const [searchHospName, setSearchHospName] = useState('');
  const [searchDirectorName, setSearchDirectorName] = useState('');
  const [searchLicenseNo, setSearchLicenseNo] = useState('');
  const [searchInstType, setSearchInstType] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  /* ─── 실제 적용된 필터 ─── */
  const [appliedFilter, setAppliedFilter] = useState<{
    hospName?: string;
    directorName?: string;
    licenseNo?: string;
    instType?: string;
    status?: PartnerStatus;
  }>({});

  /* ─── GraphQL 목록 조회 ─── */
  const { data, loading, refetch } = useQuery<AdminPartnerApplicationsResponse>(
    GET_ADMIN_PARTNER_APPLICATIONS,
    {
      variables: {
        pagination: { page: currentPage, limit: pageSize },
        ...(appliedFilter.status ? { status: appliedFilter.status } : {}),
      },
      fetchPolicy: 'network-only',
    },
  );

  /* 클라이언트측 필터링 (partnerType + 검색 조건) */
  const allItems = data?.adminPartnerApplications?.items ?? [];
  const filteredItems = allItems.filter((item) => {
    if (item.hospital?.partnerType !== partnerType) return false;
    if (appliedFilter.hospName && !item.hospital?.name?.includes(appliedFilter.hospName)) return false;
    if (appliedFilter.directorName && !item.directorName?.includes(appliedFilter.directorName)) return false;
    if (appliedFilter.licenseNo) {
      const licenseNo = (item as unknown as Record<string, string | undefined>).directorLicenseNo;
      if (licenseNo && !licenseNo.includes(appliedFilter.licenseNo)) return false;
    }
    if (appliedFilter.instType) {
      const instType = (item as unknown as Record<string, string | undefined>).institutionType;
      if (instType && !instType.includes(appliedFilter.instType)) return false;
    }
    return true;
  });
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
  const [selectedItem, setSelectedItem] = useState<PartnerApplicationDetail | null>(null);

  /* ─── 확인 다이얼로그 ─── */
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  /* ─── 재검색 ─── */
  const handleSearch = useCallback(() => {
    const status = (searchStatus === '__all' ? undefined : searchStatus || undefined) as PartnerStatus | undefined;
    const newFilter = {
      hospName: searchHospName.trim() || undefined,
      directorName: searchDirectorName.trim() || undefined,
      licenseNo: searchLicenseNo.trim() || undefined,
      instType: searchInstType.trim() || undefined,
      status,
    };
    setAppliedFilter(newFilter);
    setCurrentPage(1);
    refetch({
      pagination: { page: 1, limit: pageSize },
      ...(status ? { status } : {}),
    });
  }, [searchHospName, searchDirectorName, searchLicenseNo, searchInstType, searchStatus, refetch, pageSize]);

  /* ─── 초기화 ─── */
  const handleReset = () => {
    setSearchHospName('');
    setSearchDirectorName('');
    setSearchLicenseNo('');
    setSearchInstType('');
    setSearchStatus('');
    setAppliedFilter({});
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
    try {
      await rejectPartner({
        variables: { id: selectedItem.id, reason: rejectReason.trim() || '반려 처리' },
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
      id: 'classificationCode',
      header: '요양기관번호',
      size: 130,
      cell: ({ row }) => row.original.hospital?.phisCode || '-',
    },
    {
      id: 'hospName',
      header: '병원명',
      size: 160,
      cell: ({ row }) => row.original.hospital?.name || '-',
    },
    {
      id: 'hospPhone',
      header: '병원 전화번호',
      size: 140,
      cell: ({ row }) => row.original.hospital?.phone || '-',
    },
    {
      id: 'directorName',
      header: '대표원장명',
      size: 110,
      cell: ({ row }) => row.original.directorName || '-',
    },
    {
      id: 'directorLicenseNo',
      header: '면허번호',
      size: 110,
      cell: ({ row }) => row.original.directorLicenseNo || '-',
    },
    {
      id: 'institutionType',
      header: '의료기관 유형',
      size: 130,
      cell: ({ row }) => row.original.institutionType || '-',
    },
    {
      accessorKey: 'createdAt',
      header: '신청일시',
      size: 160,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
    {
      accessorKey: 'reviewedById',
      header: '승인 담당자',
      size: 120,
      cell: ({ getValue }) => getValue() as string || '-',
    },
    {
      accessorKey: 'status',
      header: '승인 여부',
      size: 90,
      cell: ({ getValue }) => {
        const val = getValue() as string;
        if (val === 'APPROVED') return <span className="text-src-point text-lg">✓</span>;
        if (val === 'REJECTED') return <span className="text-src-red text-lg">✗</span>;
        return <span className="text-muted-foreground">{partnerStatusLabel(val)}</span>;
      },
    },
    {
      accessorKey: 'approvedAt',
      header: '승인일시',
      size: 160,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
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
            <FieldGroup label="면허번호">
              <Input
                value={searchLicenseNo}
                onChange={(e) => setSearchLicenseNo(e.target.value)}
                placeholder="면허번호 검색"
              />
            </FieldGroup>
            <FieldGroup label="의료기관유형">
              <Input
                value={searchInstType}
                onChange={(e) => setSearchInstType(e.target.value)}
                placeholder="의료기관유형 검색"
              />
            </FieldGroup>
            <FieldGroup label="승인여부">
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
        <DialogContent size="lg" className="max-h-[90vh] grid-rows-[auto_1fr_auto]">
          <DialogHeader>
            <DialogTitle>
              {isHospital ? '협력병원' : '협력의원'}{' '}
              {isApply ? '신청' : '수정'} : {hospital?.name || '-'}
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
              <Tabs defaultValue="phis" className="gap-0">
                <TabsList className="w-full">
                  <TabsTrigger value="phis" className="flex-1">PHIS 연동항목</TabsTrigger>
                  <TabsTrigger value="checklist" className="flex-1">체크리스트 항목</TabsTrigger>
                </TabsList>

                {/* ═══ Tab 1: PHIS 연동항목 ═══ */}
                <TabsContent value="phis" className="space-y-5 pt-5">
                  {/* 기본 병원 정보 */}
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="병원명">
                      <Input value={hospital?.name || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="요양기관번호">
                      <Input value={hospital?.phisCode || hospital?.classificationCode || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="병원종별코드 주소">
                      <Input value={hospital?.website || ''} disabled />
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="병원 전화번호">
                      <Input value={hospital?.phone || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="팩스번호">
                      <Input value={hospital?.faxNumber || ''} disabled />
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="우편번호">
                      <Input value={hospital?.zipCode || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="주소">
                      <Input value={hospital?.address || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="상세주소">
                      <Input value={hospital?.addressDetail || ''} disabled />
                    </FieldGroup>
                  </div>

                  {/* 병원장정보 */}
                  <SectionHeader>병원장정보</SectionHeader>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="병원장명">
                      <Input value={selectedItem.directorName || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="의사면허번호">
                      <Input value={selectedItem.directorLicenseNo || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="생년월일">
                      <Input value={selectedItem.directorBirthDate || ''} disabled />
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="휴대전화">
                      <Input value={selectedItem.directorPhone || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="성별">
                      <Input value={selectedItem.directorGender || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="차량번호">
                      <Input value={selectedItem.directorCarNo || ''} disabled />
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="이메일">
                      <Input value={selectedItem.directorEmail || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="졸업년도">
                      <Input value={selectedItem.directorGraduationYear || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="출신학교">
                      <Input value={selectedItem.directorSchool || ''} disabled />
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="수련병원">
                      <Input value={selectedItem.directorTrainingHospital || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="진료과">
                      <Input value={selectedItem.directorDepartment || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="세부전공">
                      <Input value={selectedItem.directorSubSpecialty || ''} disabled />
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <RadioField label="이메일 수신 동의 여부" value={selectedItem.directorEmailConsent} />
                    <RadioField label="SMS 수신 동의 여부" value={selectedItem.directorSmsConsent} />
                    <RadioField label="회신서 수신 동의 여부" value={selectedItem.directorReplyConsent} />
                  </div>

                  {/* 실무자 정보 */}
                  <SectionHeader>실무자 정보</SectionHeader>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="실무자명">
                      <Input value={selectedItem.staffName || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="부서">
                      <Input value={selectedItem.staffDeptValue || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="직급">
                      <Input value={selectedItem.staffPosition || ''} disabled />
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="연락처">
                      <Input value={selectedItem.staffPhone || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="휴대전화">
                      <Input value={selectedItem.staffTel || ''} disabled />
                    </FieldGroup>
                  </div>

                  {/* 의료기관 유형 */}
                  <SectionHeader>의료기관 유형</SectionHeader>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="의료기관 유형">
                      <Input value={selectedItem.institutionType || ''} disabled />
                    </FieldGroup>
                  </div>

                  {/* 인력현황 */}
                  <SectionHeader>인력현황</SectionHeader>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="총 직원 수">
                      <Input value={selectedItem.totalStaffCount?.toString() || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="전문의 수">
                      <Input value={selectedItem.specialistCount?.toString() || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="간호사 수">
                      <Input value={selectedItem.nurseCount?.toString() || ''} disabled />
                    </FieldGroup>
                  </div>

                  {/* 병원 특성 및 기타사항 */}
                  <SectionHeader>병원 특성 및 기타사항</SectionHeader>
                  <FieldGroup label="비고">
                    <Textarea value={selectedItem.remarks || ''} disabled rows={3} />
                  </FieldGroup>

                  {/* 첨부파일 */}
                  <SectionHeader>첨부파일(사업자등록증, 차량등록증)</SectionHeader>
                  <div className="space-y-2">
                    {(() => {
                      const files = Array.isArray(selectedItem.attachments)
                        ? selectedItem.attachments
                        : [];
                      if (files.length === 0) {
                        return <p className="text-sm text-muted-foreground">첨부파일이 없습니다.</p>;
                      }
                      return files.map((file: { url?: string; filename?: string; name?: string; originalName?: string }, idx: number) => {
                        const fileName = file.originalName || file.filename || file.name || `첨부파일 ${idx + 1}`;
                        const fileUrl = file.url || '';
                        return (
                          <a
                            key={idx}
                            href={fileUrl}
                            download={fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="text-blue-600 underline">{fileName}</span>
                          </a>
                        );
                      });
                    })()}
                  </div>
                </TabsContent>

                {/* ═══ Tab 2: 체크리스트 항목 ═══ */}
                <TabsContent value="checklist" className="space-y-5 pt-5">
                  {/* 기본 병원 정보 */}
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="병원명">
                      <Input value={hospital?.name || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label="요양기관번호">
                      <Input value={hospital?.phisCode || hospital?.classificationCode || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label={isHospital ? '병원종별코드 주소' : '병원홈페이지 주소'}>
                      <Input value={hospital?.website || ''} disabled />
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="병원 전화번호">
                      <Input value={hospital?.phone || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label={isHospital ? '팩스번호' : '병원FAX'}>
                      <Input value={hospital?.faxNumber || ''} disabled />
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldGroup label="병원 주소">
                      <Input value={hospital?.address || ''} disabled />
                    </FieldGroup>
                    <FieldGroup label={isHospital ? '상세주소' : '우편번호'}>
                      <Input value={isHospital ? (hospital?.addressDetail || '') : (hospital?.zipCode || '')} disabled />
                    </FieldGroup>
                    {isHospital && (
                      <FieldGroup label="우편번호">
                        <Input value={hospital?.zipCode || ''} disabled />
                      </FieldGroup>
                    )}
                  </div>

                  {isHospital ? (
                    <>
                      {/* ═══ 협력병원: 전체 체크리스트 ═══ */}
                      {/* 병상 운영 현황 */}
                      <SectionHeader>병상 운영 현황</SectionHeader>
                      <div className="grid grid-cols-3 gap-4">
                        <FieldGroup label="가동병상수">
                          <Input value={selectedItem.activeBedCount?.toString() || ''} disabled />
                        </FieldGroup>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <FieldGroup label="상급병실">
                          <Input value={selectedItem.premiumRoomCount?.toString() || ''} disabled />
                        </FieldGroup>
                        <FieldGroup label="다인실">
                          <Input value={selectedItem.multiRoomCount?.toString() || ''} disabled />
                        </FieldGroup>
                        <FieldGroup label="격리병실">
                          <Input value={selectedItem.isolationRoomCount?.toString() || ''} disabled />
                        </FieldGroup>
                      </div>

                      {/* 시설 운영 현황 */}
                      <SectionHeader>시설 운영 현황</SectionHeader>
                      <div className="grid grid-cols-3 gap-4">
                        <FieldGroup label="중환자실">
                          <Input value={selectedItem.icuCount?.toString() || ''} disabled />
                        </FieldGroup>
                        <FieldGroup label="응급실">
                          <Input value={selectedItem.erCount?.toString() || ''} disabled />
                        </FieldGroup>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-foreground">정신과병동</label>
                          <div className="flex items-center gap-4 h-9">
                            <CheckItem label="일반병동" checked={selectedItem.hasPsychGeneral} />
                            <CheckItem label="폐쇄병동" checked={selectedItem.hasPsychClosed} />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <RadioField label="인공신장실" value={selectedItem.hasDialysisRoom} />
                        <RadioField label="수술실" value={selectedItem.hasOperatingRoom} />
                        <RadioField label="호스피스" value={selectedItem.hasHospice} />
                      </div>
                      <p className="text-sm font-semibold text-foreground">재활치료</p>
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <CheckItem label="물리치료" checked={selectedItem.hasPhysicalTherapy} />
                        <CheckItem label="작업치료" checked={selectedItem.hasRehabOt} />
                        <CheckItem label="언어재활" checked={selectedItem.hasRehabSt} />
                        <CheckItem label="연하재활" checked={selectedItem.hasRehabSwallow} />
                        <CheckItem label="격리재활" checked={selectedItem.hasRehabIsolation} />
                      </div>

                      {/* 진료과 운영 현황 */}
                      <SectionHeader>진료과 운영 현황(전문의 수)</SectionHeader>
                      {(() => {
                        const depts = (selectedItem.departmentSpecialists as Record<string, unknown>) || {};
                        const DEPT_LIST = [
                          '가정의학과', '내과', '마취통증의학과', '방사선종양학과', '병리과',
                          '비뇨의학과', '산부인과', '성형외과', '소아청소년과', '신경과',
                          '신경외과', '신장내과', '안과', '영상의학과', '외과',
                          '응급의학과', '이비인후과', '재활의학과', '정신건강의학과', '정형외과',
                          '진단검사의학과', '치과', '피부과', '심장혈관흉부외과', '한의학과', '기타',
                        ];
                        return (
                          <div className="grid grid-cols-3 gap-4">
                            {DEPT_LIST.map((dept) => (
                              <FieldGroup key={dept} label={dept}>
                                <Input value={String(depts[dept] ?? '')} disabled />
                              </FieldGroup>
                            ))}
                          </div>
                        );
                      })()}

                      {/* 간병시스템 */}
                      <SectionHeader>간병시스템</SectionHeader>
                      <div className="grid grid-cols-3 gap-4">
                        <RadioField label="간호간병통합서비스" value={selectedItem.hasIntegratedNursing} />
                        <RadioField label="보호자 간병" value={selectedItem.hasGuardianCare} />
                        <RadioField label="공동 간병" value={selectedItem.hasSharedCare} />
                      </div>

                      {/* 격리병상 운영 현황 */}
                      <SectionHeader>
                        <span className="flex items-center gap-4">
                          격리병상 운영 현황
                          <RadioField label="" value={selectedItem.hasRehabIsolation} inline />
                        </span>
                      </SectionHeader>
                      <div className="grid grid-cols-3 gap-4">
                        <FieldGroup label="격리병상 수(1인실)">
                          <Input value={selectedItem.isolationSingleCount?.toString() || ''} disabled />
                        </FieldGroup>
                        <FieldGroup label="격리병상 수(2인실)">
                          <Input value={selectedItem.isolationDoubleCount?.toString() || ''} disabled />
                        </FieldGroup>
                        <FieldGroup label="격리병상 수(다인실)">
                          <Input value={selectedItem.isolationTripleCount?.toString() || ''} disabled />
                        </FieldGroup>
                      </div>
                      <p className="text-sm font-semibold text-foreground">격리유형</p>
                      {(() => {
                        const types = selectedItem.isolationTypes;
                        const checkedSet = new Set<string>(
                          Array.isArray(types) ? types as string[] : typeof types === 'object' && types ? Object.keys(types as Record<string, unknown>) : []
                        );
                        const ISOLATION_TYPES = ['VRE', 'CRE', 'CPE', 'TB', '기타'];
                        return (
                          <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {ISOLATION_TYPES.map((t) => (
                              <CheckItem key={t} label={t} checked={checkedSet.has(t)} />
                            ))}
                          </div>
                        );
                      })()}
                      <p className="text-sm font-semibold text-foreground">격리 중 간병</p>
                      {(() => {
                        const careType = selectedItem.isolationCareType || '';
                        const CARE_TYPES = ['공동간병', '개인간병', '보호자간병'];
                        return (
                          <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {CARE_TYPES.map((t) => (
                              <CheckItem key={t} label={t} checked={careType.includes(t)} />
                            ))}
                          </div>
                        );
                      })()}
                      <p className="text-sm font-semibold text-foreground">격리 중 재활</p>
                      {(() => {
                        const rehabType = selectedItem.isolationRehabType || '';
                        const REHAB_TYPES = ['No', '침상재활', '격리병동 재활실 운영'];
                        return (
                          <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {REHAB_TYPES.map((t) => (
                              <CheckItem key={t} label={t} checked={rehabType.includes(t)} />
                            ))}
                          </div>
                        );
                      })()}

                      {/* 주요 보유 장비 */}
                      <SectionHeader>주요 보유 장비</SectionHeader>
                      {(() => {
                        const equip = selectedItem.majorEquipment || '';
                        const EQUIPMENT_LIST = [
                          'X-RAY', 'MRI', 'CT', 'PET', '초음파', '심장초음파',
                          'EKG', '내시경', 'mammography', 'VFSS', '골밀도 검사기',
                          'CPM', 'Ventilator', 'Home Ventilator', 'High flow O2',
                          'Pratable O2/Suction', 'PFT', '혈액투석기', 'CRRT',
                          '정맥주입기 (Infusion pump)',
                        ];
                        return (
                          <div className="grid grid-cols-5 gap-x-4 gap-y-2">
                            {EQUIPMENT_LIST.map((e) => (
                              <CheckItem key={e} label={e} checked={equip.includes(e)} />
                            ))}
                          </div>
                        );
                      })()}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">기타장비</p>
                        <div className="grid grid-cols-3 gap-4">
                          <Input value="" disabled placeholder="기타장비명" />
                          <Input value="" disabled placeholder="기타장비명" />
                          <Input value="" disabled placeholder="기타장비명" />
                        </div>
                      </div>

                      {/* 기본 처치 가능 항목 */}
                      <SectionHeader>기본 처치 가능 항목</SectionHeader>
                      {(() => {
                        const treatments = selectedItem.availableTreatments;
                        const treatStr = typeof treatments === 'string' ? treatments : JSON.stringify(treatments ?? '');
                        const isChecked = (item: string) => treatStr.includes(item);

                        const TREATMENT_CATEGORIES = [
                          {
                            category: '관리',
                            items: [
                              'Tracheostomy care', 'E-tube', 'L-tube', 'PEG',
                              'Foley/Nelaton(CIC)', '배액관(위루관, 장루, 요루 등)',
                              '중심정맥관 삽입 및 관리', 'Chemo-port 관리',
                            ],
                          },
                          {
                            category: '처방',
                            items: [
                              '수혈(전혈, 적혈구, 혈소판)', 'TPN/PPN',
                              '항생제(1, 3세대, Vanco 등)',
                            ],
                          },
                          {
                            category: '드레싱',
                            items: [
                              '욕창 예방 및 치료', 'Vaccum 관리',
                              '단순드레싱 및 복합드레싱',
                            ],
                          },
                          {
                            category: '처치',
                            items: [
                              'Intubation', 'Ventilator care', 'Home Ventilator',
                              'High flow O2', 'O2 Therapy', 'Suction',
                              '복수천자', '흉수천자', '흉관 삽입 및 관리',
                              '혈액투석', '복막투석', 'Enema',
                            ],
                          },
                        ];

                        return TREATMENT_CATEGORIES.map(({ category, items }) => (
                          <div key={category}>
                            <p className="text-sm font-semibold text-foreground">{category}</p>
                            <div className="grid grid-cols-5 gap-x-4 gap-y-2 mt-1">
                              {items.map((item) => (
                                <CheckItem key={item} label={item} checked={isChecked(item)} />
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">기타항목</p>
                        <div className="grid grid-cols-3 gap-4">
                          <Input value="" disabled placeholder="기타항목명" />
                          <Input value="" disabled placeholder="기타항목명" />
                          <Input value="" disabled placeholder="기타항목명" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* ═══ 협력의원: 제한된 체크리스트 ═══ */}
                      <SectionHeader>병원 세부 정보</SectionHeader>

                      {/* 물리치료실 / 투석 / 투약 */}
                      <div className="grid grid-cols-3 gap-4">
                        <RadioField label="물리치료실" value={selectedItem.hasPhysicalTherapy} />
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-foreground">투석</label>
                          <div className="flex items-center h-10 gap-4">
                            <CheckItem label="혈액" checked={selectedItem.hasDialysisRoom} />
                            <CheckItem label="복막" checked={selectedItem.hasRehabIsolation} />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-foreground">투약</label>
                          <div className="flex items-center h-10 gap-4">
                            <label className="flex items-center gap-1.5 text-sm">
                              <input type="radio" className="accent-primary" checked={selectedItem.clinicMedicationInjectable !== true} disabled />
                              불가능
                            </label>
                            <label className="flex items-center gap-1.5 text-sm">
                              <input type="radio" className="accent-primary" checked={selectedItem.clinicMedicationInjectable === true} disabled />
                              G-CSF 피하주사 투여 가능
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* 피부과 / 이비인후과 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-foreground">피부과</label>
                          <div className="flex items-center h-10 gap-4">
                            <CheckItem label="광선치료" checked={selectedItem.clinicLightTherapy} />
                            <CheckItem label="엑시머레이저" checked={selectedItem.clinicExcimerLaser} />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-foreground">이비인후과</label>
                          <div className="flex items-center h-10 gap-4">
                            <CheckItem label="귀 수술환자 단순 소독" checked={selectedItem.clinicEarSurgeryDressing} />
                            <CheckItem label="Betadine Soaking" checked={selectedItem.clinicBetadineSoaking} />
                          </div>
                        </div>
                      </div>

                      {/* 기타 */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-foreground">기타</label>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          <CheckItem label="수술부위 단순 소독" checked={selectedItem.clinicSurgicalDressing} />
                          <CheckItem label="stich out" checked={selectedItem.clinicStitchOut} />
                          <CheckItem label="Chemoport needle out" checked={selectedItem.clinicWoundCare} />
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            ) : null}
          </DialogBody>

          <DialogFooter className="justify-between">
            
            {isApply && selectedItem?.status === 'PENDING' ? (
              <div className="flex gap-2">
                <Button variant="blue" onClick={() => setApproveConfirmOpen(true)}>
                  체결 승인
                </Button>
                <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                  체결 반려
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
        title="체결 승인 처리"
        description={
          <>
            해당 협력병원 체결 신청을 승인하시겠습니까?
            <br />
            승인 사실은 협력병원에 안내되며,
            <br />
            승인 후에는 신청 정보가 PHIS에 등록됩니다.
          </>
        }
        onConfirm={handleApprove}
      />

      {/* ═══ 반려 확인 ═══ */}
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="체결 반려 처리"
        description={
          <>
            해당 협력병원 체결 신청을 반려하시겠습니까?
            <br />
            반려 사실은 협력병원에 안내되며,
            <br />
            반려 후에는 동일 신청 건으로 재처리가 불가합니다.
          </>
        }
        onConfirm={handleReject}
        destructive
      />
    </>
  );
}
