package services

import (
	context "context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"nothing-community-backend/internal/config"
	"nothing-community-backend/internal/database"
	"nothing-community-backend/internal/models"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

type OAuthService struct {
	appwriteClient *database.AppwriteClient
	config         *config.Config
	googleConfig   *oauth2.Config
	githubConfig   *oauth2.Config
	httpClient     *http.Client
}

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	VerifiedEmail bool   `json:"verified_email"`
}

type GitHubUserInfo struct {
	ID        int    `json:"id"`
	Login     string `json:"login"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
}

func NewOAuthService(appwriteClient *database.AppwriteClient, cfg *config.Config) *OAuthService {
	googleConfig := &oauth2.Config{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.GoogleRedirectURL,
		Scopes:       []string{"openid", "profile", "email"},
		Endpoint:     google.Endpoint,
	}
	githubConfig := &oauth2.Config{
		ClientID:     cfg.GitHubClientID,
		ClientSecret: cfg.GitHubClientSecret,
		RedirectURL:  cfg.GitHubRedirectURL,
		Scopes:       []string{"user:email"},
		Endpoint:     github.Endpoint,
	}
	// Shared HTTP client with timeout
	httpClient := &http.Client{Timeout: 10 * time.Second}
	return &OAuthService{
		appwriteClient: appwriteClient,
		config:         cfg,
		googleConfig:   googleConfig,
		githubConfig:   githubConfig,
		httpClient:     httpClient,
	}
}

// Secure random state generator
func generateState() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func (s *OAuthService) GetGoogleAuthURL(ctx context.Context) (string, string, error) {
	state, err := generateState()
	if err != nil {
		return "", "", err
	}
	url := s.googleConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	return url, state, nil
}

func (s *OAuthService) GetGitHubAuthURL(ctx context.Context) (string, string, error) {
	state, err := generateState()
	if err != nil {
		return "", "", err
	}
	url := s.githubConfig.AuthCodeURL(state)
	return url, state, nil
}

func (s *OAuthService) HandleGoogleCallback(ctx context.Context, code string) (*models.AuthResponse, error) {
	token, err := s.googleConfig.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	client := s.googleConfig.Client(ctx, token)
	userInfo, err := fetchGoogleUserInfo(ctx, client)
	if err != nil {
		return nil, err
	}
	return s.createOrGetUser(userInfo.Email, userInfo.Name, userInfo.Picture, "google")
}

func (s *OAuthService) HandleGitHubCallback(ctx context.Context, code string) (*models.AuthResponse, error) {
	token, err := s.githubConfig.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	client := s.githubConfig.Client(ctx, token)
	userInfo, err := fetchGitHubUserInfo(ctx, client)
	if err != nil {
		return nil, err
	}
	return s.createOrGetUser(userInfo.Email, userInfo.Name, userInfo.AvatarURL, "github")
}

// --- User Info Fetchers ---

func fetchGoogleUserInfo(ctx context.Context, client *http.Client) (*GoogleUserInfo, error) {
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get Google user info: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, errors.New("Google user info request failed")
	}
	var info GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, fmt.Errorf("failed to decode Google user info: %w", err)
	}
	return &info, nil
}

func fetchGitHubUserInfo(ctx context.Context, client *http.Client) (*GitHubUserInfo, error) {
	// Fetch user profile
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user", nil)
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get GitHub user info: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, errors.New("GitHub user info request failed")
	}
	var info GitHubUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, fmt.Errorf("failed to decode GitHub user info: %w", err)
	}
	// If email is empty, fetch emails
	if info.Email == "" {
		email, err := fetchGitHubPrimaryEmail(ctx, client)
		if err != nil {
			return nil, err
		}
		info.Email = email
	}
	if info.Name == "" {
		info.Name = info.Login
	}
	return &info, nil
}

func fetchGitHubPrimaryEmail(ctx context.Context, client *http.Client) (string, error) {
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user/emails", nil)
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to get GitHub emails: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return "", errors.New("GitHub emails request failed")
	}
	var emails []struct {
		Email   string `json:"email"`
		Primary bool   `json:"primary"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&emails); err != nil {
		return "", fmt.Errorf("failed to decode GitHub emails: %w", err)
	}
	for _, email := range emails {
		if email.Primary {
			return email.Email, nil
		}
	}
	if len(emails) > 0 {
		return emails[0].Email, nil
	}
	return "", errors.New("no email found")
}

// --- User Creation/Session Logic (unchanged, but can be optimized if needed) ---

func (s *OAuthService) createOrGetUser(email, name, avatar, provider string) (*models.AuthResponse, error) {
	existingUser, err := s.getUserByEmail(email)
	if err == nil && existingUser != nil {
		session, err := s.createUserSession(existingUser.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to create session: %v", err)
		}
		return &models.AuthResponse{
			User:    *existingUser,
			Session: session,
		}, nil
	}
	account, err := s.appwriteClient.Account.Create(
		"unique()",
		email,
		"oauth_user_temp_password",
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create account: %v", err)
	}
	user := models.User{
		ID:         account.Id,
		Name:       name,
		Email:      email,
		Avatar:     avatar,
		IsAdmin:    email == s.config.AdminEmail,
		IsVerified: true,
		IsActive:   true,
		Provider:   provider,
	}
	if err := s.createUserProfile(user); err != nil {
		return nil, fmt.Errorf("failed to create user profile: %v", err)
	}
	session, err := s.createUserSession(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %v", err)
	}
	return &models.AuthResponse{
		User:    user,
		Session: session,
	}, nil
}

func (s *OAuthService) getUserByEmail(email string) (*models.User, error) {
	queries := []string{
		fmt.Sprintf("equal(\"email\", \"%s\")", email),
	}
	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		s.appwriteClient.Database.WithListDocumentsQueries(queries),
	)
	if err != nil {
		return nil, err
	}
	if len(docs.Documents) == 0 {
		return nil, fmt.Errorf("user not found")
	}
	var user models.User
	if err := s.mapDocumentToUser(docs.Documents[0], &user); err != nil {
		return nil, err
	}
	user.ID = docs.Documents[0].Id
	return &user, nil
}

func (s *OAuthService) createUserProfile(user models.User) error {
	userData := map[string]interface{}{
		"name":        user.Name,
		"email":       user.Email,
		"avatar":      user.Avatar,
		"bio":         "",
		"location":    "",
		"website":     "",
		"is_admin":    user.IsAdmin,
		"is_verified": user.IsVerified,
		"is_active":   user.IsActive,
		"provider":    user.Provider,
	}
	_, err := s.appwriteClient.Database.CreateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteUsersCollectionID,
		user.ID,
		userData,
	)
	return err
}

func (s *OAuthService) createUserSession(userID string) (string, error) {
	// For OAuth users, we create a custom session token
	// In a real implementation, you might want to use JWT or Appwrite sessions
	return fmt.Sprintf("oauth_session_%s", userID), nil
}

func (s *OAuthService) mapDocumentToUser(data interface{}, user *models.User) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return json.Unmarshal(jsonData, user)
}
