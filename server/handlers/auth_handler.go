package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"tech-bant-community/server/config"
	"tech-bant-community/server/middleware"
	"tech-bant-community/server/models"
	"tech-bant-community/server/services"
)

type AuthHandler struct {
	authService  *services.AuthService
	cfg          *config.Config
	emailService *services.EmailService
	twoFAService *services.TwoFAService
}

func NewAuthHandler(cfg *config.Config, emailService *services.EmailService, twoFAService *services.TwoFAService) *AuthHandler {
	return &AuthHandler{
		authService:  services.NewAuthService(cfg, nil), // DB will be set if needed
		cfg:          cfg,
		emailService: emailService,
		twoFAService: twoFAService,
	}
}

// NewAuthHandlerWithService creates an AuthHandler with a pre-created AuthService
func NewAuthHandlerWithService(cfg *config.Config, authService *services.AuthService, emailService *services.EmailService, twoFAService *services.TwoFAService) *AuthHandler {
	return &AuthHandler{
		authService:  authService,
		cfg:          cfg,
		emailService: emailService,
		twoFAService: twoFAService,
	}
}

// SetAuthService sets the auth service (for updating after creation)
func (h *AuthHandler) SetAuthService(authService *services.AuthService) {
	h.authService = authService
}

// Signup handles POST /api/v1/auth/signup
func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req models.AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	ipAddress := getClientIP(r)
	userAgent := r.Header.Get("User-Agent")

	response, err := h.authService.SignupSupabase(r.Context(), &req, h.cfg, ipAddress, userAgent)
	if err != nil {
		respondWithError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusCreated, response)
}

// Login handles POST /api/v1/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	ipAddress := getClientIP(r)
	userAgent := r.Header.Get("User-Agent")

	response, err := h.authService.LoginSupabase(r.Context(), &req, h.cfg, ipAddress, userAgent)
	if err != nil {
		// FIXED: Issue #35 - Log failed auth attempts in handler
		h.authService.RecordFailedLogin(r.Context(), req.Email, ipAddress, userAgent)
		// Use generic error message to prevent information leakage
		respondWithError(w, r, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	respondWithJSON(w, r, http.StatusOK, response)
}

// RefreshToken handles POST /api/v1/auth/refresh
// FIXED: Issue #54 - Validate refresh token format
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req models.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	// FIXED: Issue #54 - Validate refresh token format
	if req.RefreshToken == "" || len(req.RefreshToken) < 32 || len(req.RefreshToken) > 256 {
		respondWithError(w, r, http.StatusBadRequest, "Invalid refresh token format")
		return
	}

	ipAddress := getClientIP(r)
	userAgent := r.Header.Get("User-Agent")

	response, err := h.authService.RefreshToken(r.Context(), req.RefreshToken, ipAddress, userAgent)
	if err != nil {
		respondWithError(w, r, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	respondWithJSON(w, r, http.StatusOK, response)
}

// Logout handles POST /api/v1/auth/logout
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req models.RefreshTokenRequest
	json.NewDecoder(r.Body).Decode(&req) // Optional refresh token

	ipAddress := getClientIP(r)
	userAgent := r.Header.Get("User-Agent")

	if err := h.authService.Logout(r.Context(), req.RefreshToken, userID, ipAddress, userAgent); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to logout")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

// ChangePassword handles POST /api/v1/auth/change-password
func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	ipAddress := getClientIP(r)
	userAgent := r.Header.Get("User-Agent")

	if err := h.authService.ChangePassword(r.Context(), userID, &req, ipAddress, userAgent); err != nil {
		respondWithError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "Password changed successfully"})
}

// VerifyToken handles GET /api/v1/auth/verify
func (h *AuthHandler) VerifyToken(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Missing authorization header")
		return
	}

	// Extract token
	token := extractToken(authHeader)
	if token == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Invalid authorization header")
		return
	}

	decodedToken, user, err := h.authService.VerifyToken(r.Context(), token)
	if err != nil {
		respondWithError(w, r, http.StatusUnauthorized, err.Error())
		return
	}

	permissions := models.GetRolePermissions(user.Role)

	respondWithJSON(w, r, http.StatusOK, map[string]interface{}{
		"valid":       true,
		"user":        user,
		"roles":       []string{user.Role},
		"permissions": permissions,
		"expiresAt":   decodedToken.Expires,
	})
}

// RequestPasswordReset handles POST /api/v1/auth/reset-password
func (h *AuthHandler) RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	var req models.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	ipAddress := getClientIP(r)
	userAgent := r.Header.Get("User-Agent")

	// Request password reset (sends OTP email)
	err := h.authService.RequestPasswordReset(r.Context(), req.Email, h.emailService, h.twoFAService, ipAddress, userAgent)
	if err != nil {
		// Use generic error message for security
		respondWithError(w, r, http.StatusBadRequest, "If the email exists, a reset code has been sent")
		return
	}

	// Always return success to prevent email enumeration
	respondWithJSON(w, r, http.StatusOK, map[string]string{
		"message": "If the email exists, a password reset code has been sent to your email",
	})
}

// ConfirmPasswordReset handles POST /api/v1/auth/reset-password/confirm
func (h *AuthHandler) ConfirmPasswordReset(w http.ResponseWriter, r *http.Request) {
	var req models.ConfirmPasswordResetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	ipAddress := getClientIP(r)
	userAgent := r.Header.Get("User-Agent")

	// Confirm password reset (verifies OTP and sets new password)
	err := h.authService.ConfirmPasswordReset(r.Context(), req.Email, req.OTPCode, req.NewPassword, h.twoFAService, ipAddress, userAgent)
	if err != nil {
		respondWithError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{
		"message": "Password reset successfully. Please login with your new password",
	})
}

// Helper functions
func getClientIP(r *http.Request) string {
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		return forwarded
	}
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return realIP
	}
	return r.RemoteAddr
}

func extractToken(authHeader string) string {
	parts := strings.Split(authHeader, " ")
	if len(parts) == 2 && parts[0] == "Bearer" {
		return parts[1]
	}
	return ""
}
