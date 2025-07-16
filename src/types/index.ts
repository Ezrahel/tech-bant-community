export interface User {
  id: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  isVerified: boolean;
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

export type PageType = 'home' | 'discussions' | 'reviews' | 'support' | 'new-post' | 'login' | 'signup';
export type PageType = 'home' | 'discussions' | 'reviews' | 'support' | 'new-post' | 'login' | 'signup' | 'admin';