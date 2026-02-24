// Post detail page with Apple design philosophy
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  Eye,
  Bookmark,
  Share2,
  MoreHorizontal,
  ArrowLeft,
  Send,
  Flag,
  Shield,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { postsService } from '../services/posts';
import { commentsService } from '../services/comments';
import { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, userProfile } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (postId) {
      loadPost();
      loadComments();
    }
  }, [postId]);

  const loadPost = async () => {
    try {
      const response = await postsService.getPost(postId!);
      const convertedPost = postsService.convertToPost(response);
      setPost(convertedPost);
      setLikesCount(convertedPost.likes);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await commentsService.getComments(postId!, { limit: 50 });
      setComments(response);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await postsService.likePost(postId!);
      setLiked(!liked);
      setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await postsService.bookmarkPost(postId!);
      setBookmarked(!bookmarked);
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !isAuthenticated) return;

    setPostingComment(true);
    try {
      await commentsService.createComment(postId!, { content: commentContent.trim() });
      setCommentContent('');
      await loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setPostingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8 animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-800 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold text-white mb-4">Post not found</h2>
        <button
          onClick={() => navigate('/')}
          className="text-blue-400 hover:text-blue-300"
        >
          Go back home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Post */}
      <article className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 mb-6">
        {/* Author Header */}
        <div className="flex items-center space-x-4 mb-6">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">{post.author.name}</h3>
              {post.author.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              )}
              {post.author.isAdmin && (
                <Shield className="w-4 h-4 text-red-400" />
              )}
            </div>
            <p className="text-sm text-gray-400">{formatDate(post.publishedAt)}</p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">{post.title}</h1>

        {/* Content */}
        <div
          className="prose prose-invert max-w-none mb-6 text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className="mb-6 space-y-4">
            {post.media.map((item) => (
              <div key={item.id} className="rounded-xl overflow-hidden">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-auto max-h-96 object-cover"
                  />
                ) : (
                  <video src={item.url} controls className="w-full" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-800/50 text-gray-300 px-3 py-1.5 rounded-lg"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-800">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likesCount}</span>
            </button>

            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 transition-colors">
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">{comments.length}</span>
            </button>

            <div className="flex items-center space-x-2 text-gray-500">
              <Eye className="w-5 h-5" />
              <span className="font-medium">{post.views}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-xl transition-colors ${
                bookmarked
                  ? 'text-yellow-400 bg-yellow-500/10'
                  : 'text-gray-500 hover:text-yellow-400 hover:bg-gray-800/50'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 text-gray-500 hover:text-white hover:bg-gray-800/50 rounded-xl transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-white hover:bg-gray-800/50 rounded-xl transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6">
          Comments ({comments.length})
        </h2>

        {/* Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <div className="flex items-start space-x-4">
              <img
                src={userProfile?.avatar || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop'}
                alt="Your avatar"
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  maxLength={10000}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">{commentContent.length}/10000</p>
                  <button
                    type="submit"
                    disabled={!commentContent.trim() || postingComment}
                    className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span>{postingComment ? 'Posting...' : 'Post'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-gray-800/30 rounded-xl text-center">
            <p className="text-gray-400 text-sm mb-3">
              Please sign in to leave a comment
            </p>
            <button
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Sign in
            </button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-4">
                <img
                  src={comment.author?.avatar || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop'}
                  alt={comment.author?.name}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-white text-sm">
                      {comment.author?.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-2">
                    {comment.content}
                  </p>
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-red-400 transition-colors text-xs">
                      <Heart className="w-3 h-3" />
                      <span>{comment.likes || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;

