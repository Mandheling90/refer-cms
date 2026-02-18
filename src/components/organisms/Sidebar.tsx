'use client';

import { Logo } from '@/components/atoms/Logo';
import { cn } from '@/lib/utils';
import { useMenuStore } from '@/stores/menu-store';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  ChevronDown,
  Columns3,
  Image,
  LayoutDashboard,
  PenLine,
  UserPlus,
  Users
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface NavChild {
  title: string;
  href: string;
}

interface NavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: '메인페이지',
    icon: LayoutDashboard,
    children: [{ title: '대시보드', href: '/cms/home' }],
  },
  {
    title: '메뉴 관리',
    href: '/cms/menu',
    icon: Columns3,
  },
  {
    title: '회원 관리',
    href: '/cms/user',
    icon: Users,
  },
  {
    title: '회원가입 신청 관리',
    href: '/cms/user/apply',
    icon: UserPlus,
  },
  {
    title: '배너관리',
    icon: Image,
    children: [
      { title: '미니배너', href: '/cms/banner/mini-banner' },
      { title: '팝업', href: '/cms/banner/popup' },
    ],
  },
  // {
  //   title: '의료진',
  //   href: '/cms/doctor',
  //   icon: Stethoscope,
  // },
  // {
  //   title: '협력병의원 체결관리',
  //   href: '/cms/cooperation/contract',
  //   icon: Handshake,
  // },
  {
    title: '협력병의원 신청 관리',
    icon: Building2,
    children: [
      { title: '협력병원 신청 관리', href: '/cms/cooperation/hospital-apply' },
      { title: '협력의원 신청 관리', href: '/cms/cooperation/clinic-apply' },
    ],
  },
  {
    title: '협력병의원 수정 관리',
    icon: PenLine,
    children: [
      { title: '협력병원 수정 관리', href: '/cms/cooperation/hospital-edit' },
      { title: '협력의원 수정 관리', href: '/cms/cooperation/clinic-edit' },
    ],
  },
  // {
  //   title: '검사이미지 관리',
  //   href: '/cms/exam-image',
  //   icon: FileImage,
  // },
  // {
  //   title: '게시판 설정',
  //   href: '/cms/board/config',
  //   icon: Settings2,
  // },
  // {
  //   title: '게시판 관리',
  //   href: '/cms/board',
  //   icon: ClipboardList,
  // },
  // {
  //   title: '콘텐츠 설정',
  //   href: '/cms/contents/config',
  //   icon: FileText,
  // },
  // {
  //   title: '콘텐츠 관리',
  //   href: '/cms/contents',
  //   icon: FileText,
  // },
  // {
  //   title: 'e-Consult',
  //   href: '/cms/e-consult',
  //   icon: Mail,
  // },
  // {
  //   title: '시스템 관리',
  //   icon: ShieldCheck,
  //   children: [
  //     { title: '관리자 관리', href: '/cms/system/manager' },
  //     { title: 'CMS 메뉴', href: '/cms/system/menu' },
  //     { title: '권한 관리', href: '/cms/system/authority' },
  //     { title: '권한그룹 수정 이력', href: '/cms/system/history' },
  //   ],
  // },
  // {
  //   title: '로그내역',
  //   href: '/cms/log',
  //   icon: History,
  // },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { expandedGroups, toggleGroup, sidebarOpen } = useMenuStore();

  const isItemActive = (item: NavItem) => {
    if (item.href) return pathname === item.href;
    if (item.children) return item.children.some((c) => pathname === c.href);
    return false;
  };

  const handleDepth1Click = (item: NavItem, idx: number) => {
    if (item.children) {
      toggleGroup(idx);
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <aside
      className={cn(
        'bg-gray-200 border-r border-gray-600 flex flex-col overflow-hidden transition-all duration-300',
        !sidebarOpen && 'w-0 border-r-0'
      )}
      style={{ gridArea: 'aside' }}
    >
      <Logo />
      <nav className="flex-1 overflow-y-auto">
        <ul>
          {NAV_ITEMS.map((item, idx) => {
            const active = isItemActive(item);
            const expanded = expandedGroups.includes(idx);
            const Icon = item.icon;

            return (
              <li key={idx}>
                {/* Depth 1 */}
                <button
                  onClick={() => handleDepth1Click(item, idx)}
                  className={cn(
                    'flex items-center gap-[10px] w-full px-5 py-[15px] text-[18px] text-foreground transition-colors rounded-[5px]',
                    'border-b border-white/10',
                    'hover:bg-primary hover:font-bold hover:text-white [&:hover_svg]:text-white',
                    active && 'bg-primary font-bold text-white',
                    active && item.children && expanded && 'rounded-b-none'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 text-gray-900 transition-colors',
                      active && 'text-white'
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
                  <ul className="bg-src-darken rounded-b-[5px] overflow-hidden">
                    {item.children.map((child, childIdx) => (
                      <li
                        key={child.href}
                        className={cn(
                          childIdx > 0 && 'border-t border-white/[0.04]'
                        )}
                      >
                        <button
                          onClick={() => router.push(child.href)}
                          className={cn(
                            'w-full text-left px-[30px] py-[12px] text-[16px] text-white rounded-[5px] transition-colors',
                            pathname === child.href
                              ? 'bg-primary/50 font-medium'
                              : 'hover:bg-primary/50'
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
