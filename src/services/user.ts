// User service using Next.js backend API
import { apiClient } from '../lib/api';
import { ApiUserResponse, mapApiUserToUser } from '../lib/users';
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

export interface UserResponse extends ApiUserResponse {}

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
      ...mapApiUserToUser(response),
      posts_count: response.posts_count,
      followers_count: response.followers_count,
      following_count: response.following_count,
      join_date: response.created_at,
    };
  }
}

export const userService = new UserService();
