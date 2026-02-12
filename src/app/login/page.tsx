'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/cms/home');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!userId.trim()) {
      toast.error('아이디를 입력하세요.');
      return;
    }
    if (!password.trim()) {
      toast.error('비밀번호를 입력하세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/cms/vktmTlwps/login.do', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ USER_ID: userId, PASSWORD: password }),
        credentials: 'include',
      });

      if (response.ok) {
        login({
          USER_ID: userId,
          USER_NM: userId,
          IS_SUPER_ADMIN: false,
          IS_HCM_ADMIN: false,
          ROLE_TYPE_LIST: [],
        });
        router.push('/cms/home');
      } else {
        toast.error('로그인에 실패했습니다.');
      }
    } catch {
      toast.error('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-[420px]">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-48 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl tracking-wide">EHR CMS</span>
            </div>
          </div>
          <CardTitle className="text-lg">관리자 로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">아이디</Label>
              <Input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="아이디를 입력하세요"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
