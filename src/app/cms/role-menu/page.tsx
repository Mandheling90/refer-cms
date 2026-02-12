'use client';

import { useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { roleApi, roleMenuApi } from '@/lib/api/role';
import type { Role, RoleMenu } from '@/types/role';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

const roleColumns: ColumnDef<Role, unknown>[] = [
  { accessorKey: 'ROLE_CODE', header: '역할 코드', size: 150 },
  { accessorKey: 'ROLE_NAME', header: '역할 이름', size: 200 },
  { accessorKey: 'ROLE_TYPE', header: '역할 유형', size: 150 },
];

export default function RoleMenuPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<RoleMenu[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [menusLoading, setMenusLoading] = useState(false);
  const [checkedMenus, setCheckedMenus] = useState<Set<string>>(new Set());

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const res = await roleApi.list({ SHOWN_ENTITY: 100 });
      setRoles(res.list || []);
    } catch {
      toast.error('역할 목록 조회에 실패했습니다.');
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const loadMenusByRole = useCallback(async (roleId: string) => {
    setMenusLoading(true);
    try {
      const res = await roleMenuApi.list({ ROLE_ID: roleId });
      const menuList = res.list || [];
      setMenus(menuList);
      setCheckedMenus(new Set(menuList.filter((m) => m.IS_CHECKED === 'Y').map((m) => m.MENU_ID)));
    } catch {
      toast.error('메뉴 목록 조회에 실패했습니다.');
    } finally {
      setMenusLoading(false);
    }
  }, []);

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role);
    loadMenusByRole(role.ROLE_ID);
  };

  const toggleMenu = (menuId: string) => {
    setCheckedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) next.delete(menuId);
      else next.add(menuId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRole) {
      toast.error('역할을 선택하세요.');
      return;
    }
    try {
      const menuList = menus.map((m) => ({
        ...m,
        IS_CHECKED: checkedMenus.has(m.MENU_ID) ? 'Y' : 'N',
      }));
      const res = await roleMenuApi.save({
        ROLE_ID: selectedRole.ROLE_ID,
        MENU_LIST: JSON.stringify(menuList),
      });
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('저장되었습니다.');
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('저장에 실패했습니다.');
    }
  };

  useState(() => { loadRoles(); });

  const menuColumns: ColumnDef<RoleMenu, unknown>[] = [
    {
      id: 'checked',
      header: '선택',
      size: 60,
      cell: ({ row }) => (
        <Checkbox
          checked={checkedMenus.has(row.original.MENU_ID)}
          onCheckedChange={() => toggleMenu(row.original.MENU_ID)}
        />
      ),
    },
    { accessorKey: 'MENU_CODE', header: '메뉴 코드', size: 200 },
    { accessorKey: 'MENU_NAME', header: '메뉴 이름', size: 200 },
    { accessorKey: 'PERMISSION_LEVEL', header: '권한 레벨', size: 100 },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">역할-메뉴 매핑</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">역할 목록</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <DataTable
              columns={roleColumns}
              data={roles}
              loading={rolesLoading}
              onRowClick={handleRoleClick}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                메뉴 권한 {selectedRole && `- ${selectedRole.ROLE_NAME}`}
              </CardTitle>
              <Button size="sm" onClick={handleSave} disabled={!selectedRole}>
                <Save className="h-4 w-4 mr-1" />
                저장
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {selectedRole ? (
              <DataTable
                columns={menuColumns}
                data={menus}
                loading={menusLoading}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                역할을 선택하세요.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
