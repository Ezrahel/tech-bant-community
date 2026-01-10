// API client for Go backend - Pure REST API, no Firebase
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export interface ApiError {
  error: string;
  request_id?: string;
  code?: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    // Get token from localStorage (set by backend after login)
    return localStorage.getItem('auth_token') || null;
  }

  private setAuthToken(token: string | null) {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Get CSRF token from cookie if available
    // For first request, cookie might not exist yet, so we'll get it from response
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1];
    
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Important for cookies to work
      });

      // Extract CSRF token from response cookies if not already set
      const setCookieHeader = response.headers.get('Set-Cookie');
      if (setCookieHeader && !csrfToken) {
        const csrfMatch = setCookieHeader.match(/csrf_token=([^;]+)/);
        if (csrfMatch && csrfMatch[1]) {
          // Store for next request
          document.cookie = `csrf_token=${csrfMatch[1]}; path=/; SameSite=Lax`;
        }
      }

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
          code: response.status,
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      
      // If response contains a token, store it
      if (data.token) {
        this.setAuthToken(data.token);
      }

      return data;
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network Error:', {
          url,
          baseURL: this.baseURL,
          endpoint,
          error: error.message
        });
        throw new Error(
          `Cannot connect to backend server at ${this.baseURL}. ` +
          `Please ensure the backend server is running on port 8080. ` +
          `If it is running, check CORS configuration. ` +
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

  async uploadFile(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.token) {
              localStorage.setItem('auth_token', response.token);
            }
            resolve(response);
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || `HTTP ${xhr.status}`));
          } catch {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.open('POST', `${this.baseURL}${endpoint}`);
      
      // Add auth token
      const token = this.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      // Get CSRF token
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_token='))
        ?.split('=')[1];
      
      if (csrfToken) {
        xhr.setRequestHeader('X-CSRF-Token', csrfToken);
      }

      xhr.send(formData);
    });
  }

  // Clear auth token
  clearAuthToken() {
    this.setAuthToken(null);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
