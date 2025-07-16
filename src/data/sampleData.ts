import { User, Post, Category, PostCategory } from '../types';

export const sampleUsers: User[] = [
  {
    id: '1',
    name: 'TechReviewer',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop',
    isAdmin: true,
    isVerified: true
  },
  {
    id: '2',
    name: 'NothingFan',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop',
    isAdmin: false,
    isVerified: true
  },
  {
    id: '3',
    name: 'DevCommunity',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop',
    isAdmin: true,
    isVerified: true
  },
  {
    id: '4',
    name: 'ControversialUser',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop',
    isAdmin: false,
    isVerified: false
  },
  {
    id: '5',
    name: 'AudioPhile',
    avatar: 'https://images.pexels.com/photos/1181562/pexels-photo-1181562.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop',
    isAdmin: false,
    isVerified: true
  }
];

export const samplePosts: Post[] = [
  {
    id: '1',
    title: 'Nothing Phone (2a) Review: The Mid-Range Champion',
    content: 'After using the Nothing Phone (2a) for two weeks, here\'s my comprehensive review of this unique mid-range device that\'s shaking up the smartphone market...',
    author: sampleUsers[0],
    category: 'reviews',
    tags: ['nothing', 'smartphone', 'review'],
    likes: 234,
    comments: 67,
    views: 1240,
    publishedAt: '2h',
    isHot: true
  },
  {
    id: '2',
    title: 'Nothing OS 2.5 Update Rolling Out',
    content: 'The latest Nothing OS update brings new features including improved Glyph Interface customization, better battery optimization, and enhanced camera performance...',
    author: sampleUsers[1],
    category: 'updates',
    tags: ['nothing-os', 'update', 'features'],
    likes: 156,
    comments: 43,
    views: 890,
    publishedAt: '4h',
    isPinned: true
  },
  {
    id: '3',
    title: 'Quick Gist: Custom Glyph Patterns',
    content: 'Here\'s a quick code snippet to create custom Glyph patterns for your Nothing device using the developer API...',
    author: sampleUsers[2],
    category: 'gists',
    tags: ['glyph', 'api', 'development'],
    likes: 89,
    comments: 23,
    views: 567,
    publishedAt: '6h'
  },
  {
    id: '4',
    title: 'Hot Take: Nothing is Overrated',
    content: 'Unpopular opinion: Nothing phones are just marketing hype with mediocre specs. Change my mind...',
    author: sampleUsers[3],
    category: 'banter',
    tags: ['opinion', 'debate', 'controversial'],
    likes: 45,
    comments: 128,
    views: 2340,
    publishedAt: '8h'
  },
  {
    id: '5',
    title: 'Nothing Ear (2) vs AirPods Pro: Sound Quality Comparison',
    content: 'A detailed comparison of audio quality, ANC performance, and overall value between Nothing\'s latest earbuds and Apple\'s flagship...',
    author: sampleUsers[4],
    category: 'tech',
    tags: ['audio', 'comparison', 'earbuds'],
    likes: 178,
    comments: 56,
    views: 1450,
    publishedAt: '12h'
  }
];

export const categories: Category[] = [
  { id: 'all', name: 'All', count: 1247 },
  { id: 'general', name: 'General', count: 456 },
  { id: 'tech', name: 'Tech Talk', count: 234 },
  { id: 'reviews', name: 'Reviews', count: 189 },
  { id: 'updates', name: 'Updates', count: 123 },
  { id: 'gists', name: 'Gists', count: 98 },
  { id: 'banter', name: 'Banter', count: 147 }
];

export const postCategories: PostCategory[] = [
  { id: 'general', name: 'General', description: 'General discussions and topics' },
  { id: 'tech', name: 'Tech Talk', description: 'Technology discussions and insights' },
  { id: 'reviews', name: 'Reviews', description: 'Product reviews and comparisons' },
  { id: 'updates', name: 'Updates', description: 'News and updates' },
  { id: 'gists', name: 'Gists', description: 'Code snippets and quick tips' },
  { id: 'banter', name: 'Banter', description: 'Casual conversations and debates' }
];