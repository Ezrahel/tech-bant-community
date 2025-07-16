package handlers

import (
	"net/http"
	"nothing-community-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type LikeHandler struct {
	likeService *services.LikeService
}

func NewLikeHandler(likeService *services.LikeService) *LikeHandler {
	return &LikeHandler{
		likeService: likeService,
	}
}

func (h *LikeHandler) TogglePostLike(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postID := c.Param("postId")

	isLiked, err := h.likeService.TogglePostLike(userID.(string), postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_liked": isLiked,
		"message":  map[bool]string{true: "Post liked", false: "Post unliked"}[isLiked],
	})
}

func (h *LikeHandler) ToggleCommentLike(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	commentID := c.Param("commentId")

	isLiked, err := h.likeService.ToggleCommentLike(userID.(string), commentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_liked": isLiked,
		"message":  map[bool]string{true: "Comment liked", false: "Comment unliked"}[isLiked],
	})
}

func (h *LikeHandler) GetPostLikes(c *gin.Context) {
	postID := c.Param("postId")

	users, err := h.likeService.GetPostLikes(postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}