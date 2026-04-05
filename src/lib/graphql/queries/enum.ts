import { gql } from '@apollo/client';

/** 전체 Enum 목록 조회 */
export const GET_ENUMS = gql`
  query Enums {
    enums {
      name
      values {
        key
        label
      }
    }
  }
`;

/** 특정 Enum 조회 */
export const GET_ENUM_BY_NAME = gql`
  query EnumByName($name: String!) {
    enumByName(name: $name) {
      name
      values {
        key
        label
      }
    }
  }
`;
