import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import LoginPage from './views/LoginPage';
import SignupPage from './views/SignupPage';
import HomePage from './views/HomePage';
import NewPostPage from './views/NewPostPage';
import DiscussionsPage from './views/DiscussionsPage';
import ReviewsPage from './views/ReviewsPage';
import SupportPage from './views/SupportPage';
import AdminDashboard from './views/AdminDashboard';
import UserProfilePage from './views/UserProfilePage';
import OAuthCallbackPage from './views/OAuthCallbackPage';
import PostDetailPage from './views/PostDetailPage';
import ForgotPasswordPage from './views/ForgotPasswordPage';
import NotificationsPage from './views/NotificationsPage';
import ProtectedPageShell from './components/ProtectedPageShell';

function ProtectedRoute({
  children,
  adminOnly = false,
  withShell = true,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  withShell?: boolean;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  if (!withShell) {
    return <>{children}</>;
  }

  return <ProtectedPageShell>{children}</ProtectedPageShell>;
}

function AppContent() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const hideHeaderRoutes = ['/login', '/signup', '/oauth-callback', '/forgot-password'];
  const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowHeader && (
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      )}
      <div className="min-h-screen bg-black">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly withShell={false}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/new-post"
            element={
              <ProtectedRoute>
                <NewPostPage />
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
            element={<ProtectedPageShell><UserProfilePage /></ProtectedPageShell>}
          />

          <Route
            path="/posts/:postId"
            element={<ProtectedPageShell><PostDetailPage /></ProtectedPageShell>}
          />

          <Route
            path="/discussions"
            element={<ProtectedPageShell><DiscussionsPage /></ProtectedPageShell>}
          />

          <Route
            path="/reviews"
            element={<ProtectedPageShell><ReviewsPage /></ProtectedPageShell>}
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/support"
            element={<ProtectedPageShell><SupportPage /></ProtectedPageShell>}
          />

          <Route
            path="/"
            element={<HomePage />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
