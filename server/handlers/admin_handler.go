package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"tech-bant-community/server/config"
	"tech-bant-community/server/models"
	"tech-bant-community/server/services"

	"github.com/gorilla/mux"
)

type AdminHandler struct {
	adminService *services.AdminService
	userService  *services.UserService
	cfg          *config.Config
}

func NewAdminHandler(db *sql.DB, cfg *config.Config) *AdminHandler {
	return &AdminHandler{
		adminService: services.NewAdminService(db),
		userService:  services.NewUserService(db),
		cfg:          cfg,
	}
}

// GetStats handles GET /api/v1/admin/stats
func (h *AdminHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.adminService.GetStats(r.Context())
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, stats)
}

// GetAdmins handles GET /api/v1/admin/admins
// FIXED: Issue #61 - Add pagination
func (h *AdminHandler) GetAdmins(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	admins, err := h.adminService.GetAdmins(r.Context(), limit, offset)
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to retrieve admins")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]interface{}{"admins": admins})
}

// CreateAdmin handles POST /api/v1/admin/admins
func (h *AdminHandler) CreateAdmin(w http.ResponseWriter, r *http.Request) {
	var req models.CreateAdminRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	admin, err := h.adminService.CreateAdmin(r.Context(), &req, h.cfg)
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusCreated, admin)
}

// UpdateAdminRole handles PUT /api/v1/admin/admins/{id}/role
func (h *AdminHandler) UpdateAdminRole(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	adminID := vars["id"]

	var req models.UpdateAdminRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.adminService.UpdateAdminRole(r.Context(), adminID, req.Role); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, err.Error())
		return
	}

	// Get updated admin
	admin, err := h.userService.GetUser(r.Context(), adminID)
	if err != nil {
		respondWithError(w, r, http.StatusNotFound, "Admin not found")
		return
	}

	respondWithJSON(w, r, http.StatusOK, admin)
}

// DeleteAdmin handles DELETE /api/v1/admin/admins/{id}
func (h *AdminHandler) DeleteAdmin(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	adminID := vars["id"]

	if err := h.adminService.DeleteAdmin(r.Context(), adminID, h.cfg); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "Admin deleted successfully"})
}
