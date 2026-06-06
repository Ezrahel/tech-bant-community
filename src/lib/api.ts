// API client for Next.js backend - Pure REST API
import { getApiBaseUrl } from './env';

const API_BASE_URL = getApiBaseUrl();

export interface ApiError {
  error: string;
  request_id?: string;
  code?: number;
}

export class ApiRequestError extends Error {
  status?: number;
  code?: number;

  constructor(message: string, status?: number, code?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

interface RefreshResponse {
  token?: string;
  refreshToken?: string;
}

class ApiClient {
  private baseURL: string;
  private refreshInFlight: Promise<boolean> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    const trimmed = token.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private getRefreshToken(): string | null {
    const token = localStorage.getItem('refresh_token');
    if (!token) return null;
    const trimmed = token.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private setAuthToken(token: string | null) {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private setRefreshToken(token: string | null) {
    if (token) {
      localStorage.setItem('refresh_token', token);
    } else {
      localStorage.removeItem('refresh_token');
    }
  }

  private shouldAttemptRefresh(endpoint: string): boolean {
    return !endpoint.startsWith('/auth/login') &&
      !endpoint.startsWith('/auth/signup') &&
      !endpoint.startsWith('/auth/refresh') &&
      !endpoint.startsWith('/auth/logout');
  }

  async refreshSession(): Promise<boolean> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(refreshToken ? { refreshToken } : {}),
        });

        if (!response.ok) {
          return false;
        }

        const data = await response.json() as RefreshResponse;
        if (!data.token) {
          return false;
        }

        this.setAuthToken(data.token);
        if (data.refreshToken) {
          this.setRefreshToken(data.refreshToken);
        }

        return true;
      } catch (error) {
        console.error('Session refresh failed:', error);
        return false;
      } finally {
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
  }

  private buildAuthHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      ...(extraHeaders || {}),
    };

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    allowUnauthorizedRetry = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.buildAuthHeaders(options.headers as Record<string, string> | undefined);

    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (
        response.status === 401 &&
        allowUnauthorizedRetry &&
        this.shouldAttemptRefresh(endpoint)
      ) {
        const refreshed = await this.refreshSession();
        if (refreshed) {
          return this.request<T>(endpoint, options, false);
        }
        this.clearAuthToken();
      }

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
          code: response.status,
        }));
        throw new ApiRequestError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData.code
        );
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error: unknown) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network Error:', {
          url,
          baseURL: this.baseURL,
          endpoint,
          error: error.message
        });
        throw new Error(
          `Cannot connect to backend server at ${this.baseURL}. ` +
          `Please ensure the backend server is running. ` +
          `Error: ${error.message}`
        );
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFormData(endpoint: string, formData: FormData): Promise<unknown> {
    const sendUpload = async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.buildAuthHeaders(),
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new ApiRequestError(error.error || `HTTP ${response.status}`, response.status);
      }

      return response.json();
    };

    try {
      return await sendUpload();
    } catch (error: unknown) {
      if (
        error instanceof ApiRequestError &&
        error.status === 401 &&
        this.shouldAttemptRefresh(endpoint)
      ) {
        const refreshed = await this.refreshSession();
        if (refreshed) {
          return sendUpload();
        }
        this.clearAuthToken();
      }

      throw error;
    }
  }

  async uploadFile(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<unknown> {
    const sendUpload = () => new Promise<unknown>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve(xhr.responseText);
          }
          return;
        }

        try {
          const error = JSON.parse(xhr.responseText);
          reject(new ApiRequestError(error.error || `HTTP ${xhr.status}`, xhr.status));
        } catch {
          reject(new ApiRequestError(`HTTP ${xhr.status}: ${xhr.statusText}`, xhr.status));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.open('POST', `${this.baseURL}${endpoint}`);
      xhr.withCredentials = true;

      const token = this.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });

    try {
      return await sendUpload();
    } catch (error: unknown) {
      if (
        error instanceof ApiRequestError &&
        error.status === 401 &&
        this.shouldAttemptRefresh(endpoint)
      ) {
        const refreshed = await this.refreshSession();
        if (refreshed) {
          return sendUpload();
        }
        this.clearAuthToken();
      }

      throw error;
    }
  }

  clearAuthToken() {
    this.setAuthToken(null);
    this.setRefreshToken(null);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
