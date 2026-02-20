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
import { Switch } from '@/components/ui/switch';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type {
  MedicalStaffDetail,
  MedicalStaffModel,
} from '@/types/medical-staff';
import { CONSULTANT_STATUS_OPTIONS } from '@/types/medical-staff';
import { type ColumnDef } from '@tanstack/react-table';
import { Check, ImageIcon, Trash2, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

// TODO: API 연동 시 아래 GraphQL import로 교체
// import {
//   DELETE_MEDICAL_STAFFS,
//   GET_ADMIN_MEDICAL_STAFFS,
//   GET_ADMIN_MEDICAL_STAFF_BY_ID,
//   UPDATE_MEDICAL_STAFF,
// } from '@/lib/graphql/queries/medical-staff';
// import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';

/** 소속병원 옵션 (피그마 기준) */
const HOSPITAL_OPTIONS = [
  { value: '', label: '전체' },
  { value: '고려대학교 안암병원', label: '고려대학교 안암병원' },
  { value: '고려대학교 구로병원', label: '고려대학교 구로병원' },
  { value: '고려대학교 안산병원', label: '고려대학교 안산병원' },
] as const;

/* ═══════════════════════════════════════
   Mock 데이터 (API 연동 전 확인용)
   ═══════════════════════════════════════ */
const MOCK_DATA: MedicalStaffDetail[] = [
  {
    id: '1',
    staffNo: '00001',
    name: '남궁성모',
    hospitalName: '고려대학교 안암병원',
    mainDepartment: '심장혈관흉부외과',
    profileImageUrl: '',
    profileImageFilename: '안암병원_심장혈관흉부외과_남궁성모.png',
    profileImageSize: 338000,
    isConsultant: false,
    isVisible: false,
    consultantEmail: '',
    updatedAt: '2025-04-25T10:30:00Z',
    createdAt: '2025-03-10T09:00:00Z',
  },
  {
    id: '2',
    staffNo: '00002',
    name: '김허트',
    hospitalName: '고려대학교 안암병원',
    mainDepartment: '신경외과',
    profileImageUrl: '',
    profileImageFilename: '안암병원_신경외과_김허트.png',
    profileImageSize: 245000,
    isConsultant: true,
    isVisible: true,
    consultantEmail: 'kimheart@korea.ac.kr',
    updatedAt: '2025-04-25T14:20:00Z',
    createdAt: '2025-03-12T11:00:00Z',
  },
  {
    id: '3',
    staffNo: '00003',
    name: '박정형',
    hospitalName: '고려대학교 구로병원',
    mainDepartment: '정형외과',
    profileImageUrl: '',
    profileImageFilename: '구로병원_정형외과_박정형.png',
    profileImageSize: 412000,
    isConsultant: true,
    isVisible: true,
    consultantEmail: 'parkjh@korea.ac.kr',
    updatedAt: '2025-04-20T09:15:00Z',
    createdAt: '2025-02-28T08:30:00Z',
  },
  {
    id: '4',
    staffNo: '00004',
    name: '이소연',
    hospitalName: '고려대학교 안산병원',
    mainDepartment: '소아청소년과',
    profileImageUrl: '',
    profileImageFilename: '안산병원_소아청소년과_이소연.png',
    profileImageSize: 189000,
    isConsultant: false,
    isVisible: true,
    consultantEmail: '',
    updatedAt: '2025-04-18T16:45:00Z',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: '5',
    staffNo: '00005',
    name: '최민수',
    hospitalName: '고려대학교 구로병원',
    mainDepartment: '내분비내과',
    profileImageUrl: '',
    profileImageFilename: '구로병원_내분비내과_최민수.png',
    profileImageSize: 295000,
    isConsultant: true,
    isVisible: true,
    consultantEmail: 'choims@korea.ac.kr',
    updatedAt: '2025-04-15T11:30:00Z',
    createdAt: '2025-01-20T14:00:00Z',
  },
  {
    id: '6',
    staffNo: '00006',
    name: '정유진',
    hospitalName: '고려대학교 안산병원',
    mainDepartment: '피부과',
    profileImageUrl: '',
    profileImageFilename: '안산병원_피부과_정유진.png',
    profileImageSize: 178000,
    isConsultant: false,
    isVisible: false,
    consultantEmail: '',
    updatedAt: '2025-04-10T13:00:00Z',
    createdAt: '2025-02-05T09:30:00Z',
  },
  {
    id: '7',
    staffNo: '00007',
    name: '한상훈',
    hospitalName: '고려대학교 안암병원',
    mainDepartment: '재활의학과',
    profileImageUrl: '',
    profileImageFilename: '안암병원_재활의학과_한상훈.png',
    profileImageSize: 320000,
    isConsultant: true,
    isVisible: true,
    consultantEmail: 'hansh@korea.ac.kr',
    updatedAt: '2025-04-08T10:00:00Z',
    createdAt: '2025-03-01T08:00:00Z',
  },
  {
    id: '8',
    staffNo: '00008',
    name: '김지현',
    hospitalName: '고려대학교 구로병원',
    mainDepartment: '안과',
    profileImageUrl: '',
    profileImageFilename: '구로병원_안과_김지현.png',
    profileImageSize: 256000,
    isConsultant: false,
    isVisible: true,
    consultantEmail: '',
    updatedAt: '2025-04-05T15:30:00Z',
    createdAt: '2025-02-18T11:00:00Z',
  },
  {
    id: '9',
    staffNo: '00009',
    name: '오승환',
    hospitalName: '고려대학교 안산병원',
    mainDepartment: '비뇨의학과',
    profileImageUrl: '',
    profileImageFilename: '안산병원_비뇨의학과_오승환.png',
    profileImageSize: 203000,
    isConsultant: true,
    isVisible: false,
    consultantEmail: 'ohsh@korea.ac.kr',
    updatedAt: '2025-04-01T09:45:00Z',
    createdAt: '2025-01-25T13:00:00Z',
  },
  {
    id: '10',
    staffNo: '00010',
    name: '윤서아',
    hospitalName: '고려대학교 안암병원',
    mainDepartment: '영상의학과',
    profileImageUrl: '',
    profileImageFilename: '안암병원_영상의학과_윤서아.png',
    profileImageSize: 275000,
    isConsultant: false,
    isVisible: true,
    consultantEmail: '',
    updatedAt: '2025-03-28T14:15:00Z',
    createdAt: '2025-02-10T10:30:00Z',
  },
];

/* --- 검색 필드 공통 --- */
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

/* --- 날짜 포맷 --- */
function formatDate(val?: string | null) {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd}`;
}

/* --- 파일 크기 포맷 --- */
function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/* ═══════════════════════════════════════
   의료진 관리 페이지
   ═══════════════════════════════════════ */
export default function MedicalStaffPage() {
  /* --- Mock 데이터 상태 --- */
  const [mockItems, setMockItems] = useState<MedicalStaffDetail[]>(MOCK_DATA);

  /* --- 페이징 --- */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* --- 검색 조건 (입력 중) --- */
  const [searchStaffNo, setSearchStaffNo] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchHospital, setSearchHospital] = useState('');
  const [searchDepartment, setSearchDepartment] = useState('');
  const [searchConsultant, setSearchConsultant] = useState('');

  /* --- 실제 적용된 필터 --- */
  const [appliedFilter, setAppliedFilter] = useState<{
    staffNo?: string;
    name?: string;
    hospitalName?: string;
    mainDepartment?: string;
    isConsultant?: string;
  }>({});

  /* --- Mock 기반 필터링 & 페이징 --- */
  const filteredItems = useMemo(() => {
    return mockItems.filter((item) => {
      if (appliedFilter.staffNo && !item.staffNo.includes(appliedFilter.staffNo)) return false;
      if (appliedFilter.name && !item.name.includes(appliedFilter.name)) return false;
      if (appliedFilter.hospitalName && item.hospitalName !== appliedFilter.hospitalName) return false;
      if (appliedFilter.mainDepartment && !item.mainDepartment.includes(appliedFilter.mainDepartment)) return false;
      if (appliedFilter.isConsultant === 'Y' && !item.isConsultant) return false;
      if (appliedFilter.isConsultant === 'N' && item.isConsultant) return false;
      return true;
    });
  }, [mockItems, appliedFilter]);

  const totalCount = filteredItems.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  /* --- 상세 다이얼로그 --- */
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MedicalStaffDetail | null>(null);

  /* --- 수정 폼 상태 --- */
  const [editConsultant, setEditConsultant] = useState(false);
  const [editEmailLocal, setEditEmailLocal] = useState('');
  const [editEmailDomain, setEditEmailDomain] = useState('');

  /* --- 선택 행 --- */
  const [selectedRows, setSelectedRows] = useState<MedicalStaffModel[]>([]);

  /* --- 삭제 확인 --- */
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  /* --- 저장 확인 --- */
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  /* --- 재검색 --- */
  const handleSearch = useCallback(() => {
    const newFilter = {
      staffNo: searchStaffNo.trim() || undefined,
      name: searchName.trim() || undefined,
      hospitalName: (searchHospital === '__all' ? undefined : searchHospital) || undefined,
      mainDepartment: searchDepartment.trim() || undefined,
      isConsultant: searchConsultant === '__all' ? undefined : searchConsultant || undefined,
    };
    setAppliedFilter(newFilter);
    setCurrentPage(1);
  }, [searchStaffNo, searchName, searchHospital, searchDepartment, searchConsultant]);

  /* --- 초기화 --- */
  const handleReset = () => {
    setSearchStaffNo('');
    setSearchName('');
    setSearchHospital('');
    setSearchDepartment('');
    setSearchConsultant('');
    setAppliedFilter({});
    setCurrentPage(1);
  };

  /* --- 행 클릭 -> 상세 조회 (Mock) --- */
  const handleRowClick = (row: MedicalStaffModel) => {
    const detail = mockItems.find((item) => item.id === row.id);
    if (detail) {
      setSelectedItem(detail);
      setEditConsultant(detail.isConsultant);
      if (detail.consultantEmail) {
        const [local, domain] = detail.consultantEmail.split('@');
        setEditEmailLocal(local ?? '');
        setEditEmailDomain(domain ?? '');
      } else {
        setEditEmailLocal('');
        setEditEmailDomain('');
      }
      setDetailOpen(true);
    }
  };

  /* --- 저장 (Mock) --- */
  const handleSave = async () => {
    if (!selectedItem) return;
    const consultantEmail = editConsultant && editEmailLocal && editEmailDomain
      ? `${editEmailLocal}@${editEmailDomain}`
      : '';

    setMockItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? { ...item, isConsultant: editConsultant, consultantEmail, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
    toast.success('저장되었습니다.');
    setSaveConfirmOpen(false);
    setDetailOpen(false);
  };

  /* --- 일괄 삭제 (Mock) --- */
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      toast.error('삭제할 항목을 선택해주세요.');
      return;
    }
    const deleteIds = new Set(selectedRows.map((r) => r.id));
    setMockItems((prev) => prev.filter((item) => !deleteIds.has(item.id)));
    toast.success(`${selectedRows.length}건이 삭제되었습니다.`);
    setDeleteConfirmOpen(false);
    setSelectedRows([]);
  };

  /* --- 페이징 --- */
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  /* --- 테이블 컬럼 --- */
  const columns: ColumnDef<MedicalStaffModel, unknown>[] = [
    {
      id: 'staffNo',
      header: '사번',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.staffNo}</span>
      ),
      size: 80,
    },
    {
      id: 'profileImage',
      header: '의료진 프로필 사진',
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          {row.original.profileImageUrl ? (
            <img
              src={row.original.profileImageUrl}
              alt={row.original.name}
              className="h-16 w-14 rounded object-cover border border-gray-300"
            />
          ) : (
            <div className="flex h-16 w-14 items-center justify-center rounded border border-gray-300 bg-gray-100">
              <ImageIcon className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
      ),
      size: 140,
    },
    {
      id: 'name',
      header: '성명',
      cell: ({ row }) => (
        <button
          className="text-sm font-medium text-src-blue hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row.original);
          }}
        >
          {row.original.name}
        </button>
      ),
      size: 100,
    },
    {
      id: 'hospitalName',
      header: '소속병원',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.hospitalName}</span>
      ),
      size: 160,
    },
    {
      id: 'mainDepartment',
      header: '주 진료과',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.mainDepartment}</span>
      ),
      size: 150,
    },
    {
      id: 'isConsultant',
      header: '자문의 여부',
      cell: ({ row }) =>
        row.original.isConsultant ? (
          <Check className="mx-auto h-5 w-5 text-src-point" />
        ) : (
          <X className="mx-auto h-5 w-5 text-src-red" />
        ),
      size: 100,
    },
    {
      id: 'isVisible',
      header: '노출여부',
      cell: ({ row }) =>
        row.original.isVisible ? (
          <Check className="mx-auto h-5 w-5 text-src-point" />
        ) : (
          <X className="mx-auto h-5 w-5 text-src-red" />
        ),
      size: 100,
    },
    {
      id: 'updatedAt',
      header: '수정일시',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.updatedAt)}
        </span>
      ),
      size: 120,
    },
  ];

  return (
    <>
      <ListPageTemplate
        title="의료진"
        totalItems={totalCount}
        onSearch={handleSearch}
        onReset={handleReset}
        listHeaderActions={
          <Button
            variant="outline"
            size="md"
            className="text-src-red border-src-red hover:bg-src-red/10"
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
                value={searchStaffNo}
                onChange={(e) => setSearchStaffNo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </FieldGroup>
            <FieldGroup label="성함">
              <Input
                placeholder="성함을 입력해 주세요."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                  {HOSPITAL_OPTIONS.map((opt) => (
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
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
            loading={false}
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

      {/* 상세/수정 다이얼로그 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent size="default">
          <DialogHeader>
            <DialogTitle>
              의료진 조회 및 수정{selectedItem ? ` : ${selectedItem.name}` : ''}
            </DialogTitle>
            <DialogDescription className="sr-only">
              의료진 상세 정보를 조회하고 수정합니다.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="max-h-[60vh] overflow-y-auto space-y-5">
            {selectedItem ? (
              <>
                {/* 이름 */}
                <FieldGroup label="이름">
                  <Input value={selectedItem.name} disabled />
                </FieldGroup>

                {/* 사번 */}
                <FieldGroup label="사번">
                  <Input value={selectedItem.staffNo} disabled />
                </FieldGroup>

                {/* 소속병원 */}
                <FieldGroup label="소속병원">
                  <Input value={selectedItem.hospitalName} disabled />
                </FieldGroup>

                {/* 주 진료과 */}
                <FieldGroup label="주 진료과">
                  <Input value={selectedItem.mainDepartment} disabled />
                </FieldGroup>

                {/* 의료진 프로필 사진 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    의료진 프로필 사진
                  </label>
                  <div className="flex items-start gap-4">
                    {selectedItem.profileImageUrl ? (
                      <img
                        src={selectedItem.profileImageUrl}
                        alt={selectedItem.name}
                        className="h-24 w-20 rounded border border-gray-300 object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-20 items-center justify-center rounded border border-gray-300 bg-gray-100">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1 pt-2">
                      {selectedItem.profileImageFilename && (
                        <>
                          <span className="text-sm text-src-blue">
                            {selectedItem.profileImageFilename}
                            {selectedItem.profileImageSize
                              ? ` (${formatFileSize(selectedItem.profileImageSize)})`
                              : ''}
                          </span>
                          <div className="h-px w-full min-w-[200px] bg-gray-300" />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 자문의 여부 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">자문의 여부</label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editConsultant}
                      onCheckedChange={setEditConsultant}
                    />
                    <span className="text-sm text-muted-foreground">
                      {editConsultant ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>

                {/* 자문의 이메일 입력 */}
                {editConsultant && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">자문의 이메일 입력</label>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder=""
                        value={editEmailLocal}
                        onChange={(e) => setEditEmailLocal(e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium">@</span>
                      <Input
                        placeholder=""
                        value={editEmailDomain}
                        onChange={(e) => setEditEmailDomain(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => setSaveConfirmOpen(true)}
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
