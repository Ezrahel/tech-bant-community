// Authentication service using Go backend API only (no Firebase)
import { apiClient } from '../lib/api';
import { User } from '../types';

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
  roles: string[];
  permissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
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
  // Sign up new user
  async signup(data: SignupRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/signup', {
        email: data.email,
        password: data.password,
        name: data.name,
      });
      return response;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  }

  // Login user
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email: data.email,
        password: data.password,
      });
      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Invalid credentials');
    }
  }

  // Google OAuth login
  async loginWithGoogle(): Promise<void> {
    try {
      // Redirect to backend OAuth endpoint
      const redirectUrl = encodeURIComponent(window.location.origin + '/oauth-callback');
      window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/auth/oauth/google?redirect_url=${redirectUrl}`;
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
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
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      const response = await apiClient.get<{ user: User }>('/auth/verify');
      return response.user;
    } catch (error) {
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
      const response = await apiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken,
      });
      return response;
    } catch (error: any) {
      console.error('Refresh token error:', error);
      throw new Error(error.message || 'Failed to refresh token');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Set token (used by OAuth callback)
  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }
}

export const authService = new AuthService();
