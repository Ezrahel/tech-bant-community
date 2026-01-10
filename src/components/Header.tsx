// Header component with Apple design philosophy
import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Bell, Home, MessageSquare, Star, HelpCircle, Settings, LogOut, Shield } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState(0);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
            >
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                <div className="w-3 h-3 bg-black rounded-full"></div>
              </div>
              <h1 className="text-xl font-semibold tracking-tight">nothing community</h1>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/')
                    ? 'text-white bg-gray-900/50'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/30'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <Link
                to="/discussions"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/discussions')
                    ? 'text-white bg-gray-900/50'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/30'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Discussions</span>
              </Link>
              <Link
                to="/reviews"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/reviews')
                    ? 'text-white bg-gray-900/50'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/30'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Reviews</span>
              </Link>
              <Link
                to="/support"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/support')
                    ? 'text-white bg-gray-900/50'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/30'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Support</span>
              </Link>
            </nav>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search posts, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-11 pr-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Notifications */}
            <button 
              className="relative p-2.5 text-gray-400 hover:text-white hover:bg-gray-900/50 rounded-xl transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* New Post Button */}
            <button
              onClick={() => navigate('/new-post')}
              className="flex items-center space-x-2 bg-white text-black px-4 py-2.5 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Post</span>
            </button>
            
            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {userProfile?.avatar ? (
                  <img 
                    src={userProfile.avatar} 
                    alt={userProfile.name || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </button>
              
              {showProfileMenu && (
                <>
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-apple-xl z-50 overflow-hidden">
                    {/* User Info */}
                    <div className="p-4 border-b border-gray-800">
                      <div className="flex items-center space-x-3">
                        {userProfile?.avatar ? (
                          <img 
                            src={userProfile.avatar} 
                            alt={userProfile.name} 
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-semibold text-white truncate">
                              {userProfile?.name || user?.displayName || 'User'}
                            </p>
                            {userProfile?.isVerified && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-[10px]">✓</span>
                              </div>
                            )}
                            {userProfile?.isAdmin && (
                              <Shield className="w-4 h-4 text-red-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {user?.email || userProfile?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 rounded-xl transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate('/profile?tab=settings');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 rounded-xl transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>

                      {userProfile?.isAdmin && (
                        <button
                          onClick={() => {
                            navigate('/admin');
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 rounded-xl transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      <div className="my-2 border-t border-gray-800"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Click outside to close */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowProfileMenu(false)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
