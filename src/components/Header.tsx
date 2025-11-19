import React, { useState } from 'react';
import { Search, Plus, User, Bell, Home, MessageSquare, Star, HelpCircle, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="border-b border-gray-800 sticky top-0 z-50 bg-black/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-black rounded-full"></div>
              </div>
              <h1 className="text-xl font-bold">nothing community</h1>
            </Link>
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className={`flex items-center space-x-2 transition-colors text-sm font-medium ${location.pathname === '/' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <Link
                to="/discussions"
                className={`flex items-center space-x-2 transition-colors text-sm font-medium ${location.pathname === '/discussions' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Discussions</span>
              </Link>
              <Link
                to="/reviews"
                className={`flex items-center space-x-2 transition-colors text-sm font-medium ${location.pathname === '/reviews' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Star className="w-4 h-4" />
                <span>Reviews</span>
              </Link>
              <Link
                to="/support"
                className={`flex items-center space-x-2 transition-colors text-sm font-medium ${location.pathname === '/support' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Support</span>
              </Link>
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
              onClick={() => navigate('/new-post')}
              className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Post</span>
            </button>
            
            {/* User Profile Menu */}
            <div className="relative">
              <div
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
              >
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={user.fullName || user.username || 'User'} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50">
                  <div className="p-3 border-b border-gray-700">
                    <div className="text-sm font-medium text-white">{user?.fullName || user?.username || 'User'}</div>
                    <div className="text-xs text-gray-400">{user?.primaryEmailAddress?.emailAddress}</div>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    {user?.primaryEmailAddress?.emailAddress === 'ditech@ditechagency.com' && (
                      <button
                        onClick={() => {
                          navigate('/admin');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
    </header>
  );
};

export default Header;