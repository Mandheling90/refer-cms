import { useQuery } from '@apollo/client/react';
import { useMemo, useCallback } from 'react';
import { GET_ENUMS } from '@/lib/graphql/queries/enum';

interface EnumValue {
  key: string;
  label: string;
}

interface EnumDef {
  name: string;
  values: EnumValue[];
}

interface EnumsResponse {
  enums: EnumDef[];
}

/**
 * 서버 Enum을 조회하여 key→label 변환 함수를 제공하는 훅
 *
 * @example
 * const { labelOf, optionsOf } = useEnums();
 * labelOf('MedicalDepartment', 'FM') // → '가정의학과'
 * optionsOf('PartnerStatus')         // → [{ value: 'PENDING', label: '신청대기' }, ...]
 * optionsOf('PartnerStatus', true)   // → [{ value: '', label: '전체' }, ...]  (전체 포함)
 */
export function useEnums() {
  const { data, loading } = useQuery<EnumsResponse>(GET_ENUMS, {
    fetchPolicy: 'cache-first',
  });

  const enumMap = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    if (data?.enums) {
      for (const e of data.enums) {
        const valMap: Record<string, string> = {};
        for (const v of e.values) {
          valMap[v.key] = v.label;
        }
        map[e.name] = valMap;
      }
    }
    return map;
  }, [data]);

  const enumRaw = useMemo(() => {
    const map: Record<string, EnumValue[]> = {};
    if (data?.enums) {
      for (const e of data.enums) {
        map[e.name] = e.values;
      }
    }
    return map;
  }, [data]);

  /** key → label 변환 */
  const labelOf = useCallback(
    (enumName: string, key?: string | null, fallback = '-'): string => {
      if (!key) return fallback;
      return enumMap[enumName]?.[key] ?? key;
    },
    [enumMap],
  );

  /** enum을 Select 옵션 배열로 변환. withAll=true 이면 전체 옵션 추가 */
  const optionsOf = useCallback(
    (enumName: string, withAll = false): { value: string; label: string }[] => {
      const values = enumRaw[enumName];
      if (!values) return withAll ? [{ value: '__all', label: '전체' }] : [];
      const opts = values.map((v) => ({ value: v.key, label: v.label }));
      return withAll ? [{ value: '__all', label: '전체' }, ...opts] : opts;
    },
    [enumRaw],
  );

  return { enumMap, labelOf, optionsOf, loading };
}
