package services

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"tech-bant-community/server/config"
	"tech-bant-community/server/database"
	"tech-bant-community/server/models"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// OAuthService handles OAuth operations
type OAuthService struct {
	cfg         *config.Config
	db          *sql.DB
	googleOAuth *oauth2.Config
}

// GetConfig returns the config
func (s *OAuthService) GetConfig() *config.Config {
	return s.cfg
}

// GenerateState generates a random OAuth state string
func (s *OAuthService) GenerateState() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// ValidateRedirectURL validates redirect URL against whitelist
func (s *OAuthService) ValidateRedirectURL(url string) bool {
	if s.cfg == nil {
		return false
	}
	for _, allowed := range s.cfg.AllowedOAuthRedirects {
		if url == allowed {
			return true
		}
	}
	return false
}

// GetAllowedRedirects returns allowed redirect URLs
func (s *OAuthService) GetAllowedRedirects() []string {
	if s.cfg == nil {
		return []string{}
	}
	return s.cfg.AllowedOAuthRedirects
}

// NewOAuthService creates a new OAuthService instance
func NewOAuthService(cfg *config.Config) *OAuthService {
	googleOAuth := &oauth2.Config{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.OAuthRedirectURL,
		Scopes:       []string{"openid", "profile", "email"},
		Endpoint:     google.Endpoint,
	}

	return &OAuthService{
		cfg:         cfg,
		db:          nil, // Can be set if needed
		googleOAuth: googleOAuth,
	}
}

// StoreOAuthState stores OAuth state in PostgreSQL
func (s *OAuthService) StoreOAuthState(ctx context.Context, state *models.OAuthState) error {
	query := `
		INSERT INTO public.oauth_states (state, provider, redirect_url, user_id, created_at, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (state) DO UPDATE SET expires_at = $6
	`

	var userIDPtr *string
	if state.UserID != "" {
		userIDPtr = &state.UserID
	}

	now := time.Now().UTC()
	expiresAt := now.Add(10 * time.Minute)

	_, err := database.ExecWithContext(ctx, query,
		state.State, string(state.Provider), state.RedirectURL, userIDPtr, now, expiresAt,
	)
	return err
}

// VerifyOAuthState verifies and retrieves OAuth state from PostgreSQL
func (s *OAuthService) VerifyOAuthState(ctx context.Context, state string) (*models.OAuthState, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	query := `
		SELECT state, provider, redirect_url, user_id, created_at, expires_at
		FROM public.oauth_states
		WHERE state = $1
		FOR UPDATE
	`

	row := database.QueryRowWithContext(ctx, query, state)
	var oauthState models.OAuthState
	var providerStr string
	var redirectURL sql.NullString
	var userID sql.NullString
	var createdAt time.Time
	var expiresAt time.Time

	err := row.Scan(&oauthState.State, &providerStr, &redirectURL, &userID, &createdAt, &expiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("invalid state")
		}
		return nil, err
	}

	// Check expiry
	if expiresAt.Before(time.Now().UTC()) {
		// Delete expired state
		_, _ = database.ExecWithContext(ctx, "DELETE FROM public.oauth_states WHERE state = $1", state)
		return nil, errors.New("state expired")
	}

	oauthState.Provider = models.OAuthProvider(providerStr)
	if redirectURL.Valid {
		oauthState.RedirectURL = redirectURL.String
	}
	if userID.Valid {
		oauthState.UserID = userID.String
	}

	// Delete state after use
	_, _ = database.ExecWithContext(ctx, "DELETE FROM public.oauth_states WHERE state = $1", state)

	return &oauthState, nil
}

// CreateOrUpdateUserFromOAuth creates or updates user from OAuth using Supabase
func (s *OAuthService) CreateOrUpdateUserFromOAuth(ctx context.Context, provider models.OAuthProvider, userInfo *models.GoogleUserInfo, cfg *config.Config) (*models.User, bool, error) {
	// Check if user exists by email
	query := "SELECT id, name, email, avatar, is_admin, is_verified, is_active, role, provider, posts_count, followers_count, following_count, created_at, updated_at FROM public.users WHERE email = $1"
	row := database.QueryRowWithContext(ctx, query, userInfo.Email)

	var user models.User
	var avatar sql.NullString
	err := row.Scan(
		&user.ID, &user.Name, &user.Email, &avatar, &user.IsAdmin, &user.IsVerified, &user.IsActive,
		&user.Role, &user.Provider, &user.PostsCount, &user.FollowersCount, &user.FollowingCount,
		&user.CreatedAt, &user.UpdatedAt,
	)

	isNewUser := false

	if err == sql.ErrNoRows {
		// User doesn't exist, create new using Supabase Auth
		isNewUser = true

		// Create user in Supabase Auth (OAuth users are created by Supabase, so we need to link)
		// For OAuth, Supabase creates the user automatically, so we create profile
		// In practice, Supabase OAuth callback will provide the user ID
		// For now, we'll create a user profile that will be linked when Supabase creates the auth user

		// Note: In Supabase, OAuth users are created automatically by Supabase Auth
		// We need to get the user ID from the OAuth callback token
		// This method should be called after Supabase OAuth callback provides the user ID

		// For now, return error indicating we need user ID from Supabase
		return nil, false, fmt.Errorf("OAuth user creation should be handled by Supabase Auth callback")
	} else if err != nil {
		return nil, false, fmt.Errorf("failed to check user: %w", err)
	}

	// User exists, update
	if avatar.Valid {
		user.Avatar = avatar.String
	}

	// Update user info
	updateQuery := `
		UPDATE public.users
		SET name = $1, avatar = $2, updated_at = $3, is_verified = COALESCE(is_verified, $4)
		WHERE id = $5
	`
	_, err = database.ExecWithContext(ctx, updateQuery,
		userInfo.Name, userInfo.Picture, time.Now().UTC(), userInfo.VerifiedEmail, user.ID,
	)
	if err != nil {
		return nil, false, err
	}

	user.Name = userInfo.Name
	user.Avatar = userInfo.Picture
	if userInfo.VerifiedEmail {
		user.IsVerified = true
	}

	return &user, isNewUser, nil
}

// GetGoogleAuthURL returns Google OAuth authorization URL (unchanged)
func (s *OAuthService) GetGoogleAuthURL(state string) string {
	return s.googleOAuth.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
}

// ExchangeGoogleCode exchanges authorization code for token (unchanged)
func (s *OAuthService) ExchangeGoogleCode(ctx context.Context, code string) (*oauth2.Token, error) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var token *oauth2.Token
	var err error
	maxRetries := 3
	baseDelay := 1 * time.Second

	for attempt := 0; attempt < maxRetries; attempt++ {
		token, err = s.googleOAuth.Exchange(ctx, code)
		if err == nil {
			return token, nil
		}

		if attempt < maxRetries-1 {
			delay := baseDelay * time.Duration(1<<uint(attempt))
			time.Sleep(delay)
		}
	}

	return nil, err
}

// GetGoogleUserInfo gets user info from Google (unchanged)
func (s *OAuthService) GetGoogleUserInfo(ctx context.Context, token *oauth2.Token) (*models.GoogleUserInfo, error) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	maxRetries := 3
	baseDelay := 1 * time.Second

	for attempt := 0; attempt < maxRetries; attempt++ {
		client := s.googleOAuth.Client(ctx, token)
		resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
		if err == nil {
			defer resp.Body.Close()

			if resp.StatusCode == http.StatusOK {
				body, err := io.ReadAll(resp.Body)
				if err == nil {
					var userInfo models.GoogleUserInfo
					if err := json.Unmarshal(body, &userInfo); err == nil {
						return &userInfo, nil
					}
				}
			}

			if resp.StatusCode < 500 {
				return nil, fmt.Errorf("failed to get user info: status %d", resp.StatusCode)
			}
		}

		if attempt < maxRetries-1 {
			delay := baseDelay * time.Duration(1<<uint(attempt))
			time.Sleep(delay)
			continue
		}

		if err != nil {
			return nil, err
		}
		return nil, errors.New("failed to get user info after retries")
	}

	return nil, errors.New("failed to get user info")
}
