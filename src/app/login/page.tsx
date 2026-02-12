'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [institution, setInstitution] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ institution?: string; userId?: string; password?: string }>({});

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/cms/home');
    }
  }, [isAuthenticated, router]);

  const validate = () => {
    const newErrors: { institution?: string; userId?: string; password?: string } = {};
    if (!institution) newErrors.institution = '기관을 선택해 주세요.';
    if (!userId.trim()) newErrors.userId = '아이디를 입력해 주세요.';
    if (!password.trim()) newErrors.password = '비밀번호를 입력해 주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // TODO: 백엔드 완료 후 실제 로그인 API로 교체
      // const response = await fetch('/api/cms/vktmTlwps/login.do', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      //   body: new URLSearchParams({ USER_ID: userId, PASSWORD: password }),
      //   credentials: 'include',
      // });

      if (userId === 'test' && password === 'test') {
        login({
          USER_ID: userId,
          USER_NM: '테스트 관리자',
          IS_SUPER_ADMIN: institution === 'admin',
          IS_HCM_ADMIN: false,
          ROLE_TYPE_LIST: [],
        });
        router.push('/cms/home');
      } else {
        toast.error('아이디 또는 비밀번호가 일치하지 않습니다.\n다시 확인하신 후 입력해주세요.');
      }
    } catch {
      toast.error('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-1 items-center justify-center bg-gray-100">
        <div className="w-full max-w-[480px] px-5">
          {/* 로고 영역 */}
          <div className="mb-10 flex items-center justify-center gap-4">
            <div className="flex h-[56px] w-[56px] items-center justify-center rounded-lg bg-black">
              <span className="text-lg font-bold text-white">EHR</span>
            </div>
            <div>
              <p className="text-[22px] font-bold text-foreground leading-tight">
                EHR CMS 관리자
              </p>
              <p className="text-sm tracking-wider text-gray-900 uppercase">
                EHR CMS ADMIN SYSTEM
              </p>
            </div>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit}>
            {/* 기관선택 */}
            <div className="mb-5">
              <label className="mb-2 block text-base font-bold text-foreground">
                기관선택
              </label>
              <select
                value={institution}
                onChange={(e) => {
                  setInstitution(e.target.value);
                  if (errors.institution) setErrors((p) => ({ ...p, institution: undefined }));
                }}
                className={`h-[50px] w-full appearance-none rounded-lg border bg-background px-4 text-base outline-none focus:border-primary ${
                  institution ? 'text-foreground' : 'text-gray-800'
                } ${errors.institution ? 'border-src-red' : 'border-gray-600'}`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b8d98' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  backgroundSize: '12px',
                }}
              >
                <option value="" disabled>선택하세요</option>
                <option value="admin">통합관리자</option>
                <option value="anam">진료협력센터 안암병원</option>
                <option value="guro">진료협력센터 구로병원</option>
                <option value="ansan">진료협력센터 안산병원</option>
              </select>
              {errors.institution && (
                <p className="mt-1.5 text-sm text-src-red">{errors.institution}</p>
              )}
            </div>

            {/* 아이디 */}
            <div className="mb-5">
              <label className="mb-2 block text-base font-bold text-foreground">
                로그인
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  if (errors.userId) setErrors((p) => ({ ...p, userId: undefined }));
                }}
                placeholder="아이디"
                className="h-[50px] w-full rounded-lg border border-gray-600 bg-background px-4 text-base outline-none placeholder:text-gray-800 focus:border-primary"
                autoFocus
              />
              {errors.userId && (
                <p className="mt-1.5 text-sm text-src-red">{errors.userId}</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div className="mb-6">
              <label className="mb-2 block text-base font-bold text-foreground">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="비밀번호 입력"
                className="h-[50px] w-full rounded-lg border border-gray-600 bg-background px-4 text-base outline-none placeholder:text-gray-800 focus:border-primary"
              />
              {errors.password && (
                <p className="mt-1.5 text-sm text-src-red">{errors.password}</p>
              )}
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-[56px] w-full items-center justify-center rounded-xl bg-primary text-xl font-semibold text-white transition-colors hover:bg-primary/85 active:bg-primary/70 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>

      {/* 하단 푸터 바 */}
      <footer className="flex h-10 shrink-0 items-center justify-center bg-src-darken">
        <p className="text-xs text-gray-600">
          &copy; EHR CMS Admin System. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
