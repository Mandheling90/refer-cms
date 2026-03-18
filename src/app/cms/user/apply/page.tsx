'use client';

import { usePagePermission } from '@/components/molecules/PermissionGuard';
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
import { GET_ADMIN_USERS, GET_ADMIN_USER_APPROVAL_BY_ID, APPROVE_USER, REJECT_USER } from '@/lib/graphql/queries/member-apply';
import type { AdminUser, AdminUserApprovalByIdResponse, AdminUserDetail, AdminUsersResponse } from '@/types/member';
import {
  MEMBER_TYPE_OPTIONS,
  APPLY_STATUS_OPTIONS,
} from '@/types/member';

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

/* ─── 상태 라벨 변환 ─── */
const applyStatusLabel = (val?: string) => {
  const found = APPLY_STATUS_OPTIONS.find((o) => o.value === val);
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
   회원가입 신청관리 페이지
   ═══════════════════════════════════════ */
export default function MemberApplyPage() {
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
  const [searchApplyStatus, setSearchApplyStatus] = useState('');

  /* ─── 실제 적용된 필터 (검색 버튼 클릭 시 반영) ─── */
  const [appliedFilter, setAppliedFilter] = useState<{
    search?: string;
    userType?: string;
    status?: string;
  }>({});

  /* ─── GraphQL 조회 ─── */
  const buildFilterVars = (filter: typeof appliedFilter) => ({
    ...(filter.search ? { search: filter.search } : {}),
    ...(filter.userType ? { userType: filter.userType } : {}),
    ...(filter.status ? { status: filter.status } : {}),
  });

  const { data, loading, refetch } = useQuery<AdminUsersResponse>(GET_ADMIN_USERS, {
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

  /* ─── 상세 다이얼로그 ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);

  /* ─── Mutations ─── */
  const [approveUser] = useMutation(APPROVE_USER);
  const [rejectUser] = useMutation(REJECT_USER);

  /* ─── 확인 다이얼로그 ─── */
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  /* ─── 재검색: 현재 입력된 검색 조건을 적용하여 조회 ─── */
  const handleSearch = useCallback(() => {
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
      status: searchApplyStatus === '__all' ? undefined : searchApplyStatus || undefined,
    };
    setAppliedFilter(newFilter);
    setCurrentPage(1);
    refetch({
      filter: buildFilterVars(newFilter),
      pagination: { page: 1, limit: pageSize },
    });
  }, [searchLicenseNo, searchUserId, searchBirthDate, searchPhone, searchUserName, searchUserType, searchApplyStatus, refetch, pageSize]);

  /* ─── 검색초기화: 모든 검색 조건을 초기값으로 되돌리고 재조회 ─── */
  const handleReset = () => {
    setSearchLicenseNo('');
    setSearchUserId('');
    setSearchBirthDate('');
    setSearchPhone('');
    setSearchUserName('');
    setSearchUserType('');
    setSearchApplyStatus('');
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
    setRejectReason('');
    try {
      const { data: detailData } = await fetchDetail({ variables: { id: row.id } });
      if (detailData?.adminUserApprovalById) {
        setSelectedUser(detailData.adminUserApprovalById);
      }
    } catch {
      toast.error('회원 상세 정보를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  /* ─── 가입승인 ─── */
  const handleApprove = async () => {
    if (!selectedUser) return;
    try {
      await approveUser({ variables: { id: selectedUser.id } });
      toast.success('가입이 승인되었습니다.');
      setApproveOpen(false);
      setDetailOpen(false);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : '승인 처리 중 오류가 발생했습니다.';
      toast.error(message);
      setApproveOpen(false);
    }
  };

  /* ─── 반려 ─── */
  const handleReject = async () => {
    if (!selectedUser) return;
    if (!rejectReason.trim()) {
      toast.error('반려 사유를 입력해주세요.');
      return;
    }
    try {
      await rejectUser({ variables: { id: selectedUser.id, reason: rejectReason.trim() } });
      toast.success('가입이 반려되었습니다.');
      setRejectOpen(false);
      setDetailOpen(false);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : '반려 처리 중 오류가 발생했습니다.';
      toast.error(message);
      setRejectOpen(false);
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
    { accessorKey: 'userId', header: '회원아이디', size: 120 },
    { accessorKey: 'userName', header: '회원명', size: 90 },
    { accessorKey: 'phone', header: '전화번호', size: 130 },
    {
      accessorKey: 'userType',
      header: '회원구분',
      size: 90,
      cell: ({ getValue }) => memberTypeLabel(getValue() as string),
    },
    {
      id: 'licenseNo',
      header: '의사면허번호',
      size: 120,
      cell: ({ row }) => row.original.profile?.licenseNo || '-',
    },
    {
      accessorKey: 'createdAt',
      header: '신청일시',
      size: 120,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
    {
      accessorKey: 'status',
      header: '가입승인/반려',
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
    {
      accessorKey: 'updatedAt',
      header: '승인일시',
      size: 120,
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === 'APPROVED' || status === 'REJECTED') {
          return formatDateTime(row.original.updatedAt);
        }
        return '-';
      },
    },
  ];

  return (
    <>
      <ListPageTemplate
        title="회원가입 신청관리"
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
            <FieldGroup label="가입승인/반려">
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

      {/* ═══ 회원가입 신청 관리 다이얼로그 ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent size="lg" className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>회원가입 신청 관리</DialogTitle>
            <DialogDescription className="sr-only">회원가입 신청 정보</DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5 overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                로딩 중...
              </div>
            ) : selectedUser ? (
              <>
                {(() => {
                  const profile = selectedUser.profile;
                  return (
                    <>
                      {/* ─── 회원ID, 회원번호, 회원명 ─── */}
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

                      {/* ─── 회원구분, 생년월일, 의사면허번호 ─── */}
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

                      {/* ─── 출신학교, 진료과, 원장여부 ─── */}
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
                              <input type="radio" className="accent-primary" checked={profile?.isDirector === true} disabled />
                              원장
                            </label>
                            <label className="flex items-center gap-1.5 text-sm">
                              <input type="radio" className="accent-primary" checked={profile?.isDirector !== true} disabled />
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
                              수신 동의
                            </label>
                            <label className="flex items-center gap-1.5 text-sm">
                              <input type="radio" className="accent-primary" checked={profile?.emailConsent !== true} disabled />
                              수신 미동의
                            </label>
                          </div>
                        </FieldGroup>
                        <FieldGroup label="SMS 수신 동의 여부">
                          <div className="flex items-center h-10 gap-4">
                            <label className="flex items-center gap-1.5 text-sm">
                              <input type="radio" className="accent-primary" checked={profile?.smsConsent === true} disabled />
                              수신 동의
                            </label>
                            <label className="flex items-center gap-1.5 text-sm">
                              <input type="radio" className="accent-primary" checked={profile?.smsConsent !== true} disabled />
                              수신 미동의
                            </label>
                          </div>
                        </FieldGroup>
                        <FieldGroup label="회신서 동의 여부">
                          <div className="flex items-center h-10 gap-4">
                            <label className="flex items-center gap-1.5 text-sm">
                              <input type="radio" className="accent-primary" checked={profile?.replyConsent === true} disabled />
                              수신 동의
                            </label>
                            <label className="flex items-center gap-1.5 text-sm">
                              <input type="radio" className="accent-primary" checked={profile?.replyConsent !== true} disabled />
                              수신 미동의
                            </label>
                          </div>
                        </FieldGroup>
                      </div>

                      {/* ─── 병원정보 ─── */}
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

                      {/* ─── 신청일시, 승인여부, 승인일시 ─── */}
                      <div className="grid grid-cols-3 gap-4">
                        <FieldGroup label="신청일시">
                          <Input value={formatDateTime(selectedUser.createdAt)} disabled />
                        </FieldGroup>
                        <FieldGroup label="승인여부">
                          <Input value={applyStatusLabel(selectedUser.status)} disabled />
                        </FieldGroup>
                        <FieldGroup label="승인일시">
                          <Input
                            value={
                              selectedUser.status === 'APPROVED' || selectedUser.status === 'REJECTED'
                                ? formatDateTime(selectedUser.updatedAt)
                                : '-'
                            }
                            disabled
                          />
                        </FieldGroup>
                      </div>
                    </>
                  );
                })()}
              </>
            ) : null}
          </DialogBody>

          <DialogFooter className="justify-between">
            {selectedUser?.status === 'PENDING' ? (
              <div className="flex gap-2">
                <Button variant="blue" disabled={!canEdit} onClick={() => setApproveOpen(true)}>
                  가입승인
                </Button>
                <Button variant="destructive" disabled={!canEdit} onClick={() => setRejectOpen(true)}>
                  가입반려
                </Button>
              </div>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                닫기
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
            <Button variant="destructive" disabled={!canEdit} onClick={handleReject}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
