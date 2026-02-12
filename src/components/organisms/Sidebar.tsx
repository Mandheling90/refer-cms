'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { Logo } from '@/components/atoms/Logo';
import { useMenuStore } from '@/stores/menu-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: '시스템 관리',
    href: '#',
    children: [
      { title: '메뉴 관리', href: '/cms/menu' },
      { title: '역할 관리', href: '/cms/role' },
      { title: '역할-메뉴', href: '/cms/role-menu' },
      { title: '역할-사용자', href: '/cms/role-user' },
      { title: '권한 그룹', href: '/cms/permission' },
      { title: '사용자 관리', href: '/cms/user' },
    ],
  },
  {
    title: '콘텐츠 관리',
    href: '#',
    children: [
      { title: '게시판 설정', href: '/cms/board/config' },
      { title: '게시판 관리', href: '/cms/board' },
      { title: '콘텐츠 관리', href: '/cms/contents' },
      { title: '스트립 배너', href: '/cms/banner/strip' },
      { title: '팝업 배너', href: '/cms/banner/popup' },
    ],
  },
  {
    title: '시스템 설정',
    href: '#',
    children: [
      { title: '코드 관리', href: '/cms/code' },
      { title: '코드 그룹', href: '/cms/code/group' },
      { title: '공통 코드', href: '/cms/common-code' },
      { title: '시스템 메뉴', href: '/cms/system-menu' },
      { title: '관리자 정보', href: '/cms/admin-info' },
    ],
  },
  {
    title: '부가 기능',
    href: '#',
    children: [
      { title: 'HCM 인터페이스', href: '/cms/interface' },
      { title: '스케줄러', href: '/cms/scheduler' },
      { title: 'SMS', href: '/cms/sms' },
      { title: '템플릿', href: '/cms/template' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { expandedGroups, toggleGroup, sidebarOpen } = useMenuStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="w-[240px] min-h-screen bg-background border-r flex flex-col shrink-0">
      <Logo />
      <ScrollArea className="flex-1">
        <nav className="p-2">
          {NAV_ITEMS.map((group, idx) => (
            <div key={group.title} className="mb-1">
              <button
                onClick={() => toggleGroup(idx)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold text-foreground rounded-md hover:bg-muted transition-colors"
              >
                {group.title}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    expandedGroups.includes(idx) && 'rotate-180'
                  )}
                />
              </button>
              {expandedGroups.includes(idx) && group.children && (
                <ul className="ml-2 space-y-0.5">
                  {group.children.map((item) => (
                    <li key={item.href}>
                      <button
                        onClick={() => router.push(item.href)}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                          pathname === item.href
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
