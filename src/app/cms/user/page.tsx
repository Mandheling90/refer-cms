'use client';

import { usePagePermission } from '@/components/molecules/PermissionGuard';
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
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import {
  ADMIN_RESET_PASSWORD,
  ADMIN_UPDATE_USER,
  GET_ADMIN_USERS_MEMBERS,
} from '@/lib/graphql/queries/member';
import { GET_ADMIN_USER_APPROVAL_BY_ID } from '@/lib/graphql/queries/member-apply';
import type {
  AdminUser,
  AdminUserApprovalByIdResponse,
  AdminUserDetail,
  AdminUsersResponse,
} from '@/types/member';
import { MEMBER_STATUS_OPTIONS, MEMBER_TYPE_OPTIONS } from '@/types/member';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { type ColumnDef } from '@tanstack/react-table';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

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

/* ─── 상태/가입유형 라벨 변환 ─── */
const statusLabel = (val?: string) => {
  const found = MEMBER_STATUS_OPTIONS.find((o) => o.value === val);
  return found?.label ?? val ?? '-';
};

const memberTypeLabel = (val?: string) => {
  const found = MEMBER_TYPE_OPTIONS.find((o) => o.value === val);
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
   회원관리 페이지
   ═══════════════════════════════════════ */
export default function MemberPage() {
  const { canEdit } = usePagePermission();

  /* ─── 페이징 상태 ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 조건 (입력 중) ─── */
  const [searchLicenseNo, setSearchLicenseNo] = useState('');
  const [searchUserId, setSearchUserId] = useState('');
  const [searchBirthDate, setSearchBirthDate] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchUserName, setSearchUserName] = useState('');
  const [searchUserType, setSearchUserType] = useState('');

  /* ─── 실제 적용된 필터 ─── */
  const [appliedFilter, setAppliedFilter] = useState<{
    search?: string;
    userType?: string;
  }>({});

  /* ─── GraphQL 목록 조회 ─── */
  const buildFilterVars = (filter: typeof appliedFilter) => ({
    ...(filter.search ? { search: filter.search } : {}),
    userType: filter.userType || 'DOCTOR',
    status: 'ACTIVE',
  });

  const { data, loading, refetch } = useQuery<AdminUsersResponse>(GET_ADMIN_USERS_MEMBERS, {
    variables: {
      filter: buildFilterVars(appliedFilter),
      pagination: {
        page: currentPage,
        limit: pageSize,
      },
    },
    fetchPolicy: 'network-only',
  });

  const items = data?.adminUsers?.items ?? [];
  const totalItems = data?.adminUsers?.totalCount ?? 0;

  /* ─── GraphQL 상세 조회 ─── */
  const [fetchDetail] = useLazyQuery<AdminUserApprovalByIdResponse>(GET_ADMIN_USER_APPROVAL_BY_ID, {
    fetchPolicy: 'network-only',
  });

  /* ─── GraphQL 수정 ─── */
  const [updateUser] = useMutation(ADMIN_UPDATE_USER);
  const [resetPassword] = useMutation<{ adminResetPassword: { success: boolean; message: string } }>(ADMIN_RESET_PASSWORD);

  /* ─── 상세 다이얼로그 ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [memo, setMemo] = useState('');

  /* ─── 확인 다이얼로그 ─── */
  const [pwResetOpen, setPwResetOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  /* ─── 재검색 ─── */
  const handleSearch = useCallback(() => {
    // 서버 필터는 search(통합검색) + userType만 지원
    const searchTerms = [
      searchLicenseNo.trim(),
      searchUserId.trim(),
      searchBirthDate.trim(),
      searchPhone.trim(),
      searchUserName.trim(),
    ].filter(Boolean);
    const newFilter = {
      search: searchTerms.length > 0 ? searchTerms.join(' ') : undefined,
      userType: searchUserType === '__all' ? undefined : searchUserType || undefined,
    };
    setAppliedFilter(newFilter);
    setCurrentPage(1);
    refetch({
      filter: buildFilterVars(newFilter),
      pagination: { page: 1, limit: pageSize },
    });
  }, [searchLicenseNo, searchUserId, searchBirthDate, searchPhone, searchUserName, searchUserType, refetch, pageSize]);

  /* ─── 검색초기화 ─── */
  const handleReset = () => {
    setSearchLicenseNo('');
    setSearchUserId('');
    setSearchBirthDate('');
    setSearchPhone('');
    setSearchUserName('');
    setSearchUserType('');
    setAppliedFilter({});
    setCurrentPage(1);
    refetch({
      filter: buildFilterVars({}),
      pagination: { page: 1, limit: pageSize },
    });
  };

  /* ─── 행 클릭 → 상세 조회 ─── */
  const handleRowClick = async (row: AdminUser) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const { data: detailData } = await fetchDetail({ variables: { id: row.id } });
      if (detailData?.adminUserApprovalById) {
        setSelectedUser(detailData.adminUserApprovalById);
        setMemo('');
      }
    } catch {
      toast.error('회원 상세 정보를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  /* ─── 저장 ─── */
  const handleSave = async () => {
    if (!selectedUser) return;
    try {
      await updateUser({
        variables: {
          id: selectedUser.id,
          input: {
            userName: selectedUser.userName,
            email: selectedUser.email,
            phone: selectedUser.phone,
            userType: selectedUser.userType,
            status: selectedUser.status,
          },
        },
      });
      toast.success('회원 정보가 수정되었습니다.');
      setSaveConfirmOpen(false);
      setDetailOpen(false);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.';
      toast.error(message);
      setSaveConfirmOpen(false);
    }
  };

  /* ─── 페이징 ─── */
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  /* ─── 테이블 컬럼 ─── */
  const columns: ColumnDef<AdminUser, unknown>[] = [
    {
      id: 'rowNum',
      header: 'No',
      size: 60,
      cell: ({ row }) => (currentPage - 1) * pageSize + row.index + 1,
    },
    { accessorKey: 'userId', header: '회원아이디', size: 130 },
    { accessorKey: 'userName', header: '회원명', size: 100 },
    { accessorKey: 'phone', header: '전화번호', size: 140 },
    {
      accessorKey: 'userType',
      header: '회원구분',
      size: 100,
      cell: ({ getValue }) => memberTypeLabel(getValue() as string),
    },
    {
      id: 'licenseNo',
      header: '의사면허번호',
      size: 130,
      cell: ({ row }) => row.original.profile?.licenseNo || '-',
    },
    {
      accessorKey: 'createdAt',
      header: '가입일시',
      size: 160,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
  ];

  const profile = selectedUser?.profile;

  return (
    <>
      <ListPageTemplate
        title="회원관리"
        totalItems={totalItems}
        onSearch={handleSearch}
        onReset={handleReset}
        searchSection={
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <FieldGroup label="의사면허번호">
              <Input
                value={searchLicenseNo}
                onChange={(e) => setSearchLicenseNo(e.target.value)}
                placeholder="의사면허번호"
              />
            </FieldGroup>
            <FieldGroup label="회원아이디">
              <Input
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
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
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="휴대전화번호"
              />
            </FieldGroup>
            <FieldGroup label="회원명">
              <Input
                value={searchUserName}
                onChange={(e) => setSearchUserName(e.target.value)}
                placeholder="회원명"
              />
            </FieldGroup>
            <FieldGroup label="회원구분">
              <Select value={searchUserType} onValueChange={setSearchUserType}>
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
          </div>
        }
        listContent={
          <DataTable
            columns={columns}
            data={items}
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
        <DialogContent size="lg" className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>회원 조회 및 수정</DialogTitle>
            <DialogDescription>
              회원 정보를 조회하고 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5 overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                로딩 중...
              </div>
            ) : selectedUser ? (
              <>
                {/* ─── Row 1: 회원ID, 회원번호, 회원명 ─── */}
                <div className="grid grid-cols-3 gap-4">
                  <FieldGroup label="회원ID">
                    <Input value={selectedUser.userId} disabled />
                  </FieldGroup>
                  <FieldGroup label="회원번호">
                    <Input value={selectedUser.id || '-'} disabled />
                  </FieldGroup>
                  <FieldGroup label="회원명">
                    <Input value={selectedUser.userName} disabled />
                  </FieldGroup>
                </div>

                {/* ─── Row 2: 회원구분, 생년월일, 의사면허번호 ─── */}
                <div className="grid grid-cols-3 gap-4">
                  <FieldGroup label="회원구분">
                    <Input value={memberTypeLabel(selectedUser.userType)} disabled />
                  </FieldGroup>
                  <FieldGroup label="생년월일">
                    <Input value={profile?.birthDate?.split('T')[0] || ''} disabled />
                  </FieldGroup>
                  <FieldGroup label="의사면허번호">
                    <Input value={profile?.licenseNo || ''} disabled />
                  </FieldGroup>
                </div>

                {/* ─── Row 3: 출신학교, 진료과, 원장여부 ─── */}
                <div className="grid grid-cols-3 gap-4">
                  <FieldGroup label="출신학교">
                    <Input value={profile?.school || ''} disabled />
                  </FieldGroup>
                  <FieldGroup label="진료과">
                    <Input value={profile?.department || ''} disabled />
                  </FieldGroup>
                  <FieldGroup label="원장여부">
                    <div className="flex items-center h-10 gap-4">
                      <label className="flex items-center gap-1.5 text-sm">
                        <input
                          type="radio"
                          name="isDirector"
                          className="accent-primary"
                          checked={profile?.isDirector === true}
                          disabled
                        />
                        원장
                      </label>
                      <label className="flex items-center gap-1.5 text-sm">
                        <input
                          type="radio"
                          name="isDirector"
                          className="accent-primary"
                          checked={profile?.isDirector !== true}
                          disabled
                        />
                        비원장
                      </label>
                    </div>
                  </FieldGroup>
                </div>

                {/* ─── 세부전공 ─── */}
                <FieldGroup label="세부전공">
                  <Input value={profile?.specialty || ''} disabled />
                </FieldGroup>

                {/* ─── 이메일, 휴대전화번호 ─── */}
                <div className="grid grid-cols-3 gap-4">
                  <FieldGroup label="이메일">
                    <Input value={selectedUser.email} disabled />
                  </FieldGroup>
                  <FieldGroup label="휴대전화번호">
                    <Input value={selectedUser.phone || ''} disabled />
                  </FieldGroup>
                </div>

                {/* ─── 수신 동의 여부 ─── */}
                <div className="grid grid-cols-3 gap-4">
                  <FieldGroup label="이메일 수신 동의 여부">
                    <div className="flex items-center h-10 gap-4">
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" className="accent-primary" checked={profile?.emailConsent === true} disabled />
                        동의
                      </label>
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" className="accent-primary" checked={profile?.emailConsent !== true} disabled />
                        미동의
                      </label>
                    </div>
                  </FieldGroup>
                  <FieldGroup label="SMS 수신 동의 여부">
                    <div className="flex items-center h-10 gap-4">
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" className="accent-primary" checked={profile?.smsConsent === true} disabled />
                        동의
                      </label>
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" className="accent-primary" checked={profile?.smsConsent !== true} disabled />
                        미동의
                      </label>
                    </div>
                  </FieldGroup>
                  <FieldGroup label="회신서 동의 여부">
                    <div className="flex items-center h-10 gap-4">
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" className="accent-primary" checked={profile?.replyConsent === true} disabled />
                        동의
                      </label>
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" className="accent-primary" checked={profile?.replyConsent !== true} disabled />
                        미동의
                      </label>
                    </div>
                  </FieldGroup>
                </div>

                {/* ─── 병원정보 섹션 ─── */}
                <div className="-mx-6 border-y border-border px-6 py-3">
                  <h3 className="text-sm font-semibold">병원정보</h3>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <FieldGroup label="병원명">
                        <Input value={profile?.hospName || ''} disabled />
                      </FieldGroup>
                      <FieldGroup label="요양기관번호">
                        <Input value={profile?.careInstitutionNo || ''} disabled />
                      </FieldGroup>
                      <FieldGroup label="대표전화">
                        <Input value={profile?.hospPhone || ''} disabled />
                      </FieldGroup>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FieldGroup label="우편번호">
                        <Input value={profile?.hospZipCode || ''} disabled />
                      </FieldGroup>
                      <FieldGroup label="주소">
                        <Input value={profile?.hospAddress || ''} disabled />
                      </FieldGroup>
                      <FieldGroup label="상세주소">
                        <Input value={profile?.hospAddressDetail || ''} disabled />
                      </FieldGroup>
                    </div>
                    <FieldGroup label="병원 홈페이지 주소">
                      <Input value={profile?.hospWebsite || ''} disabled />
                    </FieldGroup>
                  </div>

                {/* ─── 상태 정보 ─── */}
                <div className="grid grid-cols-3 gap-4">
                  <FieldGroup label="회원상태">
                    <Input value={statusLabel(selectedUser.status)} disabled />
                  </FieldGroup>
                  <FieldGroup label="회원정보 수정일시">
                    <Input value={formatDateTime(selectedUser.updatedAt)} disabled />
                  </FieldGroup>
                  <FieldGroup label="회원 가입일시">
                    <Input value={formatDateTime(selectedUser.createdAt)} disabled />
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FieldGroup label="회원탈퇴 일시">
                    <Input value={formatDateTime(selectedUser.withdrawnAt)} disabled />
                  </FieldGroup>
                  <FieldGroup label="마지막 로그인 일시">
                    <Input value={formatDateTime(selectedUser.lastLoginAt)} disabled />
                  </FieldGroup>
                  <FieldGroup label="마지막 로그인 IP">
                    <Input value={selectedUser.lastLoginIp || '-'} disabled />
                  </FieldGroup>
                </div>

                {/* ─── 비고 ─── */}
                <FieldGroup label="비고">
                  <Textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="회원에 대한 특이사항을 기재하세요."
                    rows={3}
                  />
                </FieldGroup>
              </>
            ) : null}
          </DialogBody>

          <DialogFooter className="justify-between">
            <div className="flex gap-2">
              <Button disabled={!canEdit} onClick={() => setPwResetOpen(true)}>비밀번호 초기화</Button>
              <Button variant="destructive" disabled={!canEdit} onClick={() => setWithdrawOpen(true)}>
                탈퇴처리
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCancelConfirmOpen(true)}>
                취소
              </Button>
              <Button variant="dark" disabled={!canEdit} onClick={() => setSaveConfirmOpen(true)}>
                저장
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ 비밀번호 초기화 확인 ═══ */}
      <ConfirmDialog
        open={pwResetOpen}
        onOpenChange={setPwResetOpen}
        title="비밀번호 초기화"
        description="비밀번호를 초기화하시겠습니까? 초기화된 비밀번호는 회원의 휴대전화번호로 전송됩니다."
        onConfirm={async () => {
          if (!selectedUser) return;
          try {
            const { data: result } = await resetPassword({
              variables: { id: selectedUser.id },
            });
            if (result?.adminResetPassword?.success) {
              toast.success(result.adminResetPassword.message || '비밀번호가 초기화되었습니다.');
            } else {
              toast.error(result?.adminResetPassword?.message || '비밀번호 초기화에 실패했습니다.');
            }
            setPwResetOpen(false);
          } catch (err) {
            const message = err instanceof Error ? err.message : '비밀번호 초기화 중 오류가 발생했습니다.';
            toast.error(message);
            setPwResetOpen(false);
          }
        }}
        destructive
      />

      {/* ═══ 탈퇴처리 확인 ═══ */}
      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="탈퇴처리"
        description="해당 회원을 탈퇴 처리하시겠습니까?"
        onConfirm={async () => {
          if (!selectedUser) return;
          try {
            await updateUser({
              variables: {
                id: selectedUser.id,
                input: { status: 'WITHDRAWN' },
              },
            });
            toast.success('회원이 탈퇴 처리되었습니다.');
            setWithdrawOpen(false);
            setDetailOpen(false);
            refetch();
          } catch (err) {
            const message = err instanceof Error ? err.message : '탈퇴 처리 중 오류가 발생했습니다.';
            toast.error(message);
            setWithdrawOpen(false);
          }
        }}
        destructive
      />

      {/* ═══ 저장 확인 ═══ */}
      <ConfirmDialog
        open={saveConfirmOpen}
        onOpenChange={setSaveConfirmOpen}
        title="저장"
        description="수정한 내용으로 저장하시겠습니까?"
        onConfirm={handleSave}
      />

      {/* ═══ 취소 확인 ═══ */}
      <ConfirmDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="취소"
        description="취소 시 수정한 내용이 저장되지 않습니다. 취소하시겠습니까?"
        onConfirm={() => {
          setCancelConfirmOpen(false);
          setDetailOpen(false);
        }}
        destructive
      />
    </>
  );
}
