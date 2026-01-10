package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"tech-bant-community/server/middleware"
	"tech-bant-community/server/services"

	"github.com/gorilla/mux"
)

type FeaturesHandler struct {
	followService *services.FollowService
	reportService *services.ReportService
	banService    *services.BanService
}

func NewFeaturesHandler(db *sql.DB) *FeaturesHandler {
	return &FeaturesHandler{
		followService: services.NewFollowService(),
		reportService: services.NewReportService(),
		banService:    services.NewBanService(),
	}
}

// FollowUser handles POST /api/v1/users/{id}/follow
func (h *FeaturesHandler) FollowUser(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	followingID := vars["id"]

	if err := h.followService.FollowUser(r.Context(), userID, followingID); err != nil {
		respondWithError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "User followed successfully"})
}

// UnfollowUser handles POST /api/v1/users/{id}/unfollow
func (h *FeaturesHandler) UnfollowUser(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	followingID := vars["id"]

	if err := h.followService.UnfollowUser(r.Context(), userID, followingID); err != nil {
		respondWithError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "User unfollowed successfully"})
}

// ReportPost handles POST /api/v1/posts/{id}/report
func (h *FeaturesHandler) ReportPost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	postID := vars["id"]

	var req struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Reason == "" {
		respondWithError(w, r, http.StatusBadRequest, "Reason is required")
		return
	}

	if err := h.reportService.ReportPost(r.Context(), userID, postID, req.Reason); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to report post")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "Post reported successfully"})
}

// ReportComment handles POST /api/v1/comments/{id}/report
func (h *FeaturesHandler) ReportComment(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	commentID := vars["id"]

	var req struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Reason == "" {
		respondWithError(w, r, http.StatusBadRequest, "Reason is required")
		return
	}

	if err := h.reportService.ReportComment(r.Context(), userID, commentID, req.Reason); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to report comment")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "Comment reported successfully"})
}

// BanUser handles POST /api/v1/admin/users/{id}/ban (Admin only)
func (h *FeaturesHandler) BanUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	if err := h.banService.BanUser(r.Context(), userID); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to ban user")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "User banned successfully"})
}

// UnbanUser handles POST /api/v1/admin/users/{id}/unban (Admin only)
func (h *FeaturesHandler) UnbanUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	if err := h.banService.UnbanUser(r.Context(), userID); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to unban user")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "User unbanned successfully"})
}

// VerifyUser handles POST /api/v1/admin/users/{id}/verify (Admin only)
func (h *FeaturesHandler) VerifyUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	if err := h.banService.VerifyUser(r.Context(), userID); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to verify user")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "User verified successfully"})
}

// PromoteToAdmin handles POST /api/v1/admin/users/{id}/promote (Super Admin only)
func (h *FeaturesHandler) PromoteToAdmin(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	var req struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.banService.PromoteToAdmin(r.Context(), userID, req.Role); err != nil {
		respondWithError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "User promoted successfully"})
}

// GetReports handles GET /api/v1/admin/reports (Admin only)
func (h *FeaturesHandler) GetReports(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	status := r.URL.Query().Get("status")

	reports, err := h.reportService.GetReports(r.Context(), limit, offset, status)
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to get reports")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]interface{}{"reports": reports})
}

// ResolveReport handles POST /api/v1/admin/reports/{id}/resolve (Admin only)
func (h *FeaturesHandler) ResolveReport(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	reportID := vars["id"]

	adminID := middleware.GetUserID(r.Context())
	if adminID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req struct {
		Status string `json:"status"` // "resolved" or "rejected"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Status != "resolved" && req.Status != "rejected" {
		respondWithError(w, r, http.StatusBadRequest, "Status must be 'resolved' or 'rejected'")
		return
	}

	if err := h.reportService.ResolveReport(r.Context(), reportID, req.Status, adminID); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to resolve report")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "Report resolved successfully"})
}
