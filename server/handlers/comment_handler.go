package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"tech-bant-community/server/middleware"
	"tech-bant-community/server/models"
	"tech-bant-community/server/services"

	"github.com/gorilla/mux"
)

type CommentHandler struct {
	commentService *services.CommentService
}

func NewCommentHandler(db *sql.DB) *CommentHandler {
	return &CommentHandler{
		commentService: services.NewCommentService(db),
	}
}

// CreateComment handles POST /api/v1/posts/{id}/comments
func (h *CommentHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	postID := vars["id"]

	var req models.CreateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Note: Nested comments (parent_id) support will be added later
	// For now, CreateComment doesn't support parentID parameter
	comment, err := h.commentService.CreateComment(r.Context(), userID, postID, &req)
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusCreated, comment)
}

// GetComments handles GET /api/v1/posts/{id}/comments
func (h *CommentHandler) GetComments(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postID := vars["id"]

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 20
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if offset < 0 {
		offset = 0
	}

	comments, err := h.commentService.GetComments(r.Context(), postID, limit, offset)
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, comments)
}

// LikeComment handles POST /api/v1/comments/{id}/like
func (h *CommentHandler) LikeComment(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	commentID := vars["id"]

	if err := h.commentService.LikeComment(r.Context(), userID, commentID); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "Like toggled successfully"})
}

// UpdateComment handles PUT /api/v1/comments/{id}
func (h *CommentHandler) UpdateComment(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	commentID := vars["id"]

	var req models.UpdateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	comment, err := h.commentService.UpdateComment(r.Context(), userID, commentID, &req)
	if err != nil {
		if err.Error() == "unauthorized: you can only update your own comments" {
			respondWithError(w, r, http.StatusForbidden, err.Error())
			return
		}
		respondWithError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, comment)
}

// DeleteComment handles DELETE /api/v1/comments/{id}
func (h *CommentHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	commentID := vars["id"]

	err := h.commentService.DeleteComment(r.Context(), userID, commentID)
	if err != nil {
		if err.Error() == "unauthorized: you can only delete your own comments" {
			respondWithError(w, r, http.StatusForbidden, err.Error())
			return
		}
		respondWithError(w, r, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "Comment deleted successfully"})
}
