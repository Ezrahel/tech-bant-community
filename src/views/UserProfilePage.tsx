// User profile page with Apple design philosophy
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Edit3,
  MapPin,
  Globe,
  Calendar,
  Settings,
  ArrowLeft,
  Camera,
  Save,
  X,
  Heart,
  Image,
  MessageSquare,
  MoreHorizontal,
  Share2,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { userService, UpdateProfileData } from '../services/user';
import { postsService } from '../services/posts';
import { UserProfile } from '../services/user';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import { useAuth } from '../contexts/AuthContext';

type TabType = 'posts' | 'likes' | 'media' | 'settings';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { userProfile: currentUserProfile, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isCurrentUser = !userId || userId === currentUserProfile?.id;

  const [editForm, setEditForm] = useState<UpdateProfileData>({
    name: '',
    bio: '',
    location: '',
    website: '',
    avatar: '',
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      let userProfile: UserProfile | null;

      if (userId && !isCurrentUser) {
        userProfile = await userService.getUser(userId);
      } else {
        userProfile = await userService.getCurrentUser();
      }

      if (userProfile) {
        setProfile(userProfile);
        setEditForm({
          name: userProfile.name,
          bio: userProfile.bio || '',
          location: userProfile.location || '',
          website: userProfile.website || '',
          avatar: userProfile.avatar,
        });

        // Load user posts
        try {
          const posts = await userService.getUserPosts(userProfile.id);
          const convertedPosts = posts.map((p: any) => postsService.convertToPost(p));
          setUserPosts(convertedPosts);
        } catch (postsError) {
          console.error('Failed to load user posts:', postsError);
          setUserPosts([]);
        }
      } else {
        setError('Profile not found');
      }
    } catch (err: any) {
      console.error('Load profile error:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!isCurrentUser) return;

    try {
      setError(null);
      setSuccess(null);

      const updatedProfile = await userService.updateProfile(editForm);
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        avatar: profile.avatar,
      });
    }
    setIsEditing(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Error</h2>
          <p className="text-gray-400">{error || 'Profile not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden mb-6">
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 relative">
            {isCurrentUser && (
              <button className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-xl transition-colors">
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
                className="w-32 h-32 rounded-full border-4 border-black"
              />
              {isCurrentUser && (
                <button className="absolute bottom-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-full transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              {isEditing && isCurrentUser ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      maxLength={100}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {editForm.bio?.length || 0}/500
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      maxLength={100}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center space-x-2 bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 active:scale-[0.98] transition-all"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                        {profile.isVerified && (
                          <CheckCircle2 className="w-5 h-5 text-blue-400" />
                        )}
                        {profile.isAdmin && (
                          <Shield className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        {profile.isVerified && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full font-medium">
                            Verified
                          </span>
                        )}
                        {profile.isAdmin && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                    {isCurrentUser && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2.5 rounded-xl hover:bg-gray-700 active:scale-[0.98] transition-all text-sm font-medium"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="text-gray-300 leading-relaxed">{profile.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {profile.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {profile.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {formatDate(profile.join_date)}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex space-x-8 pt-4 border-t border-gray-800">
                    <div>
                      <div className="text-2xl font-bold text-white">{profile.posts_count || 0}</div>
                      <div className="text-sm text-gray-400">Posts</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {profile.followers_count || 0}
                      </div>
                      <div className="text-sm text-gray-400">Followers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {profile.following_count || 0}
                      </div>
                      <div className="text-sm text-gray-400">Following</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden">
          <div className="border-b border-gray-800">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
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
              {isCurrentUser && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
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
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {userPosts.length > 0 ? (
                  userPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No posts yet</p>
                    {isCurrentUser && (
                      <button
                        onClick={() => navigate('/new-post')}
                        className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all"
                      >
                        Create Your First Post
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && isCurrentUser && (
              <div className="space-y-6">
                <div className="bg-gray-800/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Email Notifications</p>
                        <p className="text-xs text-gray-400">Receive email notifications</p>
                      </div>
                      <input type="checkbox" className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Private Profile</p>
                        <p className="text-xs text-gray-400">Make your profile private</p>
                      </div>
                      <input type="checkbox" className="rounded" />
                    </div>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
                  <button className="bg-red-500 text-white px-4 py-2.5 rounded-xl hover:bg-red-600 active:scale-[0.98] transition-all text-sm font-medium">
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
