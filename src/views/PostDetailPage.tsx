// Post detail page with Apple design philosophy
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart as faHeartSolid,
  faComment,
  faEye,
  faBookmark as faBookmarkSolid,
  faArrowLeft,
  faPaperPlane,
  faFlag,
  faShieldAlt,
  faCheckCircle,
  faFire
} from '@fortawesome/free-solid-svg-icons';
import {
  faHeart as faHeartRegular,
  faBookmark as faBookmarkRegular
} from '@fortawesome/free-regular-svg-icons';
import { postsService } from '../services/posts';
import { commentsService } from '../services/comments';
import { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ShareMenu from '../components/ShareMenu';
import ManagementMenu from '../components/ManagementMenu';
import ImageCollage from '../components/ImageCollage';

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
  const [sharesCount, setSharesCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

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
      setEditTitle(convertedPost.title);
      setEditContent(convertedPost.content);
      setLiked(convertedPost.isLiked || false);
      setBookmarked(convertedPost.isBookmarked || false);
      setLikesCount(convertedPost.likes);
      setSharesCount(convertedPost.shares || 0);
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
      return;
    }

    const newLiked = !liked;
    const newCount = newLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    setLiked(newLiked);
    setLikesCount(newCount);

    try {
      await postsService.likePost(postId!);
    } catch (error) {
      console.error('Error liking post:', error);
      setLiked(!newLiked);
      setLikesCount(likesCount);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      return;
    }

    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);

    try {
      await postsService.bookmarkPost(postId!);
    } catch (error) {
      console.error('Error bookmarking post:', error);
      setBookmarked(!newBookmarked);
    }
  };

  const handleShare = async () => {
    try {
      setSharesCount(prev => prev + 1);
      await postsService.sharePost(post!.id);
    } catch (error) {
      console.error('Error sharing post:', error);
      setSharesCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleDelete = async () => {
    try {
      await postsService.deletePost(postId!);
      navigate('/');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    setLoading(true);
    try {
      const response = await postsService.updatePost(postId!, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setPost(postsService.convertToPost(response));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setLoading(false);
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

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsService.deleteComment(commentId);
      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return;
    try {
      await commentsService.updateComment(commentId, { content: editCommentContent.trim() });
      setEditingCommentId(null);
      await loadComments();
    } catch (error) {
      console.error('Error updating comment:', error);
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
    <div className="max-w-4xl mx-auto px-0 sm:px-4 py-0 sm:py-8">
      {/* Back Button */}
      <div className="px-4 sm:px-0 pt-4 sm:pt-0 mb-4 sm:mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Post */}
      <article className="bg-gray-900/50 backdrop-blur-xl border-y sm:border border-gray-800 sm:rounded-2xl p-4 sm:p-8 mb-4 sm:mb-6">
        {/* Author Header */}
        <div className="mb-4 flex items-start gap-3 sm:mb-6 sm:gap-4">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 sm:w-12 sm:w-12 rounded-full ring-2 ring-gray-800"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="truncate font-semibold text-white text-sm sm:text-base">{post.author.name}</h3>
                  {post.author.isVerified && (
                    <FontAwesomeIcon icon={faCheckCircle} className="h-3.5 w-3.5 shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                  )}
                  {post.author.isAdmin && (
                    <FontAwesomeIcon icon={faShieldAlt} className="h-3.5 w-3.5 shrink-0 text-gray-500 sm:h-4 sm:w-4" />
                  )}
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-[0.14em] sm:text-right leading-4 sm:leading-5">
                {formatDate(post.publishedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Title & Content */}
        {isEditing ? (
          <div className="space-y-4 mb-6">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Post title"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              placeholder="What's on your mind?"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={!editTitle.trim() || !editContent.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 leading-tight">{post.title}</h1>
            <div className="prose prose-invert max-w-none mb-6 text-gray-300 leading-relaxed text-sm sm:text-base whitespace-pre-wrap break-words">
              {post.content}
            </div>
          </>
        )}

        {/* Media Collage */}
        {post.media && post.media.length > 0 && (
          <div className="mb-6">
            <ImageCollage media={post.media} />
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] sm:text-xs bg-gray-800/50 text-gray-400 px-2.5 py-1 rounded-lg border border-gray-700/50"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-gray-800/50">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <button
              onClick={handleLike}
              disabled={!isAuthenticated}
              title={isAuthenticated ? 'Like post' : 'Sign in to like posts'}
              className={`flex items-center space-x-1.5 sm:space-x-2 transition-colors ${
                liked ? 'text-white' : isAuthenticated ? 'text-gray-500 hover:text-white' : 'text-gray-600 cursor-not-allowed'
                }`}
            >
              <FontAwesomeIcon icon={liked ? faHeartSolid : faHeartRegular} className={`w-4 h-4 sm:w-5 sm:h-5`} />
              <span className="font-semibold text-xs sm:text-sm">{likesCount}</span>
            </button>

            <button className="flex items-center space-x-1.5 sm:space-x-2 text-gray-500 hover:text-white transition-colors">
              <FontAwesomeIcon icon={faComment} className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold text-xs sm:text-sm">{comments.length}</span>
            </button>

            <div className="flex items-center space-x-1.5 sm:space-x-2 text-gray-500">
              <FontAwesomeIcon icon={faEye} className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold text-xs sm:text-sm">{post.views}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={handleBookmark}
              disabled={!isAuthenticated}
              title={isAuthenticated ? 'Save post' : 'Sign in to save posts'}
              className={`p-1.5 sm:p-2 rounded-xl transition-colors ${bookmarked
                ? 'text-white bg-gray-800'
                : isAuthenticated
                  ? 'text-gray-500 hover:text-white hover:bg-gray-800/50'
                  : 'text-gray-600 cursor-not-allowed'
                }`}
            >
              <FontAwesomeIcon icon={bookmarked ? faBookmarkSolid : faBookmarkRegular} className={`w-4 h-4 sm:w-5 sm:h-5`} />
            </button>

            <ShareMenu
              url={window.location.href}
              title={post.title}
              sharesCount={sharesCount}
              onShareSuccess={handleShare}
            />

            <ManagementMenu
              isOwner={post.author.id === userProfile?.id}
              isAdmin={userProfile?.role === 'admin' || userProfile?.role === 'super_admin'}
              onEdit={() => setIsEditing(true)}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div className="bg-gray-900/50 backdrop-blur-xl border-y sm:border border-gray-800 sm:rounded-2xl p-4 sm:p-8">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-6">
          Comments <span className="text-gray-500 ml-1">({comments.length})</span>
        </h2>

        {!isAuthenticated && (
          <div className="mb-6 rounded-2xl border border-gray-800/60 bg-gray-800/20 px-4 py-3 text-sm text-gray-400">
            Visitors can read every comment and share this post. Sign in to post, like, bookmark, or comment.
          </div>
        )}

        {/* Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <img
                src={userProfile?.avatar || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop'}
                alt="Your avatar"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{commentContent.length} chars</p>
                  <button
                    type="submit"
                    disabled={!commentContent.trim() || postingComment}
                    className="flex items-center space-x-2 bg-white text-black px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} className="w-3.5 h-3.5" />
                    <span>{postingComment ? 'Posting...' : 'Post'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-6 bg-gray-800/30 rounded-2xl text-center border border-gray-800/50">
            <p className="text-gray-400 text-sm mb-4">
              Join the discussion to leave a comment
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-gray-800 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all border border-gray-700"
            >
              Sign in
            </button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faComment} className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm">No comments yet. Be the first to reply!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3 sm:space-x-4">
                <img
                  src={comment.author?.avatar || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop'}
                  alt={comment.author?.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 border border-gray-800"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-white text-xs sm:text-sm">
                      {comment.author?.name}
                    </span>
                    <span className="text-[10px] text-gray-600 uppercase">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <div className="bg-gray-800/30 rounded-2xl rounded-tl-none p-3 border border-gray-800/50">
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          rows={2}
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="text-[10px] text-gray-500 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateComment(comment.id)}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {comment.content}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 ml-1">
                    <div className="flex items-center space-x-4">
                      <button
                        disabled
                        title="Comment reactions are available for signed-in members"
                        className="flex items-center space-x-1 text-gray-600 cursor-not-allowed text-[10px] font-bold"
                      >
                        <FontAwesomeIcon icon={faHeartRegular} className="w-3 h-3" />
                        <span>{comment.likes || 0}</span>
                      </button>
                      <button
                        disabled
                        title="Replies are available for signed-in members"
                        className="text-gray-600 cursor-not-allowed text-[10px] font-bold uppercase tracking-widest"
                      >
                        Reply
                      </button>
                    </div>

                    <ManagementMenu
                      isOwner={comment.author?.id === userProfile?.id}
                      isAdmin={userProfile?.role === 'admin' || userProfile?.role === 'super_admin'}
                      onEdit={() => {
                        setEditingCommentId(comment.id);
                        setEditCommentContent(comment.content);
                      }}
                      onDelete={() => handleDeleteComment(comment.id)}
                    />
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
