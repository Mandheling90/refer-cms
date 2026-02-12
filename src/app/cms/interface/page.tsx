'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Play, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api/client';
import type { ApiResponse } from '@/types/api';

export default function InterfacePage() {
  const [loading, setLoading] = useState(false);
  const [interfaceDate, setInterfaceDate] = useState('');
  const [result, setResult] = useState('');

  const handleExecute = async () => {
    if (!interfaceDate) {
      toast.error('인터페이스 일자를 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse>('/hcmDataInterface/execute.ajax', {
        INTERFACE_DATE: interfaceDate,
      });
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('인터페이스가 실행되었습니다.');
        setResult(res.ServiceResult.MESSAGE_TEXT || '실행 완료');
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '실행에 실패했습니다.');
        setResult(res.ServiceResult.MESSAGE_TEXT || '실행 실패');
      }
    } catch {
      toast.error('인터페이스 실행에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">HCM 데이터 인터페이스</h1>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">인터페이스 실행</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-end gap-4 max-w-xl">
            <div className="space-y-1.5 flex-1">
              <Label>인터페이스 일자</Label>
              <Input
                type="date"
                value={interfaceDate}
                onChange={(e) => setInterfaceDate(e.target.value)}
              />
            </div>
            <Button onClick={handleExecute} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              실행
            </Button>
          </div>
          {result && (
            <div className="mt-4 p-3 bg-muted rounded-md text-sm">
              <Label className="text-muted-foreground">실행 결과</Label>
              <p className="mt-1">{result}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
