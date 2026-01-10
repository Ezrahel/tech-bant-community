package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"tech-bant-community/server/middleware"
	"tech-bant-community/server/models"
	"tech-bant-community/server/services"
	"tech-bant-community/server/utils"

	"github.com/gorilla/mux"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(db *sql.DB) *UserHandler {
	return &UserHandler{
		userService: services.NewUserService(db),
	}
}

// GetCurrentUser handles GET /api/v1/users/me
func (h *UserHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	user, err := h.userService.GetUser(r.Context(), userID)
	if err != nil {
		respondWithError(w, r, http.StatusNotFound, "User not found")
		return
	}

	respondWithJSON(w, r, http.StatusOK, user)
}

// GetUser handles GET /api/v1/users/{id}
// FIXED: Issue #34 - Validate user ID format
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	// Validate user ID format
	if !utils.ValidateUserID(userID) {
		respondWithError(w, r, http.StatusBadRequest, "Invalid user ID")
		return
	}

	user, err := h.userService.GetUser(r.Context(), userID)
	if err != nil {
		respondWithError(w, r, http.StatusNotFound, "User not found")
		return
	}

	respondWithJSON(w, r, http.StatusOK, user)
}

// UpdateUser handles PUT /api/v1/users/me
// FIXED: Issue #18 - Filter updateable fields to prevent privilege escalation
func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	// FIXED: Issue #18 - Filter out sensitive fields that users cannot update
	// Users cannot update: isAdmin, isVerified, role, provider, ID, email
	// Only allow: name, bio, location, website, avatar
	filteredReq := models.UpdateProfileRequest{
		Name:     req.Name,
		Bio:      req.Bio,
		Location: req.Location,
		Website:  req.Website,
		Avatar:   req.Avatar,
	}

	user, err := h.userService.UpdateUser(r.Context(), userID, &filteredReq)
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	respondWithJSON(w, r, http.StatusOK, user)
}

// SearchUsers handles GET /api/v1/users/search
func (h *UserHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		respondWithError(w, r, http.StatusBadRequest, "Query parameter 'q' is required")
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 10
	}

	users, err := h.userService.SearchUsers(r.Context(), query, limit)
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, users)
}

// GetUserPosts handles GET /api/v1/users/{id}/posts
// FIXED: Issue #34 - Validate user ID format
func (h *UserHandler) GetUserPosts(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	// Validate user ID format
	if !utils.ValidateUserID(userID) {
		respondWithError(w, r, http.StatusBadRequest, "Invalid user ID")
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 20
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if offset < 0 {
		offset = 0
	}

	posts, err := h.userService.GetUserPosts(r.Context(), userID, limit, offset)
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, posts)
}
