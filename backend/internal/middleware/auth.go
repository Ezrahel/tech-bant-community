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
		var sessionToken string
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			sessionToken = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			// Try to get session_token from cookie
			cookie, err := c.Cookie("session_token")
			if err == nil {
				sessionToken = cookie
			}
		}
		if sessionToken == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No session token provided"})
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
