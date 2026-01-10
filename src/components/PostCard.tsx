// Post card component with Apple design philosophy
import React, { useState } from 'react';
import { Heart, MessageSquare, Eye, Bookmark, Share2, MoreHorizontal, Flame, Shield, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Post } from '../types';
import { postsService } from '../services/posts';
import { useAuth } from '../contexts/AuthContext';

interface PostCardProps {
  post: Post;
  onClick?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [loading, setLoading] = useState(false);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'text-gray-400 bg-gray-800/50',
      tech: 'text-blue-400 bg-blue-500/10',
      reviews: 'text-purple-400 bg-purple-500/10',
      updates: 'text-green-400 bg-green-500/10',
      gists: 'text-orange-400 bg-orange-500/10',
      banter: 'text-pink-400 bg-pink-500/10',
    };
    return colors[category] || colors.general;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (days > 0) {
      return `${days}d ago`;
    }
    if (hours > 0) {
      return `${hours}h ago`;
    }
    if (minutes > 0) {
      return `${minutes}m ago`;
    }
    return 'Just now';
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      await postsService.likePost(post.id);
      setLiked(!liked);
      setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      await postsService.bookmarkPost(post.id);
      setBookmarked(!bookmarked);
    } catch (error) {
      console.error('Error bookmarking post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/posts/${post.id}`);
    }
  };

  return (
    <article
      onClick={handleClick}
      className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:bg-gray-900/50 hover:border-gray-700/50 transition-all duration-300 group cursor-pointer"
    >
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-11 h-11 rounded-full object-cover border-2 border-gray-800"
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
          <div className="flex items-center flex-wrap gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white text-sm">{post.author.name}</span>
              {post.author.isVerified && !post.author.isAdmin && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              {post.author.isAdmin && (
                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                  Admin
                </span>
              )}
            </div>
            <span className="text-gray-500 text-xs">•</span>
            <span className="text-gray-500 text-xs">{formatDate(post.publishedAt)}</span>
            <span
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wide ${getCategoryColor(
                post.category
              )}`}
            >
              {post.category}
            </span>
            {post.isPinned && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 font-medium">
                Pinned
              </span>
            )}
            {post.isHot && (
              <div className="flex items-center space-x-1 text-orange-400">
                <Flame className="w-3 h-3" />
                <span className="text-[10px] font-medium">Hot</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gray-200 transition-colors line-clamp-2">
            {post.title}
          </h3>

          {/* Content Preview */}
          <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
            {post.content.replace(/<[^>]*>/g, '')}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to tag search
                  }}
                  className="text-xs bg-gray-800/50 text-gray-300 px-2.5 py-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > 5 && (
                <span className="text-xs text-gray-500 px-2.5 py-1">
                  +{post.tags.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Media Preview */}
          {post.media && post.media.length > 0 && (
            <div className="mb-4 rounded-xl overflow-hidden">
              {post.media[0].type === 'image' ? (
                <img
                  src={post.media[0].url}
                  alt={post.media[0].name}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Video content</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                disabled={loading}
                className={`flex items-center space-x-2 transition-colors ${
                  liked
                    ? 'text-red-400'
                    : 'text-gray-500 hover:text-red-400'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{formatNumber(likesCount)}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">{formatNumber(post.comments)}</span>
              </button>

              <div className="flex items-center space-x-2 text-gray-500">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">{formatNumber(post.views)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleBookmark}
                disabled={loading}
                className={`p-2 rounded-xl transition-colors ${
                  bookmarked
                    ? 'text-yellow-400 bg-yellow-500/10'
                    : 'text-gray-500 hover:text-yellow-400 hover:bg-gray-800/50'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Share functionality
                }}
                className="p-2 text-gray-500 hover:text-white hover:bg-gray-800/50 rounded-xl transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // More menu
                }}
                className="p-2 text-gray-500 hover:text-white hover:bg-gray-800/50 rounded-xl transition-colors"
              >
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
