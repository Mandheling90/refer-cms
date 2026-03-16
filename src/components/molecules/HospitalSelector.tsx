'use client';

import { useApolloClient } from '@apollo/client/react';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

const HOSPITAL_OPTIONS = [
  { value: 'ANAM', label: '안암' },
  { value: 'GURO', label: '구로' },
  { value: 'ANSAN', label: '안산' },
] as const;

const HOSPITAL_OPTIONS_WITH_ALL = [
  { value: 'ALL', label: '전체' },
  ...HOSPITAL_OPTIONS,
] as const;

interface HospitalSelectorProps {
  /** true이면 '전체(ALL)' 옵션을 포함합니다 */
  showAll?: boolean;
}

/**
 * 통합관리자(ALL)일 때만 표시되는 기관 선택 탭.
 * 선택 시 activeHospitalCode가 변경되고 Apollo 캐시를 초기화하여
 * 모든 쿼리가 새 기관 코드로 다시 실행됩니다.
 */
export function HospitalSelector({ showAll = false }: HospitalSelectorProps) {
  const client = useApolloClient();
  const { hospitalCode, activeHospitalCode, setActiveHospitalCode } = useAuthStore();

  if (hospitalCode !== 'ALL') return null;

  const options = showAll ? HOSPITAL_OPTIONS_WITH_ALL : HOSPITAL_OPTIONS;
  const current = activeHospitalCode ?? 'ANAM';

  const handleChange = (code: string) => {
    if (code === current) return;
    setActiveHospitalCode(code);
    client.resetStore();
  };

  return (
    <div className="inline-flex items-center rounded-full bg-primary p-1">
      <span className="px-4 text-base font-medium text-white">기관 선택</span>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleChange(opt.value)}
          className={cn(
            'px-5 py-1.5 text-base font-medium rounded-full transition-colors cursor-pointer',
            current === opt.value
              ? 'bg-src-white text-primary shadow-sm'
              : 'text-white/80 hover:text-white',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
