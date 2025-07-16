package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"nothing-community-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type OAuthHandler struct {
	oauthService *services.OAuthService
}

func NewOAuthHandler(oauthService *services.OAuthService) *OAuthHandler {
	return &OAuthHandler{
		oauthService: oauthService,
	}
}

func (h *OAuthHandler) GoogleLogin(c *gin.Context) {
	// Generate state for CSRF protection
	state := h.generateState()
	
	// Store state in session/cookie for validation
	c.SetCookie("oauth_state", state, 600, "/", "", false, true)
	
	// Get Google OAuth URL
	url := h.oauthService.GetGoogleAuthURL(state)
	
	c.JSON(http.StatusOK, gin.H{
		"auth_url": url,
	})
}

func (h *OAuthHandler) GoogleCallback(c *gin.Context) {
	// Verify state parameter
	storedState, err := c.Cookie("oauth_state")
	if err != nil || storedState != c.Query("state") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state parameter"})
		return
	}

	// Clear state cookie
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)

	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code not provided"})
		return
	}

	// Handle OAuth callback
	authResponse, err := h.oauthService.HandleGoogleCallback(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Set session cookie
	c.SetCookie("session_token", authResponse.Session, 86400*7, "/", "", false, true)

	// Redirect based on user role
	redirectURL := "http://localhost:5173"
	if authResponse.User.IsAdmin {
		redirectURL = "http://localhost:5173/admin"
	}

	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func (h *OAuthHandler) GitHubLogin(c *gin.Context) {
	// Generate state for CSRF protection
	state := h.generateState()
	
	// Store state in session/cookie for validation
	c.SetCookie("oauth_state", state, 600, "/", "", false, true)
	
	// Get GitHub OAuth URL
	url := h.oauthService.GetGitHubAuthURL(state)
	
	c.JSON(http.StatusOK, gin.H{
		"auth_url": url,
	})
}

func (h *OAuthHandler) GitHubCallback(c *gin.Context) {
	// Verify state parameter
	storedState, err := c.Cookie("oauth_state")
	if err != nil || storedState != c.Query("state") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state parameter"})
		return
	}

	// Clear state cookie
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)

	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code not provided"})
		return
	}

	// Handle OAuth callback
	authResponse, err := h.oauthService.HandleGitHubCallback(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Set session cookie
	c.SetCookie("session_token", authResponse.Session, 86400*7, "/", "", false, true)

	// Redirect based on user role
	redirectURL := "http://localhost:5173"
	if authResponse.User.IsAdmin {
		redirectURL = "http://localhost:5173/admin"
	}

	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func (h *OAuthHandler) generateState() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}