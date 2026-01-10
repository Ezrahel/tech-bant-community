package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"tech-bant-community/server/constants"
	"tech-bant-community/server/middleware"
	"tech-bant-community/server/models"
	"tech-bant-community/server/services"
	"tech-bant-community/server/utils"

	"github.com/gorilla/mux"
)

type PostHandler struct {
	postService *services.PostService
}

func NewPostHandler(db *sql.DB) *PostHandler {
	return &PostHandler{
		postService: services.NewPostService(db),
	}
}

// CreatePost handles POST /api/v1/posts
func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	// FIXED: Issue #7 - Input sanitization
	title, err := utils.SanitizeAndValidatePostTitle(req.Title)
	if err != nil {
		respondWithError(w, r, http.StatusBadRequest, err.Error())
		return
	}
	req.Title = title

	content, err := utils.SanitizeAndValidatePostContent(req.Content)
	if err != nil {
		respondWithError(w, r, http.StatusBadRequest, err.Error())
		return
	}
	req.Content = content

	// Validate category
	if !utils.ValidateCategory(req.Category) {
		respondWithError(w, r, http.StatusBadRequest, "Invalid category")
		return
	}

	// FIXED: Issue #86 - Validate array sizes
	if len(req.Tags) > constants.MaxTagsPerPost {
		respondWithError(w, r, http.StatusBadRequest, fmt.Sprintf("Maximum %d tags allowed", constants.MaxTagsPerPost))
		return
	}
	if len(req.MediaIDs) > constants.MaxMediaPerPost {
		respondWithError(w, r, http.StatusBadRequest, fmt.Sprintf("Maximum %d media files allowed", constants.MaxMediaPerPost))
		return
	}

	// Sanitize tags
	if len(req.Tags) > 0 {
		tags, err := utils.SanitizeTags(req.Tags, constants.MaxTagsPerPost)
		if err != nil {
			respondWithError(w, r, http.StatusBadRequest, err.Error())
			return
		}
		req.Tags = tags
	}

	post, err := h.postService.CreatePost(r.Context(), userID, &req)
	if err != nil {
		// FIXED: Issue #17 - Sanitize error messages to prevent information leakage
		respondWithError(w, r, http.StatusInternalServerError, "Failed to create post")
		return
	}

	respondWithJSON(w, r, http.StatusCreated, post)
}

// GetPost handles GET /api/v1/posts/{id}
func (h *PostHandler) GetPost(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postID := vars["id"]

	// FIXED: Issue #50 - Validate post ID format
	if !utils.ValidatePostID(postID) {
		respondWithError(w, r, http.StatusBadRequest, "Invalid post ID")
		return
	}

	post, err := h.postService.GetPost(r.Context(), postID)
	if err != nil {
		respondWithError(w, r, http.StatusNotFound, "Post not found")
		return
	}

	respondWithJSON(w, r, http.StatusOK, post)
}

// GetPosts handles GET /api/v1/posts
func (h *PostHandler) GetPosts(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 20
	}
	// FIXED: Issue #31 - Enforce max limit
	if limit > 100 {
		limit = 100
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if offset < 0 {
		offset = 0
	}
	// FIXED: Issue #78 - Validate max offset
	if offset > constants.MaxOffset {
		respondWithError(w, r, http.StatusBadRequest, "Offset too large")
		return
	}

	category := r.URL.Query().Get("category")
	var posts []*models.Post
	var err error

	if category != "" {
		posts, err = h.postService.GetPostsByCategory(r.Context(), category, limit, offset)
	} else {
		posts, err = h.postService.GetPosts(r.Context(), limit, offset)
	}

	if err != nil {
		// FIXED: Issue #17 - Sanitize error messages
		respondWithError(w, r, http.StatusInternalServerError, "Failed to retrieve posts")
		return
	}

	respondWithJSON(w, r, http.StatusOK, posts)
}

// LikePost handles POST /api/v1/posts/{id}/like
func (h *PostHandler) LikePost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	postID := vars["id"]

	// Validate post ID
	if !utils.ValidatePostID(postID) {
		respondWithError(w, r, http.StatusBadRequest, "Invalid post ID")
		return
	}

	if err := h.postService.LikePost(r.Context(), userID, postID); err != nil {
		// FIXED: Issue #17 - Sanitize error messages
		respondWithError(w, r, http.StatusInternalServerError, "Failed to update like")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "Like toggled successfully"})
}

// BookmarkPost handles POST /api/v1/posts/{id}/bookmark
func (h *PostHandler) BookmarkPost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	postID := vars["id"]

	// Validate post ID
	if !utils.ValidatePostID(postID) {
		respondWithError(w, r, http.StatusBadRequest, "Invalid post ID")
		return
	}

	if err := h.postService.BookmarkPost(r.Context(), userID, postID); err != nil {
		// FIXED: Issue #17 - Sanitize error messages
		respondWithError(w, r, http.StatusInternalServerError, "Failed to update bookmark")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "Bookmark toggled successfully"})
}

// UpdatePost handles PUT /api/v1/posts/{id}
func (h *PostHandler) UpdatePost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	postID := vars["id"]

	// Validate post ID
	if !utils.ValidatePostID(postID) {
		respondWithError(w, r, http.StatusBadRequest, "Invalid post ID")
		return
	}

	var req models.UpdatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	post, err := h.postService.UpdatePost(r.Context(), userID, postID, &req)
	if err != nil {
		if err.Error() == "unauthorized: you can only update your own posts" {
			respondWithError(w, r, http.StatusForbidden, err.Error())
			return
		}
		respondWithError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, post)
}

// DeletePost handles DELETE /api/v1/posts/{id}
func (h *PostHandler) DeletePost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	postID := vars["id"]

	// Validate post ID
	if !utils.ValidatePostID(postID) {
		respondWithError(w, r, http.StatusBadRequest, "Invalid post ID")
		return
	}

	err := h.postService.DeletePost(r.Context(), userID, postID)
	if err != nil {
		if err.Error() == "unauthorized: you can only delete your own posts" {
			respondWithError(w, r, http.StatusForbidden, err.Error())
			return
		}
		respondWithError(w, r, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "Post deleted successfully"})
}

// respondWithJSON and respondWithError are now in handlers/utils.go
