'use client';

import { useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { roleApi, roleUserApi } from '@/lib/api/role';
import type { Role, RoleUser } from '@/types/role';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

const roleColumns: ColumnDef<Role, unknown>[] = [
  { accessorKey: 'ROLE_CODE', header: '역할 코드', size: 150 },
  { accessorKey: 'ROLE_NAME', header: '역할 이름', size: 200 },
  { accessorKey: 'ROLE_TYPE', header: '역할 유형', size: 150 },
];

export default function RoleUserPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<RoleUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [checkedUsers, setCheckedUsers] = useState<Set<string>>(new Set());

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

  const loadUsersByRole = useCallback(async (roleId: string) => {
    setUsersLoading(true);
    try {
      const res = await roleUserApi.list({ ROLE_ID: roleId });
      const userList = res.list || [];
      setUsers(userList);
      setCheckedUsers(new Set(userList.filter((u) => u.IS_CHECKED === 'Y').map((u) => u.USER_ID)));
    } catch {
      toast.error('사용자 목록 조회에 실패했습니다.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role);
    loadUsersByRole(role.ROLE_ID);
  };

  const toggleUser = (userId: string) => {
    setCheckedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRole) {
      toast.error('역할을 선택하세요.');
      return;
    }
    try {
      const userList = users.map((u) => ({
        ...u,
        IS_CHECKED: checkedUsers.has(u.USER_ID) ? 'Y' : 'N',
      }));
      const res = await roleUserApi.save({
        ROLE_ID: selectedRole.ROLE_ID,
        USER_LIST: JSON.stringify(userList),
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

  const userColumns: ColumnDef<RoleUser, unknown>[] = [
    {
      id: 'checked',
      header: '선택',
      size: 60,
      cell: ({ row }) => (
        <Checkbox
          checked={checkedUsers.has(row.original.USER_ID)}
          onCheckedChange={() => toggleUser(row.original.USER_ID)}
        />
      ),
    },
    { accessorKey: 'USER_ID', header: 'Login ID', size: 150 },
    { accessorKey: 'USER_TYPE', header: '사용자 유형', size: 120 },
    { accessorKey: 'DESCRIPTION', header: '설명', size: 200 },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">역할-사용자 매핑</h1>

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
                사용자 매핑 {selectedRole && `- ${selectedRole.ROLE_NAME}`}
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
                columns={userColumns}
                data={users}
                loading={usersLoading}
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
