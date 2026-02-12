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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { method = 'GET', params, data, headers = {} } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const qs = toQueryString(params);
      if (qs) url += `?${qs}`;
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...headers,
      },
      credentials: 'include',
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      const formData = toFormData(data);
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
