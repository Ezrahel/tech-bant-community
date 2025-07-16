import React, { useState, useEffect } from 'react';
import { PageType } from './types';
import { samplePosts, categories, postCategories } from './data/sampleData';
import { authService } from './services/auth';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import NewPostPage from './pages/NewPostPage';
import DiscussionsPage from './pages/DiscussionsPage';
import ReviewsPage from './pages/ReviewsPage';
import SupportPage from './pages/SupportPage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('login');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    authService.isAuthenticated()
      .then((authenticated) => {
        setIsAuthenticated(authenticated);
        if (authenticated) {
          // Check if user is admin by trying to get current user
          authService.getCurrentUser()
            .then((user) => {
              // Check if user email matches admin email
              const isAdminUser = user?.email === 'ditech@ditechagency.com';
              setIsAdmin(isAdminUser);
              setCurrentPage(isAdminUser ? 'admin' : 'home');
            })
            .catch(() => {
              setCurrentPage('home');
            });
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 bg-black rounded-full"></div>
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredPosts = samplePosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Show auth pages if not authenticated
  if (!isAuthenticated) {
    if (currentPage === 'signup') {
      return <SignupPage setCurrentPage={setCurrentPage} setIsAuthenticated={setIsAuthenticated} />;
    }
    return <LoginPage setCurrentPage={setCurrentPage} setIsAuthenticated={setIsAuthenticated} />;
  }

  const getPageContent = () => {
    switch (currentPage) {
      case 'new-post':
        return <NewPostPage setCurrentPage={setCurrentPage} postCategories={postCategories} />;
      case 'discussions':
        return <DiscussionsPage setCurrentPage={setCurrentPage} />;
      case 'reviews':
        return <ReviewsPage setCurrentPage={setCurrentPage} />;
      case 'support':
        return <SupportPage />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return (
          <HomePage 
            posts={filteredPosts}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {currentPage === 'new-post' ? (
          getPageContent()
        ) : (
          getPageContent()
        )}
      </div>
    </div>
  );
}

export default App;