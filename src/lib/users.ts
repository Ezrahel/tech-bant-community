import { User } from '../types';

export interface ApiUserResponse {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  bio?: string;
  location?: string;
  website?: string;
  is_admin: boolean;
  is_verified: boolean;
  is_active?: boolean;
  role?: string;
  provider?: string;
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
  created_at: string;
  updated_at: string;
}

export function mapApiUserToUser(response: ApiUserResponse): User {
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
  };
}
