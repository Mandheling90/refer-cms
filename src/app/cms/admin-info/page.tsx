'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import apiClient from '@/lib/api/client';
import type { ApiResponse } from '@/types/api';

export default function AdminInfoPage() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      toast.error('현재 비밀번호를 입력하세요.');
      return;
    }
    if (!newPassword.trim()) {
      toast.error('새 비밀번호를 입력하세요.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      const res = await apiClient.post<ApiResponse>('/admin/changePassword.ajax', {
        CURRENT_PASSWORD: currentPassword,
        NEW_PASSWORD: newPassword,
      });
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('비밀번호가 변경되었습니다.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '비밀번호 변경에 실패했습니다.');
      }
    } catch {
      toast.error('비밀번호 변경에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">관리자 정보</h1>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">계정 정보</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>사용자 ID</Label>
              <Input value={user?.USER_ID || ''} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>사용자 이름</Label>
              <Input value={user?.USER_NM || ''} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>관리자 여부</Label>
              <Input value={user?.IS_SUPER_ADMIN ? '슈퍼 관리자' : '일반 관리자'} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">비밀번호 변경</CardTitle>
            <Button size="sm" onClick={handleChangePassword}>
              <Save className="h-4 w-4 mr-1" />
              변경
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-4 max-w-3xl">
            <div className="space-y-1.5">
              <Label>현재 비밀번호</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호"
              />
            </div>
            <div className="space-y-1.5">
              <Label>새 비밀번호</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호"
              />
            </div>
            <div className="space-y-1.5">
              <Label>새 비밀번호 확인</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 확인"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
