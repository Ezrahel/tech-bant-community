// User service using Go backend API
import { apiClient } from '../lib/api';
import { User } from '../types';

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
}

export interface UserProfile extends User {
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
  join_date?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  bio?: string;
  location?: string;
  website?: string;
  is_admin: boolean;
  is_verified: boolean;
  is_active: boolean;
  role?: string;
  provider?: string;
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
  created_at: string;
  updated_at: string;
}

class UserService {
  // Get current user profile
  async getCurrentUser(): Promise<UserProfile> {
    const response = await apiClient.get<UserResponse>('/users/me');
    return this.convertToUserProfile(response);
  }

  // Get user by ID
  async getUser(userId: string): Promise<UserProfile> {
    const response = await apiClient.get<UserResponse>(`/users/${userId}`);
    return this.convertToUserProfile(response);
  }

  // Update user profile
  async updateProfile(profileData: UpdateProfileData): Promise<UserProfile> {
    const response = await apiClient.put<UserResponse>('/users/me', profileData);
    return this.convertToUserProfile(response);
  }

  // Get user posts
  async getUserPosts(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<any[]> {
    return apiClient.get<any[]>(
      `/users/${userId}/posts?limit=${limit}&offset=${offset}`
    );
  }

  // Search users
  async searchUsers(query: string, limit = 10): Promise<UserProfile[]> {
    const response = await apiClient.get<UserResponse[]>(
      `/users/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.map((user) => this.convertToUserProfile(user));
  }

  // Convert API response to UserProfile
  private convertToUserProfile(response: UserResponse): UserProfile {
    return {
      id: response.id,
      name: response.name,
      email: response.email,
      avatar: response.avatar,
      bio: response.bio,
      location: response.location,
      website: response.website,
      isAdmin: response.is_admin,
      isVerified: response.is_verified,
      isActive: response.is_active,
      role: response.role,
      provider: response.provider,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
      posts_count: response.posts_count,
      followers_count: response.followers_count,
      following_count: response.following_count,
      join_date: response.created_at,
    };
  }
}

export const userService = new UserService();
