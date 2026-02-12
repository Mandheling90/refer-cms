'use client';

import { useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import type { MemberApply } from '@/types/member';
import {
  MEMBER_TYPE_OPTIONS,
  APPLY_STATUS_OPTIONS,
  JOIN_TYPE_OPTIONS,
} from '@/types/member';

/* ─── 더미 데이터 (백엔드 연동 전) ─── */
const MOCK_APPLIES: MemberApply[] = [
  {
    MEMBER_ID: 'abc1246',
    MEMBER_NO: 'M031245',
    MEMBER_NM: '홍길동',
    MEMBER_TYPE: 'KMD',
    BIRTH_DATE: '1983-08-16',
    DOCTOR_LICENSE_NO: '34562',
    SCHOOL: '가톨릭대학교',
    DEPARTMENT: '내과',
    IS_DIRECTOR: 'Y',
    SPECIALTY: '일반혈액질환, 림프구계혈액암(림프종, 다발골수종)',
    EMAIL: 'revehit@naver.com',
    MOBILE_NO: '010-9288-4290',
    EMAIL_AGREE: 'Y',
    SMS_AGREE: 'Y',
    REPLY_AGREE: 'Y',
    ADDR: '서울특별시 성북구 동소문로 47길 8 (길음동)',
    ADDR_DETAIL: '404호',
    HOSPITAL_NM: 'A 병원',
    HOSPITAL_NO: '0651251254',
    HOSPITAL_TEL: '02-940-2000',
    HOSPITAL_ADDR: '서울특별시 성북구 동소문로 47길 8 (길음동)',
    HOSPITAL_ADDR_DETAIL: '404호',
    HOSPITAL_URL: 'https://www.seoulchuk.com/main.do',
    APPLY_STATUS: 'PENDING',
    APPLY_DTTM: '2025-08-27 13:10:25',
    APPROVE_DTTM: '-',
    JOIN_TYPE: 'NORMAL',
    LOGIN_ID: 'abc1246',
    INSERT_DTTM: '2025-08-27 13:10:25',
    UPDATE_DTTM: '2025-08-27 13:10:25',
  },
  {
    MEMBER_ID: 'kim002',
    MEMBER_NO: 'M031246',
    MEMBER_NM: '김철수',
    MEMBER_TYPE: 'DENTIST',
    BIRTH_DATE: '1990-07-22',
    DOCTOR_LICENSE_NO: '23456',
    SCHOOL: '서울대학교',
    DEPARTMENT: '외과',
    IS_DIRECTOR: 'N',
    SPECIALTY: '정형외과',
    EMAIL: 'kim@example.com',
    MOBILE_NO: '010-9876-5432',
    EMAIL_AGREE: 'Y',
    SMS_AGREE: 'N',
    REPLY_AGREE: 'Y',
    HOSPITAL_NM: 'B 병원',
    HOSPITAL_NO: '0651251255',
    HOSPITAL_TEL: '02-123-4567',
    APPLY_STATUS: 'APPROVED',
    APPLY_DTTM: '2025-04-11 09:00:00',
    APPROVE_DTTM: '2025-04-12 11:00:00',
    JOIN_TYPE: 'NORMAL',
    LOGIN_ID: 'kim002',
    INSERT_DTTM: '2025-04-11 09:00:00',
    UPDATE_DTTM: '2025-04-12 11:00:00',
  },
  {
    MEMBER_ID: 'lee003',
    MEMBER_NO: 'M031247',
    MEMBER_NM: '이영희',
    MEMBER_TYPE: 'DOCTOR',
    BIRTH_DATE: '1988-11-03',
    DOCTOR_LICENSE_NO: '34567',
    SCHOOL: '연세대학교',
    DEPARTMENT: '소아과',
    IS_DIRECTOR: 'N',
    SPECIALTY: '소아내과',
    EMAIL: 'lee@example.com',
    MOBILE_NO: '010-5555-1234',
    EMAIL_AGREE: 'N',
    SMS_AGREE: 'Y',
    REPLY_AGREE: 'N',
    HOSPITAL_NM: 'C 의원',
    HOSPITAL_NO: '0651251256',
    HOSPITAL_TEL: '02-555-6789',
    APPLY_STATUS: 'REJECTED',
    APPLY_DTTM: '2025-04-11 09:00:00',
    APPROVE_DTTM: '-',
    JOIN_TYPE: 'SMS',
    LOGIN_ID: 'lee003',
    INSERT_DTTM: '2025-04-11 09:00:00',
    UPDATE_DTTM: '2025-04-11 09:00:00',
  },
];

/* ─── 상태 라벨 변환 ─── */
const applyStatusLabel = (val?: string) => {
  const found = APPLY_STATUS_OPTIONS.find((o) => o.value === val);
  return found?.label ?? val ?? '-';
};

const memberTypeLabel = (val?: string) => {
  const found = MEMBER_TYPE_OPTIONS.find((o) => o.value === val);
  return found?.label ?? val ?? '-';
};

const joinTypeLabel = (val?: string) => {
  const found = JOIN_TYPE_OPTIONS.find((o) => o.value === val);
  return found?.label ?? val ?? '-';
};

/* ─── 검색 필드 라벨+인풋 공통 ─── */
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

/* ═══════════════════════════════════════
   회원가입 신청관리 페이지
   ═══════════════════════════════════════ */
export default function MemberApplyPage() {
  /* ─── 리스트 상태 ─── */
  const [data, setData] = useState<MemberApply[]>(MOCK_APPLIES);
  const [loading] = useState(false);
  const [totalItems, setTotalItems] = useState(MOCK_APPLIES.length);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 조건 ─── */
  const [searchDoctorLicenseNo, setSearchDoctorLicenseNo] = useState('');
  const [searchMemberId, setSearchMemberId] = useState('');
  const [searchBirthDate, setSearchBirthDate] = useState('');
  const [searchMobileNo, setSearchMobileNo] = useState('');
  const [searchMemberNm, setSearchMemberNm] = useState('');
  const [searchApplyStatus, setSearchApplyStatus] = useState('');
  const [searchJoinType, setSearchJoinType] = useState('');

  /* ─── 상세 다이얼로그 ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<MemberApply>>({});

  /* ─── 확인 다이얼로그 ─── */
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  /* ─── 검색 ─── */
  const handleSearch = useCallback(() => {
    let filtered = [...MOCK_APPLIES];
    if (searchDoctorLicenseNo)
      filtered = filtered.filter((m) => m.DOCTOR_LICENSE_NO?.includes(searchDoctorLicenseNo));
    if (searchMemberId)
      filtered = filtered.filter((m) => m.LOGIN_ID?.includes(searchMemberId));
    if (searchBirthDate)
      filtered = filtered.filter((m) => m.BIRTH_DATE?.includes(searchBirthDate));
    if (searchMobileNo)
      filtered = filtered.filter((m) => m.MOBILE_NO?.includes(searchMobileNo));
    if (searchMemberNm)
      filtered = filtered.filter((m) => m.MEMBER_NM?.includes(searchMemberNm));
    if (searchApplyStatus)
      filtered = filtered.filter((m) => m.APPLY_STATUS === searchApplyStatus);
    if (searchJoinType)
      filtered = filtered.filter((m) => m.JOIN_TYPE === searchJoinType);
    setData(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  }, [searchDoctorLicenseNo, searchMemberId, searchBirthDate, searchMobileNo, searchMemberNm, searchApplyStatus, searchJoinType]);

  /* ─── 초기화 ─── */
  const handleReset = () => {
    setSearchDoctorLicenseNo('');
    setSearchMemberId('');
    setSearchBirthDate('');
    setSearchMobileNo('');
    setSearchMemberNm('');
    setSearchApplyStatus('');
    setSearchJoinType('');
    setData(MOCK_APPLIES);
    setTotalItems(MOCK_APPLIES.length);
    setCurrentPage(1);
  };

  /* ─── 행 클릭 → 상세 팝업 ─── */
  const handleRowClick = (row: MemberApply) => {
    setFormData({ ...row });
    setRejectReason('');
    setDetailOpen(true);
  };

  /* ─── 가입승인 (TODO: API 연동) ─── */
  const handleApprove = () => {
    toast.success('가입이 승인되었습니다.');
    setApproveOpen(false);
    setDetailOpen(false);
  };

  /* ─── 반려 (TODO: API 연동) ─── */
  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('반려 사유를 입력해주세요.');
      return;
    }
    toast.success('가입이 반려되었습니다.');
    setRejectOpen(false);
    setDetailOpen(false);
  };

  /* ─── 페이징 ─── */
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  /* ─── 테이블 컬럼 ─── */
  const columns: ColumnDef<MemberApply, unknown>[] = [
    {
      id: 'rowNum',
      header: 'No',
      size: 60,
      cell: ({ row }) => row.index + 1,
    },
    { accessorKey: 'LOGIN_ID', header: '회원아이디', size: 120 },
    { accessorKey: 'MEMBER_NM', header: '회원명', size: 90 },
    {
      accessorKey: 'MEMBER_TYPE',
      header: '회원구분',
      size: 90,
      cell: ({ getValue }) => memberTypeLabel(getValue() as string),
    },
    { accessorKey: 'DOCTOR_LICENSE_NO', header: '의사면허번호', size: 110 },
    { accessorKey: 'BIRTH_DATE', header: '생년월일', size: 110 },
    {
      accessorKey: 'APPLY_STATUS',
      header: '회원상태',
      size: 80,
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
            {applyStatusLabel(val)}
          </span>
        );
      },
    },
    { accessorKey: 'APPROVE_DTTM', header: '가입승인일시', size: 160 },
    { accessorKey: 'APPLY_DTTM', header: '신청일시', size: 160 },
  ];

  return (
    <>
      <ListPageTemplate
        title="회원가입 신청관리"
        totalItems={totalItems}
        onSearch={handleSearch}
        onReset={handleReset}
        searchSection={
          <div className="grid grid-cols-4 gap-x-6 gap-y-4">
            <FieldGroup label="의사면허번호">
              <Input
                value={searchDoctorLicenseNo}
                onChange={(e) => setSearchDoctorLicenseNo(e.target.value)}
                placeholder="의사면허번호"
              />
            </FieldGroup>
            <FieldGroup label="회원아이디">
              <Input
                value={searchMemberId}
                onChange={(e) => setSearchMemberId(e.target.value)}
                placeholder="회원아이디"
              />
            </FieldGroup>
            <FieldGroup label="생년월일">
              <Input
                value={searchBirthDate}
                onChange={(e) => setSearchBirthDate(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </FieldGroup>
            <FieldGroup label="휴대전화번호">
              <Input
                value={searchMobileNo}
                onChange={(e) => setSearchMobileNo(e.target.value)}
                placeholder="휴대전화번호"
              />
            </FieldGroup>
            <FieldGroup label="회원명">
              <Input
                value={searchMemberNm}
                onChange={(e) => setSearchMemberNm(e.target.value)}
                placeholder="회원명"
              />
            </FieldGroup>
            <FieldGroup label="회원상태">
              <Select value={searchApplyStatus} onValueChange={setSearchApplyStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  {APPLY_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || '__all'} value={opt.value || '__all'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="가입유형">
              <Select value={searchJoinType} onValueChange={setSearchJoinType}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  {JOIN_TYPE_OPTIONS.map((opt) => (
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
            data={data}
            loading={loading}
            totalItems={totalItems}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={Math.ceil(totalItems / pageSize) || 1}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onRowClick={handleRowClick}
          />
        }
      />

      {/* ═══ 회원가입 신청 관리 다이얼로그 ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent size="lg" className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>회원가입 신청 관리</DialogTitle>
            <DialogDescription>
              회원가입 신청 정보를 조회하고 승인/반려할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5 overflow-y-auto">
            {/* ─── Row 1: 회원ID, 회원번호, 회원명 ─── */}
            <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="회원ID">
                <Input value={formData.MEMBER_ID || ''} disabled />
              </FieldGroup>
              <FieldGroup label="회원번호">
                <Input value={formData.MEMBER_NO || ''} disabled />
              </FieldGroup>
              <FieldGroup label="회원명">
                <Input value={formData.MEMBER_NM || ''} disabled />
              </FieldGroup>
            </div>

            {/* ─── Row 2: 회원구분, 생년월일, 의사면허번호 ─── */}
            <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="회원구분">
                <Input value={memberTypeLabel(formData.MEMBER_TYPE)} disabled />
              </FieldGroup>
              <FieldGroup label="생년월일">
                <Input value={formData.BIRTH_DATE || ''} disabled />
              </FieldGroup>
              <FieldGroup label="의사면허번호">
                <Input value={formData.DOCTOR_LICENSE_NO || ''} disabled />
              </FieldGroup>
            </div>

            {/* ─── Row 3: 출신학교, 진료과, 원장여부 ─── */}
            <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="출신학교">
                <Input value={formData.SCHOOL || ''} disabled />
              </FieldGroup>
              <FieldGroup label="진료과">
                <Input value={formData.DEPARTMENT || ''} disabled />
              </FieldGroup>
              <FieldGroup label="원장여부">
                <div className="flex items-center h-10 gap-4">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="applyIsDirector"
                      className="accent-primary"
                      checked={formData.IS_DIRECTOR === 'Y'}
                      disabled
                    />
                    원장
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="applyIsDirector"
                      className="accent-primary"
                      checked={formData.IS_DIRECTOR !== 'Y'}
                      disabled
                    />
                    비원장
                  </label>
                </div>
              </FieldGroup>
            </div>

            {/* ─── 세부전공 (full width) ─── */}
            <FieldGroup label="세부전공">
              <Input value={formData.SPECIALTY || ''} disabled />
            </FieldGroup>

            {/* ─── 주소 (full width) ─── */}
            <FieldGroup label="주소">
              <div className="flex gap-2">
                <Input
                  value={formData.ADDR || ''}
                  disabled
                  className="flex-1"
                />
                <Input
                  value={formData.ADDR_DETAIL || ''}
                  disabled
                  className="flex-1"
                />
              </div>
            </FieldGroup>

            {/* ─── 이메일, 휴대전화번호 (2 col) ─── */}
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="이메일">
                <Input value={formData.EMAIL || ''} disabled />
              </FieldGroup>
              <FieldGroup label="휴대전화번호">
                <Input value={formData.MOBILE_NO || ''} disabled />
              </FieldGroup>
            </div>

            {/* ─── 수신 동의 여부 (3 col radios) ─── */}
            <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="이메일 수신 동의 여부">
                <div className="flex items-center h-10 gap-4">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="applyEmailAgree"
                      className="accent-primary"
                      checked={formData.EMAIL_AGREE === 'Y'}
                      disabled
                    />
                    동의
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="applyEmailAgree"
                      className="accent-primary"
                      checked={formData.EMAIL_AGREE !== 'Y'}
                      disabled
                    />
                    미동의
                  </label>
                </div>
              </FieldGroup>
              <FieldGroup label="SMS 수신 동의 여부">
                <div className="flex items-center h-10 gap-4">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="applySmsAgree"
                      className="accent-primary"
                      checked={formData.SMS_AGREE === 'Y'}
                      disabled
                    />
                    동의
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="applySmsAgree"
                      className="accent-primary"
                      checked={formData.SMS_AGREE !== 'Y'}
                      disabled
                    />
                    미동의
                  </label>
                </div>
              </FieldGroup>
              <FieldGroup label="회신서 동의 여부">
                <div className="flex items-center h-10 gap-4">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="applyReplyAgree"
                      className="accent-primary"
                      checked={formData.REPLY_AGREE === 'Y'}
                      disabled
                    />
                    동의
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="applyReplyAgree"
                      className="accent-primary"
                      checked={formData.REPLY_AGREE !== 'Y'}
                      disabled
                    />
                    미동의
                  </label>
                </div>
              </FieldGroup>
            </div>

            {/* ─── 병원정보 섹션 ─── */}
            <div className="border-t border-gray-500 pt-5">
              <h3 className="text-base font-semibold mb-4">병원정보</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FieldGroup label="병원명">
                    <Input value={formData.HOSPITAL_NM || ''} disabled />
                  </FieldGroup>
                  <FieldGroup label="요양기관번호">
                    <Input value={formData.HOSPITAL_NO || ''} disabled />
                  </FieldGroup>
                  <FieldGroup label="대표전화">
                    <Input value={formData.HOSPITAL_TEL || ''} disabled />
                  </FieldGroup>
                </div>

                <FieldGroup label="병원주소">
                  <div className="flex gap-2">
                    <Input
                      value={formData.HOSPITAL_ADDR || ''}
                      disabled
                      className="flex-1"
                    />
                    <Input
                      value={formData.HOSPITAL_ADDR_DETAIL || ''}
                      disabled
                      className="flex-1"
                    />
                  </div>
                </FieldGroup>

                <FieldGroup label="병원 홈페이지 주소">
                  <Input value={formData.HOSPITAL_URL || ''} disabled />
                </FieldGroup>
              </div>
            </div>

            {/* ─── 상태 정보 테이블 ─── */}
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
                          formData.APPLY_STATUS === 'APPROVED'
                            ? 'text-src-point font-medium'
                            : formData.APPLY_STATUS === 'REJECTED'
                              ? 'text-src-red font-medium'
                              : formData.APPLY_STATUS === 'PENDING'
                                ? 'text-src-blue font-medium'
                                : ''
                        }
                      >
                        {applyStatusLabel(formData.APPLY_STATUS)}
                      </span>
                    </td>
                    <th className="bg-gray-300 px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                      신청일시
                    </th>
                    <td className="px-4 py-2.5">{formData.APPLY_DTTM || '-'}</td>
                    <th className="bg-gray-300 px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                      가입승인일시
                    </th>
                    <td className="px-4 py-2.5">{formData.APPROVE_DTTM || '-'}</td>
                  </tr>
                  <tr>
                    <th className="bg-gray-300 px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                      가입유형
                    </th>
                    <td className="px-4 py-2.5" colSpan={5}>
                      {joinTypeLabel(formData.JOIN_TYPE)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ─── 비고 ─── */}
            <FieldGroup label="비고">
              <Textarea
                value={formData.MEMO || ''}
                disabled
                placeholder=""
                rows={3}
              />
            </FieldGroup>
          </DialogBody>

          <DialogFooter className="justify-between">
            {formData.APPLY_STATUS === 'PENDING' ? (
              <div className="flex gap-2">
                <Button variant="blue" onClick={() => setApproveOpen(true)}>
                  가입승인
                </Button>
                <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                  반려
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

      {/* ═══ 가입승인 확인 ═══ */}
      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="가입승인"
        description="해당 회원의 가입을 승인하시겠습니까?"
        onConfirm={handleApprove}
      />

      {/* ═══ 반려사유 입력 다이얼로그 ═══ */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>반려사유</DialogTitle>
            <DialogDescription>
              반려 사유를 입력해주세요. 입력한 반려사유는 신청자에게 문자로 안내됩니다. (입력한 반려사유가 SMS로 발송되므로 간결히 작성 바랍니다.)
            </DialogDescription>
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
