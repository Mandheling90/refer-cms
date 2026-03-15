/* --- 검사이미지(ImagingRequest) 타입 정의 --- */

/** 요청 상태 */
export type ImagingRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

/** 화면 표시 상태 */
export type ImagingRequestDisplayState =
  | 'REQUESTABLE'
  | 'PENDING_IMAGE'
  | 'VIEWABLE'
  | 'REJECTED'
  | 'EXPIRED';

/** 첨부파일 모델 */
export interface AttachmentModel {
  id: string;
  originalName: string;
  storedPath: string;
  mimeType: string;
  fileSize: number;
  createdAt?: string;
}

/** 검사이미지 모델 */
export interface ImagingRequestModel {
  id: string;
  hospitalCode: string;
  ptntNo: string;
  orderCode: string;
  examDate: string;
  pacsAccessNo?: string | null;
  status: ImagingRequestStatus;
  displayState: ImagingRequestDisplayState;
  requestedAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  expiresAt: string;
  attachments?: AttachmentModel[];
  createdAt: string;
  updatedAt: string;
}

/** 목록 응답 */
export interface ImagingRequestsResponse {
  imagingRequestsForAdmin: {
    items: ImagingRequestModel[];
    totalCount: number;
    hasNextPage: boolean;
  };
}

/** 상세 응답 */
export interface ImagingRequestDetailResponse {
  imagingRequestDetail: ImagingRequestModel;
}

/** 필터 입력 */
export interface ImagingRequestFilterInput {
  patientName?: string;
  ptntNo?: string;
  examName?: string;
  status?: ImagingRequestStatus;
  startDate?: string;
  endDate?: string;
}

/** 상태 옵션 */
export const IMAGING_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'REQUESTED', label: '요청' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
  { value: 'EXPIRED', label: '만료' },
] as const;

/** 표시 상태 라벨 */
export const displayStateLabel = (state?: ImagingRequestDisplayState) => {
  const map: Record<ImagingRequestDisplayState, string> = {
    REQUESTABLE: '요청가능',
    PENDING_IMAGE: '이미지 대기',
    VIEWABLE: '조회가능',
    REJECTED: '반려',
    EXPIRED: '만료',
  };
  return state ? map[state] ?? state : '-';
};

/** 상태 라벨 */
export const imagingStatusLabel = (status?: ImagingRequestStatus) => {
  const found = IMAGING_STATUS_OPTIONS.find((o) => o.value === status);
  return found?.label ?? status ?? '-';
};
