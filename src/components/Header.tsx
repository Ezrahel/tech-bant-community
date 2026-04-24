// Header component with Apple design philosophy
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faPlus,
  faUser,
  faBell,
  faHome,
  faComment,
  faStar,
  faQuestionCircle,
  faCog,
  faSignOutAlt,
  faShieldAlt,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
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
  const { user, userProfile, isAuthenticated } = useAuth();
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

  const navigateTo = (path: string) => {
    navigate(path);
    setShowMobileMenu(false);
  };

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Mobile Menu Toggle */}
          <div className="flex items-center space-x-4 h-full">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              <div className="w-5 h-4 flex flex-col justify-between items-start group">
                <span className={`h-0.5 bg-current transition-all duration-300 ${showMobileMenu ? 'w-5 translate-y-[7px] rotate-45' : 'w-5'}`}></span>
                <span className={`h-0.5 bg-current transition-all duration-300 ${showMobileMenu ? 'opacity-0' : 'w-3'}`}></span>
                <span className={`h-0.5 bg-current transition-all duration-300 ${showMobileMenu ? 'w-5 -translate-y-[7px] -rotate-45' : 'w-4'}`}></span>
              </div>
            </button>

            <Link
              to="/"
              className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity group"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-black rounded-full"></div>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate max-w-[120px] sm:max-w-none">nothing</h1>
            </Link>

            {/* Navigation (Desktop) */}
            <nav className="hidden md:flex items-center space-x-1 ml-4">
              <button
                type="button"
                onClick={() => navigateTo('/')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive('/')
                  ? 'text-white bg-gray-900/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/30'
                  }`}
              >
                <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
                <span>Home</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/discussions')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive('/discussions')
                  ? 'text-white bg-gray-900/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/30'
                  }`}
              >
                <FontAwesomeIcon icon={faComment} className="w-4 h-4" />
                <span>Discussions</span>
              </button>
              <nav className="flex items-center">
                <button
                  type="button"
                  onClick={() => navigateTo('/reviews')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive('/reviews')
                    ? 'text-white bg-gray-900/50'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/30'
                    }`}
                >
                  <FontAwesomeIcon icon={faStar} className="w-4 h-4" />
                  <span>Reviews</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('/support')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive('/support')
                    ? 'text-white bg-gray-900/50'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/30'
                    }`}
                >
                  <FontAwesomeIcon icon={faQuestionCircle} className="w-4 h-4" />
                  <span>Support</span>
                </button>
              </nav>
            </nav>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search (Desktop) */}
            <div className="relative hidden lg:block">
              <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 xl:w-64 pl-11 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>

            {/* Notifications */}
            <button
              onClick={() => navigate(isAuthenticated ? '/notifications' : '/login')}
              className={`p-2 rounded-xl transition-all ${
                location.pathname === '/notifications'
                  ? 'bg-gray-900/60 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
              }`}
              aria-label={isAuthenticated ? 'Notifications' : 'Sign in for notifications'}
            >
              <FontAwesomeIcon icon={faBell} className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
              )}
            </button>

            {/* New Post Button */}
            <button
              onClick={() => navigate(isAuthenticated ? '/new-post' : '/login')}
              className="flex items-center justify-center sm:space-x-2 bg-white text-black w-10 sm:w-auto h-10 sm:px-4 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all text-sm font-bold shrink-0 shadow-apple-sm"
            >
              <FontAwesomeIcon icon={faPlus} className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{isAuthenticated ? 'Post' : 'Join'}</span>
            </button>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {userProfile?.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </button>

              {showProfileMenu && (
                <>
                  <div className="absolute right-0 mt-3 w-64 bg-gray-900/95 backdrop-blur-2xl border border-gray-800 rounded-2xl shadow-apple-2xl z-50 overflow-hidden ring-1 ring-white/5">
                    <div className="p-4 bg-white/5 border-b border-gray-800">
                      <div className="flex items-center space-x-3">
                        {userProfile?.avatar ? (
                          <img
                            src={userProfile.avatar}
                            alt={userProfile.name}
                            className="w-10 h-10 rounded-full ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <p className="text-sm font-bold text-white truncate">
                              {isAuthenticated ? (userProfile?.name || user?.name || 'User') : 'Visitor mode'}
                            </p>
                            {userProfile?.isVerified && (
                              <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider font-semibold">
                            {isAuthenticated ? (user?.email || userProfile?.email) : 'Browse and share freely'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      {isAuthenticated ? (
                        <>
                          <button
                            onClick={() => {
                              navigate('/profile');
                              setShowProfileMenu(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 rounded-xl transition-all font-medium"
                          >
                            <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-400" />
                            <span>Profile</span>
                          </button>

                          <button
                            onClick={() => {
                              navigate('/profile?tab=settings');
                              setShowProfileMenu(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 rounded-xl transition-all font-medium"
                          >
                            <FontAwesomeIcon icon={faCog} className="w-4 h-4 text-gray-400" />
                            <span>Settings</span>
                          </button>

                          {userProfile?.isAdmin && (
                            <button
                              onClick={() => {
                                navigate('/admin');
                                setShowProfileMenu(false);
                              }}
                              className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 rounded-xl transition-all font-medium"
                            >
                              <FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4 text-gray-400" />
                              <span>Admin Dashboard</span>
                            </button>
                          )}

                          <div className="my-2 border-t border-gray-800/50 mx-2"></div>

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold"
                          >
                            <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                            <span>Sign out</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            navigate('/login');
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 rounded-xl transition-all font-medium"
                        >
                          <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-400" />
                          <span>Sign in</span>
                        </button>
                      )}
                    </div>
                  </div>

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

      {/* Mobile Menu */}
      {showMobileMenu && (
        <>
          <div className="md:hidden fixed inset-x-0 top-[65px] p-4 z-40 animate-in slide-in-from-top duration-300">
            <div className="bg-gray-900/95 backdrop-blur-2xl border border-gray-800 rounded-3xl shadow-apple-2xl overflow-hidden ring-1 ring-white/5">
              <nav className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => navigateTo('/')}
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-base font-semibold transition-all ${isActive('/') ? 'bg-white text-black' : 'text-gray-300'}`}
                >
                  <FontAwesomeIcon icon={faHome} className="w-5 h-5" />
                  <span>Home</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('/discussions')}
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-base font-semibold transition-all ${isActive('/discussions') ? 'bg-white text-black' : 'text-gray-300'}`}
                >
                  <FontAwesomeIcon icon={faComment} className="w-5 h-5" />
                  <span>Discussions</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('/reviews')}
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-base font-semibold transition-all ${isActive('/reviews') ? 'bg-white text-black' : 'text-gray-300'}`}
                >
                  <FontAwesomeIcon icon={faStar} className="w-5 h-5" />
                  <span>Reviews</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('/support')}
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-base font-semibold transition-all ${isActive('/support') ? 'bg-white text-black' : 'text-gray-300'}`}
                >
                  <FontAwesomeIcon icon={faQuestionCircle} className="w-5 h-5" />
                  <span>Support</span>
                </button>
              </nav>

              {/* Search in Mobile Menu */}
              <div className="p-4 pt-2">
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search community..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            onClick={() => setShowMobileMenu(false)}
          />
        </>
      )}
    </header>
  );
};

export default Header;
