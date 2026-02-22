import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { Observable } from 'rxjs';

const GRAPHQL_URI = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/graphql';

/* ─── 토큰 읽기/쓰기 헬퍼 ─── */
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

/* ─── 토큰 리프레시 ─── */
let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

function resolvePending() {
  pendingRequests.forEach((cb) => cb());
  pendingRequests = [];
}

async function refreshAccessToken(): Promise<boolean> {
  const state = getAuthState();
  const refreshToken = state?.refreshToken;
  if (!refreshToken) return false;

  try {
    const res = await fetch(GRAPHQL_URI, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            accessToken
            refreshToken
          }
        }`,
        variables: { refreshToken },
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

/* ─── Links ─── */
const httpLink = createHttpLink({ uri: GRAPHQL_URI });

const authLink = setContext((_, { headers }) => {
  const state = getAuthState();
  const token = state?.accessToken ?? null;
  const hospitalCode = state?.hospitalCode ?? null;
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(hospitalCode ? { 'x-hospital-code': hospitalCode } : {}),
    },
  };
});

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  if (!CombinedGraphQLErrors.is(error)) return;

  const unauthError = error.errors.find(
    (err) => err.extensions?.code === 'UNAUTHENTICATED' || err.extensions?.statusCode === 401,
  );

  if (!unauthError) return;

  // refreshToken mutation 자체가 실패한 경우 무한 루프 방지
  if (operation.operationName === 'RefreshToken') {
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return;
  }

  if (isRefreshing) {
    return new Observable((observer) => {
      pendingRequests.push(() => {
        const s = getAuthState();
        if (s?.accessToken) {
          operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
            headers: {
              ...headers,
              Authorization: `Bearer ${s.accessToken}`,
              ...(s.hospitalCode ? { 'x-hospital-code': s.hospitalCode } : {}),
            },
          }));
        }
        forward(operation).subscribe(observer);
      });
    });
  }

  isRefreshing = true;

  return new Observable((observer) => {
    refreshAccessToken()
      .then((success) => {
        if (success) {
          const s = getAuthState();
          if (s?.accessToken) {
            operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
              headers: {
                ...headers,
                Authorization: `Bearer ${s.accessToken}`,
                ...(s.hospitalCode ? { 'x-hospital-code': s.hospitalCode } : {}),
              },
            }));
          }
          resolvePending();
          forward(operation).subscribe(observer);
        } else {
          clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          observer.error(unauthError);
        }
      })
      .catch(() => {
        clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        observer.error(unauthError);
      })
      .finally(() => {
        isRefreshing = false;
      });
  });
});

/* ─── Client ─── */
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
});
