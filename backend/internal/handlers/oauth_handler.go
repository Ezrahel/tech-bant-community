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
	ctx := c.Request.Context()
	url, state, err := h.oauthService.GetGoogleAuthURL(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// Store state in session/cookie for validation
	c.SetCookie("oauth_state", state, 600, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{
		"auth_url": url,
	})
}

func (h *OAuthHandler) GoogleCallback(c *gin.Context) {
	ctx := c.Request.Context()
	storedState, err := c.Cookie("oauth_state")
	if err != nil || storedState != c.Query("state") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state parameter"})
		return
	}
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code not provided"})
		return
	}
	authResponse, err := h.oauthService.HandleGoogleCallback(ctx, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.SetCookie("session_token", authResponse.Session, 86400*7, "/", "", false, true)
	redirectURL := "http://localhost:5173"
	if authResponse.User.IsAdmin {
		redirectURL = "http://localhost:5173/admin"
	}
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func (h *OAuthHandler) GitHubLogin(c *gin.Context) {
	ctx := c.Request.Context()
	url, state, err := h.oauthService.GetGitHubAuthURL(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.SetCookie("oauth_state", state, 600, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{
		"auth_url": url,
	})
}

func (h *OAuthHandler) GitHubCallback(c *gin.Context) {
	ctx := c.Request.Context()
	storedState, err := c.Cookie("oauth_state")
	if err != nil || storedState != c.Query("state") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state parameter"})
		return
	}
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code not provided"})
		return
	}
	authResponse, err := h.oauthService.HandleGitHubCallback(ctx, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.SetCookie("session_token", authResponse.Session, 86400*7, "/", "", false, true)
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
