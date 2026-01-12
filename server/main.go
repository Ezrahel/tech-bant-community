package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"tech-bant-community/server/config"
	"tech-bant-community/server/handlers"
	"tech-bant-community/server/middleware"
	"tech-bant-community/server/models"
	"tech-bant-community/server/services"
	"tech-bant-community/server/supabase"

	"github.com/gorilla/mux"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize Supabase
	if err := supabase.Initialize(cfg); err != nil {
		log.Fatalf("Failed to initialize Supabase: %v", err)
	}
	defer supabase.Close()

	// Initialize Supabase auth middleware with JWT secret
	middleware.InitSupabaseAuth(cfg)

	// Initialize Redis/Rate Limiting
	rateLimitService, err := services.NewRateLimitService(cfg)
	if err != nil {
		log.Printf("Warning: Failed to initialize Redis rate limiting: %v. Rate limiting disabled.", err)
		rateLimitService = nil
	} else {
		defer rateLimitService.Close()
		log.Println("Redis rate limiting initialized")
	}

	// Initialize services
	emailService := services.NewEmailService(cfg)
	twoFAService := services.NewTwoFAService(cfg)
	oauthService := services.NewOAuthService(cfg)

	// Initialize handlers
	authService := services.NewAuthService(cfg, supabase.GetDB())
	authHandler := handlers.NewAuthHandlerWithService(cfg, authService, emailService, twoFAService)
	twoFAHandler := handlers.NewTwoFAHandler(twoFAService, emailService, rateLimitService, supabase.GetDB())
	oauthHandler := handlers.NewOAuthHandler(oauthService)
	postHandler := handlers.NewPostHandler(supabase.GetDB())
	userHandler := handlers.NewUserHandler(supabase.GetDB())
	commentHandler := handlers.NewCommentHandler(supabase.GetDB())
	mediaHandler := handlers.NewMediaHandler(supabase.GetDB(), cfg)
	adminHandler := handlers.NewAdminHandler(supabase.GetDB(), cfg)
	featuresHandler := handlers.NewFeaturesHandler(supabase.GetDB())

	// Setup router
	router := mux.NewRouter()

	// Apply security middleware globally
	router.Use(middleware.SecurityHeadersMiddleware)
	router.Use(middleware.RequestIDMiddleware)
	router.Use(middleware.RequestLoggingMiddleware) // FIXED: Issue #72 - Request logging
	router.Use(middleware.ContentTypeMiddleware)    // FIXED: Issue #32 - Content-Type validation
	router.Use(middleware.BodySizeMiddleware)       // FIXED: Issue #33 - Request body size limit
	router.Use(middleware.CompressionMiddleware)    // FIXED: Issue #79 - Gzip compression
	router.Use(middleware.ETagMiddleware)           // FIXED: Issue #80 - ETag support
	router.Use(middleware.CSRFMiddleware)           // FIXED: Issue #16 - CSRF protection

	// Apply rate limiting globally if Redis is available
	if rateLimitService != nil {
		router.Use(middleware.PerEndpointRateLimit(rateLimitService, services.DefaultLimits, true)) // Adaptive rate limiting
	}

	// API v1 routes
	api := router.PathPrefix("/api/v1").Subrouter()

	// Auth routes (public) - with specific rate limits
	if rateLimitService != nil {
		api.HandleFunc("/auth/signup", authHandler.Signup).Methods("POST")
		api.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
		api.HandleFunc("/auth/refresh", authHandler.RefreshToken).Methods("POST")
		api.HandleFunc("/auth/verify", authHandler.VerifyToken).Methods("GET")

		// OAuth routes
		api.HandleFunc("/auth/oauth/google", oauthHandler.InitiateGoogleOAuth).Methods("GET")
		api.HandleFunc("/auth/oauth/google/callback", oauthHandler.GoogleOAuthCallback).Methods("GET")

		// 2FA routes
		api.HandleFunc("/auth/2fa/send-otp", twoFAHandler.SendOTP).Methods("POST")

		// Password reset routes
		api.HandleFunc("/auth/reset-password", authHandler.RequestPasswordReset).Methods("POST")
		api.HandleFunc("/auth/reset-password/confirm", authHandler.ConfirmPasswordReset).Methods("POST")
	} else {
		api.HandleFunc("/auth/signup", authHandler.Signup).Methods("POST")
		api.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
		api.HandleFunc("/auth/refresh", authHandler.RefreshToken).Methods("POST")
		api.HandleFunc("/auth/verify", authHandler.VerifyToken).Methods("GET")
		api.HandleFunc("/auth/oauth/google", oauthHandler.InitiateGoogleOAuth).Methods("GET")
		api.HandleFunc("/auth/oauth/google/callback", oauthHandler.GoogleOAuthCallback).Methods("GET")
		api.HandleFunc("/auth/2fa/send-otp", twoFAHandler.SendOTP).Methods("POST")

		// Password reset routes
		api.HandleFunc("/auth/reset-password", authHandler.RequestPasswordReset).Methods("POST")
		api.HandleFunc("/auth/reset-password/confirm", authHandler.ConfirmPasswordReset).Methods("POST")
	}

	// Public routes (optional auth)
	api.HandleFunc("/posts", postHandler.GetPosts).Methods("GET")
	api.HandleFunc("/posts/{id}", postHandler.GetPost).Methods("GET")
	api.HandleFunc("/posts/{id}/comments", commentHandler.GetComments).Methods("GET")
	api.HandleFunc("/users/{id}", userHandler.GetUser).Methods("GET")
	api.HandleFunc("/users/{id}/posts", userHandler.GetUserPosts).Methods("GET")
	api.HandleFunc("/users/search", userHandler.SearchUsers).Methods("GET")

	// Protected routes (require auth)
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.SupabaseAuthMiddleware)

	protected.HandleFunc("/auth/logout", authHandler.Logout).Methods("POST")
	protected.HandleFunc("/auth/change-password", authHandler.ChangePassword).Methods("POST")

	// 2FA routes (protected)
	protected.HandleFunc("/auth/2fa/enable", twoFAHandler.Enable2FA).Methods("POST")
	protected.HandleFunc("/auth/2fa/verify", twoFAHandler.Verify2FA).Methods("POST")
	protected.HandleFunc("/auth/2fa/disable", twoFAHandler.Disable2FA).Methods("POST")

	protected.HandleFunc("/posts", postHandler.CreatePost).Methods("POST")
	protected.HandleFunc("/posts/{id}", postHandler.UpdatePost).Methods("PUT")
	protected.HandleFunc("/posts/{id}", postHandler.DeletePost).Methods("DELETE")
	protected.HandleFunc("/posts/{id}/like", postHandler.LikePost).Methods("POST")
	protected.HandleFunc("/posts/{id}/bookmark", postHandler.BookmarkPost).Methods("POST")
	protected.HandleFunc("/posts/{id}/comments", commentHandler.CreateComment).Methods("POST")
	protected.HandleFunc("/comments/{id}", commentHandler.UpdateComment).Methods("PUT")
	protected.HandleFunc("/comments/{id}", commentHandler.DeleteComment).Methods("DELETE")
	protected.HandleFunc("/comments/{id}/like", commentHandler.LikeComment).Methods("POST")
	protected.HandleFunc("/users/me", userHandler.GetCurrentUser).Methods("GET")
	protected.HandleFunc("/users/me", userHandler.UpdateUser).Methods("PUT")
	protected.HandleFunc("/media/upload", mediaHandler.UploadMedia).Methods("POST")

	// Admin routes (require auth + admin role with RBAC)
	admin := api.PathPrefix("/admin").Subrouter()
	admin.Use(middleware.SupabaseAuthMiddleware)
	admin.Use(middleware.RoleMiddleware(models.RoleAdmin, models.RoleSuperAdmin))

	admin.HandleFunc("/stats", adminHandler.GetStats).Methods("GET")
	admin.HandleFunc("/admins", adminHandler.GetAdmins).Methods("GET")
	admin.HandleFunc("/users/{id}/ban", featuresHandler.BanUser).Methods("POST")
	admin.HandleFunc("/users/{id}/unban", featuresHandler.UnbanUser).Methods("POST")
	admin.HandleFunc("/users/{id}/verify", featuresHandler.VerifyUser).Methods("POST")
	admin.HandleFunc("/reports", featuresHandler.GetReports).Methods("GET")
	admin.HandleFunc("/reports/{id}/resolve", featuresHandler.ResolveReport).Methods("POST")

	// Super admin only routes
	superAdmin := admin.PathPrefix("").Subrouter()
	superAdmin.Use(middleware.RoleMiddleware(models.RoleSuperAdmin))
	superAdmin.HandleFunc("/admins", adminHandler.CreateAdmin).Methods("POST")
	superAdmin.HandleFunc("/admins/{id}/role", adminHandler.UpdateAdminRole).Methods("PUT")
	superAdmin.HandleFunc("/admins/{id}", adminHandler.DeleteAdmin).Methods("DELETE")
	superAdmin.HandleFunc("/users/{id}/promote", featuresHandler.PromoteToAdmin).Methods("POST")

	// Health check
	// FIXED: Issue #43 - Add Redis health check
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		health := map[string]interface{}{
			"status": "healthy",
			"redis":  "unknown",
		}

		if rateLimitService != nil {
			ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
			defer cancel()
			if err := rateLimitService.Ping(ctx); err == nil {
				health["redis"] = "healthy"
			} else {
				health["redis"] = "unhealthy"
				health["status"] = "degraded"
			}
		} else {
			health["redis"] = "not_configured"
		}

		w.Header().Set("Content-Type", "application/json")
		if health["status"] == "healthy" {
			w.WriteHeader(http.StatusOK)
		} else {
			w.WriteHeader(http.StatusServiceUnavailable)
		}
		json.NewEncoder(w).Encode(health)
	}).Methods("GET")

	// FIXED: Issues #45, #46 - Start cleanup job for expired OTPs and sessions
	cleanupService := services.NewCleanupService(supabase.GetDB())
	cleanupCtx, cleanupCancel := context.WithCancel(context.Background())
	defer cleanupCancel()
	cleanupService.StartCleanupJob(cleanupCtx)

	// Apply CORS middleware
	handler := middleware.CORS(cfg)(router)

	// Setup server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
