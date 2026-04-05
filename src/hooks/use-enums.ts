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
 * const { labelOf } = useEnums();
 * labelOf('MedicalDepartment', 'FM') // → '가정의학과'
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

  const labelOf = useCallback(
    (enumName: string, key?: string | null, fallback = '-'): string => {
      if (!key) return fallback;
      return enumMap[enumName]?.[key] ?? key;
    },
    [enumMap],
  );

  return { enumMap, labelOf, loading };
}
