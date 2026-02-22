const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://api.propai.kr/graphql';

export class GraphQLError extends Error {
  constructor(
    message: string,
    public errors?: Array<{ message: string; path?: string[] }>,
  ) {
    super(message);
    this.name = 'GraphQLError';
  }
}

// ---------------------------------------------------------------------------
// localStorage 토큰 헬퍼
// ---------------------------------------------------------------------------

function getAuthState() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('ehr-auth');
    if (stored) return JSON.parse(stored)?.state ?? null;
  } catch {
    // ignore
  }
  return null;
}

function getAccessToken(): string | null {
  return getAuthState()?.accessToken ?? null;
}

function getHospitalCode(): string | null {
  return getAuthState()?.hospitalCode ?? null;
}

/** 외부에서 현재 hospitalCode를 읽을 수 있도록 노출 */
export function getStoredHospitalCode(): string | null {
  return getHospitalCode();
}

function getRefreshToken(): string | null {
  return getAuthState()?.refreshToken ?? null;
}

function setAuthTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem('ehr-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.state.accessToken = accessToken;
      parsed.state.refreshToken = refreshToken;
      localStorage.setItem('ehr-auth', JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
}

function clearAuth() {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem('ehr-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.state.accessToken = null;
      parsed.state.refreshToken = null;
      parsed.state.isAuthenticated = false;
      parsed.state.user = null;
      localStorage.setItem('ehr-auth', JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// 토큰 리프레시 (동시 요청 시 한 번만 실행)
// ---------------------------------------------------------------------------

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const token = getRefreshToken();
  if (!token) return false;

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            accessToken
            refreshToken
          }
        }`,
        variables: { refreshToken: token },
      }),
    });

    const json = await res.json();
    const tokens = json?.data?.refreshToken;

    if (tokens?.accessToken) {
      setAuthTokens(tokens.accessToken, tokens.refreshToken);
      return true;
    }
  } catch {
    // refresh 실패
  }

  return false;
}

/** 동시 호출 시 하나의 refresh 만 수행 */
function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ---------------------------------------------------------------------------
// UNAUTHENTICATED 판별
// ---------------------------------------------------------------------------

function isUnauthenticatedError(
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>,
): boolean {
  if (!errors?.length) return false;
  return errors.some(
    (e) =>
      e.extensions?.code === 'UNAUTHENTICATED' ||
      e.extensions?.statusCode === 401,
  );
}

// ---------------------------------------------------------------------------
// GraphQL 요청
// ---------------------------------------------------------------------------

async function executeRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = getAccessToken();
  const hospitalCode = getHospitalCode();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (hospitalCode) {
    headers['x-hospital-code'] = hospitalCode;
  }

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new GraphQLError(
      `GraphQL HTTP Error: ${response.status} ${response.statusText}`,
    );
  }

  const json = await response.json();

  if (json.errors?.length) {
    throw new GraphQLError(
      json.errors[0].message || 'GraphQL Error',
      json.errors,
    );
  }

  return json.data as T;
}

// ---------------------------------------------------------------------------
// 파일 업로드 (REST: POST /upload → multipart/form-data)
// ---------------------------------------------------------------------------

const API_BASE_URL =
  GRAPHQL_URL.replace(/\/graphql$/, '');

export interface UploadResult {
  originalName: string;
  mimeType: string;
  fileSize: number;
  storedPath: string;
  url: string;
}

async function executeUpload(file: File): Promise<UploadResult> {
  const token = getAccessToken();
  const hospitalCode = getHospitalCode();
  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (hospitalCode) {
    headers['x-hospital-code'] = hospitalCode;
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function uploadFile(file: File): Promise<UploadResult> {
  try {
    return await executeUpload(file);
  } catch (err) {
    // 401인 경우 토큰 리프레시 후 재시도
    if (err instanceof Error && err.message.includes('401')) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return await executeUpload(file);
      }
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// GraphQL 요청
// ---------------------------------------------------------------------------

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  try {
    return await executeRequest<T>(query, variables);
  } catch (err) {
    // UNAUTHENTICATED 에러인 경우 토큰 리프레시 후 재시도
    if (err instanceof GraphQLError && isUnauthenticatedError(err.errors)) {
      const refreshed = await tryRefresh();

      if (refreshed) {
        return await executeRequest<T>(query, variables);
      }

      // 리프레시 실패 → 로그아웃 후 로그인 페이지로 이동
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    throw err;
  }
}
