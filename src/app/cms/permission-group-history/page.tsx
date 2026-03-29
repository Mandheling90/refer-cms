'use client';

import { useCallback, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@apollo/client/react';

import { DataTable } from '@/components/organisms/DataTable';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { GET_PERMISSION_AUDIT_LOGS } from '@/lib/graphql/queries/permission-group';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';

/* ─── 타입 정의 ─── */
interface PermissionMenuHistory {
  logId: string;
  target: string;
  menuId: string | null;
  menuName: string | null;
  accessLevel: string | null;
  adminNumber: string | null;
  adminName: string | null;
  createdAt: string;
}

interface PermissionMemberHistory {
  logId: string;
  target: string;
  memberLabels: string[];
  adminNumber: string | null;
  adminName: string | null;
  createdAt: string;
}

interface PermissionAuditLogItem {
  id: string;
  action: string;
  target: string;
  detail: string | null;
  hospitalCode: string;
  adminNumber: string;
  adminName: string;
  ipAddress: string | null;
  createdAt: string;
  permissionMenuHistories: PermissionMenuHistory[] | null;
  permissionMemberHistories: PermissionMemberHistory[] | null;
}

interface PermissionAuditLogsResponse {
  adminPermissionAuditLogs: {
    items: PermissionAuditLogItem[];
    totalCount: number;
    hasNextPage: boolean;
  };
}

/* ─── 이력 구분 라벨 ─── */
const ACTION_LABEL: Record<string, string> = {
  CREATE: '등록',
  UPDATE: '수정',
  DELETE: '삭제',
  APPROVE: '승인',
  REJECT: '거부',
  LOGIN: '로그인',
  LOGOUT: '로그아웃',
};
const toActionLabel = (action?: string) => (action ? ACTION_LABEL[action] ?? action : '-');

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
  return `${yyyy}-${MM}-${dd}, ${HH}:${mm}:${ss}`;
};

/* ─── detail JSON 파싱 ─── */
interface ParsedDetail {
  key?: string;
  groupName?: string;
  permissions?: string[];
  rawValue?: string;
}

function parseDetail(detail: string | null): ParsedDetail {
  if (!detail) return {};
  try {
    const outer = JSON.parse(detail); // { key, value }
    const result: ParsedDetail = { key: outer.key };
    if (outer.value) {
      try {
        const inner = JSON.parse(outer.value); // { name, permissions }
        result.groupName = inner.name;
        result.permissions = inner.permissions;
      } catch {
        result.rawValue = outer.value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/* ─── 검색 필드 그룹 ─── */
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

/* ─── 상세 팝업 읽기전용 필드 ─── */
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <Input value={value} disabled />
    </div>
  );
}

/* ═══════════════════════════════════════
   권한 그룹 수정 이력 페이지
   ═══════════════════════════════════════ */
export default function PermissionGroupHistoryPage() {
  const { getEffectiveHospitalCode } = useAuthStore();

  /* ─── 페이징 상태 ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 조건 (입력 중) ─── */
  const [searchAdminName, setSearchAdminName] = useState('');
  const [searchGroupName, setSearchGroupName] = useState('');

  /* ─── 실제 적용된 필터 ─── */
  const [appliedAdminName, setAppliedAdminName] = useState('');
  const [appliedGroupName, setAppliedGroupName] = useState('');

  /* ─── GraphQL 목록 조회 ─── */
  const hospitalCode = getEffectiveHospitalCode();
  const { data, loading, refetch } = useQuery<PermissionAuditLogsResponse>(GET_PERMISSION_AUDIT_LOGS, {
    variables: {
      hospitalCode: hospitalCode,
      pagination: {
        page: currentPage,
        limit: pageSize,
      },
    },
    fetchPolicy: 'network-only',
  });

  const allItems = data?.adminPermissionAuditLogs?.items ?? [];
  const serverTotalCount = data?.adminPermissionAuditLogs?.totalCount ?? 0;

  /* ─── 클라이언트 필터링 (API에 filter 파라미터 없으므로) ─── */
  const filteredItems = allItems.filter((item) => {
    if (appliedAdminName && !item.adminName?.includes(appliedAdminName)) return false;
    if (appliedGroupName) {
      const parsed = parseDetail(item.detail);
      if (!parsed.groupName?.includes(appliedGroupName)) return false;
    }
    return true;
  });

  const totalItems = appliedAdminName || appliedGroupName ? filteredItems.length : serverTotalCount;
  const displayItems = appliedAdminName || appliedGroupName ? filteredItems : allItems;

  /* ─── 상세 다이얼로그 ─── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PermissionAuditLogItem | null>(null);

  /* ─── 재검색 ─── */
  const handleSearch = useCallback(() => {
    setAppliedAdminName(searchAdminName.trim());
    setAppliedGroupName(searchGroupName.trim());
    setCurrentPage(1);
  }, [searchAdminName, searchGroupName]);

  /* ─── 검색초기화 ─── */
  const handleReset = () => {
    setSearchAdminName('');
    setSearchGroupName('');
    setAppliedAdminName('');
    setAppliedGroupName('');
    setCurrentPage(1);
    refetch();
  };

  /* ─── 관리자명 클릭 → 상세 ─── */
  const handleAdminNameClick = (row: PermissionAuditLogItem) => {
    setSelectedLog(row);
    setDetailOpen(true);
  };

  /* ─── 페이징 ─── */
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  /* ─── 테이블 컬럼 ─── */
  const columns: ColumnDef<PermissionAuditLogItem, unknown>[] = [
    {
      id: 'rowNum',
      header: 'No',
      size: 60,
      cell: ({ row }) => (currentPage - 1) * pageSize + row.index + 1,
    },
    {
      accessorKey: 'adminName',
      header: '관리자명',
      size: 120,
      cell: ({ row }) => (
        <button
          type="button"
          className="text-left text-primary hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleAdminNameClick(row.original);
          }}
        >
          {row.original.adminName || '-'}
        </button>
      ),
    },
    {
      id: 'groupName',
      header: '권한그룹명',
      size: 160,
      cell: ({ row }) => {
        const parsed = parseDetail(row.original.detail);
        return parsed.groupName || '-';
      },
    },
    {
      accessorKey: 'action',
      header: '이력 구분',
      size: 100,
      cell: ({ getValue }) => toActionLabel(getValue() as string),
    },
    {
      accessorKey: 'target',
      header: '변경 대상',
      size: 160,
    },
    {
      id: 'permissions',
      header: '권한 수',
      size: 100,
      cell: ({ row }) => {
        const parsed = parseDetail(row.original.detail);
        return parsed.permissions ? parsed.permissions.length : '-';
      },
    },
    {
      accessorKey: 'createdAt',
      header: '수정일시',
      size: 180,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
  ];

  /* ─── 선택된 로그의 파싱된 상세 ─── */
  const selectedParsed = selectedLog ? parseDetail(selectedLog.detail) : null;

  return (
    <>
      <ListPageTemplate
        title="권한그룹 수정 이력"
        totalItems={totalItems}
        onSearch={handleSearch}
        onReset={handleReset}
        searchSection={
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <FieldGroup label="페이지당 행 수">
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  const size = Number(val);
                  setPageSize(size);
                  setCurrentPage(1);
                  refetch({
                    hospitalCode: hospitalCode,
                    pagination: { page: 1, limit: size },
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 30, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="관리자명">
              <Input
                value={searchAdminName}
                onChange={(e) => setSearchAdminName(e.target.value)}
                placeholder="관리자명을 입력해 주세요."
                maxLength={20}
              />
            </FieldGroup>
            <FieldGroup label="권한그룹명">
              <Input
                value={searchGroupName}
                onChange={(e) => setSearchGroupName(e.target.value)}
                placeholder="권한그룹명을 입력해 주세요."
                maxLength={30}
              />
            </FieldGroup>
          </div>
        }
        listContent={
          <DataTable
            columns={columns}
            data={displayItems}
            loading={loading}
            totalItems={totalItems}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={Math.ceil(totalItems / pageSize) || 1}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        }
      />

      {/* ═══ 수정 이력 상세 다이얼로그 ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent size="md" className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>권한그룹 수정 이력 상세</DialogTitle>
            <DialogDescription>권한그룹 수정 이력 상세 정보를 확인합니다.</DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 overflow-y-auto">
            {selectedLog ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <ReadOnlyField label="수정 관리자" value={selectedLog.adminName || '-'} />
                  <ReadOnlyField label="권한그룹명" value={selectedParsed?.groupName || '-'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ReadOnlyField label="이력 구분" value={toActionLabel(selectedLog.action)} />
                  <ReadOnlyField label="IP주소" value={selectedLog.ipAddress || '-'} />
                </div>

                {/* 상세내역 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    상세내역
                  </label>
                  <textarea
                    className="w-full min-h-[140px] rounded-md border border-input bg-muted px-3 py-2 text-sm font-mono disabled:cursor-not-allowed disabled:opacity-70"
                    value={selectedLog.detail || '-'}
                    disabled
                  />
                </div>
              </>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button variant="dark" onClick={() => setDetailOpen(false)}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
