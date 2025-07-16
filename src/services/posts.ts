import { databases, storage, ID } from '../lib/appwrite';
import { Post, PostCategory } from '../types';

const DATABASE_ID = 'nothing-community-db';
const POSTS_COLLECTION_ID = 'posts';
const STORAGE_BUCKET_ID = 'media-bucket';

export interface CreatePostData {
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  location?: string;
  mediaIds?: string[];
}

export const postsService = {
  // Create new post
  async createPost(postData: CreatePostData) {
    try {
      const user = await account.get();
      
      const post = await databases.createDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        ID.unique(),
        {
          ...postData,
          author_id: user.$id,
          author_name: user.name,
          author_avatar: `https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop`,
          author_admin: false,
          author_verified: false,
          views: 0,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          is_pinned: false,
          is_hot: false,
        }
      );
      
      return post;
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  },

  // Get all posts
  async getPosts(limit = 20, offset = 0) {
    try {
      const posts = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [
          `limit(${limit})`,
          `offset(${offset})`,
          'orderDesc("$createdAt")'
        ]
      );
      
      return posts.documents;
    } catch (error) {
      console.error('Get posts error:', error);
      throw error;
    }
  },

  // Get posts by category
  async getPostsByCategory(category: string, limit = 20, offset = 0) {
    try {
      const posts = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [
          `equal("category", "${category}")`,
          `limit(${limit})`,
          `offset(${offset})`,
          'orderDesc("$createdAt")'
        ]
      );
      
      return posts.documents;
    } catch (error) {
      console.error('Get posts by category error:', error);
      throw error;
    }
  },

  // Upload media file
  async uploadMedia(file: File) {
    try {
      const uploadedFile = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        file
      );
      
      // Get file URL
      const fileUrl = storage.getFileView(STORAGE_BUCKET_ID, uploadedFile.$id);
      
      return {
        id: uploadedFile.$id,
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'gif'
      };
    } catch (error) {
      console.error('Upload media error:', error);
      throw error;
    }
  }
};