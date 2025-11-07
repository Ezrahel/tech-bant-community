package handlers

import (
	"net/http"
	"nothing-community-backend/internal/models"
	"nothing-community-backend/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type PostHandler struct {
	postService *services.PostService
	validator   *validator.Validate
}

func NewPostHandler(postService *services.PostService) *PostHandler {
	return &PostHandler{
		postService: postService,
		validator:   validator.New(),
	}
}

func (h *PostHandler) CreatePost(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Server-side validation
	if len(req.Title) < 1 || len(req.Title) > 200 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title must be 1-200 characters"})
		return
	}
	if len(req.Content) < 1 || len(req.Content) > 2000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Content must be 1-2000 characters"})
		return
	}
	validCategories := map[models.PostCategory]bool{
		models.CategoryGeneral: true,
		models.CategoryTech:    true,
		models.CategoryReviews: true,
		models.CategoryUpdates: true,
		models.CategoryGists:   true,
		models.CategoryBanter:  true,
	}
	if !validCategories[req.Category] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category"})
		return
	}
	if len(req.Tags) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Too many tags (max 10)"})
		return
	}
	if req.MediaIDs != nil && len(req.MediaIDs) > 0 {
		for _, id := range req.MediaIDs {
			if len(id) == 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid media ID"})
				return
			}
		}
	}

	if err := h.validator.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post, err := h.postService.CreatePost(userID.(string), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, post)
}

func (h *PostHandler) GetPost(c *gin.Context) {
	postID := c.Param("id")

	// Get user ID if authenticated
	var userID string
	if uid, exists := c.Get("userID"); exists {
		userID = uid.(string)
	}

	post, err := h.postService.GetPost(postID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	c.JSON(http.StatusOK, post)
}

func (h *PostHandler) GetPosts(c *gin.Context) {
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

	// Get user ID if authenticated
	var userID string
	if uid, exists := c.Get("userID"); exists {
		userID = uid.(string)
	}

	posts, err := h.postService.GetPosts(limit, offset, userID)
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

func (h *PostHandler) GetPostsByCategory(c *gin.Context) {
	categoryStr := c.Param("category")
	category := models.PostCategory(categoryStr)

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

	// Get user ID if authenticated
	var userID string
	if uid, exists := c.Get("userID"); exists {
		userID = uid.(string)
	}

	posts, err := h.postService.GetPostsByCategory(category, limit, offset, userID)
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

func (h *PostHandler) GetPostsByUser(c *gin.Context) {
	targetUserID := c.Param("userId")

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

	// Get user ID if authenticated
	var userID string
	if uid, exists := c.Get("userID"); exists {
		userID = uid.(string)
	}

	posts, err := h.postService.GetPostsByUser(targetUserID, limit, offset, userID)
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

func (h *PostHandler) UpdatePost(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postID := c.Param("id")

	var req models.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.validator.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post, err := h.postService.UpdatePost(postID, userID.(string), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, post)
}

func (h *PostHandler) DeletePost(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postID := c.Param("id")

	if err := h.postService.DeletePost(postID, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}
