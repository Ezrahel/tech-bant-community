// Home page with Apple design philosophy
import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, ChevronDown, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import { postsService } from '../services/posts';
import { Post, Category } from '../types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'trending' | 'hot'>('latest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const categories: Category[] = [
    { id: 'all', name: 'All', count: 0 },
    { id: 'general', name: 'General', count: 0 },
    { id: 'tech', name: 'Tech', count: 0 },
    { id: 'reviews', name: 'Reviews', count: 0 },
    { id: 'updates', name: 'Updates', count: 0 },
    { id: 'gists', name: 'Gists', count: 0 },
    { id: 'banter', name: 'Banter', count: 0 },
  ];

  useEffect(() => {
    loadPosts();
  }, [selectedCategory, sortBy]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit,
        offset: 0,
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      const response = await postsService.getPosts(params);
      const convertedPosts = response.map((p) => postsService.convertToPost(p));
      setPosts(convertedPosts);
      setOffset(convertedPosts.length);
      setHasMore(convertedPosts.length === limit);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;

    try {
      const params: any = {
        limit,
        offset,
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      const response = await postsService.getPosts(params);
      const convertedPosts = response.map((p) => postsService.convertToPost(p));
      setPosts((prev) => [...prev, ...convertedPosts]);
      setOffset((prev) => prev + convertedPosts.length);
      setHasMore(convertedPosts.length === limit);
    } catch (error) {
      console.error('Error loading more posts:', error);
    }
  };

  const sortOptions = [
    { id: 'latest', label: 'Latest', icon: HomeIcon },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'hot', label: 'Hot', icon: Sparkles },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <Sidebar
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            showCategories={true}
          />
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HomeIcon className="w-5 h-5 text-gray-400" />
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {selectedCategory !== 'all'
                    ? categories.find((c) => c.id === selectedCategory)?.name
                    : 'Latest Discussions'}
                </h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                </p>
              </div>
            </div>

            {/* Sort Menu */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-900 transition-colors"
              >
                <span>
                  {sortOptions.find((s) => s.id === sortBy)?.label || 'Sort by'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>

              {showSortMenu && (
                <>
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-apple-lg z-50 overflow-hidden">
                    {sortOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSortBy(option.id as any);
                            setShowSortMenu(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                            sortBy === option.id
                              ? 'bg-gray-800/50 text-white'
                              : 'text-gray-300 hover:bg-gray-800/30'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSortMenu(false)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Posts */}
          {loading && posts.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 animate-pulse"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-800 rounded w-full"></div>
                      <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <HomeIcon className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
              <p className="text-gray-400 text-sm mb-6">
                Be the first to share something with the community
              </p>
              <button
                onClick={() => navigate('/new-post')}
                className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all"
              >
                Create Post
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => navigate(`/posts/${post.id}`)}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center pt-8">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="bg-gray-900/50 border border-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-900 active:scale-[0.98] transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Load More Posts'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default HomePage;
