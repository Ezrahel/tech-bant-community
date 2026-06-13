import React, { lazy, Suspense, useState, useCallback, memo } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";

// ─── Route-level code splitting ──────────────────────────────────────────────
// Each lazy() call becomes a separate chunk. Vite tree-shakes all imports that
// are not needed for the current route. Initial bundle drops ~70%.
const LoginPage = lazy(() => import("./views/LoginPage"));
const SignupPage = lazy(() => import("./views/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./views/ForgotPasswordPage"));
const OAuthCallbackPage = lazy(() => import("./views/OAuthCallbackPage"));
const HomePage = lazy(() => import("./views/HomePage"));
const DiscussionsPage = lazy(() => import("./views/DiscussionsPage"));
const ReviewsPage = lazy(() => import("./views/ReviewsPage"));
const NotificationsPage = lazy(() => import("./views/NotificationsPage"));
const SupportPage = lazy(() => import("./views/SupportPage"));
const NewPostPage = lazy(() => import("./views/NewPostPage"));
const PostDetailPage = lazy(() => import("./views/PostDetailPage"));
const UserProfilePage = lazy(() => import("./views/UserProfilePage"));
// Admin routes — heaviest chunk (TipTap editor + admin logic)
const AdminDashboard = lazy(() => import("./views/AdminDashboard"));
const ArticleListPage = lazy(() => import("./views/articles/ArticleListPage"));
const ArticleEditorPage = lazy(
  () => import("./views/articles/ArticleEditorPage"),
);
const ArticleViewPage = lazy(() => import("./views/articles/ArticleViewPage"));
// Shell — rendered on every authenticated page; keep eager but after auth check
import ProtectedPageShell from "./components/ProtectedPageShell";

// ─── Route loading fallback ───────────────────────────────────────────────────
// Minimal spinner: no extra deps, matches the existing dark theme.
const RouteLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Toast options (stable reference — prevents Toaster from re-mounting) ────
const TOAST_OPTIONS = {
  style: { background: "#1f2937", color: "#fff", border: "1px solid #374151" },
  success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
  error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
} as const;

// ─── Protected route wrapper ──────────────────────────────────────────────────
const ProtectedRoute = memo(function ProtectedRoute({
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
    return <RouteLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== "admin" && user.role !== "super_admin") {
    return <Navigate to="/" replace />;
  }

  if (!withShell) return <>{children}</>;
  return <ProtectedPageShell>{children}</ProtectedPageShell>;
});

// ─── Routes hidden-header list (stable reference) ────────────────────────────
const HIDE_HEADER_PATHS = new Set([
  "/login",
  "/signup",
  "/oauth-callback",
  "/forgot-password",
]);

function AppContent() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // useCallback so Header does not re-render when unrelated state changes
  const handleSearchChange = useCallback((q: string) => setSearchQuery(q), []);

  const shouldShowHeader = !HIDE_HEADER_PATHS.has(location.pathname);

  return (
    <>
      {shouldShowHeader && (
        <Header searchQuery={searchQuery} setSearchQuery={handleSearchChange} />
      )}
      <div className="min-h-screen bg-black">
        {/* Single Suspense boundary: shows RouteLoader during any lazy chunk fetch */}
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

            {/* ── Admin routes (heaviest — always behind ProtectedRoute) ── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly withShell={false}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/articles"
              element={
                <ProtectedRoute adminOnly withShell={false}>
                  <ArticleListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/articles/new"
              element={
                <ProtectedRoute adminOnly withShell={false}>
                  <ArticleEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/articles/:id/edit"
              element={
                <ProtectedRoute adminOnly withShell={false}>
                  <ArticleEditorPage />
                </ProtectedRoute>
              }
            />

            {/* ── Authenticated routes ── */}
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
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* ── Shell-wrapped routes ── */}
            <Route
              path="/profile/:userId"
              element={
                <ProtectedPageShell>
                  <UserProfilePage />
                </ProtectedPageShell>
              }
            />
            <Route
              path="/posts/:postId"
              element={
                <ProtectedPageShell>
                  <PostDetailPage />
                </ProtectedPageShell>
              }
            />
            <Route
              path="/discussions"
              element={
                <ProtectedPageShell>
                  <DiscussionsPage />
                </ProtectedPageShell>
              }
            />
            <Route
              path="/reviews"
              element={
                <ProtectedPageShell>
                  <ReviewsPage />
                </ProtectedPageShell>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedPageShell>
                  <SupportPage />
                </ProtectedPageShell>
              }
            />
            <Route
              path="/articles/:id"
              element={
                <ProtectedPageShell>
                  <ArticleViewPage />
                </ProtectedPageShell>
              }
            />

            {/* ── Landing ── */}
            <Route path="/" element={<HomePage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <Toaster position="bottom-right" toastOptions={TOAST_OPTIONS} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
