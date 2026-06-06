export interface User {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  bio?: string;
  location?: string;
  website?: string;
  isAdmin: boolean;
  isVerified: boolean;
  isActive?: boolean;
  role?: string;
  provider?: string;
  cover_photo?: string;
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  html_content?: string;
  author: User;
  category: 'general' | 'tech' | 'reviews' | 'updates' | 'gists' | 'banter';
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  shares: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  publishedAt: string;
  isPinned?: boolean;
  isHot?: boolean;
  media?: MediaAttachment[];
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  name: string;
  size: number;
}

export interface Category {
  id: string;
  name: string;
  count: number;
  description?: string;
}

export interface PostCategory {
  id: string;
  name: string;
  description: string;
}

export type PageType = 'login' | 'signup' | 'home' | 'new-post' | 'discussions' | 'reviews' | 'support' | 'admin' | 'articles' | 'new-article' | 'edit-article';

// ---- Article Types ----

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface ArticleImage {
  id: string;
  article_id?: string;
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

export interface ArticleTag {
  tag: string;
}

export interface ArticleAuthor {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: string;
  bio?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: Record<string, unknown>;
  html_content?: string;
  featured_image?: string;
  featured_image_caption?: string;
  category_id?: string;
  author_id: string;
  author?: ArticleAuthor;
  category?: ArticleCategory;
  tags?: ArticleTag[];
  status: 'draft' | 'scheduled' | 'published';
  published_at?: string;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  canonical_url?: string;
  view_count: number;
  word_count: number;
  reading_time_minutes: number;
}

export interface ArticleRevision {
  id: string;
  article_id: string;
  title: string;
  content: Record<string, unknown>;
  html_content?: string;
  excerpt?: string;
  featured_image?: string;
  category_id?: string;
  editor_id?: string;
  editor?: ArticleAuthor;
  change_summary?: string;
  created_at: string;
}

export interface CreateArticleData {
  title: string;
  content: Record<string, unknown>;
  html_content?: string;
  excerpt?: string;
  featured_image?: string;
  featured_image_caption?: string;
  category_id?: string;
  tags?: string[];
  status?: 'draft' | 'scheduled' | 'published';
  scheduled_at?: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  canonical_url?: string;
}

export interface UpdateArticleData extends Partial<CreateArticleData> {
  change_summary?: string;
}