// Post card component with Apple design philosophy
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart as faHeartSolid,
  faComment,
  faEye,
  faBookmark as faBookmarkSolid,
  faFire,
  faShieldAlt,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import {
  faHeart as faHeartRegular,
  faBookmark as faBookmarkRegular
} from '@fortawesome/free-regular-svg-icons';
import { useNavigate } from 'react-router-dom';
import { Post } from '../types';
import { postsService } from '../services/posts';
import { useAuth } from '../contexts/AuthContext';
import ShareMenu from './ShareMenu';
import ManagementMenu from './ManagementMenu';
import ImageCollage from './ImageCollage';

interface PostCardProps {
  post: Post;
  onClick?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const navigate = useNavigate();
  const { isAuthenticated, userProfile } = useAuth();
  const [liked, setLiked] = useState(post.isLiked || false);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked || false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [sharesCount, setSharesCount] = useState(post.shares || 0);
  const [loading, setLoading] = useState(false);

  const getCategoryColor = (category: string) => {
    return 'text-gray-300 bg-gray-800/50';
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
      return;
    }

    // Optimistic update
    const newLiked = !liked;
    const newCount = newLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    setLiked(newLiked);
    setLikesCount(newCount);

    try {
      await postsService.likePost(post.id);
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert on error
      setLiked(!newLiked);
      setLikesCount(likesCount);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      return;
    }

    // Optimistic update
    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);

    try {
      await postsService.bookmarkPost(post.id);
    } catch (error) {
      console.error('Error bookmarking post:', error);
      // Revert on error
      setBookmarked(!newBookmarked);
    }
  };

  const handleShare = async () => {
    try {
      setSharesCount(prev => prev + 1);
      await postsService.sharePost(post.id);
    } catch (error) {
      console.error('Error sharing post:', error);
      setSharesCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleDelete = async () => {
    try {
      await postsService.deletePost(post.id);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/posts/${post.id}?edit=true`);
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
      className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 sm:p-6 hover:bg-gray-900/60 hover:border-gray-700/50 transition-all duration-300 group cursor-pointer shadow-apple-sm"
    >
      <div className="flex items-start space-x-3 sm:space-x-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-gray-800 shadow-apple-sm"
          />
          {post.author.isAdmin && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gray-600 rounded-full flex items-center justify-center border-2 border-black">
              <FontAwesomeIcon icon={faShieldAlt} className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-bold text-white text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{post.author.name}</span>
              {post.author.isVerified && !post.author.isAdmin && (
                <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5 text-gray-400" />
              )}
              {post.author.isAdmin && (
                <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
            <span className="text-gray-600 text-[10px] sm:text-xs">•</span>
            <span className="text-gray-500 text-[10px] sm:text-xs font-medium">{formatDate(post.publishedAt)}</span>
            <span
              className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getCategoryColor(
                post.category
              )}`}
            >
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-white transition-colors line-clamp-2 leading-tight">
            {post.title}
          </h3>

          {/* Content Preview */}
          <p className="text-gray-400 text-xs sm:text-sm mb-4 line-clamp-2 sm:line-clamp-3 leading-relaxed font-medium">
            {post.content.replace(/<[^>]*>/g, '')}
          </p>

          {/* Media Collage */}
          {post.media && post.media.length > 0 && (
            <div className="mb-4">
              <ImageCollage media={post.media} />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-800/50">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                onClick={handleLike}
                disabled={loading || !isAuthenticated}
                title={isAuthenticated ? 'Like post' : 'Sign in to like posts'}
                className={`flex items-center space-x-1.5 sm:space-x-2 transition-all ${liked
                  ? 'text-white'
                  : isAuthenticated
                    ? 'text-gray-500 hover:text-white'
                    : 'text-gray-600 cursor-not-allowed'
                  }`}
              >
                <FontAwesomeIcon icon={liked ? faHeartSolid : faHeartRegular} className={`w-3.5 h-3.5 sm:w-4 sm:h-4`} />
                <span className="text-xs sm:text-sm font-bold">{formatNumber(likesCount)}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="flex items-center space-x-1.5 sm:space-x-2 text-gray-500 hover:text-white transition-all font-medium"
              >
                <FontAwesomeIcon icon={faComment} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-bold">{formatNumber(post.comments)}</span>
              </button>

              <div className="flex items-center space-x-1.5 sm:space-x-2 text-gray-500">
                <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-bold">{formatNumber(post.views)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={handleBookmark}
                disabled={loading || !isAuthenticated}
                title={isAuthenticated ? 'Bookmark post' : 'Sign in to save posts'}
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${bookmarked
                  ? 'text-white bg-gray-800'
                  : isAuthenticated
                    ? 'text-gray-500 hover:text-white hover:bg-gray-800/50'
                    : 'text-gray-600 cursor-not-allowed'
                  }`}
              >
                <FontAwesomeIcon icon={bookmarked ? faBookmarkSolid : faBookmarkRegular} className={`w-3.5 h-3.5 sm:w-4 sm:h-4`} />
              </button>

              <ShareMenu
                url={window.location.origin + `/posts/${post.id}`}
                title={post.title}
                sharesCount={sharesCount}
                onShareSuccess={handleShare}
              />

              <ManagementMenu
                isOwner={post.author.id === userProfile?.id}
                isAdmin={userProfile?.role === 'admin' || userProfile?.role === 'super_admin'}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
