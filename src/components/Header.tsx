import React from 'react';
import { Search, Plus, User, Bell, Home, MessageSquare, Star, HelpCircle } from 'lucide-react';
import { PageType } from '../types';

interface HeaderProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <header className="border-b border-gray-800 sticky top-0 z-50 bg-black/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => setCurrentPage('home')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-black rounded-full"></div>
              </div>
              <h1 className="text-xl font-bold">nothing community</h1>
            </button>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => setCurrentPage('home')}
                className={`flex items-center space-x-2 transition-colors text-sm font-medium ${
                  currentPage === 'home' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              <button 
                onClick={() => setCurrentPage('discussions')}
                className={`flex items-center space-x-2 transition-colors text-sm font-medium ${
                  currentPage === 'discussions' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Discussions</span>
              </button>
              <button 
                onClick={() => setCurrentPage('reviews')}
                className={`flex items-center space-x-2 transition-colors text-sm font-medium ${
                  currentPage === 'reviews' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Reviews</span>
              </button>
              <button 
                onClick={() => setCurrentPage('support')}
                className={`flex items-center space-x-2 transition-colors text-sm font-medium ${
                  currentPage === 'support' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Support</span>
              </button>
            </nav>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-full text-sm focus:outline-none focus:border-gray-600 transition-colors"
              />
            </div>
            
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setCurrentPage('new-post')}
              className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Post</span>
            </button>
            
            <div 
              onClick={() => setCurrentPage('admin')}
              className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
            >
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;