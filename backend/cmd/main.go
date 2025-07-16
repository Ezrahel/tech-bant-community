package main

import (
	"log"
	"nothing-community-backend/internal/database"
	"nothing-community-backend/internal/config"
	"nothing-community-backend/internal/handlers"
	"nothing-community-backend/internal/middleware"
	"nothing-community-backend/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize Appwrite client
	appwriteClient := database.NewAppwriteClient(cfg)

	// Initialize services
	userService := services.NewUserService(appwriteClient)
	authService := services.NewAuthService(appwriteClient, userService)
	oauthService := services.NewOAuthService(appwriteClient, cfg)
	adminService := services.NewAdminService(appwriteClient, userService)
	mediaService := services.NewMediaService(appwriteClient)
	postService := services.NewPostService(appwriteClient, userService, mediaService)
	commentService := services.NewCommentService(appwriteClient, userService)
	likeService := services.NewLikeService(appwriteClient)

	// Create super admin account
	if err := adminService.CreateSuperAdmin(cfg.AdminEmail, cfg.AdminPassword, "Super Admin"); err != nil {
		log.Printf("⚠️  Super admin creation: %v", err)
	} else {
		log.Printf("✅ Super admin account ready: %s", cfg.AdminEmail)
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	oauthHandler := handlers.NewOAuthHandler(oauthService)
	adminHandler := handlers.NewAdminHandler(adminService)
	userHandler := handlers.NewUserHandler(userService)
	postHandler := handlers.NewPostHandler(postService)
	commentHandler := handlers.NewCommentHandler(commentService)
	likeHandler := handlers.NewLikeHandler(likeService)
	mediaHandler := handlers.NewMediaHandler(mediaService)

	// Setup router
	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "nothing-community-backend"})
	})

	// API routes
	api := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", middleware.AuthMiddleware(appwriteClient), authHandler.Logout)
			auth.GET("/me", middleware.AuthMiddleware(appwriteClient), authHandler.GetCurrentUser)
			
			// OAuth routes
			auth.GET("/google", oauthHandler.GoogleLogin)
			auth.GET("/google/callback", oauthHandler.GoogleCallback)
			auth.GET("/github", oauthHandler.GitHubLogin)
			auth.GET("/github/callback", oauthHandler.GitHubCallback)
		}

		// Admin routes (protected)
		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(appwriteClient))
		admin.Use(middleware.AdminMiddleware(appwriteClient))
		{
			admin.GET("/stats", adminHandler.GetDashboardStats)
			admin.POST("/admins", middleware.SuperAdminMiddleware(appwriteClient), adminHandler.CreateAdmin)
			admin.GET("/admins", adminHandler.GetAdmins)
			admin.PUT("/admins/:id/role", middleware.SuperAdminMiddleware(appwriteClient), adminHandler.UpdateAdminRole)
			admin.DELETE("/admins/:id", middleware.SuperAdminMiddleware(appwriteClient), adminHandler.DeleteAdmin)
		}

		// User routes
		users := api.Group("/users")
		{
			users.GET("/profile", middleware.AuthMiddleware(appwriteClient), userHandler.GetProfile)
			users.PUT("/profile", middleware.AuthMiddleware(appwriteClient), userHandler.UpdateProfile)
			users.GET("/list", userHandler.ListUsers) // Public endpoint
			users.GET("/:id", userHandler.GetUser)    // Public endpoint
		}

		// Post routes
		posts := api.Group("/posts")
		{
			posts.GET("", postHandler.GetPosts)                                                        // Public
			posts.GET("/:id", postHandler.GetPost)                                                     // Public
			posts.POST("", middleware.AuthMiddleware(appwriteClient), postHandler.CreatePost)          // Protected
			posts.PUT("/:id", middleware.AuthMiddleware(appwriteClient), postHandler.UpdatePost)       // Protected
			posts.DELETE("/:id", middleware.AuthMiddleware(appwriteClient), postHandler.DeletePost)    // Protected
			posts.GET("/category/:category", postHandler.GetPostsByCategory)                           // Public
			posts.GET("/user/:userId", postHandler.GetPostsByUser)                                     // Public
		}

		// Comment routes
		comments := api.Group("/comments")
		{
			comments.GET("/post/:postId", commentHandler.GetComments)                                      // Public
			comments.POST("", middleware.AuthMiddleware(appwriteClient), commentHandler.CreateComment)     // Protected
			comments.PUT("/:id", middleware.AuthMiddleware(appwriteClient), commentHandler.UpdateComment)  // Protected
			comments.DELETE("/:id", middleware.AuthMiddleware(appwriteClient), commentHandler.DeleteComment) // Protected
		}

		// Like routes
		likes := api.Group("/likes")
		{
			likes.POST("/post/:postId", middleware.AuthMiddleware(appwriteClient), likeHandler.TogglePostLike)       // Protected
			likes.POST("/comment/:commentId", middleware.AuthMiddleware(appwriteClient), likeHandler.ToggleCommentLike) // Protected
			likes.GET("/post/:postId", likeHandler.GetPostLikes)                                                     // Public
		}

		// Media routes
		media := api.Group("/media")
		{
			media.POST("/upload", middleware.AuthMiddleware(appwriteClient), mediaHandler.UploadMedia)    // Protected
			media.DELETE("/:id", middleware.AuthMiddleware(appwriteClient), mediaHandler.DeleteMedia)     // Protected
			media.GET("/user", middleware.AuthMiddleware(appwriteClient), mediaHandler.GetUserMedia)      // Protected
		}
	}

	log.Printf("🚀 Nothing Community Backend starting on port %s", cfg.Port)
	log.Printf("📊 Appwrite Project: %s", cfg.AppwriteProjectID)
	log.Printf("🌐 Appwrite Endpoint: %s", cfg.AppwriteEndpoint)
	log.Printf("👑 Super Admin: %s", cfg.AdminEmail)
	log.Fatal(router.Run(":" + cfg.Port))
}