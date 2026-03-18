'use client';

import { useQuery } from '@apollo/client/react';
import { ADMIN_MENUS } from '@/lib/graphql/queries/menu';
import { usePathname } from 'next/navigation';

export type AccessLevel = 'FULL' | 'READ' | 'NONE';

interface ApiMenuItem {
  id: string;
  name: string;
  menuTargetType: string;
  externalUrl: string | null;
  accessLevel: string | null;
  children?: ApiMenuItem[];
}

interface MenuPermissionResult {
  accessLevel: AccessLevel;
  /** 수정 가능 여부 (FULL) */
  canEdit: boolean;
  /** 조회 가능 여부 (FULL or READ) */
  canRead: boolean;
  loading: boolean;
}

/**
 * 현재 페이지의 메뉴 권한을 반환하는 훅
 *
 * - FULL: 조회 + 수정 가능
 * - READ: 조회만 가능
 * - NONE: 접근 불가
 */
export function useMenuPermission(): MenuPermissionResult {
  const pathname = usePathname();

  const { data, loading } = useQuery<{ adminMenus: ApiMenuItem[] }>(ADMIN_MENUS, {
    variables: { menuType: 'ADMIN' },
  });

  if (loading || !data?.adminMenus) {
    return { accessLevel: 'NONE', canEdit: false, canRead: false, loading };
  }

  const menus = data.adminMenus;

  // 현재 경로에 해당하는 메뉴 찾기
  let matched: ApiMenuItem | undefined;

  for (const menu of menus) {
    if (menu.externalUrl && pathname === menu.externalUrl) {
      matched = menu;
      break;
    }
    if (menu.children) {
      const child = menu.children.find((c) => c.externalUrl && pathname === c.externalUrl);
      if (child) {
        matched = child;
        break;
      }
    }
  }

  // 매칭된 메뉴가 없으면 (등록되지 않은 경로) FULL 허용
  if (!matched) {
    return { accessLevel: 'FULL', canEdit: true, canRead: true, loading: false };
  }

  const level = (matched.accessLevel as AccessLevel) || 'NONE';

  return {
    accessLevel: level,
    canEdit: level === 'FULL',
    canRead: level === 'FULL' || level === 'READ',
    loading: false,
  };
}
