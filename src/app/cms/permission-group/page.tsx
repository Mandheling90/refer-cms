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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  GET_PERMISSION_GROUPS,
  GET_PERMISSION_GROUP_DETAIL,
  GET_PERMISSION_GROUP_MEMBERS,
  CREATE_PERMISSION_GROUP,
  UPDATE_PERMISSION_GROUP,
  DELETE_PERMISSION_GROUP,
  SET_MENU_PERMISSION,
  ASSIGN_PERMISSION_GROUP,
  SET_PERMISSION_GROUP_MEMBERS,
} from '@/lib/graphql/queries/permission-group';
import { GET_ADMIN_USERS } from '@/lib/graphql/queries/admin';
import { ADMIN_MENUS } from '@/lib/graphql/queries/menu';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { ChevronDown, ChevronRight, ShieldAlert, Plus, Trash2, X } from 'lucide-react';

/* ─── 타입 정의 ─── */
interface PermissionGroupEntry {
  id: string;
  groupId: string;
  menuId: string;
  accessLevel: string;
}

interface PermissionGroupItem {
  id: string;
  name: string;
  hospitalCode?: string;
  entries?: PermissionGroupEntry[];
  createdAt?: string;
  updatedAt?: string;
}

interface MenuPermissionItem {
  menuId: string;
  menuName: string;
  parentId?: string;
  permission: PermissionLevel;
  children?: MenuPermissionItem[];
}

interface AssignedAdmin {
  id: string;
  userId: string;
  userName: string;
}

type PermissionLevel = 'FULL' | 'READ' | 'NONE' | 'CUSTOM';

interface MenuTreeNode {
  id: string;
  name: string;
  parentId?: string;
  children?: MenuTreeNode[];
}

/* ─── 상수 ─── */
const PERMISSION_OPTIONS: { value: PermissionLevel; label: string; color: string }[] = [
  { value: 'CUSTOM', label: '개별설정', color: 'bg-gray-200 text-black border-black' },
  { value: 'FULL', label: '모두허용', color: 'bg-[#0084ff] text-white border-black' },
  { value: 'READ', label: '읽기전용', color: 'bg-[#8b8d00] text-white border-black' },
  { value: 'NONE', label: '접근불가', color: 'bg-red-600 text-white border-black' },
];

const HOSPITAL_OPTIONS = [
  { code: 'ALL', label: '통합관리자' },
  { code: 'ANAM', label: '고려대학교 안암병원' },
  { code: 'GURO', label: '고려대학교 구로병원' },
  { code: 'ANSAN', label: '고려대학교 안산병원' },
];

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

/* ─── 검색 필드 ─── */
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

/* ─── 폼 필드 ─── */
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
        <span className="text-sm font-normal text-black">{label}</span>
        {required && <span className="text-[11px] text-red-500">*</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* ─── 권한 드롭다운 버튼 ─── */
function PermissionBadge({
  value,
  onChange,
}: {
  value: PermissionLevel;
  onChange: (v: PermissionLevel) => void;
}) {
  const option = PERMISSION_OPTIONS.find((o) => o.value === value) ?? PERMISSION_OPTIONS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 rounded px-3 py-1 text-[13px] border cursor-pointer',
            option.color
          )}
        >
          {option.label}
          <ChevronRight className="h-3 w-3 rotate-90" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[80px]">
        {PERMISSION_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(value === opt.value && 'font-semibold')}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ════════════════════════════════════════════════════════════════
   메인 페이지
   ════════════════════════════════════════════════════════════════ */
export default function PermissionGroupPage() {
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

  return <PermissionGroupContent />;
}

function PermissionGroupContent() {
  const hospitalCode = useAuthStore((s) => s.hospitalCode);

  /* ─── 페이징 ─── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ─── 검색 ─── */
  const [searchGroupName, setSearchGroupName] = useState('');
  const [appliedFilter, setAppliedFilter] = useState<{ search?: string }>({});

  /* ─── 선택 행 ─── */
  const [selectedRows, setSelectedRows] = useState<PermissionGroupItem[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  /* ─── 등록/수정 다이얼로그 ─── */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formGroupName, setFormGroupName] = useState('');
  const [formHospitalCode, setFormHospitalCode] = useState('ANAM');
  const [formMenuPermissions, setFormMenuPermissions] = useState<
    { menuId: string; menuName: string; parentId?: string; permission: PermissionLevel; children?: { menuId: string; menuName: string; permission: PermissionLevel }[] }[]
  >([]);
  const [formAssignedAdmins, setFormAssignedAdmins] = useState<AssignedAdmin[]>([]);

  /* ─── 메뉴 권한 설정 다이얼로그 ─── */
  const [menuPermDialogOpen, setMenuPermDialogOpen] = useState(false);

  /* ─── 전체 메뉴 권한 레벨 ─── */
  const [globalPermission, setGlobalPermission] = useState<PermissionLevel>('CUSTOM');

  /* ─── 관리자 배정 다이얼로그 ─── */
  const [adminAssignDialogOpen, setAdminAssignDialogOpen] = useState(false);
  const [adminSearchKeyword, setAdminSearchKeyword] = useState('');
  const [selectedAdminSearchKeyword, setSelectedAdminSearchKeyword] = useState('');
  const [checkedAllAdmins, setCheckedAllAdmins] = useState<Set<string>>(new Set());
  const [checkedSelectedAdmins, setCheckedSelectedAdmins] = useState<Set<string>>(new Set());

  /* ─── 확인 다이얼로그 ─── */
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [menuSaveConfirmOpen, setMenuSaveConfirmOpen] = useState(false);
  const [adminSaveConfirmOpen, setAdminSaveConfirmOpen] = useState(false);

  /* ─── GraphQL 목록 조회 ─── */
  const { data, loading, refetch } = useQuery<{
    menuPermissionGroups: PermissionGroupItem[];
  }>(GET_PERMISSION_GROUPS, {
    variables: {
      hospitalCode: hospitalCode === 'ALL' ? undefined : hospitalCode,
    },
    fetchPolicy: 'network-only',
  });

  const allItems: PermissionGroupItem[] = data?.menuPermissionGroups ?? [];

  /* ─── 클라이언트 사이드 검색 & 페이징 ─── */
  const filteredItems = useMemo(() => {
    if (!appliedFilter.search) return allItems;
    const keyword = appliedFilter.search.toLowerCase();
    return allItems.filter((item) => item.name?.toLowerCase().includes(keyword));
  }, [allItems, appliedFilter.search]);

  const totalItems = filteredItems.length;
  const items = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  /* ─── GraphQL 상세 조회 ─── */
  const [fetchDetail] = useLazyQuery<{
    groupMenuPermissions: PermissionGroupEntry[];
  }>(GET_PERMISSION_GROUP_DETAIL, {
    fetchPolicy: 'network-only',
  });

  /* ─── GraphQL 그룹 멤버 조회 ─── */
  const [fetchMembers] = useLazyQuery<{
    permissionGroupMembers: { id: string; userId: string; userName: string }[];
  }>(GET_PERMISSION_GROUP_MEMBERS, {
    fetchPolicy: 'network-only',
  });

  /* ─── GraphQL mutations ─── */
  const [createGroup] = useMutation<{ createMenuPermissionGroup: { id: string; name: string; hospitalCode: string } }>(CREATE_PERMISSION_GROUP);
  const [updateGroup] = useMutation<{ updateMenuPermissionGroup: { id: string; name: string; hospitalCode: string } }>(UPDATE_PERMISSION_GROUP);
  const [deleteGroup] = useMutation<{ deleteMenuPermissionGroup: boolean }>(DELETE_PERMISSION_GROUP);
  const [setMenuPermission] = useMutation<{ setMenuPermission: boolean }>(SET_MENU_PERMISSION);
  const [assignPermissionGroup] = useMutation<{ assignPermissionGroup: boolean }>(ASSIGN_PERMISSION_GROUP);
  const [setPermissionGroupMembers] = useMutation<{ setPermissionGroupMembers: boolean }>(SET_PERMISSION_GROUP_MEMBERS);

  /* ─── 메뉴 목록 조회 (CMS 메뉴와 동일한 ADMIN 타입, 기관코드 포함) ─── */
  const { data: menuData } = useQuery<{ adminMenus: MenuTreeNode[] }>(ADMIN_MENUS, {
    variables: { menuType: 'ADMIN', hospitalCode: formHospitalCode || undefined },
    fetchPolicy: 'cache-and-network',
  });

  /* ─── 메뉴 목록 lazy 조회 (수정 다이얼로그용) ─── */
  const [fetchMenus] = useLazyQuery<{ adminMenus: MenuTreeNode[] }>(ADMIN_MENUS, {
    fetchPolicy: 'network-only',
  });

  /* ─── 관리자 목록 조회 ─── */
  const { data: adminData } = useQuery<{
    adminUsers: { items: { id: string; userId: string; userName: string }[] };
  }>(GET_ADMIN_USERS, {
    variables: { pagination: { page: 1, limit: 100 } },
    fetchPolicy: 'cache-first',
  });

  const allAdmins: AssignedAdmin[] = useMemo(() => {
    return (adminData?.adminUsers?.items ?? []).map((a: { id: string; userId: string; userName: string }) => ({
      id: a.id,
      userId: a.userId,
      userName: a.userName,
    }));
  }, [adminData]);

  /* ─── 메뉴 트리를 권한 배열로 변환 ─── */
  const menuTreeToPermissions = useCallback((menus: MenuTreeNode[]): typeof formMenuPermissions => {
    return menus.map((m) => ({
      menuId: m.id,
      menuName: m.name,
      parentId: m.parentId,
      permission: 'FULL' as PermissionLevel,
      children: m.children?.map((c) => ({
        menuId: c.id,
        menuName: c.name,
        permission: 'FULL' as PermissionLevel,
      })),
    }));
  }, []);

  /* ─── 검색 ─── */
  const handleSearch = useCallback(() => {
    const searchTerm = searchGroupName.trim() || undefined;
    setAppliedFilter({ search: searchTerm });
    setCurrentPage(1);
  }, [searchGroupName]);

  const handleReset = () => {
    setSearchGroupName('');
    setAppliedFilter({});
    setCurrentPage(1);
  };

  /* ─── 페이징 ─── */
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  /* ─── 등록 다이얼로그 열기 ─── */
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormGroupName('');
    setFormHospitalCode('ANAM');
    setFormMenuPermissions([]);
    setFormAssignedAdmins([]);
    setDialogOpen(true);
  };

  /* ─── 수정 다이얼로그 열기 (행 클릭) ─── */
  const handleOpenEdit = async (row: PermissionGroupItem) => {
    setEditingId(row.id);
    setFormGroupName(row.name || '');
    setFormHospitalCode(row.hospitalCode || 'ANAM');
    setDialogOpen(true);

    // 상세 메뉴 권한 + 메뉴 목록 + 그룹 멤버를 동시에 가져옴
    try {
      const hospitalCode = row.hospitalCode || 'ANAM';
      const [{ data: detailData }, { data: menuResult }, { data: memberData }] = await Promise.all([
        fetchDetail({ variables: { groupId: row.id } }),
        fetchMenus({ variables: { menuType: 'ADMIN', hospitalCode } }),
        fetchMembers({ variables: { groupId: row.id, hospitalCode } }),
      ]);

      // 기존 배정된 관리자 로드
      const members = memberData?.permissionGroupMembers ?? [];
      setFormAssignedAdmins(
        members.map((m) => ({ id: m.id, userId: m.userId, userName: m.userName }))
      );
      const entries = detailData?.groupMenuPermissions ?? [];
      // entries를 메뉴 트리에 매핑
      const menus: MenuTreeNode[] = menuResult?.adminMenus ?? [];
      const entryMap = new Map(entries.map((e) => [e.menuId, e.accessLevel]));

      // 디버깅: 서버에서 받은 데이터 확인
      console.log('=== 권한 조회 디버깅 ===');
      console.log('entries (서버 응답):', JSON.stringify(entries, null, 2));
      console.log('menus (메뉴 트리):', menus.map((m) => ({
        id: m.id, name: m.name,
        children: m.children?.map((c) => ({ id: c.id, name: c.name })),
      })));
      console.log('entryMap:', Object.fromEntries(entryMap));

      // 디버깅: 메뉴 ID 매칭 확인
      menus.forEach((m) => {
        console.log(`메뉴 "${m.name}" (id: ${m.id}) → entryMap 결과:`, entryMap.get(m.id));
        m.children?.forEach((c) => {
          console.log(`  하위 "${c.name}" (id: ${c.id}) → entryMap 결과:`, entryMap.get(c.id));
        });
      });

      setFormMenuPermissions(
        menus.map((m) => {
          const children = m.children?.map((c) => ({
            menuId: c.id,
            menuName: c.name,
            permission: (entryMap.get(c.id) as PermissionLevel) || 'FULL',
          }));
          // 상위 메뉴 권한: 하위 메뉴가 있으면 하위 기준으로 계산
          let parentPermission: PermissionLevel;
          if (children && children.length > 0) {
            const allSame = children.every((c) => c.permission === children[0].permission);
            parentPermission = allSame ? children[0].permission : 'CUSTOM';
          } else {
            parentPermission = (entryMap.get(m.id) as PermissionLevel) || 'FULL';
          }
          return {
            menuId: m.id,
            menuName: m.name,
            parentId: m.parentId,
            permission: parentPermission,
            children,
          };
        })
      );
    } catch {
      toast.error('메뉴 권한 정보를 불러오지 못했습니다.');
      setFormMenuPermissions([]);
    }
  };

  /* ─── 메뉴 권한 API 저장 (순차 처리) ─── */
  const saveMenuPermissions = async (groupId: string) => {
    if (formMenuPermissions.length === 0) return;
    for (const mp of formMenuPermissions) {
      if (mp.permission !== 'CUSTOM') {
        await setMenuPermission({
          variables: {
            hospitalCode: formHospitalCode,
            input: { groupId, menuId: mp.menuId, accessLevel: mp.permission },
          },
        });
      }
      if (mp.children && mp.children.length > 0) {
        for (const child of mp.children) {
          const accessLevel = mp.permission !== 'CUSTOM' ? mp.permission : child.permission;
          await setMenuPermission({
            variables: {
              hospitalCode: formHospitalCode,
              input: { groupId, menuId: child.menuId, accessLevel },
            },
          });
        }
      }
    }
  };

  /* ─── 관리자 배정 API 저장 ─── */
  const saveAdminAssignment = async (groupId: string) => {
    if (formAssignedAdmins.length === 0) return;
    await setPermissionGroupMembers({
      variables: {
        groupId,
        userIds: formAssignedAdmins.map((admin) => admin.id),
        hospitalCode: formHospitalCode,
      },
    });
  };

  /* ─── 메인 저장 ─── */
  const handleSave = async () => {
    if (!formGroupName.trim()) {
      toast.error('그룹명은 필수 입력입니다.');
      setSaveConfirmOpen(false);
      return;
    }
    try {
      let groupId = editingId;

      if (editingId) {
        // 수정: 그룹명 저장
        await updateGroup({
          variables: {
            hospitalCode: formHospitalCode,
            id: editingId,
            input: { name: formGroupName },
          },
        });
      } else {
        // 신규: 그룹 생성
        const { data: createData } = await createGroup({
          variables: {
            hospitalCode: formHospitalCode,
            input: { name: formGroupName },
          },
        });
        groupId = createData?.createMenuPermissionGroup?.id ?? null;
        if (groupId) {
          // 서버에서 그룹 생성 완료 후 처리될 시간 확보
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // 메뉴 권한 + 관리자 배정 순차 저장
      if (groupId) {
        await saveMenuPermissions(groupId);
        await saveAdminAssignment(groupId);
      }

      toast.success(editingId ? '권한 그룹이 수정되었습니다.' : '권한 그룹이 등록되었습니다.');
      setSaveConfirmOpen(false);
      setDialogOpen(false);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.';
      toast.error(message);
      setSaveConfirmOpen(false);
    }
  };

  /* ─── 메뉴 별 권한 저장 (서브 다이얼로그 - 로컬 상태만 유지, 메인 저장 시 일괄 처리) ─── */
  const handleSaveMenuPermissions = () => {
    setMenuPermDialogOpen(false);
    toast.success('메뉴 권한이 설정되었습니다.');
  };

  /* ─── 관리자 배정 저장 (서브 다이얼로그 - 로컬 상태만 유지, 메인 저장 시 일괄 처리) ─── */
  const handleSaveAdminAssignment = () => {
    setAdminAssignDialogOpen(false);
    toast.success('관리자가 배정되었습니다.');
  };

  /* ─── 삭제 ─── */
  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedRows.map((row) =>
          deleteGroup({
            variables: { hospitalCode: row.hospitalCode, id: row.id },
          })
        )
      );
      toast.success(`${selectedRows.length}건이 삭제되었습니다.`);
      setDeleteConfirmOpen(false);
      setSelectedRows([]);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.';
      toast.error(message);
      setDeleteConfirmOpen(false);
    }
  };

  /* ─── 메뉴 권한 설정 열기 ─── */
  const handleOpenMenuPerm = () => {
    if (formMenuPermissions.length === 0 && menuData?.adminMenus) {
      setFormMenuPermissions(menuTreeToPermissions(menuData.adminMenus));
    }
    setGlobalPermission('CUSTOM');
    setMenuPermDialogOpen(true);
  };

  /* ─── 메뉴 권한 변경 ─── */
  const handleMenuPermChange = (menuId: string, permission: PermissionLevel, parentMenuId?: string) => {
    setFormMenuPermissions((prev) =>
      prev.map((mp) => {
        if (parentMenuId) {
          // 하위 메뉴 변경 → 상위 메뉴를 자동으로 개별설정으로 전환
          if (mp.menuId === parentMenuId) {
            setGlobalPermission('CUSTOM');
            return {
              ...mp,
              permission: 'CUSTOM',
              children: mp.children?.map((c) =>
                c.menuId === menuId ? { ...c, permission } : c
              ),
            };
          }
          return mp;
        }
        if (mp.menuId === menuId) {
          // 상위 메뉴 변경 → 전체 메뉴를 자동으로 개별설정으로 전환
          setGlobalPermission('CUSTOM');
          const newChildren = permission !== 'CUSTOM'
            ? mp.children?.map((c) => ({ ...c, permission }))
            : mp.children;
          return { ...mp, permission, children: newChildren };
        }
        return mp;
      })
    );
  };

  /* ─── 관리자 배정 열기 ─── */
  const handleOpenAdminAssign = () => {
    setAdminSearchKeyword('');
    setSelectedAdminSearchKeyword('');
    setCheckedAllAdmins(new Set());
    setCheckedSelectedAdmins(new Set());
    setAdminAssignDialogOpen(true);
  };

  /* ─── 관리자 추가/삭제 ─── */
  const handleAddAdmins = () => {
    const newAdmins = allAdmins.filter(
      (a) => checkedAllAdmins.has(a.id) && !formAssignedAdmins.find((fa) => fa.id === a.id)
    );
    setFormAssignedAdmins((prev) => [...prev, ...newAdmins]);
    setCheckedAllAdmins(new Set());
  };

  const handleRemoveAdmins = () => {
    setFormAssignedAdmins((prev) =>
      prev.filter((a) => !checkedSelectedAdmins.has(a.id))
    );
    setCheckedSelectedAdmins(new Set());
  };

  /* ─── 필터된 관리자 목록 ─── */
  const filteredAllAdmins = useMemo(() => {
    if (!adminSearchKeyword.trim()) return allAdmins;
    const keyword = adminSearchKeyword.toLowerCase();
    return allAdmins.filter(
      (a) => a.userName.toLowerCase().includes(keyword) || a.userId.toLowerCase().includes(keyword)
    );
  }, [allAdmins, adminSearchKeyword]);

  const filteredSelectedAdmins = useMemo(() => {
    if (!selectedAdminSearchKeyword.trim()) return formAssignedAdmins;
    const keyword = selectedAdminSearchKeyword.toLowerCase();
    return formAssignedAdmins.filter(
      (a) => a.userName.toLowerCase().includes(keyword) || a.userId.toLowerCase().includes(keyword)
    );
  }, [formAssignedAdmins, selectedAdminSearchKeyword]);

  /* ─── 테이블 컬럼 ─── */
  const columns: ColumnDef<PermissionGroupItem, unknown>[] = [
    {
      id: 'rowNum',
      header: 'No',
      size: 60,
      cell: ({ row }) => (currentPage - 1) * pageSize + row.index + 1,
    },
    {
      accessorKey: 'hospitalCode',
      header: '기관명',
      size: 140,
      cell: ({ row }) => {
        const code = row.original.hospitalCode;
        return HOSPITAL_OPTIONS.find((h) => h.code === code)?.label || code || '-';
      },
    },
    {
      accessorKey: 'name',
      header: '그룹명',
      size: 140,
      cell: ({ row }) => (
        <button
          className="text-primary underline underline-offset-2 hover:text-primary/90 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEdit(row.original);
          }}
        >
          {row.original.name || '-'}
        </button>
      ),
    },
    {
      id: 'menuCount',
      header: '권한 메뉴 수',
      size: 100,
      cell: ({ row }) => row.original.entries?.length ?? '-',
    },
    {
      accessorKey: 'updatedAt',
      header: '최종수정일시',
      size: 170,
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
  ];

  return (
    <>
      <ListPageTemplate
        title="권한 그룹 관리"
        hospitalSelector={<HospitalSelector showAll />}
        totalItems={totalItems}
        onSearch={handleSearch}
        onReset={handleReset}
        searchSection={
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <FieldGroup label="그룹명">
              <Input
                value={searchGroupName}
                onChange={(e) => setSearchGroupName(e.target.value)}
                placeholder="그룹명"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </FieldGroup>
          </div>
        }
        listHeaderActions={
          <div className="flex items-center gap-2">
            <Button variant="dark" size="md" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" />
              권한 그룹 추가
            </Button>
            <Button
              variant="outline-red"
              size="md"
              onClick={() => {
                if (!selectedRows.length) {
                  toast.error('삭제할 항목을 선택하세요.');
                  return;
                }
                setDeleteConfirmOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
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

      {/* ═══ 등록/수정 다이얼로그 ═══ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[560px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-normal">
              {editingId ? '권한 그룹 수정' : '권한 그룹 추가'}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-5 overflow-y-auto">
            {/* 기관 선택 */}
            <FormField label="기관 선택" required>
              <div className="flex gap-2 flex-wrap">
                {HOSPITAL_OPTIONS.map((h) => (
                  <button
                    key={h.code}
                    type="button"
                    onClick={() => {
                      setFormHospitalCode(h.code);
                      setFormMenuPermissions([]);
                    }}
                    className={cn(
                      'h-[38px] rounded-md border px-5 text-sm transition-colors cursor-pointer',
                      formHospitalCode === h.code
                        ? 'bg-[#9F1836] text-white border-[#9F1836]'
                        : 'border-gray-300 bg-white text-black hover:bg-gray-50'
                    )}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </FormField>

            {/* 그룹명 */}
            <FormField label="그룹명" required>
              <Input
                value={formGroupName}
                onChange={(e) => setFormGroupName(e.target.value)}
                placeholder="ex : 구로병원 홍보팀"
              />
            </FormField>

            {/* 메뉴 별 권한 설정 / 관리자 배정 버튼 */}
            <div className="flex gap-3">
              <Button
                variant="dark"
                className="flex-1"
                onClick={handleOpenMenuPerm}
              >
                + 메뉴 별 권한 설정
              </Button>
              <Button
                variant="dark"
                className="flex-1"
                onClick={handleOpenAdminAssign}
              >
                + 관리자 배정
              </Button>
            </div>

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

      {/* ═══ 메뉴 별 권한 설정 다이얼로그 ═══ */}
      <Dialog open={menuPermDialogOpen} onOpenChange={setMenuPermDialogOpen}>
        <DialogContent className="max-w-[560px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-normal">메뉴 별 권한 설정</DialogTitle>
          </DialogHeader>

          <DialogBody className="overflow-y-auto">
            {/* 전체 권한 설정 */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <span className="text-base font-semibold">전체 메뉴</span>
              <PermissionBadge
                value={globalPermission}
                onChange={(val) => {
                  setGlobalPermission(val);
                  if (val !== 'CUSTOM') {
                    setFormMenuPermissions((prev) =>
                      prev.map((mp) => ({
                        ...mp,
                        permission: val,
                        children: mp.children?.map((c) => ({ ...c, permission: val })),
                      }))
                    );
                  }
                }}
              />
            </div>

            {/* 메뉴 트리 */}
            <div className="rounded-md border border-gray-300 p-4 space-y-1 min-h-[200px] max-h-[400px] overflow-y-auto">
              {formMenuPermissions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  메뉴 데이터가 없습니다.
                </p>
              ) : (
                formMenuPermissions.map((mp) => (
                  <MenuPermissionRow
                    key={mp.menuId}
                    item={mp}
                    disabled={globalPermission !== 'CUSTOM'}
                    onChangeParent={(permission) => handleMenuPermChange(mp.menuId, permission)}
                    onChangeChild={(childId, permission) =>
                      handleMenuPermChange(childId, permission, mp.menuId)
                    }
                  />
                ))
              )}
            </div>
          </DialogBody>

          <DialogFooter className="gap-1.5">
            <Button
              variant="outline"
              onClick={() => setMenuPermDialogOpen(false)}
              className="rounded-md border-gray-500 px-4"
            >
              취소
            </Button>
            <Button
              variant="dark"
              onClick={handleSaveMenuPermissions}
              className="rounded-md px-4"
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ 관리자 배정 다이얼로그 ═══ */}
      <Dialog open={adminAssignDialogOpen} onOpenChange={setAdminAssignDialogOpen}>
        <DialogContent size="lg" className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-normal">관리자 배정</DialogTitle>
          </DialogHeader>

          <DialogBody className="overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
              {/* 좌측: 전체 관리자 */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">
                  전체 관리자 검색 (총 {filteredAllAdmins.length}명)
                </p>
                <Input
                  value={adminSearchKeyword}
                  onChange={(e) => setAdminSearchKeyword(e.target.value)}
                  placeholder="관리자명 또는 아이디 검색"
                />
                <div className="rounded-md border border-gray-300 max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-300">
                        <th className="py-2 px-3 text-left w-10">
                          <Checkbox
                            checked={
                              filteredAllAdmins.length > 0 &&
                              filteredAllAdmins.every((a) => checkedAllAdmins.has(a.id))
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCheckedAllAdmins(
                                  new Set(filteredAllAdmins.map((a) => a.id))
                                );
                              } else {
                                setCheckedAllAdmins(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="py-2 px-3 text-center font-semibold">관리자명</th>
                        <th className="py-2 px-3 text-center font-semibold">아이디</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAllAdmins.map((admin) => (
                        <tr
                          key={admin.id}
                          className="border-b border-gray-200 hover:bg-gray-300"
                        >
                          <td className="py-2 px-3">
                            <Checkbox
                              checked={checkedAllAdmins.has(admin.id)}
                              onCheckedChange={(checked) => {
                                setCheckedAllAdmins((prev) => {
                                  const next = new Set(prev);
                                  if (checked) next.add(admin.id);
                                  else next.delete(admin.id);
                                  return next;
                                });
                              }}
                            />
                          </td>
                          <td className="py-2 px-3 text-center">{admin.userName}</td>
                          <td className="py-2 px-3 text-center">{admin.userId}</td>
                        </tr>
                      ))}
                      {filteredAllAdmins.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-gray-400">
                            검색 결과가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="dark"
                    size="sm"
                    onClick={handleAddAdmins}
                    disabled={checkedAllAdmins.size === 0}
                  >
                    + 체크한 항목추가
                  </Button>
                </div>
              </div>

              {/* 우측: 선택된 관리자 */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">
                  선택된 관리자 (총 {formAssignedAdmins.length}명)
                </p>
                <Input
                  value={selectedAdminSearchKeyword}
                  onChange={(e) => setSelectedAdminSearchKeyword(e.target.value)}
                  placeholder="관리자명 또는 아이디 검색"
                />
                <div className="rounded-md border border-gray-300 max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-300">
                        <th className="py-2 px-3 text-left w-10">
                          <Checkbox
                            checked={
                              filteredSelectedAdmins.length > 0 &&
                              filteredSelectedAdmins.every((a) =>
                                checkedSelectedAdmins.has(a.id)
                              )
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCheckedSelectedAdmins(
                                  new Set(filteredSelectedAdmins.map((a) => a.id))
                                );
                              } else {
                                setCheckedSelectedAdmins(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="py-2 px-3 text-center font-semibold">관리자명</th>
                        <th className="py-2 px-3 text-center font-semibold">아이디</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSelectedAdmins.map((admin) => (
                        <tr
                          key={admin.id}
                          className="border-b border-gray-200 hover:bg-gray-300"
                        >
                          <td className="py-2 px-3">
                            <Checkbox
                              checked={checkedSelectedAdmins.has(admin.id)}
                              onCheckedChange={(checked) => {
                                setCheckedSelectedAdmins((prev) => {
                                  const next = new Set(prev);
                                  if (checked) next.add(admin.id);
                                  else next.delete(admin.id);
                                  return next;
                                });
                              }}
                            />
                          </td>
                          <td className="py-2 px-3 text-center">{admin.userName}</td>
                          <td className="py-2 px-3 text-center">{admin.userId}</td>
                        </tr>
                      ))}
                      {filteredSelectedAdmins.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-gray-400">
                            선택된 관리자가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline-red"
                    size="sm"
                    onClick={handleRemoveAdmins}
                    disabled={checkedSelectedAdmins.size === 0}
                  >
                    - 체크한 항목삭제
                  </Button>
                </div>
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="gap-1.5">
            <Button
              variant="outline"
              onClick={() => setAdminAssignDialogOpen(false)}
              className="rounded-md border-gray-500 px-4"
            >
              취소
            </Button>
            <Button
              variant="dark"
              onClick={handleSaveAdminAssignment}
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
        description={editingId ? '수정한 내용으로 저장하시겠습니까?' : '새 권한 그룹을 등록하시겠습니까?'}
        onConfirm={handleSave}
      />

      {/* ═══ 취소 확인 ═══ */}
      <ConfirmDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="취소"
        description="취소 시 입력한 내용이 저장되지 않습니다. 취소하시겠습니까?"
        onConfirm={() => {
          setCancelConfirmOpen(false);
          setDialogOpen(false);
        }}
        destructive
      />

      {/* ═══ 삭제 확인 ═══ */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="권한 그룹 삭제"
        description={`선택된 ${selectedRows.length}건의 권한 그룹을 삭제하시겠습니까?`}
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   메뉴 권한 행 (트리 구조)
   ════════════════════════════════════════════════════════════════ */
function MenuPermissionRow({
  item,
  onChangeParent,
  onChangeChild,
}: {
  item: {
    menuId: string;
    menuName: string;
    permission: PermissionLevel;
    children?: { menuId: string; menuName: string; permission: PermissionLevel }[];
  };
  disabled?: boolean;
  onChangeParent: (permission: PermissionLevel) => void;
  onChangeChild: (childId: string, permission: PermissionLevel) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      {/* 부모 메뉴 */}
      <div className="flex items-center justify-between py-1.5 hover:bg-gray-300 rounded px-2">
        <div className="flex items-center gap-1.5">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="cursor-pointer text-gray-500"
            >
              <ChevronRight
                className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')}
              />
            </button>
          ) : (
            <span className="w-4" />
          )}
          <span className="text-sm">{item.menuName}</span>
        </div>
        <PermissionBadge value={item.permission} onChange={onChangeParent} />
      </div>

      {/* 자식 메뉴 */}
      {expanded && hasChildren && (
        <div className="ml-6 border-l border-gray-200 pl-3">
          {item.children!.map((child) => (
              <div
                key={child.menuId}
                className="flex items-center justify-between py-1.5 hover:bg-gray-300 rounded px-2"
              >
                <span className="text-sm text-gray-700">{child.menuName}</span>
                <PermissionBadge
                  value={child.permission}
                  onChange={(val) => onChangeChild(child.menuId, val)}
                />
              </div>
          ))}
        </div>
      )}
    </div>
  );
}
