import { gql } from '@apollo/client';

/** 로그인 */
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
    }
  }
`;

/** 로그아웃 */
export const LOGOUT = gql`
  mutation Logout {
    logout {
      success
      message
    }
  }
`;
