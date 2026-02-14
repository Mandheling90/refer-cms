'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
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
import { GET_ADMIN_USERS, APPROVE_USER, REJECT_USER } from '@/lib/graphql/queries/member-apply';
import type { AdminUser, AdminUsersResponse } from '@/types/member';
import {
  MEMBER_TYPE_OPTIONS,
  APPLY_STATUS_OPTIONS,
} from '@/types/member';

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
  /* ─── 페이징 상태 ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 조건 (입력 중) ─── */
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchApplyStatus, setSearchApplyStatus] = useState('');

  /* ─── 실제 적용된 필터 (검색 버튼 클릭 시 반영) ─── */
  const [appliedFilter, setAppliedFilter] = useState<{
    status?: string;
    search?: string;
  }>({});

  /* ─── GraphQL 조회 ─── */
  const { data, loading, refetch } = useQuery<AdminUsersResponse>(GET_ADMIN_USERS, {
    variables: {
      filter: {
        ...(appliedFilter.status ? { status: appliedFilter.status } : {}),
        ...(appliedFilter.search ? { search: appliedFilter.search } : {}),
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

  /* ─── 상세 다이얼로그 ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  /* ─── Mutations ─── */
  const [approveUser] = useMutation(APPROVE_USER);
  const [rejectUser] = useMutation(REJECT_USER);

  /* ─── 확인 다이얼로그 ─── */
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  /* ─── 재검색: 현재 입력된 검색 조건을 적용하여 조회 ─── */
  const handleSearch = useCallback(() => {
    const newFilter = {
      status: searchApplyStatus === '__all' ? undefined : searchApplyStatus || undefined,
      search: searchKeyword.trim() || undefined,
    };
    setAppliedFilter(newFilter);
    setCurrentPage(1);
    refetch({
      filter: {
        ...(newFilter.status ? { status: newFilter.status } : {}),
        ...(newFilter.search ? { search: newFilter.search } : {}),
      },
      pagination: { page: 1, limit: pageSize },
    });
  }, [searchApplyStatus, searchKeyword, refetch, pageSize]);

  /* ─── 검색초기화: 모든 검색 조건을 초기값으로 되돌리고 재조회 ─── */
  const handleReset = () => {
    setSearchKeyword('');
    setSearchApplyStatus('');
    setAppliedFilter({});
    setCurrentPage(1);
    refetch({
      filter: {},
      pagination: { page: 1, limit: pageSize },
    });
  };

  /* ─── 행 클릭 → 상세 팝업 ─── */
  const handleRowClick = (row: AdminUser) => {
    setSelectedUser(row);
    setRejectReason('');
    setDetailOpen(true);
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
    {
      accessorKey: 'userType',
      header: '회원구분',
      size: 90,
      cell: ({ getValue }) => memberTypeLabel(getValue() as string),
    },
    { accessorKey: 'email', header: '이메일', size: 180 },
    { accessorKey: 'hospitalCode', header: '병원코드', size: 120 },
    {
      accessorKey: 'status',
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
            <FieldGroup label="검색">
              <Input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="아이디, 이름, 이메일 검색"
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
            <DialogDescription>
              회원가입 신청 정보를 조회하고 승인/반려할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5 overflow-y-auto">
            {/* ─── Row 1: 회원ID, 회원명, 이메일 ─── */}
            <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="회원아이디">
                <Input value={selectedUser?.userId || ''} disabled />
              </FieldGroup>
              <FieldGroup label="회원명">
                <Input value={selectedUser?.userName || ''} disabled />
              </FieldGroup>
              <FieldGroup label="이메일">
                <Input value={selectedUser?.email || ''} disabled />
              </FieldGroup>
            </div>

            {/* ─── Row 2: 회원구분, 병원코드 ─── */}
            <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="회원구분">
                <Input value={memberTypeLabel(selectedUser?.userType)} disabled />
              </FieldGroup>
              <FieldGroup label="병원코드">
                <Input value={selectedUser?.hospitalCode || ''} disabled />
              </FieldGroup>
            </div>

            {/* ─── 상태 정보 테이블 ─── */}
            <div className="overflow-hidden rounded-lg border border-gray-500">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <th className="bg-gray-300 px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                      신청상태
                    </th>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          selectedUser?.status === 'APPROVED'
                            ? 'text-src-point font-medium'
                            : selectedUser?.status === 'REJECTED'
                              ? 'text-src-red font-medium'
                              : selectedUser?.status === 'PENDING'
                                ? 'text-src-blue font-medium'
                                : ''
                        }
                      >
                        {applyStatusLabel(selectedUser?.status)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </DialogBody>

          <DialogFooter className="justify-between">
            {selectedUser?.status === 'PENDING' ? (
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
