import { apiClient } from '../lib/api';
import { Article, ArticleCategory, ArticleRevision, CreateArticleData, UpdateArticleData } from '../types';

export interface GetArticlesParams {
  limit?: number;
  offset?: number;
  status?: string;
  category_id?: string;
  author_id?: string;
  search?: string;
}

class ArticlesService {
  async getArticles(params: GetArticlesParams = {}): Promise<Article[]> {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());
    if (params.status) query.append('status', params.status);
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.author_id) query.append('author_id', params.author_id);
    if (params.search) query.append('search', params.search);

    const qs = query.toString();
    return apiClient.get<Article[]>(`/articles${qs ? `?${qs}` : ''}`);
  }

  async getArticle(id: string): Promise<Article> {
    return apiClient.get<Article>(`/articles/${id}`);
  }

  async createArticle(data: CreateArticleData): Promise<Article> {
    return apiClient.post<Article>('/articles', data);
  }

  async updateArticle(id: string, data: UpdateArticleData): Promise<Article> {
    return apiClient.put<Article>(`/articles/${id}`, data);
  }

  async deleteArticle(id: string): Promise<void> {
    return apiClient.delete<void>(`/articles/${id}`);
  }

  async togglePublish(id: string): Promise<{ message: string; status: string }> {
    return apiClient.post<{ message: string; status: string }>(`/articles/${id}/publish`);
  }

  async getRevisions(articleId: string): Promise<ArticleRevision[]> {
    return apiClient.get<ArticleRevision[]>(`/articles/${articleId}/revisions`);
  }

  async restoreRevision(articleId: string, revisionId: string): Promise<Article> {
    return apiClient.post<Article>(`/articles/${articleId}/revisions/${revisionId}/restore`);
  }

  async getCategories(): Promise<ArticleCategory[]> {
    return apiClient.get<ArticleCategory[]>('/articles/categories');
  }

  async createCategory(data: { name: string; description?: string }): Promise<ArticleCategory> {
    return apiClient.post<ArticleCategory>('/articles/categories', data);
  }

  async uploadImage(file: File, articleId?: string): Promise<{ id: string; url: string; alt?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (articleId) formData.append('article_id', articleId);

    return apiClient.uploadFormData('/articles/images/upload', formData) as Promise<{
      id: string;
      url: string;
      alt?: string;
    }>;
  }
}

export const articlesService = new ArticlesService();
