package middleware

import (
	"net/http"
	"nothing-community-backend/internal/database"
	"strings"

	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(appwriteClient *database.AppwriteClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		sessionToken := strings.TrimPrefix(authHeader, "Bearer ")
		if sessionToken == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		// Create a new Appwrite client for this request with the session token
		newClient := appwrite.NewClient(
			appwrite.WithEndpoint(appwriteClient.Config.AppwriteEndpoint),
			appwrite.WithProject(appwriteClient.Config.AppwriteProjectID),
		)
		// TODO: The Appwrite Go SDK does not support setting a session token directly for user session validation.
		// This middleware currently cannot validate user sessions with the SDK. Consider using REST API calls or forking the SDK for custom header support.
		account := appwrite.NewAccount(newClient)

		// Verify the session by getting the current user
		user, err := account.Get()
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
			c.Abort()
			return
		}

		// Store user ID in context
		c.Set("userID", user.Id)
		c.Set("session", sessionToken)
		c.Next()
	}
}
