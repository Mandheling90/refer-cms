'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { Users, FileText, Settings, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

const DASHBOARD_ITEMS = [
  {
    title: '사용자 관리',
    description: '사용자 계정을 관리합니다.',
    icon: Users,
    href: '/cms/user',
    color: 'text-blue-500',
  },
  {
    title: '메뉴 관리',
    description: '시스템 메뉴를 관리합니다.',
    icon: LayoutGrid,
    href: '/cms/menu',
    color: 'text-green-500',
  },
  {
    title: '게시판 관리',
    description: '게시판 및 게시글을 관리합니다.',
    icon: FileText,
    href: '/cms/board',
    color: 'text-orange-500',
  },
  {
    title: '시스템 설정',
    description: '코드 및 시스템 설정을 관리합니다.',
    icon: Settings,
    href: '/cms/code',
    color: 'text-purple-500',
  },
];

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground mt-1">
          환영합니다, {user?.USER_NM || user?.USER_ID}님
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DASHBOARD_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
