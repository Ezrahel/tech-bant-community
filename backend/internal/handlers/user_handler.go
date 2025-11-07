package handlers

import (
	"net/http"
	"nothing-community-backend/internal/models"
	"nothing-community-backend/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type UserHandler struct {
	userService *services.UserService
	postService *services.PostService
	validator   *validator.Validate
}

func NewUserHandler(userService *services.UserService, postService *services.PostService) *UserHandler {
	return &UserHandler{
		userService: userService,
		postService: postService,
		validator:   validator.New(),
	}
}

func (h *UserHandler) GetCurrentUserProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	user, err := h.userService.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) GetUserProfile(c *gin.Context) {
	userID := c.Param("id")

	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User profile not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.validator.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Server-side validation
	if req.Name != "" && (len(req.Name) < 2 || len(req.Name) > 50) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name must be 2-50 characters"})
		return
	}
	if req.Bio != "" && len(req.Bio) > 500 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bio must be 500 characters or less"})
		return
	}
	if req.Location != "" && len(req.Location) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Location must be 100 characters or less"})
		return
	}

	user, err := h.userService.UpdateUser(userID.(string), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) GetUserPosts(c *gin.Context) {
	userID := c.Param("id")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		offset = 0
	}

	// Get user ID if authenticated for like status
	var currentUserID string
	if uid, exists := c.Get("userID"); exists {
		currentUserID = uid.(string)
	}

	posts, err := h.postService.GetPostsByUser(userID, limit, offset, currentUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
		"pagination": gin.H{
			"limit":  limit,
			"offset": offset,
			"total":  len(posts),
		},
	})
}

func (h *UserHandler) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 10
	}

	users, err := h.userService.ListUsers(limit, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}
