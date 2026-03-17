'use client';

import { useState, useCallback, useMemo } from 'react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { GET_ADMIN_USERS, GET_ADMIN_USER_DETAIL, ADMIN_CREATE_USER, CHECK_USER_ID_AVAILABLE } from '@/lib/graphql/queries/admin';
import { ADMIN_UPDATE_USER } from '@/lib/graphql/queries/member';
import type { AdminUser, AdminUsersResponse, AdminUserByIdResponse, AdminUserDetail } from '@/types/member';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { ShieldAlert } from 'lucide-react';

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

/* ─── 상태 라벨 ─── */
const statusLabel = (val?: string) => {
  switch (val) {
    case 'ACTIVE': return '사용';
    case 'PENDING': return '승인대기';
    case 'REJECTED': return '사용중지';
    case 'WITHDRAWN': return '탈퇴';
    default: return val ?? '-';
  }
};

/* ─── 검색 필드 ─── */
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

/* ─── 폼 필드 (디자인 반영) ─── */
function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <span className="text-sm font-normal text-foreground">{label}</span>
        {required && <span className="text-[11px] text-red-500">*</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* ─── ToggleSwitch (메뉴관리와 동일) ─── */
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer items-center rounded-[14px] transition-colors duration-200',
        checked ? 'bg-primary' : 'bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && onChange(!checked)}
    >
      {checked && (
        <span className="absolute left-1.5 text-[10px] font-semibold text-white select-none">
          ON
        </span>
      )}
      {!checked && (
        <span className="absolute right-1.5 text-[10px] font-semibold text-gray-500 select-none">
          OFF
        </span>
      )}
      <span
        className={cn(
          'pointer-events-none absolute h-6 w-6 rounded-full bg-card shadow transition-[left] duration-200',
          checked ? 'left-[26px]' : 'left-[2px]'
        )}
      />
    </button>
  );
}

export default function AdminManagementPage() {
  const user = useAuthStore((s) => s.user);
  const hospitalCode = useAuthStore((s) => s.hospitalCode);
  const isSuperAdmin = user?.IS_SUPER_ADMIN === true || hospitalCode === 'ALL';

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
        <ShieldAlert className="h-16 w-16" />
        <p className="text-lg font-semibold">접근 권한이 없습니다.</p>
        <p className="text-sm">통합관리자만 접근할 수 있는 페이지입니다.</p>
      </div>
    );
  }

  return <AdminManagementContent />;
}

function AdminManagementContent() {
  /* ─── 페이징 ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 (입력 중) ─── */
  const [searchUserId, setSearchUserId] = useState('');
  const [searchUserName, setSearchUserName] = useState('');

  /* ─── 실제 적용된 필터 ─── */
  const [appliedFilter, setAppliedFilter] = useState<{ search?: string }>({});

  /* ─── 선택 행 ─── */
  const [selectedRows, setSelectedRows] = useState<AdminUser[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  /* ─── 상세(수정) 다이얼로그 ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);

  /* ─── 수정 폼 상태 ─── */
  const [formUserName, setFormUserName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPasswordConfirm, setFormPasswordConfirm] = useState('');
  const [formIpAddress, setFormIpAddress] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  /* ─── 등록 다이얼로그 ─── */
  const [registerOpen, setRegisterOpen] = useState(false);
  const [regUserName, setRegUserName] = useState('');
  const [regUserId, setRegUserId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regIpAddress, setRegIpAddress] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regHospitalCode, setRegHospitalCode] = useState('');
  const [regIsActive, setRegIsActive] = useState(true);
  const [regIdChecked, setRegIdChecked] = useState(false);

  /* ─── 확인 다이얼로그 ─── */
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [regSaveConfirmOpen, setRegSaveConfirmOpen] = useState(false);
  const [regCancelConfirmOpen, setRegCancelConfirmOpen] = useState(false);

  /* ─── GraphQL 목록 조회 ─── */
  const { data, loading, refetch } = useQuery<AdminUsersResponse>(GET_ADMIN_USERS, {
    variables: {
      filter: {
        ...(appliedFilter.search ? { search: appliedFilter.search } : {}),
      },
      pagination: {
        page: currentPage,
        limit: pageSize,
      },
    },
    fetchPolicy: 'network-only',
  });

  const allItems = data?.adminUsers?.items ?? [];
  const items = useMemo(() => allItems.filter((item) => item.status !== 'WITHDRAWN'), [allItems]);
  const totalItems = items.length;

  /* ─── GraphQL 상세 조회 ─── */
  const [fetchDetail] = useLazyQuery<AdminUserByIdResponse>(GET_ADMIN_USER_DETAIL, {
    fetchPolicy: 'network-only',
  });

  /* ─── GraphQL 수정 ─── */
  const [updateUser] = useMutation(ADMIN_UPDATE_USER);

  /* ─── GraphQL 등록 ─── */
  const [createUser] = useMutation(ADMIN_CREATE_USER);

  /* ─── GraphQL 아이디 중복 확인 ─── */
  const [checkUserId] = useLazyQuery<{
    checkUserIdAvailable: { available: boolean; existsInDb: boolean; existsInEhr: boolean };
  }>(CHECK_USER_ID_AVAILABLE, {
    fetchPolicy: 'network-only',
  });

  /* ─── 검색 ─── */
  const handleSearch = useCallback(() => {
    const searchTerms = [searchUserId.trim(), searchUserName.trim()].filter(Boolean);
    const newFilter = {
      search: searchTerms.length > 0 ? searchTerms.join(' ') : undefined,
    };
    setAppliedFilter(newFilter);
    setCurrentPage(1);
    refetch({
      filter: newFilter.search ? { search: newFilter.search } : {},
      pagination: { page: 1, limit: pageSize },
    });
  }, [searchUserId, searchUserName, refetch, pageSize]);

  const handleReset = () => {
    setSearchUserId('');
    setSearchUserName('');
    setAppliedFilter({});
    setCurrentPage(1);
    refetch({
      filter: {},
      pagination: { page: 1, limit: pageSize },
    });
  };

  /* ─── 페이징 ─── */
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  /* ─── 삭제 (탈퇴 처리) ─── */
  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedRows.map((row) =>
          updateUser({
            variables: {
              id: row.id,
              input: { status: 'WITHDRAWN' },
            },
          })
        )
      );
      toast.success(`${selectedRows.length}건의 관리자가 탈퇴 처리되었습니다.`);
      setDeleteConfirmOpen(false);
      setSelectedRows([]);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.';
      toast.error(message);
      setDeleteConfirmOpen(false);
    }
  };

  /* ─── 등록 폼 초기화 ─── */
  const handleOpenRegister = () => {
    setRegUserName('');
    setRegUserId('');
    setRegPassword('');
    setRegPasswordConfirm('');
    setRegIpAddress('');
    setRegEmail('');
    setRegHospitalCode('');
    setRegIsActive(true);
    setRegIdChecked(false);
    setRegisterOpen(true);
  };

  /* ─── 아이디 중복 확인 ─── */
  const handleCheckDuplicate = async () => {
    if (!regUserId.trim()) {
      toast.error('아이디를 입력해 주세요.');
      return;
    }
    try {
      const { data: checkData } = await checkUserId({
        variables: { userId: regUserId },
      });
      const result = checkData?.checkUserIdAvailable;
      if (result?.available) {
        toast.success('사용 가능한 아이디입니다.');
        setRegIdChecked(true);
      } else {
        const reasons: string[] = [];
        if (result?.existsInDb) reasons.push('CMS');
        if (result?.existsInEhr) reasons.push('EHR');
        toast.error(
          reasons.length > 0
            ? `이미 ${reasons.join(', ')}에 등록된 아이디입니다.`
            : '이미 사용 중인 아이디입니다.'
        );
        setRegIdChecked(false);
      }
    } catch {
      toast.error('중복 확인 중 오류가 발생했습니다.');
      setRegIdChecked(false);
    }
  };

  /* ─── 등록 저장 ─── */
  const handleRegisterSave = async () => {
    if (!regUserName.trim()) {
      toast.error('관리자명은 필수 입력입니다.');
      setRegSaveConfirmOpen(false);
      return;
    }
    if (!regUserId.trim()) {
      toast.error('아이디는 필수 입력입니다.');
      setRegSaveConfirmOpen(false);
      return;
    }
    if (!regPassword.trim()) {
      toast.error('비밀번호는 필수 입력입니다.');
      setRegSaveConfirmOpen(false);
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      toast.error('비밀번호가 일치하지 않습니다.');
      setRegSaveConfirmOpen(false);
      return;
    }
    if (!regIdChecked) {
      toast.error('아이디 중복 확인을 해주세요.');
      setRegSaveConfirmOpen(false);
      return;
    }
    if (!regHospitalCode) {
      toast.error('소속 기관을 선택해 주세요.');
      setRegSaveConfirmOpen(false);
      return;
    }
    try {
      await createUser({
        variables: {
          input: {
            userId: regUserId,
            userName: regUserName,
            password: regPassword,
            passwordConfirm: regPasswordConfirm,
            hospitalCode: regHospitalCode,
            ...(regEmail.trim() ? { email: regEmail } : {}),
            ...(regIpAddress.trim() ? { ipAddress: regIpAddress } : {}),
          },
        },
      });
      toast.success('관리자가 등록되었습니다.');
      setRegSaveConfirmOpen(false);
      setRegisterOpen(false);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : '등록 중 오류가 발생했습니다.';
      toast.error(message);
      setRegSaveConfirmOpen(false);
    }
  };

  /* ─── 관리자명 클릭 → 상세 조회 ─── */
  const handleOpenDetail = async (row: AdminUser) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const { data: detailData } = await fetchDetail({ variables: { id: row.id, hospitalCode: 'ALL' } });
      if (detailData?.adminUserById) {
        const u = detailData.adminUserById;
        setSelectedUser(u);
        setFormUserName(u.userName || '');
        setFormPassword('');
        setFormPasswordConfirm('');
        setFormIpAddress(u.allowedIp || '');
        setFormEmail(u.email || '');
        setFormIsActive(u.status !== 'REJECTED');
      }
    } catch {
      toast.error('관리자 상세 정보를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  /* ─── 저장 ─── */
  const handleSave = async () => {
    if (!selectedUser) return;
    if (!formUserName.trim()) {
      toast.error('관리자명은 필수 입력입니다.');
      setSaveConfirmOpen(false);
      return;
    }
    if (formPassword && formPassword !== formPasswordConfirm) {
      toast.error('비밀번호가 일치하지 않습니다.');
      setSaveConfirmOpen(false);
      return;
    }
    try {
      await updateUser({
        variables: {
          id: selectedUser.id,
          input: {
            userName: formUserName,
            email: formEmail,
            ipAddress: formIpAddress || null,
            status: formIsActive ? 'ACTIVE' : 'REJECTED',
          },
        },
      });
      toast.success('저장되었습니다.');
      setSaveConfirmOpen(false);
      setDetailOpen(false);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.';
      toast.error(message);
      setSaveConfirmOpen(false);
    }
  };

  /* ─── 테이블 컬럼 ─── */
  const columns: ColumnDef<AdminUser, unknown>[] = [
    {
      id: 'rowNum',
      header: 'No',
      size: 60,
      cell: ({ row }) => (currentPage - 1) * pageSize + row.index + 1,
    },
    { accessorKey: 'userId', header: '아이디', size: 100 },
    {
      accessorKey: 'userName',
      header: '관리자명',
      size: 120,
      cell: ({ row }) => (
        <button
          className="text-primary underline underline-offset-2 hover:text-primary/80 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDetail(row.original);
          }}
        >
          {row.original.userName || '-'}
        </button>
      ),
    },
    {
      accessorKey: 'status',
      header: '사용여부',
      size: 100,
      cell: ({ getValue }) => statusLabel(getValue() as string),
    },
    {
      accessorKey: 'createdAt',
      header: '등록일시',
      size: 170,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
    {
      accessorKey: 'updatedAt',
      header: '수정일시',
      size: 170,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
  ];

  return (
    <>
      <ListPageTemplate
        title="관리자 관리"
        hospitalSelector={<HospitalSelector showAll />}
        totalItems={totalItems}
        onSearch={handleSearch}
        onReset={handleReset}
        searchSection={
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <FieldGroup label="아이디">
              <Input
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                placeholder="아이디"
              />
            </FieldGroup>
            <FieldGroup label="관리자명">
              <Input
                value={searchUserName}
                onChange={(e) => setSearchUserName(e.target.value)}
                placeholder="관리자명"
              />
            </FieldGroup>
          </div>
        }
        listHeaderActions={
          <div className="flex items-center gap-2">
            <Button variant="dark" size="md" onClick={handleOpenRegister}>
              신규 등록
            </Button>
            <Button
              variant="outline-red"
              size="md"
              onClick={() => {
                if (!selectedRows.length) {
                  toast.error('삭제할 관리자를 선택하세요.');
                  return;
                }
                setDeleteConfirmOpen(true);
              }}
            >
              선택한 항목 삭제
            </Button>
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
            enableSelection
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSelectionChange={setSelectedRows}
          />
        }
      />

      {/* ═══ 계정 조회 및 수정 다이얼로그 ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-[560px] max-h-[90vh] flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-[22px] font-normal">계정 조회 및 수정</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-5 overflow-y-auto py-5">
            {detailLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                로딩 중...
              </div>
            ) : selectedUser ? (
              <>
                {/* 관리자 번호 (읽기전용) */}
                <FormField label="관리자 번호" required>
                  <Input
                    value={selectedUser.id || '-'}
                    readOnly
                    className="bg-gray-200 text-gray-500 border-gray-300"
                  />
                </FormField>

                {/* 관리자명 (수정 가능) */}
                <FormField
                  label="관리자명"
                  required
                  error={!formUserName.trim() ? '관리자명은 필수 입니다.' : undefined}
                >
                  <Input
                    value={formUserName}
                    onChange={(e) => setFormUserName(e.target.value)}
                    placeholder="관리자명을 입력해 주세요."
                  />
                </FormField>

                {/* 아이디 (읽기전용) */}
                <FormField label="아이디" required>
                  <Input
                    value={selectedUser.userId || '-'}
                    readOnly
                    className="bg-gray-200 text-gray-500 border-gray-300"
                  />
                </FormField>

                {/* 비밀번호 / 비밀번호 확인 */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="비밀번호">
                    <Input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="비밀번호를 입력해 주세요."
                    />
                  </FormField>
                  <FormField
                    label="비밀번호 확인"
                    error={
                      formPasswordConfirm && formPassword !== formPasswordConfirm
                        ? '비밀번호가 일치하지 않습니다.'
                        : undefined
                    }
                  >
                    <Input
                      type="password"
                      value={formPasswordConfirm}
                      onChange={(e) => setFormPasswordConfirm(e.target.value)}
                      placeholder="비밀번호를 입력해 주세요."
                    />
                  </FormField>
                </div>

                {/* 비밀번호 규칙 안내 */}
                <div className="text-sm text-gray-500 leading-relaxed space-y-0.5">
                  <p>
                    비밀번호는 영문, 숫자, 특수문자 중 2종류를 조합하여 최소 10자리 이상
                    또는 3가지 조합하여 8자리 이상으로 만들어 주세요.
                  </p>
                  <p className="mt-2">※ 특수문자 허용범위</p>
                  <p className="tracking-wider">{`!@#$%^*()[]"_'{|}~/?`}</p>
                  <p>※ 4자 이상 연속되는 숫자는 사용할 수 없습니다. (ex: 1234)</p>
                  <p>※ 계정명(ID)과 3자리 이상 동일한 비밀번호는 사용할 수 없습니다.</p>
                </div>

                {/* 관리자 IP주소 */}
                <FormField label="관리자 IP주소">
                  <Input
                    value={formIpAddress}
                    onChange={(e) => setFormIpAddress(e.target.value)}
                    placeholder="0.0.0.0"
                  />
                </FormField>

                {/* 이메일 */}
                <FormField label="이메일">
                  <Input
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="이메일 주소를 입력해 주세요."
                  />
                </FormField>

                {/* 소속 기관 (읽기전용) */}
                <FormField label="소속 기관" required>
                  <div className="flex h-[38px] items-center justify-center rounded-md border border-gray-300 bg-gray-200 px-5 text-sm text-gray-500">
                    {selectedUser.hospitalCode || '-'}
                  </div>
                </FormField>

                {/* 계정 사용여부 */}
                <FormField label="계정 사용여부" required>
                  <div className="flex items-center gap-2 pt-1">
                    <ToggleSwitch
                      checked={formIsActive}
                      onChange={setFormIsActive}
                    />
                  </div>
                </FormField>
              </>
            ) : null}
          </DialogBody>

          <DialogFooter className="gap-1.5">
            <Button
              variant="outline"
              onClick={() => setCancelConfirmOpen(true)}
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

      {/* ═══ 계정 등록 다이얼로그 ═══ */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-[560px] max-h-[90vh] flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-[22px] font-normal">계정 등록</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-5 overflow-y-auto py-5">
            {/* 관리자 번호 (자동생성, 읽기전용) */}
            <FormField label="관리자 번호" required>
              <Input
                value="(자동생성)"
                readOnly
                className="bg-gray-200 text-gray-500 border-gray-300"
              />
            </FormField>

            {/* 관리자명 */}
            <FormField
              label="관리자명"
              required
              error={regUserName !== undefined && !regUserName.trim() ? '관리자명은 필수 입니다.' : undefined}
            >
              <Input
                value={regUserName}
                onChange={(e) => setRegUserName(e.target.value)}
                placeholder="관리자명을 입력해 주세요."
              />
            </FormField>

            {/* 아이디 + 중복확인 */}
            <FormField label="아이디" required>
              <div className="flex gap-2">
                <Input
                  value={regUserId}
                  onChange={(e) => {
                    setRegUserId(e.target.value);
                    setRegIdChecked(false);
                  }}
                  placeholder="영문, 숫자 조합"
                  className="flex-1"
                />
                <Button
                  variant="dark"
                  onClick={handleCheckDuplicate}
                  className="shrink-0 rounded-md px-5"
                >
                  중복 확인
                </Button>
              </div>
            </FormField>

            {/* 비밀번호 / 비밀번호 확인 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="비밀번호" required>
                <Input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="비밀번호를 입력해 주세요."
                />
              </FormField>
              <FormField
                label="비밀번호 확인"
                required
                error={
                  regPasswordConfirm && regPassword !== regPasswordConfirm
                    ? '비밀번호가 일치하지 않습니다.'
                    : undefined
                }
              >
                <Input
                  type="password"
                  value={regPasswordConfirm}
                  onChange={(e) => setRegPasswordConfirm(e.target.value)}
                  placeholder="비밀번호를 입력해 주세요."
                />
              </FormField>
            </div>

            {/* 비밀번호 규칙 안내 */}
            <div className="text-sm text-gray-500 leading-relaxed space-y-0.5">
              <p>
                비밀번호는 영문, 숫자, 특수문자 중 2종류를 조합하여 최소 10자리 이상
                또는 3가지 조합하여 8자리 이상으로 만들어 주세요.
              </p>
              <p className="mt-2">※ 특수문자 허용범위</p>
              <p className="tracking-wider">{`!@#$%^*()[]"_'{|}~/?`}</p>
              <p>※ 4자 이상 연속되는 숫자는 사용할 수 없습니다. (ex: 1234)</p>
              <p>※ 계정명(ID)과 3자리 이상 동일한 비밀번호는 사용할 수 없습니다.</p>
            </div>

            {/* 관리자 IP주소 */}
            <FormField label="관리자 IP주소">
              <Input
                value={regIpAddress}
                onChange={(e) => setRegIpAddress(e.target.value)}
                placeholder="0.0.0.0"
              />
            </FormField>

            {/* 이메일 */}
            <FormField label="이메일">
              <Input
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="이메일 주소를 입력해 주세요."
              />
            </FormField>

            {/* 소속 기관 */}
            <FormField label="소속 기관" required>
              <div className="flex gap-1.5">
                {['ALL', 'ANAM', 'GURO', 'ANSAN'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setRegHospitalCode(code)}
                    className={cn(
                      'flex-1 h-[38px] rounded-md border text-sm transition-colors cursor-pointer',
                      regHospitalCode === code
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-gray-300 bg-card text-gray-500 hover:bg-gray-100'
                    )}
                  >
                    {code === 'ALL' ? '통합관리자' : code === 'ANAM' ? '안암' : code === 'GURO' ? '구로' : '안산'}
                  </button>
                ))}
              </div>
            </FormField>

            {/* 계정 사용여부 */}
            <FormField label="계정 사용여부" required>
              <div className="flex items-center gap-2 pt-1">
                <ToggleSwitch
                  checked={regIsActive}
                  onChange={setRegIsActive}
                />
              </div>
            </FormField>
          </DialogBody>

          <DialogFooter className="gap-1.5">
            <Button
              variant="outline"
              onClick={() => setRegCancelConfirmOpen(true)}
              className="rounded-md border-gray-500 px-4"
            >
              취소
            </Button>
            <Button
              variant="dark"
              onClick={() => setRegSaveConfirmOpen(true)}
              className="rounded-md px-4"
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ 등록 저장 확인 ═══ */}
      <ConfirmDialog
        open={regSaveConfirmOpen}
        onOpenChange={setRegSaveConfirmOpen}
        title="저장"
        description="새 관리자를 등록하시겠습니까?"
        onConfirm={handleRegisterSave}
      />

      {/* ═══ 등록 취소 확인 ═══ */}
      <ConfirmDialog
        open={regCancelConfirmOpen}
        onOpenChange={setRegCancelConfirmOpen}
        title="취소"
        description="취소 시 입력한 내용이 저장되지 않습니다. 취소하시겠습니까?"
        onConfirm={() => {
          setRegCancelConfirmOpen(false);
          setRegisterOpen(false);
        }}
        destructive
      />

      {/* ═══ 삭제 확인 ═══ */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="관리자 삭제"
        description={`선택된 ${selectedRows.length}건의 관리자를 삭제하시겠습니까?`}
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
