'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useMenuStore } from '@/stores/menu-store';

export function TopBar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useMenuStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{user.USER_NM || user.USER_ID}</span>
            {user.IS_SUPER_ADMIN && (
              <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                관리자
              </span>
            )}
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1" />
          로그아웃
        </Button>
      </div>
    </header>
  );
}
