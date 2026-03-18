'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { DataTable } from '@/components/organisms/DataTable';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { HospitalSelector } from '@/components/molecules/HospitalSelector';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Input } from '@/components/ui/input';
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
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/stores/auth-store';
import {
  GET_MEDICAL_STAFF_LIST,
  GET_ADMIN_ECONSULT_CONSULTANTS,
  DESIGNATE_ECONSULT_CONSULTANT,
  DEACTIVATE_ECONSULT_CONSULTANT,
} from '@/lib/graphql/queries/medical-staff';
import type { MedicalStaffItem, MedicalStaffListResponse } from '@/types/medical-staff';
import { CONSULTANT_STATUS_OPTIONS, HOSPITAL_CODE_MAP } from '@/types/medical-staff';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { Check, ImageIcon, Trash2, X } from 'lucide-react';

/** 소속병원 검색 옵션 */
const HOSPITAL_SEARCH_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'ANAM', label: '고려대학교 안암병원' },
  { value: 'GURO', label: '고려대학교 구로병원' },
  { value: 'ANSAN', label: '고려대학교 안산병원' },
] as const;

/* ─── 검색 필드 공통 ─── */
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

/* ─── 날짜 포맷 (YYYYMMDD → YYYY-MM-DD) ─── */
function formatYmd(val?: string | null) {
  if (!val) return '-';
  if (val.length === 8) {
    return `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
  }
  return val;
}

/* ─── 프로필 이미지 파일명 생성 ─── */
function buildProfileFilename(item: MedicalStaffItem) {
  const hospital = HOSPITAL_CODE_MAP[item.hospitalCode ?? ''] ?? item.hospitalCode ?? '';
  const dept = item.departmentName ?? '';
  const name = item.doctorName ?? '';
  return `${hospital} ${dept} ${name}.png`.trim();
}

/* ─── 파일 크기 포맷 ─── */
function formatFileSize(bytes: number) {
  if (bytes <= 0) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/* ─── 이미지 다운로드 (파일명 지정) ─── */
async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // CORS 차단 시 새 탭에서 열기
    window.open(url, '_blank');
  }
}

/* ═══════════════════════════════════════
   의료진 관리 페이지
   ═══════════════════════════════════════ */
export default function MedicalStaffPage() {
  const hospitalCode = useAuthStore((s) => s.getEffectiveHospitalCode());

  /* ─── 페이징 ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 조건 (입력 중) ─── */
  const [searchDoctorId, setSearchDoctorId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchHospital, setSearchHospital] = useState('');
  const [searchDepartment, setSearchDepartment] = useState('');
  const [searchConsultant, setSearchConsultant] = useState('');

  /* ─── 상세 다이얼로그 ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MedicalStaffItem | null>(null);

  /* ─── 수정 폼 상태 ─── */
  const [editConsultant, setEditConsultant] = useState(false);
  const [editEmailLocal, setEditEmailLocal] = useState('');
  const [editEmailDomain, setEditEmailDomain] = useState('');
  const [consultantRecordId, setConsultantRecordId] = useState<string | null>(null);
  const [imageFileSize, setImageFileSize] = useState<number>(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  /* ─── 이미지 파일 크기 조회 ─── */
  useEffect(() => {
    if (!selectedItem?.photoUrl) {
      setImageFileSize(0);
      setImageLoaded(false);
      return;
    }
    setImageLoaded(false);
    // HEAD 요청 시도 → 실패 시 blob으로 fallback
    fetch(selectedItem.photoUrl, { method: 'HEAD' })
      .then((res) => {
        const len = res.headers.get('content-length');
        if (len && parseInt(len, 10) > 0) {
          setImageFileSize(parseInt(len, 10));
        } else {
          return fetch(selectedItem.photoUrl!)
            .then((r) => r.blob())
            .then((blob) => setImageFileSize(blob.size));
        }
      })
      .catch(() => {
        fetch(selectedItem.photoUrl!)
          .then((r) => r.blob())
          .then((blob) => setImageFileSize(blob.size))
          .catch(() => setImageFileSize(0));
      });
  }, [selectedItem?.photoUrl]);

  /* ─── 선택 행 / 확인 다이얼로그 ─── */
  const [selectedRows, setSelectedRows] = useState<MedicalStaffItem[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  /* ─── GraphQL 전체 목록 조회 ─── */
  const { data, loading, refetch } = useQuery<MedicalStaffListResponse>(
    GET_MEDICAL_STAFF_LIST,
    {
      variables: { filter: {} },
      fetchPolicy: 'network-only',
    },
  );

  /* ─── 자문의 목록 조회 ─── */
  const {
    data: consultantsData,
    loading: consultantsLoading,
    refetch: refetchConsultants,
  } = useQuery<{
    adminEconsultConsultants: { id: string; doctorId: string; email: string; isActive: boolean }[];
  }>(GET_ADMIN_ECONSULT_CONSULTANTS, {
    variables: { hospitalCode },
    fetchPolicy: 'network-only',
  });
  const activeConsultantIds = useMemo(() => {
    const set = new Set<string>();
    consultantsData?.adminEconsultConsultants?.forEach((c) => {
      if (c.isActive) set.add(c.doctorId);
    });
    return set;
  }, [consultantsData]);

  /* ─── 자문의 관련 mutation ─── */
  const [fetchConsultantsByHospital] = useLazyQuery<{
    adminEconsultConsultants: { id: string; doctorId: string; email: string; isActive: boolean }[];
  }>(GET_ADMIN_ECONSULT_CONSULTANTS, { fetchPolicy: 'network-only' });
  const [designateConsultant] = useMutation(DESIGNATE_ECONSULT_CONSULTANT);
  const [deactivateConsultant] = useMutation(DEACTIVATE_ECONSULT_CONSULTANT);

  const allItems = data?.medicalStaffList?.items ?? [];
  const tableLoading = loading || consultantsLoading;

  /* ─── 프론트 필터링 (입력 즉시 반영) ─── */
  const filteredItems = useMemo(() => {
    const doctorIdTrim = searchDoctorId.trim();
    const nameTrim = searchName.trim();
    const hospitalVal = searchHospital === '__all' ? '' : searchHospital;
    const deptTrim = searchDepartment.trim();
    const consultantVal = searchConsultant === '__all' ? '' : searchConsultant;

    return allItems.filter((item) => {
      if (doctorIdTrim && !item.doctorId.includes(doctorIdTrim)) return false;
      if (nameTrim && !item.doctorName.includes(nameTrim)) return false;
      if (hospitalVal && item.hospitalCode !== hospitalVal) return false;
      if (deptTrim && !(item.departmentName ?? '').includes(deptTrim)) return false;
      if (consultantVal) {
        const isConsultant = activeConsultantIds.has(item.doctorId);
        if (consultantVal === 'Y' && !isConsultant) return false;
        if (consultantVal === 'N' && isConsultant) return false;
      }
      return true;
    });
  }, [allItems, searchDoctorId, searchName, searchHospital, searchDepartment, searchConsultant, activeConsultantIds]);

  const totalCount = filteredItems.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  /* 필터 변경 시 1페이지로 리셋 */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchDoctorId, searchName, searchHospital, searchDepartment, searchConsultant]);

  /* ─── 프론트 페이징 ─── */
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  /* ─── 재검색 (API 재조회) ─── */
  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    refetch();
    refetchConsultants();
  }, [refetch, refetchConsultants]);

  /* ─── 초기화 ─── */
  const handleReset = () => {
    setSearchDoctorId('');
    setSearchName('');
    setSearchHospital('');
    setSearchDepartment('');
    setSearchConsultant('');
    setCurrentPage(1);
  };

  /* ─── 행 클릭 → 상세 다이얼로그 ─── */
  const handleRowClick = useCallback(
    async (row: MedicalStaffItem) => {
      setSelectedItem(row);
      const isConsultant = activeConsultantIds.has(row.doctorId);
      setEditConsultant(isConsultant);
      setEditEmailLocal('');
      setEditEmailDomain('');
      setConsultantRecordId(null);

      // 자문의인 경우 consultant record 조회 (id, email)
      if (isConsultant && row.hospitalCode) {
        try {
          const { data: cData } = await fetchConsultantsByHospital({
            variables: { hospitalCode: row.hospitalCode },
          });
          const record = cData?.adminEconsultConsultants?.find(
            (c) => c.doctorId === row.doctorId && c.isActive,
          );
          if (record) {
            setConsultantRecordId(record.id);
            const [local, domain] = (record.email ?? '').split('@');
            setEditEmailLocal(local ?? '');
            setEditEmailDomain(domain ?? '');
          }
        } catch {
          // 조회 실패 시 무시
        }
      }
      setDetailOpen(true);
    },
    [activeConsultantIds, fetchConsultantsByHospital],
  );

  /* ─── 저장 ─── */
  const handleSave = async () => {
    if (!selectedItem) return;
    try {
      if (editConsultant) {
        // 자문의 지정 (On)
        const localPart = editEmailLocal.trim();
        const domainPart = editEmailDomain.trim();
        if (!localPart || !domainPart) {
          toast.error('자문의 이메일을 입력해 주세요.');
          setSaveConfirmOpen(false);
          return;
        }
        const fullEmail = `${localPart}@${domainPart}`;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fullEmail)) {
          toast.error('올바른 이메일 형식으로 입력해 주세요.');
          setSaveConfirmOpen(false);
          return;
        }
        await designateConsultant({
          variables: {
            input: {
              hospitalCode: selectedItem.hospitalCode,
              doctorId: selectedItem.doctorId,
              email: fullEmail,
            },
          },
        });
      } else if (consultantRecordId) {
        // 자문의 해제 (Off)
        await deactivateConsultant({
          variables: { id: consultantRecordId },
        });
      }
      toast.success('저장되었습니다.');
      setSaveConfirmOpen(false);
      setDetailOpen(false);
      refetchConsultants();
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
    // TODO: mutation 연동
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
  const columns: ColumnDef<MedicalStaffItem, unknown>[] = useMemo(
    () => [
    {
      id: 'doctorId',
      header: '사번',
      cell: ({ row }: { row: { original: MedicalStaffItem } }) => (
        <span className="text-sm text-muted-foreground">{row.original.doctorId}</span>
      ),
      size: 80,
    },
    {
      id: 'photoUrl',
      header: '의료진 프로필 사진',
      cell: ({ row }: { row: { original: MedicalStaffItem } }) => (
        <div className="flex items-center justify-center">
          {row.original.photoUrl ? (
            <img
              src={row.original.photoUrl}
              alt={row.original.doctorName}
              className="h-16 w-14 rounded object-cover border border-border"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                target.parentElement!.querySelector('.img-fallback')?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`flex h-16 w-14 items-center justify-center rounded border border-border bg-muted img-fallback ${row.original.photoUrl ? 'hidden' : ''}`}
          >
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      ),
      size: 140,
    },
    {
      id: 'doctorName',
      header: '성명',
      cell: ({ row }: { row: { original: MedicalStaffItem } }) => (
        <button
          className="text-primary underline underline-offset-2 hover:text-primary/90 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row.original);
          }}
        >
          {row.original.doctorName}
        </button>
      ),
      size: 100,
    },
    {
      id: 'hospitalCode',
      header: '소속병원',
      cell: ({ row }) => (
        <span className="text-sm">
          {HOSPITAL_CODE_MAP[row.original.hospitalCode ?? ''] ?? row.original.hospitalCode ?? '-'}
        </span>
      ),
      size: 160,
    },
    {
      id: 'departmentName',
      header: '주 진료과',
      cell: ({ row }) => <span className="text-sm">{row.original.departmentName ?? '-'}</span>,
      size: 150,
    },
    {
      id: 'smcrYn',
      header: '자문의 여부',
      cell: ({ row }) =>
        activeConsultantIds.has(row.original.doctorId) ? (
          <Check className="mx-auto h-5 w-5 text-green-600" />
        ) : (
          <X className="mx-auto h-5 w-5 text-red-500" />
        ),
      size: 100,
    },
    {
      id: 'frvsMdcrPsblYn',
      header: '초진가능',
      cell: ({ row }) =>
        row.original.frvsMdcrPsblYn === 'Y' ? (
          <Check className="mx-auto h-5 w-5 text-green-600" />
        ) : (
          <X className="mx-auto h-5 w-5 text-red-500" />
        ),
      size: 80,
    },
    {
      id: 'revsMdcrPsblYn',
      header: '재진가능',
      cell: ({ row }) =>
        row.original.revsMdcrPsblYn === 'Y' ? (
          <Check className="mx-auto h-5 w-5 text-green-600" />
        ) : (
          <X className="mx-auto h-5 w-5 text-red-500" />
        ),
      size: 80,
    },
    {
      id: 'apstYmd',
      header: '발령일',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatYmd(row.original.apstYmd)}</span>
      ),
      size: 110,
    },
  ], [handleRowClick, activeConsultantIds]);

  return (
    <>
      <ListPageTemplate
        title="의료진"
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
            <FieldGroup label="사번">
              <Input
                placeholder="사번을 입력해 주세요."
                value={searchDoctorId}
                onChange={(e) => setSearchDoctorId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </FieldGroup>
            <FieldGroup label="성함">
              <Input
                placeholder="성함을 입력해 주세요."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </FieldGroup>
            <FieldGroup label="소속병원">
              <Select
                value={searchHospital || '__all'}
                onValueChange={(v) => setSearchHospital(v === '__all' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  {HOSPITAL_SEARCH_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || '__all'} value={opt.value || '__all'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="주 진료과">
              <Input
                placeholder="주 진료과를 입력해 주세요."
                value={searchDepartment}
                onChange={(e) => setSearchDepartment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </FieldGroup>
            <FieldGroup label="자문의 여부">
              <Select
                value={searchConsultant || '__all'}
                onValueChange={(v) => setSearchConsultant(v === '__all' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  {CONSULTANT_STATUS_OPTIONS.map((opt) => (
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
            loading={tableLoading}
            totalItems={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onRowClick={handleRowClick}
            enableSelection
            onSelectionChange={setSelectedRows}
            getRowId={(row) => row.doctorId}
          />
        }
      />

      {/* ═══ 상세/수정 다이얼로그 ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-[560px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-normal">
              의료진 조회 및 수정{selectedItem ? ` : ${selectedItem.doctorName}` : ''}
            </DialogTitle>
            <DialogDescription className="sr-only">
              의료진 상세 정보를 조회하고 수정합니다.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="overflow-y-auto space-y-5">
            {selectedItem && (
              <>
                {/* 성명 */}
                <FieldGroup label="성명">
                  <Input value={selectedItem.doctorName} disabled />
                </FieldGroup>

                {/* 사번 */}
                <FieldGroup label="사번">
                  <Input value={selectedItem.doctorId} disabled />
                </FieldGroup>

                {/* 소속병원 */}
                <FieldGroup label="소속병원">
                  <Input
                    value={
                      HOSPITAL_CODE_MAP[selectedItem.hospitalCode ?? ''] ??
                      selectedItem.hospitalCode ??
                      ''
                    }
                    disabled
                  />
                </FieldGroup>

                {/* 주 진료과 */}
                <FieldGroup label="주 진료과">
                  <Input value={selectedItem.departmentName ?? ''} disabled />
                </FieldGroup>

                {/* 의료진 프로필 사진 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    의료진 프로필 사진
                  </label>
                  <div className="flex items-end gap-4">
                    {selectedItem.photoUrl && imageLoaded ? (
                      <img
                        src={selectedItem.photoUrl}
                        alt={selectedItem.doctorName}
                        className="h-[274px] w-[188px] shrink-0 rounded border border-border object-cover"
                        onError={() => setImageLoaded(false)}
                      />
                    ) : (
                      <div className="flex h-[274px] w-[188px] shrink-0 items-center justify-center rounded border border-border bg-muted">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {/* 이미지 로드 성공 시에만 파일명 표시 */}
                    {selectedItem.photoUrl && imageLoaded && (
                      <div className="flex flex-col gap-1 pb-1">
                        <span className="text-sm">
                          <button
                            type="button"
                            className="text-blue-500 underline underline-offset-2 hover:text-blue-600 cursor-pointer"
                            onClick={() =>
                              downloadImage(
                                selectedItem.photoUrl!,
                                buildProfileFilename(selectedItem)
                              )
                            }
                          >
                            {buildProfileFilename(selectedItem)}
                          </button>
                          {imageFileSize > 0 && (
                            <span className="text-muted-foreground">
                              {' '}
                              ({formatFileSize(imageFileSize)})
                            </span>
                          )}
                        </span>
                        <div className="h-px w-full min-w-[250px] bg-border" />
                      </div>
                    )}
                    {/* 숨겨진 img로 로드 성공 여부 판별 */}
                    {selectedItem.photoUrl && !imageLoaded && (
                      <img
                        src={selectedItem.photoUrl}
                        alt=""
                        className="hidden"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(false)}
                      />
                    )}
                  </div>
                </div>

                {/* 자문의 여부 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">자문의 여부</label>
                  <div className="flex items-center gap-2">
                    <Switch checked={editConsultant} onCheckedChange={setEditConsultant} />
                    <span className="text-sm text-muted-foreground">
                      {editConsultant ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>

                {/* 자문의 이메일 */}
                <FieldGroup label="자문의 이메일">
                  <div className="flex items-center gap-3">
                    <Input
                      className="flex-1"
                      placeholder="이메일"
                      value={editEmailLocal}
                      onChange={(e) => setEditEmailLocal(e.target.value)}
                    />
                    <span className="text-[22px] shrink-0">@</span>
                    <Input
                      className="flex-1"
                      placeholder="도메인"
                      value={editEmailDomain}
                      onChange={(e) => setEditEmailDomain(e.target.value)}
                    />
                  </div>
                </FieldGroup>

                {/* 약력 */}
                {selectedItem.bio && (
                  <FieldGroup label="약력">
                    <div className="rounded-md border border-border bg-muted p-3 text-sm whitespace-pre-wrap">
                      {selectedItem.bio}
                    </div>
                  </FieldGroup>
                )}

                {/* 발령 기간 */}
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="발령시작일">
                    <Input value={formatYmd(selectedItem.apstYmd)} disabled />
                  </FieldGroup>
                  <FieldGroup label="발령종료일">
                    <Input value={formatYmd(selectedItem.apfnYmd)} disabled />
                  </FieldGroup>
                </div>

                {/* 빠른진료일 */}
                {selectedItem.fastMdcrDt && (
                  <FieldGroup label="빠른진료일">
                    <Input value={formatYmd(selectedItem.fastMdcrDt)} disabled />
                  </FieldGroup>
                )}
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
            <Button
              variant="dark"
              onClick={() => setSaveConfirmOpen(true)}
              className="rounded-md px-4"
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 저장 확인 */}
      <ConfirmDialog
        open={saveConfirmOpen}
        onOpenChange={setSaveConfirmOpen}
        title="저장 확인"
        description="변경사항을 저장하시겠습니까?"
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
