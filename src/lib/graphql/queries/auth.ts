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

/** 관리자 로그인 */
export const ADMIN_LOGIN = gql`
  mutation AdminLogin($input: AdminLoginInput!) {
    adminLogin(input: $input) {
      accessToken
      refreshToken
      mustChangePw
      user {
        id
        userId
        userName
        email
        phone
        hospitalCode
        userType
        status
      }
    }
  }
`;

/** 토큰 갱신 */
export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
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
