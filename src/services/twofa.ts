// Two-Factor Authentication service using Go backend API with Supabase
// All OTP emails are sent via Resend API
import { apiClient } from '../lib/api';

export interface SendOTPRequest {
  email: string;
}

export interface VerifyOTPRequest {
  code: string;
}

export interface Enable2FARequest {
  email: string;
}

class TwoFAService {
  // Send OTP for login (uses Resend API for email delivery)
  async sendLoginOTP(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/2fa/send-otp', {
      email,
    });
  }

  // Verify OTP (backend uses email for verification)
  async verifyOTP(code: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/2fa/verify', {
      code,
    });
  }

  // Enable 2FA (sends OTP via Resend API)
  async enable2FA(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/2fa/enable');
  }

  // Disable 2FA
  async disable2FA(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/2fa/disable');
  }
}

export const twoFAService = new TwoFAService();

