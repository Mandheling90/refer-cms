'use client';

import { Logo } from '@/components/atoms/Logo';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useMenuStore } from '@/stores/menu-store';
import { useQuery } from '@apollo/client/react';
import { ADMIN_MENUS } from '@/lib/graphql/queries/menu';
import {
  ChevronDown,
  Menu as MenuIcon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface ApiMenuItem {
  id: string;
  name: string;
  menuTargetType: string;
  externalUrl: string | null;
  gnbExposure: boolean;
  accessLevel: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: ApiMenuItem[];
}

interface NavChild {
  title: string;
  href: string;
  linkTarget: '_self' | '_blank';
}

interface NavItem {
  title: string;
  href?: string;
  children?: NavChild[];
  linkTarget?: '_self' | '_blank';
}

function mapMenuToNav(menus: ApiMenuItem[]): NavItem[] {
  const result: NavItem[] = [];

  for (const menu of menus) {
    // NONE인 메뉴 숨김
    if (menu.accessLevel === 'NONE') continue;

    const linkTarget: '_self' | '_blank' = menu.gnbExposure ? '_blank' : '_self';

    if (menu.menuTargetType === 'PARENT' && menu.children?.length) {
      // 하위 메뉴 중 NONE이 아닌 것만 표시
      const visibleChildren: NavChild[] = menu.children
        .filter((child) => child.accessLevel !== 'NONE')
        .map((child) => ({
          title: child.name,
          href: child.externalUrl || '',
          linkTarget: (child.gnbExposure ? '_blank' : '_self') as '_self' | '_blank',
        }));

      // 하위 메뉴가 모두 NONE이면 상위도 숨김
      if (visibleChildren.length === 0) continue;

      result.push({ title: menu.name, children: visibleChildren });
    } else {
      result.push({
        title: menu.name,
        href: menu.externalUrl || undefined,
        linkTarget,
      });
    }
  }

  return result;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { hospitalCode } = useAuthStore();
  const { expandedGroups, toggleGroup, sidebarOpen } = useMenuStore();

  const { data } = useQuery<{ adminMenus: ApiMenuItem[] }>(ADMIN_MENUS, {
    variables: { menuType: 'ADMIN' },
  });

  const navItems: NavItem[] = data?.adminMenus ? mapMenuToNav(data.adminMenus) : [];

  const isItemActive = (item: NavItem) => {
    if (item.href) return pathname === item.href;
    if (item.children) return item.children.some((c) => pathname === c.href);
    return false;
  };

  const handleNavigation = (href: string, linkTarget?: '_self' | '_blank') => {
    if (linkTarget === '_blank') {
      window.open(href, '_blank');
    } else {
      router.push(href);
    }
  };

  const handleDepth1Click = (item: NavItem, idx: number) => {
    if (item.children) {
      toggleGroup(idx);
    } else if (item.href) {
      handleNavigation(item.href, item.linkTarget);
    }
  };

  return (
    <aside
      className={cn(
        'bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden transition-all duration-300',
        !sidebarOpen && 'w-0 border-r-0'
      )}
      style={{ gridArea: 'aside' }}
    >
      <Logo />
      <nav className="flex-1 overflow-y-auto">
        <ul>
          {navItems.map((item, idx) => {
            const active = isItemActive(item);
            const expanded = expandedGroups.includes(idx);

            return (
              <li key={idx}>
                {/* Depth 1 */}
                <button
                  onClick={() => handleDepth1Click(item, idx)}
                  className={cn(
                    'flex items-center gap-[10px] w-full px-5 py-[15px] text-[18px] text-sidebar-foreground transition-colors rounded-[5px] cursor-pointer',
                    'border-b border-sidebar-border/30',
                    'hover:bg-sidebar-primary hover:font-bold hover:text-sidebar-primary-foreground [&:hover_svg]:text-sidebar-primary-foreground',
                    active && 'bg-sidebar-primary font-bold text-sidebar-primary-foreground',
                    active && item.children && expanded && 'rounded-b-none'
                  )}
                >
                  <MenuIcon
                    className={cn(
                      'h-5 w-5 shrink-0 text-sidebar-foreground transition-colors',
                      active && 'text-sidebar-primary-foreground'
                    )}
                  />
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.children && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform',
                        expanded && 'rotate-180'
                      )}
                    />
                  )}
                </button>

                {/* Depth 2 */}
                {item.children && expanded && (
                  <ul className="bg-sidebar-accent rounded-b-[5px] overflow-hidden">
                    {item.children.map((child, childIdx) => (
                      <li
                        key={child.href}
                        className={cn(
                          childIdx > 0 && 'border-t border-sidebar-border/10'
                        )}
                      >
                        <button
                          onClick={() => handleNavigation(child.href, child.linkTarget)}
                          className={cn(
                            'w-full text-left px-[30px] py-[12px] text-[16px] text-sidebar-accent-foreground rounded-[5px] transition-colors cursor-pointer',
                            pathname === child.href
                              ? 'bg-sidebar-primary/50 font-medium'
                              : 'hover:bg-sidebar-primary/50'
                          )}
                        >
                          {child.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
