'use client';

import { useState, useCallback } from 'react';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react';
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
import {
  GET_ADMIN_USERS_MEMBERS,
  GET_ADMIN_USER_BY_ID,
  ADMIN_UPDATE_USER,
} from '@/lib/graphql/queries/member';
import type {
  AdminUser,
  AdminUsersResponse,
  AdminUserDetail,
  AdminUserByIdResponse,
} from '@/types/member';
import { MEMBER_STATUS_OPTIONS, MEMBER_TYPE_OPTIONS } from '@/types/member';

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
  /* ─── 페이징 상태 ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 조건 (입력 중) ─── */
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchUserType, setSearchUserType] = useState('');

  /* ─── 실제 적용된 필터 ─── */
  const [appliedFilter, setAppliedFilter] = useState<{
    search?: string;
    status?: string;
    userType?: string;
  }>({});

  /* ─── GraphQL 목록 조회 ─── */
  const { data, loading, refetch } = useQuery<AdminUsersResponse>(GET_ADMIN_USERS_MEMBERS, {
    variables: {
      filter: {
        ...(appliedFilter.search ? { search: appliedFilter.search } : {}),
        ...(appliedFilter.status ? { status: appliedFilter.status } : {}),
        ...(appliedFilter.userType ? { userType: appliedFilter.userType } : {}),
      },
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
  const [fetchDetail] = useLazyQuery<AdminUserByIdResponse>(GET_ADMIN_USER_BY_ID, {
    fetchPolicy: 'network-only',
  });

  /* ─── GraphQL 수정 ─── */
  const [updateUser] = useMutation(ADMIN_UPDATE_USER);

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
    const newFilter = {
      search: searchKeyword.trim() || undefined,
      status: searchStatus === '__all' ? undefined : searchStatus || undefined,
      userType: searchUserType === '__all' ? undefined : searchUserType || undefined,
    };
    setAppliedFilter(newFilter);
    setCurrentPage(1);
    refetch({
      filter: {
        ...(newFilter.search ? { search: newFilter.search } : {}),
        ...(newFilter.status ? { status: newFilter.status } : {}),
        ...(newFilter.userType ? { userType: newFilter.userType } : {}),
      },
      pagination: { page: 1, limit: pageSize },
    });
  }, [searchKeyword, searchStatus, searchUserType, refetch, pageSize]);

  /* ─── 검색초기화 ─── */
  const handleReset = () => {
    setSearchKeyword('');
    setSearchStatus('');
    setSearchUserType('');
    setAppliedFilter({});
    setCurrentPage(1);
    refetch({
      filter: {},
      pagination: { page: 1, limit: pageSize },
    });
  };

  /* ─── 행 클릭 → 상세 조회 ─── */
  const handleRowClick = async (row: AdminUser) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const { data: detailData } = await fetchDetail({ variables: { id: row.id } });
      if (detailData?.adminUserById) {
        setSelectedUser(detailData.adminUserById);
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
    {
      accessorKey: 'userType',
      header: '회원구분',
      size: 100,
      cell: ({ getValue }) => memberTypeLabel(getValue() as string),
    },
    { accessorKey: 'email', header: '이메일', size: 180 },
    { accessorKey: 'phone', header: '전화번호', size: 140 },
    {
      accessorKey: 'status',
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
    { accessorKey: 'hospitalCode', header: '병원코드', size: 100 },
    { accessorKey: 'updatedAt', header: '수정일시', size: 160 },
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
          <div className="grid grid-cols-4 gap-x-6 gap-y-4">
            <FieldGroup label="검색">
              <Input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="아이디, 이름, 이메일 검색"
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
                {/* ─── Row 1: 회원ID, 회원명, 이메일 ─── */}
                <div className="grid grid-cols-3 gap-4">
                  <FieldGroup label="회원아이디">
                    <Input value={selectedUser.userId} disabled />
                  </FieldGroup>
                  <FieldGroup label="회원명">
                    <Input value={selectedUser.userName} disabled />
                  </FieldGroup>
                  <FieldGroup label="이메일">
                    <Input value={selectedUser.email} disabled />
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="border-t border-gray-500 pt-5">
                  <h3 className="text-base font-semibold mb-4">병원정보</h3>
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
                    <FieldGroup label="병원주소">
                      <div className="flex gap-2">
                        <Input value={profile?.hospAddress || ''} disabled className="flex-1" />
                        <Input value={profile?.hospAddressDetail || ''} disabled className="flex-1" />
                      </div>
                    </FieldGroup>
                    <FieldGroup label="병원 홈페이지 주소">
                      <Input value={profile?.hospWebsite || ''} disabled />
                    </FieldGroup>
                  </div>
                </div>

                {/* ─── 상태 정보 테이블 ─── */}
                <div className="overflow-hidden rounded-lg border border-gray-500">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-500">
                        <th className="bg-gray-300 px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                          회원상태
                        </th>
                        <td className="px-4 py-2.5">
                          <span
                            className={
                              selectedUser.status === 'ACTIVE'
                                ? 'text-src-point font-medium'
                                : selectedUser.status === 'WITHDRAWN'
                                  ? 'text-src-red font-medium'
                                  : ''
                            }
                          >
                            {statusLabel(selectedUser.status)}
                          </span>
                        </td>
                        <th className="bg-gray-300 px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                          병원코드
                        </th>
                        <td className="px-4 py-2.5">{selectedUser.hospitalCode || '-'}</td>
                        <th className="bg-gray-300 px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                          가입일시
                        </th>
                        <td className="px-4 py-2.5">{selectedUser.createdAt || '-'}</td>
                      </tr>
                      <tr>
                        <th className="bg-gray-300 px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                          수정일시
                        </th>
                        <td className="px-4 py-2.5" colSpan={5}>{selectedUser.updatedAt || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
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
              <Button onClick={() => setPwResetOpen(true)}>비밀번호 초기화</Button>
              <Button variant="destructive" onClick={() => setWithdrawOpen(true)}>
                탈퇴처리
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCancelConfirmOpen(true)}>
                취소
              </Button>
              <Button variant="dark" onClick={() => setSaveConfirmOpen(true)}>
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
        onConfirm={() => {
          toast.success('비밀번호가 초기화되었습니다. 회원의 휴대전화번호로 전송되었습니다.');
          setPwResetOpen(false);
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
