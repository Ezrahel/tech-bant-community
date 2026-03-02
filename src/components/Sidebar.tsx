import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faComment, faChartLine, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
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
    <aside className="lg:col-span-1 space-y-6">
      {/* Categories */}
      {showCategories && (
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 shadow-apple-sm">
          <h3 className="text-lg font-semibold mb-4 text-white">Categories</h3>
          <nav className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 -mr-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-300 text-sm ${selectedCategory === category.id
                  ? 'bg-white text-black font-semibold shadow-apple-sm scale-[1.02]'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
              >
                <span className="truncate mr-2">{category.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedCategory === category.id
                  ? 'bg-black/10 text-black'
                  : 'bg-gray-800 text-gray-500'
                  }`}>
                  {category.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Stats */}
      <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 shadow-apple-sm">
        <h3 className="text-lg font-semibold mb-4 text-white">Community</h3>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-800/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold">Members</span>
                <span className="text-sm font-semibold text-white">24.7k</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-800/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <FontAwesomeIcon icon={faComment} className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold">Posts</span>
                <span className="text-sm font-semibold text-white">1.2k</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-800/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <FontAwesomeIcon icon={faChartLine} className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold">Online</span>
                <span className="text-sm font-semibold text-white">847</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-800/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold">Admins</span>
                <span className="text-sm font-semibold text-white">12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;