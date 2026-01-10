package services

import (
	"bytes"
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"tech-bant-community/server/config"
	"tech-bant-community/server/database"
	"tech-bant-community/server/models"
	"tech-bant-community/server/utils"

	"github.com/google/uuid"
)

// AuthService handles authentication operations
type AuthService struct {
	db                 *sql.DB
	cfg                *config.Config
	maxLoginAttempts   int
	lockoutDuration    time.Duration
	passwordMinLength  int
	sessionExpiry      time.Duration
	refreshTokenExpiry time.Duration
}

// NewAuthService creates a new AuthService instance
func NewAuthService(cfg *config.Config, db *sql.DB) *AuthService {
	return &AuthService{
		db:                 db,
		cfg:                cfg,
		maxLoginAttempts:   5,
		lockoutDuration:    15 * time.Minute,
		passwordMinLength:  8,
		sessionExpiry:      24 * time.Hour,
		refreshTokenExpiry: 7 * 24 * time.Hour,
	}
}

// SupabaseAuthResponse represents Supabase auth API response
type SupabaseAuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	} `json:"user"`
}

// Signup creates a new user account using Supabase Auth REST API
func (s *AuthService) SignupSupabase(ctx context.Context, req *models.AuthRequest, cfg *config.Config, ipAddress, userAgent string) (*models.AuthResponse, error) {
	// Validate input
	if err := s.validateEmail(req.Email); err != nil {
		return nil, err
	}
	if err := s.validatePassword(req.Password); err != nil {
		return nil, err
	}
	if strings.TrimSpace(req.Name) == "" {
		return nil, errors.New("name is required")
	}

	// Check if email already exists
	existingUser, err := s.getUserByEmail(ctx, req.Email)
	if err == nil && existingUser != nil {
		s.logSecurityEvent(ctx, "", "signup_attempt", ipAddress, userAgent, false, "email_already_exists")
		return nil, errors.New("unable to create account")
	}

	// Create user in Supabase Auth using REST API
	url := fmt.Sprintf("%s/auth/v1/signup", cfg.SupabaseURL)
	payload := map[string]interface{}{
		"email":    req.Email,
		"password": req.Password,
		"data": map[string]interface{}{
			"name": req.Name,
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("apikey", cfg.SupabaseAnonKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		s.logSecurityEvent(ctx, "", "signup_attempt", ipAddress, userAgent, false, "supabase_error")
		return nil, fmt.Errorf("failed to create user: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		s.logSecurityEvent(ctx, "", "signup_attempt", ipAddress, userAgent, false, "supabase_error")
		return nil, s.sanitizeError(fmt.Errorf("signup failed: %s", string(body)))
	}

	var authResp SupabaseAuthResponse
	if err := json.Unmarshal(body, &authResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if authResp.User.ID == "" {
		return nil, errors.New("failed to create user")
	}

	userID := authResp.User.ID
	now := time.Now().UTC()

	// Create user profile in PostgreSQL using transaction
	tx, err := database.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		INSERT INTO public.users (id, name, email, avatar, is_admin, is_verified, is_active, role, provider, posts_count, followers_count, following_count, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`
	avatar := "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop"
	_, err = tx.ExecContext(ctx, query,
		userID, req.Name, req.Email, avatar,
		false, false, true, models.RoleUser, "email",
		0, 0, 0, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create user profile: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Log successful signup
	s.logSecurityEvent(ctx, userID, "signup", ipAddress, userAgent, true, "")

	// Get access token
	accessToken := authResp.AccessToken
	if accessToken == "" {
		// Sign in to get token
		token, err := utils.VerifyPasswordWithSupabase(ctx, cfg.SupabaseURL, cfg.SupabaseAnonKey, req.Email, req.Password)
		if err != nil {
			return nil, fmt.Errorf("failed to get access token: %w", err)
		}
		accessToken = token
	}

	// Create session
	session, err := s.createSession(ctx, userID, accessToken, ipAddress, userAgent)
	if err != nil {
		return nil, s.sanitizeError(err)
	}

	// Get user from database
	user, err := s.getUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	permissions := models.GetRolePermissions(user.Role)

	return &models.AuthResponse{
		Token:        accessToken,
		RefreshToken: session.ID,
		ExpiresIn:    int64(s.sessionExpiry.Seconds()),
		User:         user,
		Roles:        []string{user.Role},
		Permissions:  permissions,
	}, nil
}

// LoginSupabase authenticates a user using Supabase Auth REST API
func (s *AuthService) LoginSupabase(ctx context.Context, req *models.AuthRequest, cfg *config.Config, ipAddress, userAgent string) (*models.AuthResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	// Validate input
	if err := s.validateEmail(req.Email); err != nil {
		return nil, err
	}
	if strings.TrimSpace(req.Password) == "" {
		return nil, errors.New("password is required")
	}

	// Verify password using Supabase Auth REST API
	accessToken, err := utils.VerifyPasswordWithSupabase(ctx, cfg.SupabaseURL, cfg.SupabaseAnonKey, req.Email, req.Password)
	if err != nil {
		s.logSecurityEvent(ctx, "", "login_attempt", ipAddress, userAgent, false, "invalid_credentials")
		return nil, errors.New("invalid credentials")
	}

	// Get user ID from token (parse JWT or make API call)
	// For now, we'll get user by email
	user, err := s.getUserByEmail(ctx, req.Email)
	if err != nil {
		s.logSecurityEvent(ctx, "", "login_attempt", ipAddress, userAgent, false, "user_not_found")
		return nil, errors.New("invalid credentials")
	}

	userID := user.ID

	// Check account lockout
	lockout, err := s.getAccountLockout(ctx, userID)
	if err == nil && lockout != nil {
		if lockout.LockedUntil.After(time.Now().UTC()) {
			s.logSecurityEvent(ctx, userID, "login_attempt", ipAddress, userAgent, false, "account_locked")
			return nil, errors.New("account temporarily locked due to multiple failed login attempts")
		}
	}

	// Check if account is active
	if !user.IsActive {
		s.logSecurityEvent(ctx, userID, "login_attempt", ipAddress, userAgent, false, "account_inactive")
		return nil, errors.New("account is inactive")
	}

	// Reset failed attempts on successful login
	s.resetFailedAttempts(ctx, user.ID)

	// Log successful login
	s.logSecurityEvent(ctx, user.ID, "login", ipAddress, userAgent, true, "")

	// Create session
	session, err := s.createSession(ctx, user.ID, accessToken, ipAddress, userAgent)
	if err != nil {
		return nil, s.sanitizeError(err)
	}

	permissions := models.GetRolePermissions(user.Role)

	return &models.AuthResponse{
		Token:        accessToken,
		RefreshToken: session.ID,
		ExpiresIn:    int64(s.sessionExpiry.Seconds()),
		User:         user,
		Roles:        []string{user.Role},
		Permissions:  permissions,
	}, nil
}

// Helper methods migrated to PostgreSQL

func (s *AuthService) getUserByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, name, email, avatar, bio, location, website, is_admin, is_verified, is_active, role, provider, posts_count, followers_count, following_count, created_at, updated_at
		FROM public.users
		WHERE email = $1
	`
	row := database.QueryRowWithContext(ctx, query, email)
	return s.scanUser(row)
}

func (s *AuthService) getUserByID(ctx context.Context, userID string) (*models.User, error) {
	query := `
		SELECT id, name, email, avatar, bio, location, website, is_admin, is_verified, is_active, role, provider, posts_count, followers_count, following_count, created_at, updated_at
		FROM public.users
		WHERE id = $1
	`
	row := database.QueryRowWithContext(ctx, query, userID)
	return s.scanUser(row)
}

func (s *AuthService) scanUser(row *sql.Row) (*models.User, error) {
	var user models.User
	var avatar, bio, location, website sql.NullString
	err := row.Scan(
		&user.ID, &user.Name, &user.Email, &avatar, &bio, &location, &website,
		&user.IsAdmin, &user.IsVerified, &user.IsActive, &user.Role, &user.Provider,
		&user.PostsCount, &user.FollowersCount, &user.FollowingCount,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if avatar.Valid {
		user.Avatar = avatar.String
	}
	if bio.Valid {
		user.Bio = bio.String
	}
	if location.Valid {
		user.Location = location.String
	}
	if website.Valid {
		user.Website = website.String
	}

	return &user, nil
}

func (s *AuthService) createSession(ctx context.Context, userID, token, ipAddress, userAgent string) (*models.Session, error) {
	sessionID := s.generateSessionID()
	now := time.Now().UTC()
	expiresAt := now.Add(s.sessionExpiry)

	query := `
		INSERT INTO public.sessions (id, user_id, token_id, ip_address, user_agent, created_at, expires_at, last_activity, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := database.ExecWithContext(ctx, query,
		sessionID, userID, token, ipAddress, userAgent, now, expiresAt, now, true,
	)
	if err != nil {
		return nil, err
	}

	return &models.Session{
		ID:           sessionID,
		UserID:       userID,
		TokenID:      token,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		CreatedAt:    now,
		ExpiresAt:    expiresAt,
		LastActivity: now,
		IsActive:     true,
	}, nil
}

func (s *AuthService) getAccountLockout(ctx context.Context, userID string) (*models.AccountLockout, error) {
	query := `
		SELECT user_id, failed_attempts, locked_until, created_at
		FROM public.account_lockouts
		WHERE user_id = $1
	`
	row := database.QueryRowWithContext(ctx, query, userID)
	var lockout models.AccountLockout
	var lockedUntil sql.NullTime
	var createdAt time.Time
	err := row.Scan(&lockout.UserID, &lockout.FailedAttempts, &lockedUntil, &createdAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if lockedUntil.Valid {
		lockout.LockedUntil = lockedUntil.Time
	}
	return &lockout, nil
}

func (s *AuthService) resetFailedAttempts(ctx context.Context, userID string) {
	query := `DELETE FROM public.account_lockouts WHERE user_id = $1`
	_, _ = database.ExecWithContext(ctx, query, userID)
}

func (s *AuthService) logSecurityEvent(ctx context.Context, userID, eventType, ipAddress, userAgent string, success bool, reason string) {
	eventID := uuid.New().String()
	now := time.Now().UTC()

	query := `
		INSERT INTO public.security_events (id, user_id, event_type, ip_address, user_agent, success, details, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	go func() {
		logCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		var userIDPtr *string
		if userID != "" {
			userIDPtr = &userID
		}

		_, _ = database.ExecWithContext(logCtx, query,
			eventID, userIDPtr, eventType, ipAddress, userAgent, success, reason, now,
		)
	}()
}

func (s *AuthService) generateSessionID() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

func (s *AuthService) validateEmail(email string) error {
	email = strings.TrimSpace(email)
	if email == "" {
		return errors.New("email is required")
	}
	if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
		return errors.New("invalid email format")
	}
	return nil
}

func (s *AuthService) validatePassword(password string) error {
	if len(password) < s.passwordMinLength {
		return fmt.Errorf("password must be at least %d characters", s.passwordMinLength)
	}
	return nil
}

func (s *AuthService) sanitizeError(err error) error {
	errStr := err.Error()
	if strings.Contains(errStr, "email already registered") || strings.Contains(errStr, "EMAIL_EXISTS") {
		return errors.New("email already registered")
	}
	if strings.Contains(errStr, "invalid email") || strings.Contains(errStr, "INVALID_EMAIL") {
		return errors.New("invalid email format")
	}
	if strings.Contains(errStr, "weak password") || strings.Contains(errStr, "WEAK_PASSWORD") {
		return errors.New("password is too weak")
	}
	if strings.Contains(errStr, "user not found") || strings.Contains(errStr, "USER_NOT_FOUND") {
		return errors.New("user not found")
	}
	return errors.New("authentication failed")
}

// RecordFailedLogin records a failed login attempt
func (s *AuthService) RecordFailedLogin(ctx context.Context, email, ipAddress, userAgent string) {
	user, err := s.getUserByEmail(ctx, email)
	if err != nil {
		s.logSecurityEvent(ctx, "", "login_attempt", ipAddress, userAgent, false, "user_not_found")
		return
	}

	// Increment failed attempts
	lockout, err := s.getAccountLockout(ctx, user.ID)
	if err != nil || lockout == nil {
		// Create new lockout record
		query := `INSERT INTO public.account_lockouts (user_id, failed_attempts, created_at) VALUES ($1, 1, $2)`
		_, _ = database.ExecWithContext(ctx, query, user.ID, time.Now().UTC())
	} else {
		// Update existing
		newAttempts := lockout.FailedAttempts + 1
		lockedUntil := lockout.LockedUntil
		if newAttempts >= s.maxLoginAttempts {
			lockedUntil = time.Now().UTC().Add(s.lockoutDuration)
		}
		query := `UPDATE public.account_lockouts SET failed_attempts = $1, locked_until = $2 WHERE user_id = $3`
		_, _ = database.ExecWithContext(ctx, query, newAttempts, lockedUntil, user.ID)
	}

	s.logSecurityEvent(ctx, user.ID, "login_attempt", ipAddress, userAgent, false, "invalid_credentials")
}

// RefreshToken refreshes an access token
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken, ipAddress, userAgent string) (*models.AuthResponse, error) {
	// Get session by refresh token (session ID)
	query := `SELECT user_id, token_id, expires_at FROM public.sessions WHERE id = $1 AND is_active = TRUE`
	row := database.QueryRowWithContext(ctx, query, refreshToken)
	var userID, tokenID string
	var expiresAt time.Time
	err := row.Scan(&userID, &tokenID, &expiresAt)
	if err != nil {
		return nil, errors.New("invalid or expired refresh token")
	}

	if expiresAt.Before(time.Now().UTC()) {
		return nil, errors.New("refresh token expired")
	}

	// Get user
	user, err := s.getUserByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Create new session
	session, err := s.createSession(ctx, userID, tokenID, ipAddress, userAgent)
	if err != nil {
		return nil, err
	}

	permissions := models.GetRolePermissions(user.Role)
	return &models.AuthResponse{
		Token:        tokenID, // Use existing token or generate new one
		RefreshToken: session.ID,
		ExpiresIn:    int64(s.sessionExpiry.Seconds()),
		User:         user,
		Roles:        []string{user.Role},
		Permissions:  permissions,
	}, nil
}

// Logout invalidates a session
func (s *AuthService) Logout(ctx context.Context, refreshToken, userID, ipAddress, userAgent string) error {
	if refreshToken != "" {
		query := `UPDATE public.sessions SET is_active = FALSE WHERE id = $1 AND user_id = $2`
		_, _ = database.ExecWithContext(ctx, query, refreshToken, userID)
	}
	s.logSecurityEvent(ctx, userID, "logout", ipAddress, userAgent, true, "")
	return nil
}

// ChangePassword changes a user's password
func (s *AuthService) ChangePassword(ctx context.Context, userID string, req *models.ChangePasswordRequest, ipAddress, userAgent string) error {
	// Validate new password
	if err := s.validatePassword(req.NewPassword); err != nil {
		return err
	}

	// Update password in Supabase Auth (requires service role key)
	updateURL := fmt.Sprintf("%s/auth/v1/admin/users/%s", s.cfg.SupabaseURL, userID)
	payload := map[string]string{"password": req.NewPassword}
	jsonData, _ := json.Marshal(payload)
	httpReq, _ := http.NewRequestWithContext(ctx, "PUT", updateURL, bytes.NewBuffer(jsonData))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("apikey", s.cfg.SupabaseServiceKey)
	httpReq.Header.Set("Authorization", "Bearer "+s.cfg.SupabaseServiceKey)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil || resp.StatusCode != http.StatusOK {
		s.logSecurityEvent(ctx, userID, "password_change", ipAddress, userAgent, false, "update_failed")
		return errors.New("failed to update password")
	}
	resp.Body.Close()

	// Invalidate all sessions
	_, _ = database.ExecWithContext(ctx, "UPDATE public.sessions SET is_active = FALSE WHERE user_id = $1", userID)
	s.logSecurityEvent(ctx, userID, "password_change", ipAddress, userAgent, true, "")
	return nil
}

// TokenInfo represents token information
type TokenInfo struct {
	Expires time.Time
}

// VerifyToken verifies a JWT token and returns user info
func (s *AuthService) VerifyToken(ctx context.Context, token string) (*TokenInfo, *models.User, error) {
	// Parse JWT token to get user ID
	// For now, we'll use a simple approach - in production, use proper JWT parsing
	// This is a placeholder - proper implementation would parse the JWT
	// TODO: Implement proper JWT parsing using Supabase JWT secret
	userID := "" // Extract from token - placeholder

	if userID == "" {
		return nil, nil, errors.New("invalid token")
	}

	user, err := s.getUserByID(ctx, userID)
	if err != nil {
		return nil, nil, errors.New("invalid token")
	}

	// Return token info (placeholder) and user
	return &TokenInfo{Expires: time.Now().UTC().Add(24 * time.Hour)}, user, nil
}

// RequestPasswordReset requests a password reset
func (s *AuthService) RequestPasswordReset(ctx context.Context, email string, emailService interface{}, twoFAService interface{}, ipAddress, userAgent string) error {
	// Send OTP via email (type assertion needed)
	if twoFASvc, ok := twoFAService.(interface {
		SendLoginOTP(ctx context.Context, emailService interface{}, rateLimitService interface{}, userID, email string) error
	}); ok {
		user, err := s.getUserByEmail(ctx, email)
		if err == nil {
			_ = twoFASvc.SendLoginOTP(ctx, emailService, nil, user.ID, email)
		}
	}
	// Always return success to prevent email enumeration
	s.logSecurityEvent(ctx, "", "password_reset_request", ipAddress, userAgent, true, "")
	return nil
}

// ConfirmPasswordReset confirms password reset with OTP
func (s *AuthService) ConfirmPasswordReset(ctx context.Context, email, otpCode, newPassword string, twoFAService interface{}, ipAddress, userAgent string) error {
	// Verify OTP (type assertion needed)
	var valid bool
	var err error
	if twoFASvc, ok := twoFAService.(interface {
		VerifyOTP(ctx context.Context, email, code, purpose string) (bool, error)
	}); ok {
		valid, err = twoFASvc.VerifyOTP(ctx, email, otpCode, "password_reset")
	} else {
		return errors.New("invalid twoFA service")
	}
	if err != nil || !valid {
		return errors.New("invalid or expired reset code")
	}

	// Get user
	user, err := s.getUserByEmail(ctx, email)
	if err != nil {
		return errors.New("user not found")
	}

	// Update password
	updateURL := fmt.Sprintf("%s/auth/v1/admin/users/%s", s.cfg.SupabaseURL, user.ID)
	payload := map[string]string{"password": newPassword}
	jsonData, _ := json.Marshal(payload)
	httpReq, _ := http.NewRequestWithContext(ctx, "PUT", updateURL, bytes.NewBuffer(jsonData))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("apikey", s.cfg.SupabaseServiceKey)
	httpReq.Header.Set("Authorization", "Bearer "+s.cfg.SupabaseServiceKey)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil || resp.StatusCode != http.StatusOK {
		return errors.New("failed to reset password")
	}
	resp.Body.Close()

	// Invalidate sessions
	_, _ = database.ExecWithContext(ctx, "UPDATE public.sessions SET is_active = FALSE WHERE user_id = $1", user.ID)
	s.logSecurityEvent(ctx, user.ID, "password_reset_confirm", ipAddress, userAgent, true, "")
	return nil
}
