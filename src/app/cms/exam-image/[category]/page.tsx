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
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type {
  ExamImageApprovalStatus,
  ExamImageDetail,
  ExamImageModel,
  UploadedImage,
} from '@/types/exam-image';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// TODO: API 연동 시 GraphQL import로 교체
// import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
// import { ... } from '@/lib/graphql/queries/exam-image';

/* ═══════════════════════════════════════
   카테고리별 타이틀 매핑
   ═══════════════════════════════════════ */
const CATEGORY_TITLE: Record<string, string> = {
  radiology: '영상검사',
  endoscopy: '내시경검사',
  etc: '기타검사',
};

/* ═══════════════════════════════════════
   Mock 데이터
   ═══════════════════════════════════════ */
const MOCK_DATA: ExamImageDetail[] = [
  {
    id: '1', no: 12, patientName: '남궁성모', residentNo: '980218-*******', patientNo: '12345',
    examDate: '2025-04-25 16:33', examName: 'CT- Chest(CE)[G] - 다중검사시 조영제차감',
    imageRequestDate: '2025-04-25 16:33', partnerDoctor: '이철수',
    approvalStatus: 'PENDING', imageCount: 0,
    images: [],
    createdAt: '2025-04-25T16:33:00Z', updatedAt: '2025-04-25T16:33:00Z',
  },
  {
    id: '2', no: 11, patientName: '남궁성모', residentNo: '980218-*******', patientNo: '12345',
    examDate: '2025-04-25 16:33', examName: 'CT- Chest(CE)[G] - 다중검사시 조영제차감',
    imageRequestDate: '2025-04-25 16:33', partnerDoctor: '김현장',
    approvalStatus: 'APPROVED', imageCount: 4,
    images: [
      { id: 'img1', fileName: '이미지_018683970362.jpg', fileSize: '3kb' },
      { id: 'img2', fileName: '이미지_018683970363.jpg', fileSize: '3kb' },
      { id: 'img3', fileName: '이미지_018683970364.jpg', fileSize: '3kb' },
      { id: 'img4', fileName: '이미지_018683970365.jpg', fileSize: '3kb' },
    ],
    createdAt: '2025-04-25T16:33:00Z', updatedAt: '2025-04-25T16:33:00Z',
  },
  {
    id: '3', no: 10, patientName: '남궁성모', residentNo: '980218-*******', patientNo: '12345',
    examDate: '2025-04-25 16:33', examName: 'CT- Chest(CE)[G] - 다중검사시 조영제차감',
    imageRequestDate: '2025-04-25 16:33', partnerDoctor: '최지원',
    approvalStatus: 'APPROVED', imageCount: 3,
    images: [
      { id: 'img5', fileName: '이미지_018683970370.jpg', fileSize: '5kb' },
      { id: 'img6', fileName: '이미지_018683970371.jpg', fileSize: '4kb' },
      { id: 'img7', fileName: '이미지_018683970372.jpg', fileSize: '3kb' },
    ],
    createdAt: '2025-04-25T16:33:00Z', updatedAt: '2025-04-25T16:33:00Z',
  },
  {
    id: '4', no: 10, patientName: '정수빈', residentNo: '001105-*******', patientNo: '56789',
    examDate: '2025-04-24 10:20', examName: 'CT- Abdomen(CE) - 복부 조영 CT',
    imageRequestDate: '2025-04-24 10:20', partnerDoctor: '박상훈',
    approvalStatus: 'APPROVED', imageCount: 0,
    images: [],
    createdAt: '2025-04-24T10:20:00Z', updatedAt: '2025-04-24T10:20:00Z',
  },
  {
    id: '9', no: 6, patientName: '남궁성모', residentNo: '980218-*******', patientNo: '12345',
    examDate: '2025-04-25 16:33', examName: 'CT- Chest(CE)[G] - 다중검사시 조영제차감',
    imageRequestDate: '2025-04-25 16:33', partnerDoctor: '최지원',
    approvalStatus: 'REJECTED', imageCount: 0,
    images: [],
    createdAt: '2025-04-25T16:33:00Z', updatedAt: '2025-04-25T16:33:00Z',
  },
  {
    id: '5', no: 10, patientName: '남궁성모', residentNo: '980218-*******', patientNo: '12345',
    examDate: '2025-01-25 16:33', examName: 'CT- Chest(CE)[G] - 다중검사시 조영제차감',
    imageRequestDate: '2025-01-25 16:33', partnerDoctor: '최지원',
    approvalStatus: 'EXPIRED', imageCount: 0,
    images: [],
    createdAt: '2025-01-25T16:33:00Z', updatedAt: '2025-01-25T16:33:00Z',
  },
  {
    id: '6', no: 9, patientName: '김영희', residentNo: '910315-*******', patientNo: '23456',
    examDate: '2025-04-20 09:15', examName: 'MRI Brain(CE) - 조영증강',
    imageRequestDate: '2025-04-20 09:15', partnerDoctor: '박상훈',
    approvalStatus: 'APPROVED', imageCount: 6,
    images: [
      { id: 'img10', fileName: '이미지_018683970380.jpg', fileSize: '4kb' },
      { id: 'img11', fileName: '이미지_018683970381.jpg', fileSize: '4kb' },
      { id: 'img12', fileName: '이미지_018683970382.jpg', fileSize: '5kb' },
      { id: 'img13', fileName: '이미지_018683970383.jpg', fileSize: '3kb' },
      { id: 'img14', fileName: '이미지_018683970384.jpg', fileSize: '4kb' },
      { id: 'img15', fileName: '이미지_018683970385.jpg', fileSize: '3kb' },
    ],
    createdAt: '2025-04-20T09:15:00Z', updatedAt: '2025-04-20T09:15:00Z',
  },
  {
    id: '7', no: 8, patientName: '박철호', residentNo: '850712-*******', patientNo: '34567',
    examDate: '2025-04-18 14:30', examName: 'X-Ray Chest PA',
    imageRequestDate: '2025-04-18 14:30', partnerDoctor: '이철수',
    approvalStatus: 'PENDING', imageCount: 0,
    images: [],
    createdAt: '2025-04-18T14:30:00Z', updatedAt: '2025-04-18T14:30:00Z',
  },
  {
    id: '8', no: 7, patientName: '이민정', residentNo: '770923-*******', patientNo: '45678',
    examDate: '2025-04-15 11:00', examName: 'US Abdomen',
    imageRequestDate: '2025-04-15 11:00', partnerDoctor: '김현장',
    approvalStatus: 'APPROVED', imageCount: 2,
    images: [
      { id: 'img20', fileName: '이미지_018683970390.jpg', fileSize: '6kb' },
      { id: 'img21', fileName: '이미지_018683970391.jpg', fileSize: '5kb' },
    ],
    createdAt: '2025-04-15T11:00:00Z', updatedAt: '2025-04-15T11:00:00Z',
  },
];

/* --- 공통 컴포넌트 --- */
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

/* --- 읽기 전용 필드 (다이얼로그용) --- */
function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <Input value={value} disabled />
    </div>
  );
}

/* --- 승인 상태 뱃지 --- */
function ApprovalBadge({ status }: { status: ExamImageApprovalStatus }) {
  const config: Record<ExamImageApprovalStatus, { label: string; className: string }> = {
    PENDING: { label: '대기', className: 'bg-gray-100 text-gray-600 border-gray-300' },
    APPROVED: { label: '승인 완료', className: 'bg-green-50 text-green-700 border-green-300' },
    REJECTED: { label: '반려 완료', className: 'bg-red-50 text-red-600 border-red-300' },
    EXPIRED: { label: '기간 만료', className: 'text-muted-foreground' },
  };
  const { label, className } = config[status] ?? config.PENDING;

  if (status === 'EXPIRED') {
    return <span className={`text-sm ${className}`}>{label}</span>;
  }
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════
   검사이미지 관리 페이지
   ═══════════════════════════════════════ */
export default function ExamImagePage() {
  const params = useParams();
  const category = params.category as string;
  const pageTitle = CATEGORY_TITLE[category] ?? '검사이미지 관리';

  const [mockItems, setMockItems] = useState<ExamImageDetail[]>(MOCK_DATA);

  /* --- 페이징 --- */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* --- 검색 조건 --- */
  const [searchPatientName, setSearchPatientName] = useState('');
  const [searchResidentNo, setSearchResidentNo] = useState('');
  const [searchPatientNo, setSearchPatientNo] = useState('');
  const [searchDoctor, setSearchDoctor] = useState('');
  const [searchExamName, setSearchExamName] = useState('');

  const [appliedFilter, setAppliedFilter] = useState<{
    patientName?: string;
    residentNo?: string;
    patientNo?: string;
    partnerDoctor?: string;
    examName?: string;
  }>({});

  /* --- 필터링 & 페이징 --- */
  const filteredItems = useMemo(() => {
    return mockItems.filter((item) => {
      if (appliedFilter.patientName && !item.patientName.includes(appliedFilter.patientName)) return false;
      if (appliedFilter.residentNo && !item.residentNo.includes(appliedFilter.residentNo)) return false;
      if (appliedFilter.patientNo && !item.patientNo.includes(appliedFilter.patientNo)) return false;
      if (appliedFilter.partnerDoctor && !item.partnerDoctor.includes(appliedFilter.partnerDoctor)) return false;
      if (appliedFilter.examName && !item.examName.includes(appliedFilter.examName)) return false;
      return true;
    });
  }, [mockItems, appliedFilter]);

  const totalCount = filteredItems.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  /* --- 선택 행 --- */
  const [selectedRows, setSelectedRows] = useState<ExamImageModel[]>([]);

  /* --- 다이얼로그 상태 --- */
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExamImageDetail | null>(null);

  /* --- 확인 다이얼로그 --- */
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteAllImagesOpen, setDeleteAllImagesOpen] = useState(false);
  const [deleteSingleImageOpen, setDeleteSingleImageOpen] = useState(false);
  const [deleteTargetImageId, setDeleteTargetImageId] = useState<string | null>(null);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [actionTargetId, setActionTargetId] = useState<string | null>(null);

  /* --- 파일 업로드 참조 --- */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* --- 검색 --- */
  const handleSearch = useCallback(() => {
    setAppliedFilter({
      patientName: searchPatientName.trim() || undefined,
      residentNo: searchResidentNo.trim() || undefined,
      patientNo: searchPatientNo.trim() || undefined,
      partnerDoctor: searchDoctor.trim() || undefined,
      examName: searchExamName.trim() || undefined,
    });
    setCurrentPage(1);
  }, [searchPatientName, searchResidentNo, searchPatientNo, searchDoctor, searchExamName]);

  const handleReset = () => {
    setSearchPatientName('');
    setSearchResidentNo('');
    setSearchPatientNo('');
    setSearchDoctor('');
    setSearchExamName('');
    setAppliedFilter({});
    setCurrentPage(1);
  };

  /* --- 이미지 등록 열기 --- */
  const handleOpenRegister = (row: ExamImageModel) => {
    const detail = mockItems.find((i) => i.id === row.id);
    if (detail) {
      setSelectedItem(detail);
      setRegisterOpen(true);
    }
  };

  /* --- 이미지 수정/조회 열기 --- */
  const handleOpenEdit = (row: ExamImageModel) => {
    const detail = mockItems.find((i) => i.id === row.id);
    if (detail) {
      setSelectedItem(detail);
      setEditOpen(true);
    }
  };

  /* --- 승인 (Mock) --- */
  const handleApprove = () => {
    if (!actionTargetId) return;
    setMockItems((prev) =>
      prev.map((item) =>
        item.id === actionTargetId ? { ...item, approvalStatus: 'APPROVED' as const } : item,
      ),
    );
    toast.success('승인 처리되었습니다.');
    setApproveConfirmOpen(false);
    setActionTargetId(null);
  };

  /* --- 반려 (Mock) --- */
  const handleReject = () => {
    if (!actionTargetId) return;
    setMockItems((prev) =>
      prev.map((item) =>
        item.id === actionTargetId ? { ...item, approvalStatus: 'REJECTED' as const } : item,
      ),
    );
    toast.success('반려 처리되었습니다.');
    setRejectConfirmOpen(false);
    setActionTargetId(null);
  };

  /* --- 파일 업로드 (Mock) --- */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedItem) return;

    const newImages: UploadedImage[] = Array.from(files).map((file, idx) => ({
      id: `new_${Date.now()}_${idx}`,
      fileName: file.name,
      fileSize: file.size < 1024 ? `${file.size}b` : `${Math.round(file.size / 1024)}kb`,
    }));

    const updated = {
      ...selectedItem,
      images: [...selectedItem.images, ...newImages],
      imageCount: selectedItem.images.length + newImages.length,
    };
    setSelectedItem(updated);
    setMockItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    toast.success(`${files.length}개 파일이 업로드되었습니다.`);
    e.target.value = '';
  };

  /* --- 저장 (Mock) --- */
  const handleSaveRegister = () => {
    toast.success('이미지가 등록되었습니다.');
    setRegisterOpen(false);
  };

  const handleSaveEdit = () => {
    toast.success('저장되었습니다.');
    setEditOpen(false);
  };

  /* --- 전체이미지 삭제 (Mock) --- */
  const handleDeleteAllImages = () => {
    if (!selectedItem) return;
    const updated = { ...selectedItem, images: [], imageCount: 0 };
    setSelectedItem(updated);
    setMockItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    toast.success('전체 이미지가 삭제되었습니다.');
    setDeleteAllImagesOpen(false);
  };

  /* --- 개별 이미지 삭제 (Mock) --- */
  const handleDeleteSingleImage = () => {
    if (!selectedItem || !deleteTargetImageId) return;
    const updated = {
      ...selectedItem,
      images: selectedItem.images.filter((img) => img.id !== deleteTargetImageId),
      imageCount: selectedItem.images.length - 1,
    };
    setSelectedItem(updated);
    setMockItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    toast.success('이미지가 삭제되었습니다.');
    setDeleteSingleImageOpen(false);
    setDeleteTargetImageId(null);
  };

  /* --- 일괄 삭제 (Mock) --- */
  const handleBulkDelete = () => {
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
  const columns: ColumnDef<ExamImageModel, unknown>[] = [
    {
      id: 'no',
      header: '번호',
      cell: ({ row }) => <span className="text-sm">{row.original.no}</span>,
      size: 60,
    },
    {
      id: 'patientName',
      header: '환자명',
      cell: ({ row }) => <span className="text-sm">{row.original.patientName}</span>,
      size: 80,
    },
    {
      id: 'residentNo',
      header: '주민등록번호',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.residentNo}</span>,
      size: 120,
    },
    {
      id: 'patientNo',
      header: '환자번호',
      cell: ({ row }) => <span className="text-sm">{row.original.patientNo}</span>,
      size: 80,
    },
    {
      id: 'examDate',
      header: '검사일시',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.examDate}</span>,
      size: 140,
    },
    {
      id: 'examName',
      header: '검사명',
      cell: ({ row }) => <span className="text-sm">{row.original.examName}</span>,
      size: 200,
    },
    {
      id: 'imageRequestDate',
      header: '이미지신청일',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.imageRequestDate}</span>,
      size: 140,
    },
    {
      id: 'partnerDoctor',
      header: '협력의',
      cell: ({ row }) => <span className="text-sm">{row.original.partnerDoctor}</span>,
      size: 80,
    },
    {
      id: 'approvalStatus',
      header: () => <span className="block text-center">승인여부</span>,
      cell: ({ row }) => {
        const status = row.original.approvalStatus;
        if (status === 'PENDING') {
          return (
            <div className="flex gap-1.5 justify-center" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                className="h-7 bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-2.5"
                onClick={() => { setActionTargetId(row.original.id); setApproveConfirmOpen(true); }}
              >
                승인
              </Button>
              <Button
                size="sm"
                className="h-7 bg-red-500 hover:bg-red-600 text-white text-xs px-2.5"
                onClick={() => { setActionTargetId(row.original.id); setRejectConfirmOpen(true); }}
              >
                반려
              </Button>
            </div>
          );
        }
        return <div className="flex justify-center"><ApprovalBadge status={status} /></div>;
      },
      size: 130,
    },
    {
      id: 'actions',
      header: () => <span className="block text-center">이미지 등록/조회</span>,
      cell: ({ row }) => {
        const { approvalStatus, imageCount } = row.original;
        if (approvalStatus === 'APPROVED' && imageCount === 0) {
          return (
            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                className="h-7 bg-[#522AE9] hover:bg-[#4520d4] text-white text-xs px-2.5"
                onClick={() => handleOpenRegister(row.original)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />이미지 등록
              </Button>
            </div>
          );
        }
        if (approvalStatus === 'APPROVED' && imageCount > 0) {
          return (
            <div className="flex gap-1.5 justify-center" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                className="h-7 bg-orange-500 hover:bg-orange-600 text-white text-xs px-2.5"
                onClick={() => handleOpenEdit(row.original)}
              >
                수정
              </Button>
              <Button
                size="sm"
                className="h-7 bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-2.5"
                onClick={() => handleOpenEdit(row.original)}
              >
                조회
              </Button>
            </div>
          );
        }
        return null;
      },
      size: 160,
    },
  ];

  /* --- 다이얼로그 내 정보 필드 렌더링 --- */
  const renderInfoFields = (item: ExamImageDetail) => (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      <ReadonlyField label="번호" value={String(item.no)} />
      <ReadonlyField label="환자명" value={item.patientName} />
      <ReadonlyField label="주민등록번호" value={item.residentNo} />
      <ReadonlyField label="환자번호" value={item.patientNo} />
      <ReadonlyField label="검사명" value={item.examName} />
      <ReadonlyField label="검사일시" value={item.examDate} />
      <ReadonlyField label="이미지신청일" value={item.imageRequestDate} />
      <ReadonlyField label="협력의" value={item.partnerDoctor} />
    </div>
  );

  /* --- 이미지 업로드 영역 렌더링 --- */
  const renderUploadSection = (maxImages: number) => (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-foreground">이미지 업로드</label>
      <p className="text-xs text-muted-foreground leading-relaxed">
        - 등록하고자 하는 이미지들을 jpg 파일 또는 압축(ZIP)하여 업로드하십시오.<br />
        - 용량관계상 한 압축파일에 {maxImages}장 이상 사진 업로드 시 업로드가 불가합니다.
      </p>
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-gray-400 bg-gray-50 px-6 py-8">
        <Upload className="h-6 w-6 text-gray-400" />
        <p className="text-sm text-muted-foreground">
          첨부할 파일을 여기에 끌어다 놓거나, 파일 선택 버튼을 직접 선택해주세요.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          파일선택
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.zip"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );

  /* --- 이미지 목록 테이블 렌더링 --- */
  const renderImageTable = (images: UploadedImage[]) => (
    <div className="rounded-md border border-gray-300 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-300 bg-gray-50">
            <th className="px-4 py-2.5 text-left font-semibold w-16">번호</th>
            <th className="px-4 py-2.5 text-left font-semibold">이미지명</th>
            <th className="px-4 py-2.5 text-right font-semibold w-48"></th>
          </tr>
        </thead>
        <tbody>
          {images.map((img, idx) => (
            <tr key={img.id} className="border-b border-gray-200 last:border-b-0">
              <td className="px-4 py-2.5">{idx + 1}</td>
              <td className="px-4 py-2.5">
                <span className="text-src-blue hover:underline cursor-pointer">
                  {img.fileName} ({img.fileSize})
                </span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <div className="flex gap-1.5 justify-end">
                  <Button size="sm" className="h-7 bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-2.5">
                    <Eye className="h-3 w-3 mr-1" />보기
                  </Button>
                  <Button size="sm" className="h-7 bg-orange-500 hover:bg-orange-600 text-white text-xs px-2.5">
                    <Pencil className="h-3 w-3 mr-1" />수정
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 bg-gray-500 hover:bg-gray-600 text-white text-xs px-2.5"
                    onClick={() => {
                      setDeleteTargetImageId(img.id);
                      setDeleteSingleImageOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />삭제
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {images.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                등록된 이미지가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <ListPageTemplate
        title={pageTitle}
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
            <FieldGroup label="환자명">
              <Input
                placeholder="환자명을 입력해 주세요."
                value={searchPatientName}
                onChange={(e) => setSearchPatientName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </FieldGroup>
            <FieldGroup label="주민등록번호">
              <Input
                placeholder="주민등록번호를 입력해 주세요."
                value={searchResidentNo}
                onChange={(e) => setSearchResidentNo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </FieldGroup>
            <FieldGroup label="환자번호">
              <Input
                placeholder="환자번호를 입력해 주세요."
                value={searchPatientNo}
                onChange={(e) => setSearchPatientNo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </FieldGroup>
            <FieldGroup label="협력의">
              <Input
                placeholder="협력의를 입력해 주세요."
                value={searchDoctor}
                onChange={(e) => setSearchDoctor(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </FieldGroup>
            <FieldGroup label="검사명">
              <Input
                placeholder="검사명을 입력해 주세요."
                value={searchExamName}
                onChange={(e) => setSearchExamName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
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
            enableSelection
            onSelectionChange={setSelectedRows}
            getRowId={(row) => row.id}
          />
        }
      />

      {/* 이미지 등록 다이얼로그 */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>이미지 등록{selectedItem ? ` : ${selectedItem.patientName}` : ''}</DialogTitle>
            <DialogDescription className="sr-only">검사이미지를 등록합니다.</DialogDescription>
          </DialogHeader>
          <DialogBody className="max-h-[65vh] overflow-y-auto space-y-6">
            {selectedItem && (
              <>
                {renderInfoFields(selectedItem)}
                {renderUploadSection(800)}
              </>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>취소</Button>
            <Button onClick={handleSaveRegister}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이미지 수정/조회 다이얼로그 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>이미지 수정{selectedItem ? ` : ${selectedItem.patientName}` : ''}</DialogTitle>
            <DialogDescription className="sr-only">검사이미지를 수정합니다.</DialogDescription>
          </DialogHeader>
          <DialogBody className="max-h-[65vh] overflow-y-auto space-y-6">
            {selectedItem && (
              <>
                {renderInfoFields(selectedItem)}

                {renderUploadSection(400)}

                {/* 전체 이미지 조회/삭제 버튼 */}
                <div className="flex gap-2 justify-end">
                  <Button size="sm" className="bg-gray-600 hover:bg-gray-700 text-white">
                    전체이미지 조회
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                    onClick={() => setDeleteAllImagesOpen(true)}
                  >
                    전체이미지 삭제 &gt;
                  </Button>
                </div>

                {/* 이미지 목록 */}
                {renderImageTable(selectedItem.images)}
              </>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>취소</Button>
            <Button onClick={handleSaveEdit}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 승인 확인 */}
      <ConfirmDialog
        open={approveConfirmOpen}
        onOpenChange={setApproveConfirmOpen}
        title="승인 확인"
        description="해당 검사이미지를 승인하시겠습니까?"
        onConfirm={handleApprove}
      />

      {/* 반려 확인 */}
      <ConfirmDialog
        open={rejectConfirmOpen}
        onOpenChange={setRejectConfirmOpen}
        title="반려 확인"
        description="해당 검사이미지를 반려하시겠습니까?"
        onConfirm={handleReject}
      />

      {/* 일괄 삭제 확인 */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="삭제 확인"
        description={`선택한 ${selectedRows.length}건을 삭제하시겠습니까?`}
        onConfirm={handleBulkDelete}
      />

      {/* 전체이미지 삭제 확인 */}
      <ConfirmDialog
        open={deleteAllImagesOpen}
        onOpenChange={setDeleteAllImagesOpen}
        title="전체이미지 삭제"
        description="삭제된 이미지는 복구가 불가능합니다. 현재 등록된 이미지를 모두 삭제하시겠습니까?"
        onConfirm={handleDeleteAllImages}
      />

      {/* 개별 이미지 삭제 확인 */}
      <ConfirmDialog
        open={deleteSingleImageOpen}
        onOpenChange={setDeleteSingleImageOpen}
        title="이미지 삭제"
        description="삭제된 이미지는 복구가 불가능합니다. 현재 등록된 이미지를 삭제하시겠습니까?"
        onConfirm={handleDeleteSingleImage}
      />
    </>
  );
}
