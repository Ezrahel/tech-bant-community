import React from 'react';
import { Home, ChevronDown } from 'lucide-react';
import { Post, Category } from '../types';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';

interface HomePageProps {
  posts: Post[];
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  posts,
  categories,
  selectedCategory,
  setSelectedCategory
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <Sidebar 
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        showCategories={true}
      />

      <main className="lg:col-span-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Home className="w-4 h-4" />
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {selectedCategory !== 'all' 
                  ? categories.find(c => c.id === selectedCategory)?.name 
                  : 'Latest Discussions'
                }
              </h2>
              <p className="text-gray-400 text-sm">
                {posts.length} posts • Updated {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm">
              <span>Sort by</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Load More */}
        {posts.length > 0 && (
          <div className="text-center mt-8">
            <button className="bg-gray-900 border border-gray-700 text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors text-sm font-medium">
              Load More Posts
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;