package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"tech-bant-community/server/middleware"
	"tech-bant-community/server/models"
	"tech-bant-community/server/services"
)

type TwoFAHandler struct {
	twoFAService     *services.TwoFAService
	userService      *services.UserService
	emailService     *services.EmailService
	rateLimitService interface {
		CheckRateLimit(ctx context.Context, key string, limit services.EndpointLimit) (bool, int, time.Duration, error)
	}
}

func NewTwoFAHandler(twoFAService *services.TwoFAService, emailService *services.EmailService, rateLimitService interface {
	CheckRateLimit(ctx context.Context, key string, limit services.EndpointLimit) (bool, int, time.Duration, error)
}, db *sql.DB) *TwoFAHandler {
	return &TwoFAHandler{
		twoFAService:     twoFAService,
		userService:      services.NewUserService(db),
		emailService:     emailService,
		rateLimitService: rateLimitService,
	}
}

// Enable2FA handles POST /api/v1/auth/2fa/enable
func (h *TwoFAHandler) Enable2FA(w http.ResponseWriter, r *http.Request) {
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

	// Send OTP to email
	if err := h.twoFAService.SendLoginOTP(r.Context(), h.emailService, h.rateLimitService, userID, user.Email); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to send verification code")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{
		"message": "Verification code sent to your email",
	})
}

// Verify2FA handles POST /api/v1/auth/2fa/verify
func (h *TwoFAHandler) Verify2FA(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.Verify2FARequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Get user email for OTP verification
	user, err := h.userService.GetUser(r.Context(), userID)
	if err != nil {
		respondWithError(w, r, http.StatusNotFound, "User not found")
		return
	}

	// Verify OTP using email (OTP was sent via Resend API)
	valid, err := h.twoFAService.VerifyOTP(r.Context(), user.Email, req.Code, "2fa")
	if err != nil || !valid {
		respondWithError(w, r, http.StatusUnauthorized, "Invalid or expired code")
		return
	}

	// Enable 2FA
	if err := h.twoFAService.Enable2FA(r.Context(), userID); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to enable 2FA")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{
		"message": "2FA enabled successfully",
	})
}

// Disable2FA handles POST /api/v1/auth/2fa/disable
func (h *TwoFAHandler) Disable2FA(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	if err := h.twoFAService.Disable2FA(r.Context(), userID); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to disable 2FA")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{
		"message": "2FA disabled successfully",
	})
}

// SendOTP handles POST /api/v1/auth/2fa/send-otp
func (h *TwoFAHandler) SendOTP(w http.ResponseWriter, r *http.Request) {
	var req models.Enable2FARequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Find user by email
	users, err := h.userService.SearchUsers(r.Context(), req.Email, 1)
	if err != nil || len(users) == 0 {
		respondWithError(w, r, http.StatusNotFound, "User not found")
		return
	}

	user := users[0]
	if err := h.twoFAService.SendLoginOTP(r.Context(), h.emailService, h.rateLimitService, user.ID, user.Email); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to send verification code")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{
		"message": "Verification code sent to your email",
	})
}
