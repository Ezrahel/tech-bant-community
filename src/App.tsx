import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ClerkProvider, useUser } from '@clerk/clerk-react';
// import { PageType } from './types';
import { samplePosts, categories, postCategories } from './data/sampleData';
// import { authService } from './services/auth';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import SsoCallbackPage from './pages/SsoCallbackPage';
import NewPostPage from './pages/NewPostPage';
import DiscussionsPage from './pages/DiscussionsPage';
import ReviewsPage from './pages/ReviewsPage';
import SupportPage from './pages/SupportPage';
import AdminDashboard from './pages/AdminDashboard';
// import DuplicateUserErrorPage from './pages/DuplicateUserErrorPage';
// import OAuthCallbackPage from './pages/OAuthCallbackPage';
import UserProfilePage from './pages/UserProfilePage';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isLoaded } = useUser();
  const location = useLocation();

  if (!isLoaded) {
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

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.primaryEmailAddress?.emailAddress !== 'ditech@ditechagency.com') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}



function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredPosts = samplePosts;

  function AppContent() {
    const location = useLocation();
    const hideHeaderRoutes = ['/login', '/signup'];
    const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname);

    return (
      <>
        {shouldShowHeader && (
          <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        )}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/sso-callback" element={<SsoCallbackPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-post"
              element={
                <ProtectedRoute>
                  <NewPostPage postCategories={postCategories} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/discussions"
              element={
                <ProtectedRoute>
                  <DiscussionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews"
              element={
                <ProtectedRoute>
                  <ReviewsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute>
                  <SupportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage
                    posts={filteredPosts}
                    categories={categories}
                    selectedCategory={"all"}
                    setSelectedCategory={() => {}}
                  />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </>
    );
  }

  // Use VITE_CLERK_PUBLISHABLE_KEY from env
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;