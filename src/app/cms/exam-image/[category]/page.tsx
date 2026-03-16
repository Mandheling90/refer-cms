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
import { Textarea } from '@/components/ui/textarea';
import { uploadFile } from '@/lib/api/graphql';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import {
  APPROVE_IMAGING_REQUEST,
  GET_IMAGING_REQUESTS,
  GET_IMAGING_REQUEST_DETAIL,
  REJECT_IMAGING_REQUEST,
  REPLACE_IMAGING_REQUEST_ATTACHMENTS,
} from '@/lib/graphql/queries/exam-image';
import { PRESIGNED_DOWNLOAD_URL } from '@/lib/graphql/queries/board';
import type {
  AttachmentModel,
  ImagingRequestDetailResponse,
  ImagingRequestDisplayState,
  ImagingRequestModel,
  ImagingRequestsResponse,
} from '@/types/exam-image';
import { useApolloClient, useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, ImageIcon, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════
   카테고리별 타이틀 매핑
   ═══════════════════════════════════════ */
const CATEGORY_TITLE: Record<string, string> = {
  radiology: '영상검사',
  endoscopy: '내시경검사',
  etc: '기타검사',
};

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

/* --- 표시 상태 뱃지 --- */
function DisplayStateBadge({ state }: { state: ImagingRequestDisplayState }) {
  const config: Record<ImagingRequestDisplayState, { label: string; className: string }> = {
    REQUESTABLE: { label: '요청가능', className: 'bg-blue-50 text-blue-700 border-blue-300' },
    PENDING_IMAGE: { label: '이미지 대기', className: 'bg-gray-100 text-gray-600 border-gray-300' },
    VIEWABLE: { label: '조회가능', className: 'bg-green-50 text-green-700 border-green-300' },
    REJECTED: { label: '반려', className: 'bg-red-50 text-red-600 border-red-300' },
    EXPIRED: { label: '만료', className: 'text-muted-foreground' },
  };
  const { label, className } = config[state] ?? config.REQUESTABLE;

  if (state === 'EXPIRED') {
    return <span className={`text-sm ${className}`}>{label}</span>;
  }
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

/* --- 날짜 포맷 --- */
const formatDateTime = (val?: string | null) => {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}`;
};

/* ═══════════════════════════════════════
   검사이미지 관리 페이지
   ═══════════════════════════════════════ */
export default function ExamImagePage() {
  const params = useParams();
  const category = params.category as string;
  const pageTitle = CATEGORY_TITLE[category] ?? '검사이미지 관리';
  const apolloClient = useApolloClient();

  /* --- 페이징 --- */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* --- 검색 조건 --- */
  const [searchPatientName, setSearchPatientName] = useState('');
  const [searchPtntNo, setSearchPtntNo] = useState('');
  const [searchExamName, setSearchExamName] = useState('');

  const [appliedFilter, setAppliedFilter] = useState<{
    patientName?: string;
    ptntNo?: string;
    examName?: string;
  }>({});

  /* --- GraphQL 목록 조회 --- */
  const { data, loading, refetch } = useQuery<ImagingRequestsResponse>(
    GET_IMAGING_REQUESTS,
    {
      variables: {
        input: {
          page: currentPage,
          limit: pageSize,
          filter: {
            ...(appliedFilter.patientName ? { patientName: appliedFilter.patientName } : {}),
            ...(appliedFilter.ptntNo ? { ptntNo: appliedFilter.ptntNo } : {}),
            ...(appliedFilter.examName ? { examName: appliedFilter.examName } : {}),
          },
        },
      },
      fetchPolicy: 'network-only',
    },
  );

  const items = data?.imagingRequestsForAdmin?.items ?? [];
  const totalCount = data?.imagingRequestsForAdmin?.totalCount ?? 0;

  /* --- GraphQL 상세 조회 --- */
  const [fetchDetail] = useLazyQuery<ImagingRequestDetailResponse>(
    GET_IMAGING_REQUEST_DETAIL,
    { fetchPolicy: 'network-only' },
  );

  /* --- Presigned URL 조회 --- */
  const [fetchPresignedUrl] = useLazyQuery<{ presignedDownloadUrl: string }>(
    PRESIGNED_DOWNLOAD_URL,
    { fetchPolicy: 'network-only' },
  );

  const handleViewAttachment = async (attachmentId: string, fileName?: string) => {
    try {
      const { data: urlData } = await fetchPresignedUrl({ variables: { attachmentId } });
      if (urlData?.presignedDownloadUrl) {
        setSingleImageUrl(urlData.presignedDownloadUrl);
        setSingleImageName(fileName ?? '');
        setSingleImageOpen(true);
      } else {
        toast.error('다운로드 URL을 가져오지 못했습니다.');
      }
    } catch {
      toast.error('파일을 불러오는 중 오류가 발생했습니다.');
    }
  };

  /* --- Mutations --- */
  const [approveRequest] = useMutation(APPROVE_IMAGING_REQUEST);
  const [rejectRequest] = useMutation(REJECT_IMAGING_REQUEST);
  const [replaceAttachments] = useMutation(REPLACE_IMAGING_REQUEST_ATTACHMENTS);

  /* --- 선택 행 --- */
  const [selectedRows, setSelectedRows] = useState<ImagingRequestModel[]>([]);

  /* --- 다이얼로그 상태 --- */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ImagingRequestModel | null>(null);

  /* --- 확인 다이얼로그 --- */
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionTargetId, setActionTargetId] = useState<string | null>(null);
  const [deleteAllImagesOpen, setDeleteAllImagesOpen] = useState(false);
  const [deleteSingleImageOpen, setDeleteSingleImageOpen] = useState(false);
  const [deleteTargetImageId, setDeleteTargetImageId] = useState<string | null>(null);

  /* --- 전체이미지 조회 팝업 --- */
  const [allImagesOpen, setAllImagesOpen] = useState(false);
  const [allImageUrls, setAllImageUrls] = useState<Record<string, string>>({});

  /* --- 단건 이미지 조회 팝업 --- */
  const [singleImageOpen, setSingleImageOpen] = useState(false);
  const [singleImageUrl, setSingleImageUrl] = useState<string | null>(null);
  const [singleImageName, setSingleImageName] = useState('');

  /* --- 첨부파일 목록의 presigned URL 일괄 조회 --- */
  const fetchAllPresignedUrls = async (attachments: AttachmentModel[]) => {
    const urls: Record<string, string> = {};
    await Promise.all(
      attachments.map(async (att) => {
        try {
          const { data: urlData } = await apolloClient.query<{ presignedDownloadUrl: string }>({
            query: PRESIGNED_DOWNLOAD_URL,
            variables: { attachmentId: att.id },
            fetchPolicy: 'network-only',
          });
          if (urlData?.presignedDownloadUrl) {
            urls[att.id] = urlData.presignedDownloadUrl;
          }
        } catch { /* skip */ }
      }),
    );
    return urls;
  };

  /* --- 전체이미지 조회 열기 (상세 다이얼로그 내부 or 리스트에서 직접) --- */
  const handleOpenAllImages = async (item?: ImagingRequestModel) => {
    // 리스트에서 직접 호출 시 상세 조회 후 열기
    if (item) {
      setAllImagesOpen(true);
      setAllImageUrls({});
      try {
        const { data: detailData } = await fetchDetail({ variables: { id: item.id } });
        const detail = detailData?.imagingRequestDetail;
        if (!detail?.attachments?.length) {
          toast.error('등록된 이미지가 없습니다.');
          setAllImagesOpen(false);
          return;
        }
        setSelectedItem(detail);
        setAllImageUrls(await fetchAllPresignedUrls(detail.attachments));
      } catch {
        toast.error('이미지를 불러오지 못했습니다.');
        setAllImagesOpen(false);
      }
      return;
    }

    // 상세 다이얼로그 내부에서 호출 시 (selectedItem 사용)
    if (!selectedItem?.attachments?.length) return;
    setAllImagesOpen(true);
    setAllImageUrls({});
    setAllImageUrls(await fetchAllPresignedUrls(selectedItem.attachments));
  };

  /* --- 파일 업로드 참조 --- */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  /* --- 검색 --- */
  const handleSearch = useCallback(() => {
    const newFilter = {
      patientName: searchPatientName.trim() || undefined,
      ptntNo: searchPtntNo.trim() || undefined,
      examName: searchExamName.trim() || undefined,
    };
    setAppliedFilter(newFilter);
    setCurrentPage(1);
    // 동일 조건 재검색 시에도 쿼리가 나가도록 명시적 refetch
    refetch({
      input: {
        page: 1,
        limit: pageSize,
        filter: {
          ...(newFilter.patientName ? { patientName: newFilter.patientName } : {}),
          ...(newFilter.ptntNo ? { ptntNo: newFilter.ptntNo } : {}),
          ...(newFilter.examName ? { examName: newFilter.examName } : {}),
        },
      },
    });
  }, [searchPatientName, searchPtntNo, searchExamName, pageSize, refetch]);

  const handleReset = () => {
    setSearchPatientName('');
    setSearchPtntNo('');
    setSearchExamName('');
    setAppliedFilter({});
    setCurrentPage(1);
    refetch({
      input: {
        page: 1,
        limit: pageSize,
        filter: {},
      },
    });
  };

  /* --- 행 클릭 → 상세 조회 --- */
  const handleRowClick = async (row: ImagingRequestModel) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const { data: detailData } = await fetchDetail({ variables: { id: row.id } });
      if (detailData?.imagingRequestDetail) {
        setSelectedItem(detailData.imagingRequestDetail);
      }
    } catch {
      toast.error('상세 정보를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  /* --- 승인 --- */
  const handleApprove = async () => {
    if (!actionTargetId) return;
    try {
      await approveRequest({
        variables: { input: { imagingRequestId: actionTargetId } },
      });
      toast.success('승인 처리되었습니다.');
      setApproveConfirmOpen(false);
      setActionTargetId(null);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '승인 처리 중 오류가 발생했습니다.';
      toast.error(msg);
      setApproveConfirmOpen(false);
    }
  };

  /* --- 반려 --- */
  const handleReject = async () => {
    if (!actionTargetId) return;
    try {
      await rejectRequest({
        variables: {
          input: {
            imagingRequestId: actionTargetId,
            reason: rejectReason.trim() || '반려 처리',
          },
        },
      });
      toast.success('반려 처리되었습니다.');
      setRejectConfirmOpen(false);
      setRejectReason('');
      setActionTargetId(null);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '반려 처리 중 오류가 발생했습니다.';
      toast.error(msg);
      setRejectConfirmOpen(false);
    }
  };

  /* --- 파일 업로드 --- */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedItem) return;
    setUploading(true);
    try {
      // 1) 각 파일을 서버에 업로드
      const uploadResults = await Promise.all(
        Array.from(files).map((file) => uploadFile(file)),
      );

      // 2) 기존 첨부파일 + 새 업로드 파일 합산
      const existingAttachments = (selectedItem.attachments ?? []).map((a) => ({
        url: a.storedPath,
        name: a.originalName,
        mimeType: a.mimeType,
        size: a.fileSize,
      }));
      const newAttachments = uploadResults.map((r) => ({
        url: r.storedPath,
        name: r.originalName,
        mimeType: r.mimeType,
        size: r.fileSize,
      }));
      const allAttachments = [...existingAttachments, ...newAttachments];

      // 3) replaceAttachments 뮤테이션 호출
      await replaceAttachments({
        variables: {
          imagingRequestId: selectedItem.id,
          attachments: allAttachments,
        },
      });

      // 4) 상세 다시 조회하여 selectedItem 갱신
      const { data: detailData } = await fetchDetail({ variables: { id: selectedItem.id } });
      if (detailData?.imagingRequestDetail) {
        setSelectedItem(detailData.imagingRequestDetail);
      }

      toast.success(`${uploadResults.length}개 파일이 업로드되었습니다.`);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '파일 업로드 중 오류가 발생했습니다.';
      toast.error(msg);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  /* --- 개별 이미지 수정 (교체) --- */
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedItem || !replaceTargetId) return;
    setUploading(true);
    try {
      const result = await uploadFile(file);
      const updatedAttachments = (selectedItem.attachments ?? []).map((a) =>
        a.id === replaceTargetId
          ? { url: result.storedPath, name: result.originalName, mimeType: result.mimeType, size: result.fileSize }
          : { url: a.storedPath, name: a.originalName, mimeType: a.mimeType, size: a.fileSize },
      );
      await replaceAttachments({
        variables: {
          imagingRequestId: selectedItem.id,
          attachments: updatedAttachments,
        },
      });
      const { data: detailData } = await fetchDetail({ variables: { id: selectedItem.id } });
      if (detailData?.imagingRequestDetail) {
        setSelectedItem(detailData.imagingRequestDetail);
      }
      toast.success('이미지가 교체되었습니다.');
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '이미지 교체 중 오류가 발생했습니다.';
      toast.error(msg);
    } finally {
      setUploading(false);
      setReplaceTargetId(null);
      e.target.value = '';
    }
  };

  /* --- 전체 첨부파일 삭제 --- */
  const handleDeleteAllAttachments = async () => {
    if (!selectedItem) return;
    try {
      await replaceAttachments({
        variables: {
          imagingRequestId: selectedItem.id,
          attachments: [],
        },
      });
      setSelectedItem({ ...selectedItem, attachments: [] });
      toast.success('전체 이미지가 삭제되었습니다.');
      setDeleteAllImagesOpen(false);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.';
      toast.error(msg);
      setDeleteAllImagesOpen(false);
    }
  };

  /* --- 개별 첨부파일 삭제 --- */
  const handleDeleteSingleAttachment = async () => {
    if (!selectedItem || !deleteTargetImageId) return;
    const remaining = (selectedItem.attachments ?? []).filter((a) => a.id !== deleteTargetImageId);
    try {
      await replaceAttachments({
        variables: {
          imagingRequestId: selectedItem.id,
          attachments: remaining.map((a) => ({
            url: a.storedPath,
            name: a.originalName,
            mimeType: a.mimeType,
            size: a.fileSize,
          })),
        },
      });
      setSelectedItem({ ...selectedItem, attachments: remaining });
      toast.success('이미지가 삭제되었습니다.');
      setDeleteSingleImageOpen(false);
      setDeleteTargetImageId(null);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.';
      toast.error(msg);
      setDeleteSingleImageOpen(false);
    }
  };

  /* --- 페이징 --- */
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  /* --- 테이블 컬럼 --- */
  const columns: ColumnDef<ImagingRequestModel, unknown>[] = [
    {
      accessorKey: 'ptntNo',
      header: '환자번호',
      size: 100,
    },
    {
      accessorKey: 'orderCode',
      header: '오더코드',
      size: 120,
    },
    {
      accessorKey: 'examDate',
      header: '검사일',
      size: 100,
    },
    {
      id: 'requestedAt',
      header: '요청일시',
      size: 140,
      cell: ({ row }) => formatDateTime(row.original.requestedAt),
    },
    {
      id: 'expiresAt',
      header: '만료일시',
      size: 140,
      cell: ({ row }) => formatDateTime(row.original.expiresAt),
    },
    {
      id: 'attachmentCount',
      header: '첨부파일',
      size: 80,
      cell: ({ row }) => (row.original.attachments?.length ?? 0) + '건',
    },
    {
      id: 'status',
      header: () => <span className="block text-center">상태</span>,
      size: 130,
      cell: ({ row }) => {
        const { status, displayState, id } = row.original;
        if (status === 'REQUESTED') {
          return (
            <div className="flex gap-1.5 justify-center" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                className="h-7 bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-2.5"
                onClick={() => { setActionTargetId(id); setApproveConfirmOpen(true); }}
              >
                승인
              </Button>
              <Button
                size="sm"
                className="h-7 bg-red-500 hover:bg-red-600 text-white text-xs px-2.5"
                onClick={() => { setActionTargetId(id); setRejectReason(''); setRejectConfirmOpen(true); }}
              >
                반려
              </Button>
            </div>
          );
        }
        // status 기반으로 반려/만료 우선 표시
        const effectiveState: ImagingRequestDisplayState =
          status === 'REJECTED' ? 'REJECTED' :
          status === 'EXPIRED' ? 'EXPIRED' :
          displayState;
        return (
          <div className="flex justify-center">
            <DisplayStateBadge state={effectiveState} />
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <span className="block text-center">이미지 관리</span>,
      size: 160,
      cell: ({ row }) => {
        const { displayState } = row.original;
        if (displayState === 'PENDING_IMAGE') {
          return (
            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                className="h-7 bg-[#522AE9] hover:bg-[#4520d4] text-white text-xs px-2.5"
                onClick={() => handleRowClick(row.original)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />이미지 등록
              </Button>
            </div>
          );
        }
        if (displayState === 'VIEWABLE') {
          return (
            <div className="flex gap-1.5 justify-center" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                className="h-7 bg-orange-500 hover:bg-orange-600 text-white text-xs px-2.5"
                onClick={() => handleRowClick(row.original)}
              >
                수정
              </Button>
              <Button
                size="sm"
                className="h-7 bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-2.5"
                onClick={() => handleOpenAllImages(row.original)}
              >
                조회
              </Button>
            </div>
          );
        }
        return null;
      },
    },
  ];

  /* --- 다이얼로그 내 정보 필드 렌더링 --- */
  const renderInfoFields = (item: ImagingRequestModel) => (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      <ReadonlyField label="환자번호" value={item.ptntNo} />
      <ReadonlyField label="오더코드" value={item.orderCode} />
      <ReadonlyField label="검사일" value={item.examDate} />
      <ReadonlyField label="요청일시" value={formatDateTime(item.requestedAt)} />
      <ReadonlyField label="만료일시" value={formatDateTime(item.expiresAt)} />
      {item.pacsAccessNo && <ReadonlyField label="PACS Access No" value={item.pacsAccessNo} />}
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
          {uploading ? '업로드 중...' : '첨부할 파일을 여기에 끌어다 놓거나, 파일 선택 버튼을 직접 선택해주세요.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? '업로드 중...' : '파일선택'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.zip"
          className="hidden"
          onChange={handleFileUpload}
        />
        <input
          ref={replaceFileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          className="hidden"
          onChange={handleReplaceFile}
        />
      </div>
    </div>
  );

  /* --- 첨부파일 목록 테이블 렌더링 --- */
  const renderAttachmentTable = (attachments: AttachmentModel[]) => (
    <div className="rounded-md border border-gray-300 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-300 bg-gray-50">
            <th className="px-4 py-2.5 text-left font-semibold w-16">번호</th>
            <th className="px-4 py-2.5 text-left font-semibold">파일명</th>
            <th className="px-4 py-2.5 text-right font-semibold w-48"></th>
          </tr>
        </thead>
        <tbody>
          {attachments.map((att, idx) => (
            <tr key={att.id} className="border-b border-gray-200 last:border-b-0">
              <td className="px-4 py-2.5">{idx + 1}</td>
              <td className="px-4 py-2.5">
                <span
                  className="text-src-blue hover:underline cursor-pointer"
                  onClick={() => handleViewAttachment(att.id, att.originalName)}
                >
                  {att.originalName} ({att.fileSize < 1024 ? `${att.fileSize}B` : `${Math.round(att.fileSize / 1024)}KB`})
                </span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <div className="flex gap-1.5 justify-end">
                  <Button
                    size="sm"
                    className="h-7 bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-2.5"
                    onClick={() => handleViewAttachment(att.id, att.originalName)}
                  >
                    <Eye className="h-3 w-3 mr-1" />보기
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 bg-orange-500 hover:bg-orange-600 text-white text-xs px-2.5"
                    disabled={uploading}
                    onClick={() => {
                      setReplaceTargetId(att.id);
                      replaceFileInputRef.current?.click();
                    }}
                  >
                    <Pencil className="h-3 w-3 mr-1" />수정
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 bg-gray-500 hover:bg-gray-600 text-white text-xs px-2.5"
                    onClick={() => {
                      setDeleteTargetImageId(att.id);
                      setDeleteSingleImageOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />삭제
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {attachments.length === 0 && (
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
            <FieldGroup label="환자번호">
              <Input
                placeholder="환자번호를 입력해 주세요."
                value={searchPtntNo}
                onChange={(e) => setSearchPtntNo(e.target.value)}
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
            data={items}
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

      {/* ═══ 상세/이미지 관리 다이얼로그 ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>
              검사이미지 {selectedItem?.displayState === 'PENDING_IMAGE' ? '등록' : '관리'}
              {selectedItem ? ` : ${selectedItem.ptntNo}` : ''}
            </DialogTitle>
            <DialogDescription className="sr-only">검사이미지를 관리합니다.</DialogDescription>
          </DialogHeader>
          <DialogBody className="max-h-[65vh] overflow-y-auto space-y-6">
            {detailLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                로딩 중...
              </div>
            ) : selectedItem ? (
              <>
                {renderInfoFields(selectedItem)}
                {renderUploadSection(800)}

                {(selectedItem.attachments?.length ?? 0) > 0 && (
                  <>
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        className="bg-gray-600 hover:bg-gray-700 text-white"
                        onClick={() => handleOpenAllImages()}
                      >
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
                    {renderAttachmentTable(selectedItem.attachments ?? [])}
                  </>
                )}
              </>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 승인 확인 */}
      <ConfirmDialog
        open={approveConfirmOpen}
        onOpenChange={setApproveConfirmOpen}
        title="승인 확인"
        description="해당 검사이미지 요청을 승인하시겠습니까?"
        onConfirm={handleApprove}
      />

      {/* 반려 확인 */}
      <ConfirmDialog
        open={rejectConfirmOpen}
        onOpenChange={(open) => { setRejectConfirmOpen(open); if (!open) setRejectReason(''); }}
        title="반려 확인"
        description={
          <div className="space-y-3 w-full">
            <p>해당 검사이미지 요청을 반려하시겠습니까?</p>
            <Textarea
              className="w-full"
              placeholder="반려 사유를 입력해주세요."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
        }
        onConfirm={handleReject}
        destructive
      />

      {/* 전체이미지 삭제 확인 */}
      <ConfirmDialog
        open={deleteAllImagesOpen}
        onOpenChange={setDeleteAllImagesOpen}
        title="전체이미지 삭제"
        description="삭제된 이미지는 복구가 불가능합니다. 현재 등록된 이미지를 모두 삭제하시겠습니까?"
        onConfirm={handleDeleteAllAttachments}
      />

      {/* 개별 이미지 삭제 확인 */}
      <ConfirmDialog
        open={deleteSingleImageOpen}
        onOpenChange={setDeleteSingleImageOpen}
        title="이미지 삭제"
        description="삭제된 이미지는 복구가 불가능합니다. 해당 이미지를 삭제하시겠습니까?"
        onConfirm={handleDeleteSingleAttachment}
      />

      {/* ═══ 전체이미지 조회 팝업 ═══ */}
      <Dialog open={allImagesOpen} onOpenChange={setAllImagesOpen}>
        <DialogContent size="lg" showCloseButton={false} className="p-10 flex flex-col gap-10 max-h-[90vh]">
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-gray-400 pb-5">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-1 text-xl font-semibold text-white tracking-tight">
                {pageTitle}
              </span>
              <span className="text-[32px] font-semibold tracking-tight leading-[1.5]">
                {selectedItem?.orderCode ?? ''}
              </span>
            </div>
            <button
              onClick={() => setAllImagesOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* 이미지 섹션 */}
          <div className="flex flex-col gap-4 min-h-0">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#9f1836]" />
              <span className="text-2xl font-semibold tracking-tight">이미지</span>
            </div>
            <div className="overflow-y-auto flex-1 pr-2">
              {Object.keys(allImageUrls).length === 0 ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  이미지 로딩 중...
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-4">
                  {(selectedItem?.attachments ?? []).map((att) => (
                    <div key={att.id} className="relative aspect-square rounded-[5px] overflow-hidden bg-gray-100">
                      {allImageUrls[att.id] ? (
                        <img
                          src={allImageUrls[att.id]}
                          alt={att.originalName}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => handleViewAttachment(att.id, att.originalName)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          로딩 실패
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ 단건 이미지 조회 팝업 ═══ */}
      <Dialog open={singleImageOpen} onOpenChange={setSingleImageOpen}>
        <DialogContent size="lg" showCloseButton={false} className="p-10 flex flex-col gap-10 max-h-[90vh]">
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-gray-400 pb-5">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-1 text-xl font-semibold text-white tracking-tight">
                {pageTitle}
              </span>
              <span className="text-[32px] font-semibold tracking-tight leading-[1.5]">
                {singleImageName || selectedItem?.orderCode || ''}
              </span>
            </div>
            <button
              onClick={() => setSingleImageOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* 이미지 */}
          <div className="flex flex-col gap-4 min-h-0">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#9f1836]" />
              <span className="text-2xl font-semibold tracking-tight">이미지</span>
            </div>
            <div className="overflow-y-auto flex-1 flex items-center justify-center">
              {singleImageUrl ? (
                <img
                  src={singleImageUrl}
                  alt={singleImageName}
                  className="max-w-full max-h-[60vh] object-contain rounded-[5px]"
                />
              ) : (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  이미지 로딩 중...
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
