import { databases, account, ID } from '../lib/appwrite';
import { User } from '../types';

const DATABASE_ID = 'nothing-community-db';
const USERS_COLLECTION_ID = 'users';

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
}

export interface UserProfile extends User {
  posts_count: number;
  followers_count: number;
  following_count: number;
  join_date: string;
}

export const userService = {
  // Get current user profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const user = await account.get();
      
      try {
        // Get user profile from database
        const userDoc = await databases.getDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          user.$id
        );
        
        return {
          id: userDoc.$id,
          name: userDoc.name,
          email: userDoc.email,
          avatar: userDoc.avatar,
          bio: userDoc.bio || '',
          location: userDoc.location || '',
          website: userDoc.website || '',
          isAdmin: userDoc.is_admin || false,
          isVerified: userDoc.is_verified || false,
          isActive: userDoc.is_active || true,
          role: userDoc.role || 'user',
          provider: userDoc.provider || 'email',
          createdAt: userDoc.$createdAt,
          updatedAt: userDoc.$updatedAt,
          posts_count: userDoc.posts_count || 0,
          followers_count: userDoc.followers_count || 0,
          following_count: userDoc.following_count || 0,
          join_date: userDoc.$createdAt,
        };
      } catch (dbError) {
        // If user profile doesn't exist in database, create a default one
        console.log('User profile not found in database, creating default profile...');
        
        const defaultProfile = {
          name: user.name,
          email: user.email,
          avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop",
          bio: '',
          location: '',
          website: '',
          is_admin: false,
          is_verified: false,
          is_active: true,
          role: 'user',
          provider: 'email',
          posts_count: 0,
          followers_count: 0,
          following_count: 0,
        };

        const createdUser = await databases.createDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          user.$id,
          defaultProfile
        );

        return {
          id: createdUser.$id,
          name: createdUser.name,
          email: createdUser.email,
          avatar: createdUser.avatar,
          bio: createdUser.bio || '',
          location: createdUser.location || '',
          website: createdUser.website || '',
          isAdmin: createdUser.is_admin || false,
          isVerified: createdUser.is_verified || false,
          isActive: createdUser.is_active || true,
          role: createdUser.role || 'user',
          provider: createdUser.provider || 'email',
          createdAt: createdUser.$createdAt,
          updatedAt: createdUser.$updatedAt,
          posts_count: createdUser.posts_count || 0,
          followers_count: createdUser.followers_count || 0,
          following_count: createdUser.following_count || 0,
          join_date: createdUser.$createdAt,
        };
      }
    } catch (error) {
      console.error('Get current user profile error:', error);
      return null;
    }
  },

  // Get user profile by ID
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId
      );
      
      return {
        id: userDoc.$id,
        name: userDoc.name,
        email: userDoc.email,
        avatar: userDoc.avatar,
        bio: userDoc.bio || '',
        location: userDoc.location || '',
        website: userDoc.website || '',
        isAdmin: userDoc.is_admin || false,
        isVerified: userDoc.is_verified || false,
        isActive: userDoc.is_active || true,
        role: userDoc.role || 'user',
        provider: userDoc.provider || 'email',
        createdAt: userDoc.$createdAt,
        updatedAt: userDoc.$updatedAt,
        posts_count: userDoc.posts_count || 0,
        followers_count: userDoc.followers_count || 0,
        following_count: userDoc.following_count || 0,
        join_date: userDoc.$createdAt,
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  },

  // Update user profile
  async updateProfile(profileData: UpdateProfileData): Promise<UserProfile> {
    try {
      const user = await account.get();
      
      const updatedUser = await databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id,
        profileData
      );
      
      return {
        id: updatedUser.$id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio || '',
        location: updatedUser.location || '',
        website: updatedUser.website || '',
        isAdmin: updatedUser.is_admin || false,
        isVerified: updatedUser.is_verified || false,
        isActive: updatedUser.is_active || true,
        role: updatedUser.role || 'user',
        provider: updatedUser.provider || 'email',
        createdAt: updatedUser.$createdAt,
        updatedAt: updatedUser.$updatedAt,
        posts_count: updatedUser.posts_count || 0,
        followers_count: updatedUser.followers_count || 0,
        following_count: updatedUser.following_count || 0,
        join_date: updatedUser.$createdAt,
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // Get user posts
  async getUserPosts(userId: string, limit = 20, offset = 0) {
    try {
      const posts = await databases.listDocuments(
        DATABASE_ID,
        'posts',
        [
          `equal("author_id", "${userId}")`,
          `limit(${limit})`,
          `offset(${offset})`,
          'orderDesc("$createdAt")'
        ]
      );
      
      return posts.documents;
    } catch (error) {
      console.error('Get user posts error:', error);
      throw error;
    }
  },

  // Search users
  async searchUsers(query: string, limit = 10) {
    try {
      const users = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [
          `search("name", "${query}")`,
          `limit(${limit})`,
          'orderDesc("$createdAt")'
        ]
      );
      
      return users.documents;
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }
}; 