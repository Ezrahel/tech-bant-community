import React from 'react';
import { Users, MessageSquare, TrendingUp, Shield } from 'lucide-react';
import { Category } from '../types';

interface SidebarProps {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  showCategories?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  showCategories = true
}) => {
  return (
    <aside className="lg:col-span-1">
      {/* Categories */}
      {showCategories && (
        <div className="bg-gray-900/50 rounded-2xl p-6 mb-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Categories</h3>
          <nav className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all duration-200 text-sm ${
                  selectedCategory === category.id
                    ? 'bg-white text-black font-medium'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{category.name}</span>
                <span className="text-xs text-gray-500">{category.count}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Stats */}
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Community Stats</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">Members</span>
            </div>
            <span className="text-sm font-medium">24.7k</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Posts</span>
            </div>
            <span className="text-sm font-medium">1.2k</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">Online</span>
            </div>
            <span className="text-sm font-medium">847</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-300">Admins</span>
            </div>
            <span className="text-sm font-medium">12</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;