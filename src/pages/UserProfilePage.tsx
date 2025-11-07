import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, MapPin, Globe, Calendar, User, Settings, ArrowLeft, Camera, Save, X, Heart, Image, MessageSquare, MoreHorizontal, Share2, Eye, ThumbsUp } from 'lucide-react';
import { userService, UpdateProfileData } from '../services/user';
import { postsService } from '../services/posts';
import { UserProfile } from '../services/user';
import { Post } from '../types';
import PostCard from '../components/PostCard';

type TabType = 'posts' | 'likes' | 'media' | 'settings';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userLikes, setUserLikes] = useState<Post[]>([]);
  const [userMedia, setUserMedia] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Form state for editing
  const [editForm, setEditForm] = useState<UpdateProfileData>({
    name: '',
    bio: '',
    location: '',
    website: '',
    avatar: ''
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let userProfile: UserProfile | null;
      
      if (userId) {
        // Viewing another user's profile
        console.log('Loading profile for user ID:', userId);
        userProfile = await userService.getUserProfile(userId);
        setIsCurrentUser(false);
      } else {
        // Viewing own profile
        console.log('Loading current user profile');
        userProfile = await userService.getCurrentUserProfile();
        setIsCurrentUser(true);
      }

      console.log('User profile loaded:', userProfile);

      if (userProfile) {
        setProfile(userProfile);
        setEditForm({
          name: userProfile.name,
          bio: userProfile.bio || '',
          location: userProfile.location || '',
          website: userProfile.website || '',
          avatar: userProfile.avatar
        });

        // Load user posts
        try {
          const posts = await userService.getUserPosts(userProfile.id);
          const mappedPosts: Post[] = posts.map((doc: any) => ({
            id: doc.$id,
            title: doc.title,
            content: doc.content,
            author: {
              id: doc.author_id,
              name: doc.author_name,
              avatar: doc.author_avatar,
              isAdmin: doc.author_admin,
              isVerified: doc.author_verified
            },
            category: doc.category,
            tags: doc.tags || [],
            likes: doc.likes_count || 0,
            comments: doc.comments_count || 0,
            views: doc.views || 0,
            publishedAt: doc.$createdAt,
            isPinned: doc.is_pinned || false,
            isHot: doc.is_hot || false
          }));
          setUserPosts(mappedPosts);
        } catch (postsError) {
          console.error('Failed to load user posts:', postsError);
          setUserPosts([]);
        }

        // Load user media (placeholder - would need backend implementation)
        setUserMedia([]);
        
        // Load user likes (placeholder - would need backend implementation)
        setUserLikes([]);
      } else {
        setError('Profile not found. Please try logging out and logging back in.');
      }
    } catch (error) {
      console.error('Load profile error:', error);
      setError(`Failed to load profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setError(null);
      setSuccess(null);

      const updatedProfile = await userService.updateProfile(editForm);
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Update profile error:', error);
      setError('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        avatar: profile.avatar
      });
    }
    setIsEditing(false);
  };

  const handleFollow = () => {
    // TODO: Implement follow functionality
    console.log('Follow user');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile?.name}'s Profile`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setSuccess('Profile link copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="space-y-6">
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No posts yet</p>
                {isCurrentUser && (
                  <button
                    onClick={() => navigate('/new-post')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-full transition-colors"
                  >
                    Create Your First Post
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case 'likes':
        return (
          <div className="space-y-6">
            {userLikes.length > 0 ? (
              userLikes.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No liked posts yet</p>
              </div>
            )}
          </div>
        );

      case 'media':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userMedia.length > 0 ? (
              userMedia.map((media, index) => (
                <div key={index} className="aspect-square bg-gray-800 rounded-xl overflow-hidden">
                  <img 
                    src={media.url} 
                    alt={media.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Image className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No media uploaded yet</p>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email Notifications
                  </label>
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="email-notifications" className="rounded" />
                    <label htmlFor="email-notifications" className="text-sm text-gray-300">
                      Receive email notifications
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Privacy
                  </label>
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="private-profile" className="rounded" />
                    <label htmlFor="private-profile" className="text-sm text-gray-300">
                      Private profile
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
              <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-sm">
                Delete Account
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 bg-black rounded-full"></div>
          </div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Profile not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900/30 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">
                  {isCurrentUser ? 'Your Profile' : `${profile.name}'s Profile`}
                </h1>
                <p className="text-gray-400 text-sm">
                  {isCurrentUser ? 'Manage your profile and posts' : 'View profile and posts'}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                title="Share profile"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              {!isCurrentUser && (
                <button
                  onClick={handleFollow}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  Follow
                </button>
              )}
              
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50">
                    <div className="p-1">
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                        Report User
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                        Block User
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-xl text-green-400">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden mb-6">
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative">
            {isCurrentUser && (
              <button className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-32 h-32 rounded-full border-4 border-gray-900"
              />
              {isCurrentUser && (
                <button className="absolute bottom-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-full transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              {isEditing ? (
                // Edit Form
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Display Profile
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{profile.name}</h2>
                      <div className="flex items-center space-x-2 mt-1">
                        {profile.isVerified && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700">
                            ✓ Verified
                          </span>
                        )}
                        {profile.isAdmin && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-400 border border-purple-700">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                    {isCurrentUser && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="text-gray-300">{profile.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {profile.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center space-x-1">
                        <Globe className="w-4 h-4" />
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {profile.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(profile.join_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex space-x-6 pt-4 border-t border-gray-800">
                    <div className="text-center">
                      <div className="text-xl font-bold">{profile.posts_count}</div>
                      <div className="text-sm text-gray-400">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">{profile.followers_count}</div>
                      <div className="text-sm text-gray-400">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">{profile.following_count}</div>
                      <div className="text-sm text-gray-400">Following</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="border-b border-gray-800">
            <div className="flex">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'posts' 
                    ? 'text-white border-b-2 border-blue-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Posts ({userPosts.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('likes')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'likes' 
                    ? 'text-white border-b-2 border-blue-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>Likes ({userLikes.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'media' 
                    ? 'text-white border-b-2 border-blue-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Image className="w-4 h-4" />
                  <span>Media ({userMedia.length})</span>
                </div>
              </button>
              {isCurrentUser && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'settings' 
                      ? 'text-white border-b-2 border-blue-500' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </div>
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      {/* Click outside to close menu */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </div>
  );
};

export default UserProfilePage; 