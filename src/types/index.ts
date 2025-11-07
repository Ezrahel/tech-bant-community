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
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  category: 'general' | 'tech' | 'reviews' | 'updates' | 'gists' | 'banter';
  tags: string[];
  likes: number;
  comments: number;
  views: number;
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

export type PageType = 'login' | 'signup' | 'home' | 'new-post' | 'discussions' | 'reviews' | 'support' | 'admin';