'use client';

import { createContext, useContext } from 'react';
import { useMenuPermission, type AccessLevel } from '@/hooks/use-menu-permission';
import { ShieldAlert, Eye } from 'lucide-react';
import type { ReactNode } from 'react';

interface PermissionContextValue {
  accessLevel: AccessLevel;
  canEdit: boolean;
  canRead: boolean;
}

const PermissionContext = createContext<PermissionContextValue>({
  accessLevel: 'FULL',
  canEdit: true,
  canRead: true,
});

/**
 * 현재 페이지의 메뉴 권한을 가져오는 훅
 * PermissionGuard 하위에서 사용
 */
export function usePagePermission() {
  return useContext(PermissionContext);
}

interface PermissionGuardProps {
  children: ReactNode;
}

/**
 * 현재 페이지의 메뉴 권한을 확인하여 접근을 제어하는 가드 컴포넌트
 *
 * - FULL: 조회 + 수정 가능
 * - READ: 조회만 가능 (읽기전용 배너 표시)
 * - NONE: 접근 불가 메시지 표시
 */
export function PermissionGuard({ children }: PermissionGuardProps) {
  const permission = useMenuPermission();

  if (permission.loading) return null;

  if (!permission.canRead) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-muted-foreground">
        <ShieldAlert className="h-16 w-16" />
        <h2 className="text-xl font-semibold">접근 권한이 없습니다</h2>
        <p className="text-sm">관리자에게 권한을 요청하세요.</p>
      </div>
    );
  }

  return (
    <PermissionContext.Provider value={permission}>
      {!permission.canEdit && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <Eye className="h-4 w-4 shrink-0" />
          <span>읽기 전용 모드입니다. 수정 권한이 필요하면 관리자에게 문의하세요.</span>
        </div>
      )}
      {children}
    </PermissionContext.Provider>
  );
}
