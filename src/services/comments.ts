// Comments service using Go backend API
import { apiClient } from '../lib/api';

export interface CreateCommentData {
  content: string;
}

export interface CommentResponse {
  id: string;
  post_id: string;
  author_id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    isAdmin: boolean;
    isVerified: boolean;
  };
  content: string;
  likes: number;
  created_at: string;
  updated_at: string;
}

export interface GetCommentsParams {
  limit?: number;
  offset?: number;
}

class CommentsService {
  // Create comment
  async createComment(
    postId: string,
    data: CreateCommentData
  ): Promise<CommentResponse> {
    return apiClient.post<CommentResponse>(`/posts/${postId}/comments`, data);
  }

  // Get comments for a post
  async getComments(
    postId: string,
    params: GetCommentsParams = {}
  ): Promise<CommentResponse[]> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return apiClient.get<CommentResponse[]>(
      `/posts/${postId}/comments${query ? `?${query}` : ''}`
    );
  }

  // Like/unlike comment
  async likeComment(commentId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/comments/${commentId}/like`);
  }

  // Update comment
  async updateComment(commentId: string, data: { content: string }): Promise<CommentResponse> {
    return apiClient.put<CommentResponse>(`/comments/${commentId}`, data);
  }

  // Delete comment
  async deleteComment(commentId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/comments/${commentId}`);
  }
}

export const commentsService = new CommentsService();

