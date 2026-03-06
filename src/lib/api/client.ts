import { API_BASE } from '@/lib/constants';
import { toQueryString, toFormData } from '@/lib/utils/format';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyParams = Record<string, any>;

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: AnyParams;
  data?: AnyParams;
  headers?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// localStorage 에서 인증 상태 읽기 (GraphQL 클라이언트와 동일 패턴)
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

function getEffectiveHospitalCode(): string | null {
  const state = getAuthState();
  const code = state?.hospitalCode ?? null;
  if (code === 'ALL') {
    return state?.activeHospitalCode ?? 'ANAM';
  }
  return code;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { method = 'GET', params, data, headers = {} } = options;

    // 인증 상태 자동 추가
    const authState = getAuthState();
    const token = authState?.accessToken ?? null;
    const hospitalCode = getEffectiveHospitalCode();

    // GET 파라미터에 HOSPITAL_CODE 자동 추가
    const mergedParams = hospitalCode
      ? { HOSPITAL_CODE: hospitalCode, ...params }
      : params;

    let url = `${this.baseUrl}${endpoint}`;
    if (mergedParams) {
      const qs = toQueryString(mergedParams);
      if (qs) url += `?${qs}`;
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(hospitalCode ? { 'x-hospital-code': hospitalCode } : {}),
      },
      credentials: 'include',
    };

    // POST/PUT 데이터에 HOSPITAL_CODE 자동 추가
    if (data && (method === 'POST' || method === 'PUT')) {
      const mergedData = hospitalCode
        ? { HOSPITAL_CODE: hospitalCode, ...data }
        : data;
      const formData = toFormData(mergedData);
      fetchOptions.body = formData;
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (json?.ServiceResult?.REDIRECT_URI) {
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    return json;
  }

  async get<T>(endpoint: string, params?: AnyParams): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, data?: AnyParams): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', data });
  }

  async put<T>(endpoint: string, data?: AnyParams): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', data });
  }

  async delete<T>(endpoint: string, data?: AnyParams): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', data });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
