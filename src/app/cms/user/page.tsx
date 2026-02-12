'use client';

import { useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { Member } from '@/types/member';
import { MEMBER_STATUS_OPTIONS, MEMBER_TYPE_OPTIONS, JOIN_TYPE_OPTIONS } from '@/types/member';

/* ─── 더미 데이터 (백엔드 연동 전) ─── */
const MOCK_MEMBERS: Member[] = [
  {
    MEMBER_ID: 'M001',
    LOGIN_ID: 'hong001',
    MEMBER_NM: '홍길동',
    MEMBER_NM_EN: 'Hong Gildong',
    BIRTH_DATE: '1985-03-15',
    MOBILE_NO: '010-1234-5678',
    EMAIL: 'hong@example.com',
    DOCTOR_LICENSE_NO: '123-45-67890',
    DEPT_NM: '내과',
    POSITION: '과장',
    MEMBER_TYPE: 'DOCTOR',
    STATUS: 'ACTIVE',
    JOIN_TYPE: 'NORMAL',
    INSERT_DTTM: '2024-01-15 09:30:00',
    UPDATE_DTTM: '2025-06-20 14:22:00',
  },
  {
    MEMBER_ID: 'M002',
    LOGIN_ID: 'kim002',
    MEMBER_NM: '김철수',
    MEMBER_NM_EN: 'Kim Cheolsu',
    BIRTH_DATE: '1990-07-22',
    MOBILE_NO: '010-9876-5432',
    EMAIL: 'kim@example.com',
    DOCTOR_LICENSE_NO: '234-56-78901',
    DEPT_NM: '외과',
    POSITION: '전문의',
    MEMBER_TYPE: 'DENTIST',
    STATUS: 'ACTIVE',
    JOIN_TYPE: 'NORMAL',
    INSERT_DTTM: '2024-03-10 11:00:00',
    UPDATE_DTTM: '2025-05-18 10:15:00',
  },
  {
    MEMBER_ID: 'M003',
    LOGIN_ID: 'lee003',
    MEMBER_NM: '이영희',
    MEMBER_NM_EN: 'Lee Younghee',
    BIRTH_DATE: '1988-11-03',
    MOBILE_NO: '010-5555-1234',
    EMAIL: 'lee@example.com',
    DOCTOR_LICENSE_NO: '345-67-89012',
    DEPT_NM: '소아과',
    POSITION: '부장',
    MEMBER_TYPE: 'KMD',
    STATUS: 'ACTIVE',
    JOIN_TYPE: 'SMS',
    INSERT_DTTM: '2024-05-20 08:45:00',
    UPDATE_DTTM: '2025-04-12 16:30:00',
  },
  {
    MEMBER_ID: 'M004',
    LOGIN_ID: 'park004',
    MEMBER_NM: '박민수',
    MEMBER_NM_EN: 'Park Minsu',
    BIRTH_DATE: '1975-01-30',
    MOBILE_NO: '010-3333-7777',
    EMAIL: 'park@example.com',
    DOCTOR_LICENSE_NO: '456-78-90123',
    DEPT_NM: '정형외과',
    POSITION: '전문의',
    MEMBER_TYPE: 'DOCTOR',
    STATUS: 'WITHDRAWN',
    JOIN_TYPE: 'NORMAL',
    INSERT_DTTM: '2023-12-01 14:20:00',
    UPDATE_DTTM: '2025-02-28 09:00:00',
  },
  {
    MEMBER_ID: 'M005',
    LOGIN_ID: 'choi005',
    MEMBER_NM: '최수진',
    MEMBER_NM_EN: 'Choi Sujin',
    BIRTH_DATE: '1992-09-18',
    MOBILE_NO: '010-8888-4444',
    EMAIL: 'choi@example.com',
    DOCTOR_LICENSE_NO: '567-89-01234',
    DEPT_NM: '피부과',
    POSITION: '과장',
    MEMBER_TYPE: 'DENTIST',
    STATUS: 'ACTIVE',
    JOIN_TYPE: 'SMS',
    INSERT_DTTM: '2024-08-05 10:10:00',
    UPDATE_DTTM: '2025-07-01 11:45:00',
  },
];

/* ─── 상태/가입유형 라벨 변환 ─── */
const statusLabel = (val?: string) => {
  const found = MEMBER_STATUS_OPTIONS.find((o) => o.value === val);
  return found?.label ?? val ?? '-';
};

const joinTypeLabel = (val?: string) => {
  const found = JOIN_TYPE_OPTIONS.find((o) => o.value === val);
  return found?.label ?? val ?? '-';
};

/* ─── 테이블 컬럼 ─── */
const columns: ColumnDef<Member, unknown>[] = [
  {
    id: 'rowNum',
    header: 'No',
    size: 60,
    cell: ({ row }) => row.index + 1,
  },
  { accessorKey: 'LOGIN_ID', header: '회원아이디', size: 130 },
  { accessorKey: 'MEMBER_NM', header: '회원명', size: 100 },
  { accessorKey: 'BIRTH_DATE', header: '생년월일', size: 110 },
  { accessorKey: 'MOBILE_NO', header: '휴대전화번호', size: 140 },
  {
    accessorKey: 'STATUS',
    header: '상태',
    size: 80,
    cell: ({ getValue }) => {
      const val = getValue() as string;
      return (
        <span
          className={
            val === 'ACTIVE'
              ? 'text-src-point font-medium'
              : val === 'WITHDRAWN'
                ? 'text-src-red font-medium'
                : ''
          }
        >
          {statusLabel(val)}
        </span>
      );
    },
  },
  {
    accessorKey: 'JOIN_TYPE',
    header: '가입유형',
    size: 100,
    cell: ({ getValue }) => joinTypeLabel(getValue() as string),
  },
  { accessorKey: 'UPDATE_DTTM', header: '수정일시', size: 160 },
];

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

/* ─── 상세 폼 라벨+인풋 (수직 테이블) ─── */
function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-2">
      <Label className="text-sm font-semibold text-foreground whitespace-nowrap">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════
   회원관리 페이지
   ═══════════════════════════════════════ */
export default function MemberPage() {
  /* ─── 리스트 상태 ─── */
  const [data, setData] = useState<Member[]>(MOCK_MEMBERS);
  const [loading] = useState(false);
  const [totalItems, setTotalItems] = useState(MOCK_MEMBERS.length);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 조건 ─── */
  const [searchDoctorLicenseNo, setSearchDoctorLicenseNo] = useState('');
  const [searchMemberId, setSearchMemberId] = useState('');
  const [searchBirthDate, setSearchBirthDate] = useState('');
  const [searchMobileNo, setSearchMobileNo] = useState('');
  const [searchMemberNm, setSearchMemberNm] = useState('');
  const [searchMemberType, setSearchMemberType] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchJoinType, setSearchJoinType] = useState('');

  /* ─── 상세 다이얼로그 ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Member>>({});
  const [isNew, setIsNew] = useState(false);

  /* ─── 비밀번호 초기화 다이얼로그 ─── */
  const [pwResetOpen, setPwResetOpen] = useState(false);

  /* ─── 검색 ─── */
  const handleSearch = useCallback(() => {
    // TODO: 백엔드 API 연동 시 교체
    let filtered = [...MOCK_MEMBERS];
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
    if (searchMemberType)
      filtered = filtered.filter((m) => m.MEMBER_TYPE === searchMemberType);
    if (searchStatus)
      filtered = filtered.filter((m) => m.STATUS === searchStatus);
    if (searchJoinType)
      filtered = filtered.filter((m) => m.JOIN_TYPE === searchJoinType);
    setData(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  }, [searchDoctorLicenseNo, searchMemberId, searchBirthDate, searchMobileNo, searchMemberNm, searchMemberType, searchStatus, searchJoinType]);

  /* ─── 초기화 ─── */
  const handleReset = () => {
    setSearchDoctorLicenseNo('');
    setSearchMemberId('');
    setSearchBirthDate('');
    setSearchMobileNo('');
    setSearchMemberNm('');
    setSearchMemberType('');
    setSearchStatus('');
    setSearchJoinType('');
    setData(MOCK_MEMBERS);
    setTotalItems(MOCK_MEMBERS.length);
    setCurrentPage(1);
  };

  /* ─── 행 클릭 → 상세 팝업 ─── */
  const handleRowClick = (row: Member) => {
    setFormData({ ...row });
    setIsNew(false);
    setDetailOpen(true);
  };

  /* ─── 신규 등록 ─── */
  const handleNewMember = () => {
    setFormData({});
    setIsNew(true);
    setDetailOpen(true);
  };

  /* ─── 저장 (TODO: API 연동) ─── */
  const handleSave = () => {
    if (!formData.LOGIN_ID?.trim()) {
      toast.error('로그인 ID는 필수 입력입니다.');
      return;
    }
    if (!formData.MEMBER_NM?.trim()) {
      toast.error('이름은 필수 입력입니다.');
      return;
    }
    toast.success(isNew ? '회원이 등록되었습니다.' : '회원 정보가 수정되었습니다.');
    setDetailOpen(false);
  };

  /* ─── 삭제 (TODO: API 연동) ─── */
  const handleDelete = () => {
    toast.success('회원이 삭제되었습니다.');
    setDetailOpen(false);
  };

  /* ─── 페이징 ─── */
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const updateField = (key: keyof Member, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <ListPageTemplate
        title="회원관리"
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
            <FieldGroup label="회원구분">
              <Select value={searchMemberType} onValueChange={setSearchMemberType}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || '__all'} value={opt.value || '__all'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="회원상태">
              <Select value={searchStatus} onValueChange={setSearchStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_STATUS_OPTIONS.map((opt) => (
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

      {/* ═══ 회원 조회 및 수정 다이얼로그 ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? '회원 등록' : '회원 조회 및 수정'}</DialogTitle>
            <DialogDescription>
              {isNew ? '새 회원 정보를 입력합니다.' : '회원 정보를 조회하고 수정할 수 있습니다.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-6">
            {/* ─── 기본 정보 ─── */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <FormField label="로그인 ID" required>
                <Input
                  value={formData.LOGIN_ID || ''}
                  onChange={(e) => updateField('LOGIN_ID', e.target.value)}
                  placeholder="로그인 ID"
                  disabled={!isNew}
                />
              </FormField>
              <FormField label="이름" required>
                <Input
                  value={formData.MEMBER_NM || ''}
                  onChange={(e) => updateField('MEMBER_NM', e.target.value)}
                  placeholder="이름"
                />
              </FormField>
              <FormField label="영문이름">
                <Input
                  value={formData.MEMBER_NM_EN || ''}
                  onChange={(e) => updateField('MEMBER_NM_EN', e.target.value)}
                  placeholder="영문이름"
                />
              </FormField>
              <FormField label="생년월일">
                <Input
                  value={formData.BIRTH_DATE || ''}
                  onChange={(e) => updateField('BIRTH_DATE', e.target.value)}
                  placeholder="YYYY-MM-DD"
                />
              </FormField>
              <FormField label="부서코드">
                <Input
                  value={formData.DEPT_CODE || ''}
                  onChange={(e) => updateField('DEPT_CODE', e.target.value)}
                  placeholder="부서코드"
                />
              </FormField>
              <FormField label="직급">
                <Input
                  value={formData.POSITION || ''}
                  onChange={(e) => updateField('POSITION', e.target.value)}
                  placeholder="직급"
                />
              </FormField>
              <FormField label="기관코드">
                <Input
                  value={formData.ORG_CODE || ''}
                  onChange={(e) => updateField('ORG_CODE', e.target.value)}
                  placeholder="기관코드"
                />
              </FormField>
              <FormField label="홈페이지">
                <Input
                  value={formData.HOMEPAGE || ''}
                  onChange={(e) => updateField('HOMEPAGE', e.target.value)}
                  placeholder="홈페이지 URL"
                />
              </FormField>
              <FormField label="휴대전화번호" required>
                <Input
                  value={formData.MOBILE_NO || ''}
                  onChange={(e) => updateField('MOBILE_NO', e.target.value)}
                  placeholder="010-0000-0000"
                />
              </FormField>
              <FormField label="전화번호">
                <Input
                  value={formData.PHONE_NO || ''}
                  onChange={(e) => updateField('PHONE_NO', e.target.value)}
                  placeholder="전화번호"
                />
              </FormField>
              <FormField label="팩스(FAX)">
                <Input
                  value={formData.FAX_NO || ''}
                  onChange={(e) => updateField('FAX_NO', e.target.value)}
                  placeholder="FAX 번호"
                />
              </FormField>
              <FormField label="이메일">
                <Input
                  value={formData.EMAIL || ''}
                  onChange={(e) => updateField('EMAIL', e.target.value)}
                  placeholder="이메일"
                />
              </FormField>
            </div>

            {/* ─── 메모 ─── */}
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <Label className="text-sm font-semibold text-foreground pt-2">메모기입사항</Label>
              <Textarea
                value={formData.MEMO || ''}
                onChange={(e) => updateField('MEMO', e.target.value)}
                placeholder="메모를 입력하세요."
                rows={3}
              />
            </div>

            {/* ─── 비밀번호 (수정 시) ─── */}
            {!isNew && (
              <div className="border-t border-gray-500 pt-4">
                <h3 className="text-base font-semibold mb-4">비밀번호</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <FormField label="비밀번호">
                    <Input
                      type="password"
                      value={formData.PASSWORD || ''}
                      onChange={(e) => updateField('PASSWORD', e.target.value)}
                      placeholder="비밀번호"
                    />
                  </FormField>
                  <FormField label="비밀번호 확인">
                    <Input
                      type="password"
                      value={formData.PASSWORD_CONFIRM || ''}
                      onChange={(e) => updateField('PASSWORD_CONFIRM', e.target.value)}
                      placeholder="비밀번호 확인"
                    />
                  </FormField>
                </div>
                <div className="mt-3">
                  <Button
                    variant="outline-red"
                    size="sm"
                    onClick={() => setPwResetOpen(true)}
                  >
                    비밀번호 초기화
                  </Button>
                </div>
              </div>
            )}

            {/* ─── 비밀번호 (신규 등록 시) ─── */}
            {isNew && (
              <div className="border-t border-gray-500 pt-4">
                <h3 className="text-base font-semibold mb-4">비밀번호</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <FormField label="비밀번호" required>
                    <Input
                      type="password"
                      value={formData.PASSWORD || ''}
                      onChange={(e) => updateField('PASSWORD', e.target.value)}
                      placeholder="비밀번호"
                    />
                  </FormField>
                  <FormField label="비밀번호 확인" required>
                    <Input
                      type="password"
                      value={formData.PASSWORD_CONFIRM || ''}
                      onChange={(e) => updateField('PASSWORD_CONFIRM', e.target.value)}
                      placeholder="비밀번호 확인"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* ─── 옵션 (라디오) ─── */}
            <div className="border-t border-gray-500 pt-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <FormField label="의사여부">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="isDoctor"
                        className="accent-primary"
                        checked={formData.IS_DOCTOR === 'Y'}
                        onChange={() => updateField('IS_DOCTOR', 'Y')}
                      />
                      의사
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="isDoctor"
                        className="accent-primary"
                        checked={formData.IS_DOCTOR !== 'Y'}
                        onChange={() => updateField('IS_DOCTOR', 'N')}
                      />
                      비의사
                    </label>
                  </div>
                </FormField>
                <FormField label="관리자여부">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="isAdmin"
                        className="accent-primary"
                        checked={formData.IS_ADMIN === 'Y'}
                        onChange={() => updateField('IS_ADMIN', 'Y')}
                      />
                      관리자
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="isAdmin"
                        className="accent-primary"
                        checked={formData.IS_ADMIN !== 'Y'}
                        onChange={() => updateField('IS_ADMIN', 'N')}
                      />
                      일반
                    </label>
                  </div>
                </FormField>
                <FormField label="상태">
                  <Select
                    value={formData.STATUS || 'ACTIVE'}
                    onValueChange={(v) => updateField('STATUS', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">정상</SelectItem>
                      <SelectItem value="WITHDRAWN">탈퇴</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="가입유형">
                  <Select
                    value={formData.JOIN_TYPE || 'NORMAL'}
                    onValueChange={(v) => updateField('JOIN_TYPE', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">일반회원</SelectItem>
                      <SelectItem value="SMS">SMS회원</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="default" onClick={handleSave}>
              {isNew ? '회원 등록' : '회원정보 저장'}
            </Button>
            {!isNew && (
              <Button variant="destructive" onClick={handleDelete}>
                삭제
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ 비밀번호 초기화 확인 ═══ */}
      <ConfirmDialog
        open={pwResetOpen}
        onOpenChange={setPwResetOpen}
        title="비밀번호 초기화"
        description="회원의 비밀번호를 초기 비밀번호로 초기화하시겠습니까? 초기화된 비밀번호는 회원에게 SMS로 발송됩니다."
        onConfirm={() => {
          toast.success('비밀번호가 초기화되었습니다.');
          setPwResetOpen(false);
        }}
        destructive
      />
    </>
  );
}
