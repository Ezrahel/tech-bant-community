package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"nothing-community-backend/internal/database"
	"nothing-community-backend/internal/config"
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

	googleConfig := &oauth2.Config{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  "http://localhost:8080/api/v1/auth/google/callback",
		Scopes:       []string{"openid", "profile", "email"},
		Endpoint:     google.Endpoint,
	}

	githubConfig := &oauth2.Config{
		ClientID:     cfg.GitHubClientID,
		ClientSecret: cfg.GitHubClientSecret,
		RedirectURL:  "http://localhost:8080/api/v1/auth/github/callback",
		Scopes:       []string{"user:email"},
		Endpoint:     github.Endpoint,
	}

	return &OAuthService{
		appwriteClient: appwriteClient,
		config:         cfg,
		googleConfig:   googleConfig,
		githubConfig:   githubConfig,
	}
}

func (s *OAuthService) GetGoogleAuthURL(state string) string {
	return s.googleConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

func (s *OAuthService) GetGitHubAuthURL(state string) string {
	return s.githubConfig.AuthCodeURL(state)
}

func (s *OAuthService) HandleGoogleCallback(code string) (*models.AuthResponse, error) {
	token, err := s.googleConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %v", err)
	}

	// Get user info from Google
	client := s.googleConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	var googleUser GoogleUserInfo
	if err := json.Unmarshal(body, &googleUser); err != nil {
		return nil, fmt.Errorf("failed to parse user info: %v", err)
	}

	// Create or get user
	return s.createOrGetUser(googleUser.Email, googleUser.Name, googleUser.Picture, "google")
}

func (s *OAuthService) HandleGitHubCallback(code string) (*models.AuthResponse, error) {
	token, err := s.githubConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %v", err)
	}

	// Get user info from GitHub
	client := s.githubConfig.Client(context.Background(), token)
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	var githubUser GitHubUserInfo
	if err := json.Unmarshal(body, &githubUser); err != nil {
		return nil, fmt.Errorf("failed to parse user info: %v", err)
	}

	// Get email if not provided
	email := githubUser.Email
	if email == "" {
		email, err = s.getGitHubUserEmail(client)
		if err != nil {
			return nil, fmt.Errorf("failed to get user email: %v", err)
		}
	}

	name := githubUser.Name
	if name == "" {
		name = githubUser.Login
	}

	// Create or get user
	return s.createOrGetUser(email, name, githubUser.AvatarURL, "github")
}

func (s *OAuthService) getGitHubUserEmail(client *http.Client) (string, error) {
	resp, err := client.Get("https://api.github.com/user/emails")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var emails []struct {
		Email   string `json:"email"`
		Primary bool   `json:"primary"`
	}

	if err := json.Unmarshal(body, &emails); err != nil {
		return "", err
	}

	for _, email := range emails {
		if email.Primary {
			return email.Email, nil
		}
	}

	if len(emails) > 0 {
		return emails[0].Email, nil
	}

	return "", fmt.Errorf("no email found")
}

func (s *OAuthService) createOrGetUser(email, name, avatar, provider string) (*models.AuthResponse, error) {
	// Check if user exists in Appwrite database
	existingUser, err := s.getUserByEmail(email)
	if err == nil && existingUser != nil {
		// User exists, create session
		session, err := s.createUserSession(existingUser.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to create session: %v", err)
		}

		return &models.AuthResponse{
			User:    *existingUser,
			Session: session,
		}, nil
	}

	// Create new user in Appwrite Auth
	account, err := s.appwriteClient.Account.Create(
		"unique()",
		email,
		"oauth_user_temp_password", // Temporary password for OAuth users
		&name,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create account: %v", err)
	}

	// Create user profile in database
	user := models.User{
		ID:         account.Id,
		Name:       name,
		Email:      email,
		Avatar:     avatar,
		IsAdmin:    email == s.config.AdminEmail, // Check if admin email
		IsVerified: true,                         // OAuth users are verified
		IsActive:   true,
		Provider:   provider,
	}

	if err := s.createUserProfile(user); err != nil {
		return nil, fmt.Errorf("failed to create user profile: %v", err)
	}

	// Create session
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
		queries,
	)
	if err != nil {
		return nil, err
	}

	if len(docs.Documents) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	var user models.User
	if err := s.mapDocumentToUser(docs.Documents[0].Data, &user); err != nil {
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
		nil,
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