package middleware

import (
	"encoding/json"
	"net/http"
	"nothing-community-backend/internal/database"
	"nothing-community-backend/internal/models"

	"github.com/gin-gonic/gin"
)

func AdminMiddleware(appwriteClient *database.AppwriteClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		// Get user from database
		doc, err := appwriteClient.Database.GetDocument(
			appwriteClient.Config.AppwriteDatabaseID,
			appwriteClient.Config.AppwriteUsersCollectionID,
			userID.(string),
			nil,
		)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		var user models.User
		if err := mapDocumentToUser(doc.Data, &user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
			c.Abort()
			return
		}

		if !user.IsAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}

		// Store user role in context
		c.Set("userRole", user.Role)
		c.Next()
	}
}

func SuperAdminMiddleware(appwriteClient *appwrite.AppwriteClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		// Get user from database
		doc, err := appwriteClient.Database.GetDocument(
			appwriteClient.Config.AppwriteDatabaseID,
			appwriteClient.Config.AppwriteUsersCollectionID,
			userID.(string),
			nil,
		)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		var user models.User
		if err := mapDocumentToUser(doc.Data, &user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
			c.Abort()
			return
		}

		if user.Role != models.RoleSuperAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Super admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func mapDocumentToUser(data interface{}, user *models.User) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return json.Unmarshal(jsonData, user)
}