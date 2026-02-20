/* --- 검사이미지 타입 정의 --- */

/** 승인 상태 */
export type ExamImageApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

/** 검사이미지 목록 모델 */
export interface ExamImageModel {
  id: string;
  no: number;
  patientName: string;
  residentNo: string;
  patientNo: string;
  examDate: string;
  examName: string;
  imageRequestDate: string;
  partnerDoctor: string;
  approvalStatus: ExamImageApprovalStatus;
  imageCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 업로드된 이미지 */
export interface UploadedImage {
  id: string;
  fileName: string;
  fileSize: string;
  url?: string;
}

/** 검사이미지 상세 모델 */
export interface ExamImageDetail extends ExamImageModel {
  images: UploadedImage[];
}

/** 목록 응답 */
export interface AdminExamImagesResponse {
  adminExamImages: {
    items: ExamImageModel[];
    totalCount: number;
    hasNextPage: boolean;
  };
}

/** 상세 응답 */
export interface AdminExamImageByIdResponse {
  adminExamImageById: ExamImageDetail;
}

/** 승인 상태 옵션 */
export const APPROVAL_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인 완료' },
  { value: 'REJECTED', label: '반려 완료' },
  { value: 'EXPIRED', label: '기간 만료' },
] as const;

/** 승인 상태 라벨 */
export const approvalStatusLabel = (status?: ExamImageApprovalStatus) => {
  const found = APPROVAL_STATUS_OPTIONS.find((o) => o.value === status);
  return found?.label ?? status ?? '-';
};
