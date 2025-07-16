import React from 'react';
import { Heart, MessageSquare, Eye, Bookmark, Share2, MoreHorizontal, Flame, Shield } from 'lucide-react';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const getCategoryColor = (category: string) => {
    const colors = {
      general: 'text-gray-400',
      tech: 'text-blue-400',
      reviews: 'text-purple-400',
      updates: 'text-green-400',
      gists: 'text-orange-400',
      banter: 'text-pink-400'
    };
    return colors[category as keyof typeof colors] || 'text-gray-400';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <article className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 hover:bg-gray-900/50 transition-all duration-300 group">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="relative">
          <img 
            src={post.author.avatar} 
            alt={post.author.name} 
            className="w-10 h-10 rounded-full flex-shrink-0"
          />
          {post.author.isAdmin && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-black">
              <Shield className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center space-x-1">
              <span className="font-medium text-white">{post.author.name}</span>
              {post.author.isAdmin && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
                  ADMIN
                </span>
              )}
              {post.author.isVerified && !post.author.isAdmin && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <span className="text-gray-500 text-sm">•</span>
            <span className="text-gray-500 text-sm">{post.publishedAt}</span>
            <span className={`text-xs px-2 py-1 rounded-full bg-gray-800 ${getCategoryColor(post.category)}`}>
              {post.category}
            </span>
            {post.isPinned && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-400">
                Pinned
              </span>
            )}
            {post.isHot && (
              <div className="flex items-center space-x-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-xs text-orange-400">Hot</span>
              </div>
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gray-200 transition-colors cursor-pointer">
            {post.title}
          </h3>
          
          {/* Content Preview */}
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {post.content}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md hover:bg-gray-700 cursor-pointer transition-colors">
                #{tag}
              </span>
            ))}
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button className="flex items-center space-x-2 text-gray-500 hover:text-red-400 transition-colors group">
                <Heart className="w-4 h-4 group-hover:fill-current" />
                <span className="text-sm">{formatNumber(post.likes)}</span>
              </button>
              
              <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">{post.comments}</span>
              </button>
              
              <div className="flex items-center space-x-2 text-gray-500">
                <Eye className="w-4 h-4" />
                <span className="text-sm">{formatNumber(post.views)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-white transition-colors">
                <Bookmark className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-500 hover:text-white transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-500 hover:text-white transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;