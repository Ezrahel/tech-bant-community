package handlers

import (
	"fmt"
	"net/http"

	"tech-bant-community/server/config"
	"tech-bant-community/server/models"
	"tech-bant-community/server/services"
)

type OAuthHandler struct {
	oauthService *services.OAuthService
	cfg          *config.Config
}

func NewOAuthHandler(oauthService *services.OAuthService) *OAuthHandler {
	return &OAuthHandler{
		oauthService: oauthService,
		cfg:          oauthService.GetConfig(), // Get config from service
	}
}

// InitiateGoogleOAuth handles GET /api/v1/auth/oauth/google
// FIXED: Validates redirect URL against whitelist
func (h *OAuthHandler) InitiateGoogleOAuth(w http.ResponseWriter, r *http.Request) {
	state, err := h.oauthService.GenerateState()
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to generate state")
		return
	}

	redirectURL := r.URL.Query().Get("redirect_url")
	
	// Validate redirect URL against whitelist (FIXED: Issue #4)
	if redirectURL != "" {
		if !h.oauthService.ValidateRedirectURL(redirectURL) {
			respondWithError(w, r, http.StatusBadRequest, "Invalid redirect URL")
			return
		}
	} else {
		// Default to first allowed redirect
		allowed := h.oauthService.GetAllowedRedirects()
		if len(allowed) > 0 {
			redirectURL = allowed[0]
		} else {
			redirectURL = "http://localhost:5173"
		}
	}

	oauthState := &models.OAuthState{
		State:       state,
		Provider:    models.OAuthProviderGoogle,
		RedirectURL: redirectURL,
	}

	// Store state
	if err := h.oauthService.StoreOAuthState(r.Context(), oauthState); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to store state")
		return
	}

	// Get Google OAuth URL
	authURL := h.oauthService.GetGoogleAuthURL(state)

	respondWithJSON(w, r, http.StatusOK, map[string]string{
		"auth_url": authURL,
		"state":    state,
	})
}

// GoogleOAuthCallback handles GET /api/v1/auth/oauth/google/callback
func (h *OAuthHandler) GoogleOAuthCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")

	if code == "" || state == "" {
		respondWithError(w, r, http.StatusBadRequest, "Missing code or state")
		return
	}

	// Verify state
	oauthState, err := h.oauthService.VerifyOAuthState(r.Context(), state)
	if err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Invalid or expired state")
		return
	}

	// Exchange code for token
	token, err := h.oauthService.ExchangeGoogleCode(r.Context(), code)
	if err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Failed to exchange code")
		return
	}

	// Get user info from Google
	userInfo, err := h.oauthService.GetGoogleUserInfo(r.Context(), token)
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to get user info")
		return
	}

	// Create or update user
	user, isNewUser, err := h.oauthService.CreateOrUpdateUserFromOAuth(r.Context(), models.OAuthProviderGoogle, userInfo, h.cfg)
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// For Supabase, we need to create a session token
	// This should be done via Supabase Auth, but for now we'll use a placeholder
	// The actual token should come from Supabase OAuth callback
	customToken := "supabase_oauth_token_placeholder" // TODO: Get actual token from Supabase OAuth

	// Get permissions
	permissions := models.GetRolePermissions(user.Role)

	response := models.OAuthResponse{
		Token:       customToken,
		ExpiresIn:   86400, // 24 hours
		User:        user,
		IsNewUser:   isNewUser,
		Roles:       []string{user.Role},
		Permissions: permissions,
	}

	// Redirect to frontend with token in fragment (FIXED: Issue #5 - Token not in URL query)
	// Use fragment identifier to prevent token from appearing in server logs, referrer headers, or browser history
	if oauthState.RedirectURL != "" {
		// Use fragment identifier (#) instead of query parameter (?)
		redirectURL := fmt.Sprintf("%s#token=%s&isNewUser=%t", oauthState.RedirectURL, customToken, isNewUser)
		http.Redirect(w, r, redirectURL, http.StatusFound)
		return
	}

	respondWithJSON(w, r, http.StatusOK, response)
}
