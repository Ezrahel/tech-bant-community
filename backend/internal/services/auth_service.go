package services

import (
	"fmt"
	"nothing-community-backend/internal/database"
	"nothing-community-backend/internal/models"

	"github.com/appwrite/sdk-for-go/appwrite"
)

type AuthService struct {
	appwriteClient *database.AppwriteClient
	userService    *UserService
}

	return &AuthService{
		appwriteClient: appwriteClient,
		userService:    userService,
	}
}

func (s *AuthService) Register(req models.CreateUserRequest) (*models.AuthResponse, error) {
	// Create account in Appwrite Auth
	account, err := s.appwriteClient.Account.Create(
		appwrite.ID.Unique(),
		req.Email,
		req.Password,
		&req.Name,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create account: %v", err)
	}

	// Create session
	session, err := s.appwriteClient.Account.CreateEmailSession(req.Email, req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %v", err)
	}

	// Create user profile in database
	user := models.User{
		ID:         account.Id,
		Name:       req.Name,
		Email:      req.Email,
		Avatar:     "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop",
		IsAdmin:    false,
		IsVerified: false,
		IsActive:   true,
	}

	if err := s.userService.CreateUser(user); err != nil {
		return nil, fmt.Errorf("failed to create user profile: %v", err)
	}

	return &models.AuthResponse{
		User:    user,
		Session: session.Secret,
	}, nil
}

func (s *AuthService) Login(req models.LoginRequest) (*models.AuthResponse, error) {
	// Create session
	session, err := s.appwriteClient.Account.CreateEmailSession(req.Email, req.Password)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials: %v", err)
	}

	// Set session for client
	s.appwriteClient.Client.SetSession(session.Secret)

	// Get account info
	account, err := s.appwriteClient.Account.Get()
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %v", err)
	}

	// Get user profile
	user, err := s.userService.GetUserByID(account.Id)
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile: %v", err)
	}

	return &models.AuthResponse{
		User:    *user,
		Session: session.Secret,
	}, nil
}

func (s *AuthService) Logout(sessionToken string) error {
	// Set session for client
	s.appwriteClient.Client.SetSession(sessionToken)

	// Delete current session
	_, err := s.appwriteClient.Account.DeleteSession("current")
	if err != nil {
		return fmt.Errorf("failed to logout: %v", err)
	}

	return nil
}

func (s *AuthService) GetCurrentUser(sessionToken string) (*models.User, error) {
	// Set session for client
	s.appwriteClient.Client.SetSession(sessionToken)

	// Get account info
	account, err := s.appwriteClient.Account.Get()
	if err != nil {
		return nil, fmt.Errorf("invalid session: %v", err)
	}

	// Get user profile
	user, err := s.userService.GetUserByID(account.Id)
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile: %v", err)
	}

	return user, nil
}