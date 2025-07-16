import { account, ID } from '../lib/appwrite';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export const authService = {
  // Register new user
  async register(credentials: RegisterCredentials) {
    try {
      const user = await account.create(
        ID.unique(),
        credentials.email,
        credentials.password,
        credentials.name
      );
      
      // Create session after registration
      const session = await account.createEmailSession(
        credentials.email,
        credentials.password
      );
      
      return { user, session };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  async login(credentials: LoginCredentials) {
    try {
      const session = await account.createEmailSession(
        credentials.email,
        credentials.password
      );
      return session;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // OAuth login URLs
  async getGoogleAuthUrl() {
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/google', {
        credentials: 'include'
      });
      const data = await response.json();
      return data.auth_url;
    } catch (error) {
      console.error('Google auth URL error:', error);
      throw error;
    }
  },

  async getGitHubAuthUrl() {
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/github', {
        credentials: 'include'
      });
      const data = await response.json();
      return data.auth_url;
    } catch (error) {
      console.error('GitHub auth URL error:', error);
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const user = await account.get();
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      await account.get();
      return true;
    } catch {
      return false;
    }
  }
};