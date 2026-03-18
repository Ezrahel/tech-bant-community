// Posts service using Next.js backend API
import { apiClient } from '../lib/api';
import { Post, PostCategory, Category } from '../types';

export interface CreatePostData {
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  location?: string;
  mediaIds?: string[];
}

export interface GetPostsParams {
  limit?: number;
  offset?: number;
  category?: string;
}

export interface PostResponse {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author: {
    id: string;
    name: string;
    email?: string;
    avatar: string;
    is_admin: boolean;
    is_verified: boolean;
  };
  category: string;
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  shares: number;
  is_pinned: boolean;
  is_hot: boolean;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  media?: Array<{
    id: string;
    type: string;
    url: string;
    name: string;
    size: number;
  }>;
  location?: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

class PostsService {
  // Create new post
  async createPost(postData: CreatePostData): Promise<PostResponse> {
    return apiClient.post<PostResponse>('/posts', postData);
  }

  // Get all posts
  async getPosts(params: GetPostsParams = {}): Promise<PostResponse[]> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.category) queryParams.append('category', params.category);

    const query = queryParams.toString();
    return apiClient.get<PostResponse[]>(`/posts${query ? `?${query}` : ''}`);
  }

  // Get post by ID
  async getPost(postId: string): Promise<PostResponse> {
    return apiClient.get<PostResponse>(`/posts/${postId}`);
  }

  // Get posts by category
  async getPostsByCategory(
    category: string,
    limit = 20,
    offset = 0
  ): Promise<PostResponse[]> {
    return apiClient.get<PostResponse[]>(
      `/posts?category=${category}&limit=${limit}&offset=${offset}`
    );
  }

  // Like/unlike post
  async likePost(postId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/posts/${postId}/like`);
  }

  // Bookmark/unbookmark post
  async bookmarkPost(postId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/posts/${postId}/bookmark`);
  }

  // Share post
  async sharePost(postId: string): Promise<{ message: string; shares: number }> {
    return apiClient.post<{ message: string; shares: number }>(`/posts/${postId}/share`);
  }

  // Update post
  async updatePost(postId: string, postData: Partial<CreatePostData>): Promise<PostResponse> {
    return apiClient.put<PostResponse>(`/posts/${postId}`, postData);
  }

  // Delete post
  async deletePost(postId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/posts/${postId}`);
  }

  // Get categories with counts
  async getCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/posts/categories');
  }

  // Upload media
  async uploadMedia(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{
    id: string;
    type: string;
    url: string;
    name: string;
    size: number;
  }> {
    return apiClient.uploadFile('/media/upload', file, onProgress);
  }

  // Convert API response to Post type
  convertToPost(response: PostResponse): Post {
    return {
      id: response.id,
      title: response.title,
      content: response.content,
      author: {
        id: response.author.id,
        name: response.author.name,
        email: response.author.email,
        avatar: response.author.avatar,
        isAdmin: response.author.is_admin,
        isVerified: response.author.is_verified,
      },
      category: response.category as Post['category'],
      tags: response.tags,
      likes: response.likes,
      comments: response.comments,
      views: response.views,
      shares: response.shares,
      isLiked: response.is_liked || false,
      isBookmarked: response.is_bookmarked || false,
      publishedAt: response.published_at || response.created_at,
      isPinned: response.is_pinned,
      isHot: response.is_hot,
      media: response.media?.map((m) => ({
        id: m.id,
        type: m.type as 'image' | 'video' | 'gif',
        url: m.url,
        name: m.name,
        size: m.size,
      })),
    };
  }
}

export const postsService = new PostsService();
