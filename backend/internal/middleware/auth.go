package middleware

import (
	"net/http"
	"nothing-community-backend/internal/database"
	"strings"

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

		// Set the session for the client
		appwriteClient.Client.SetSession(sessionToken)

		// Verify the session by getting the current user
		user, err := appwriteClient.Account.Get()
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