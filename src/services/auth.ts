// Authentication service using Node.js/Next.js backend API
import { ApiRequestError, apiClient } from '../lib/api';
import { getApiBaseUrl } from '../lib/env';
import { ApiUserResponse, mapApiUserToUser } from '../lib/users';
import { User } from '../types';

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
  roles: string[];
  permissions: string[];
}

interface ApiAuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: ApiUserResponse;
  roles: string[];
  permissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
  otpCode?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  private readonly apiBaseURL = getApiBaseUrl();

  private setRefreshToken(token: string | null) {
    if (token) {
      localStorage.setItem('refresh_token', token);
    } else {
      localStorage.removeItem('refresh_token');
    }
  }

  private getRefreshTokenValue(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private isUnauthorizedError(error: unknown): boolean {
    return error instanceof ApiRequestError && error.status === 401;
  }

  private persistAuthResponse(response: ApiAuthResponse): AuthResponse {
    localStorage.setItem('auth_token', response.token);
    this.setRefreshToken(response.refreshToken);

    return {
      ...response,
      user: mapApiUserToUser(response.user),
    };
  }

  // Sign up new user
  async signup(data: SignupRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiAuthResponse>('/auth/signup', {
        email: data.email,
        password: data.password,
        name: data.name,
      });
      return this.persistAuthResponse(response);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  }

  // Login user
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiAuthResponse>('/auth/login', {
        email: data.email,
        password: data.password,
        otpCode: data.otpCode,
      });
      return this.persistAuthResponse(response);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Invalid credentials');
    }
  }

  // Google OAuth login
  async loginWithGoogle(): Promise<void> {
    try {
      const redirectUrl = encodeURIComponent(window.location.origin + '/oauth-callback');
      const response = await fetch(`${this.apiBaseURL}/auth/oauth/google?redirect_url=${redirectUrl}`, {
        credentials: 'include',
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.auth_url) {
        throw new Error(data?.error || 'Failed to start Google OAuth');
      }

      window.location.href = data.auth_url;
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  // Logout
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshTokenValue();
    try {
      await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : undefined);
      apiClient.clearAuthToken();
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear token even if backend call fails
      apiClient.clearAuthToken();
    }
  }

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    } catch (error: any) {
      console.error('Change password error:', error);
      throw new Error(error.message || 'Failed to change password');
    }
  }

  // Reset password - request OTP
  async resetPassword(email: string): Promise<void> {
    try {
      // Backend sends OTP to email
      await apiClient.post('/auth/reset-password', { email });
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  // Confirm password reset with OTP
  async confirmPasswordReset(email: string, otpCode: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password/confirm', {
        email,
        otpCode,
        newPassword,
      });
    } catch (error: any) {
      console.error('Confirm password reset error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  // Get current user from token
  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('auth_token');
    const refreshToken = this.getRefreshTokenValue();
    if (!token && !refreshToken) return null;

    try {
      const response = await apiClient.get<{ user: ApiUserResponse }>('/auth/verify');
      return mapApiUserToUser(response.user);
    } catch (error: any) {
      if (refreshToken) {
        try {
          await this.refreshStoredSession();
          const response = await apiClient.get<{ user: ApiUserResponse }>('/auth/verify');
          return mapApiUserToUser(response.user);
        } catch (refreshError) {
          if (!this.isUnauthorizedError(refreshError)) {
            console.error('Session refresh failed:', refreshError);
          }
          this.clearStoredSession();
          return null;
        }
      }

      if (this.isUnauthorizedError(error)) {
        this.clearStoredSession();
        return null;
      }

      console.error('Get current user error:', error);
      return null;
    }
  }

  // Verify token
  async verifyToken(): Promise<User | null> {
    return this.getCurrentUser();
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiAuthResponse>('/auth/refresh', {
        refreshToken,
      });
      return this.persistAuthResponse(response);
    } catch (error: any) {
      console.error('Refresh token error:', error);
      throw new Error(error.message || 'Failed to refresh token');
    }
  }

  async refreshStoredSession(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshTokenValue();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.refreshToken(refreshToken);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token') || !!this.getRefreshTokenValue();
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Set token (used by OAuth callback)
  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  setRefreshSession(refreshToken: string) {
    this.setRefreshToken(refreshToken);
  }

  clearStoredSession() {
    apiClient.clearAuthToken();
  }
}

export const authService = new AuthService();
