package models

import "time"

// Report represents a content report
type Report struct {
	ID         string     `json:"id"`
	ReporterID string     `json:"reporter_id"`
	PostID     string     `json:"post_id,omitempty"`
	CommentID  string     `json:"comment_id,omitempty"`
	Reason     string     `json:"reason"`
	Status     string     `json:"status"` // pending, reviewed, resolved, dismissed
	CreatedAt  time.Time  `json:"created_at"`
	ReviewedAt *time.Time `json:"reviewed_at,omitempty"`
	ReviewedBy string     `json:"reviewed_by,omitempty"`
}

// Session represents a user session
type Session struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	TokenID      string    `json:"token_id"`
	IPAddress    string    `json:"ip_address"`
	UserAgent    string    `json:"user_agent"`
	CreatedAt    time.Time `json:"created_at"`
	ExpiresAt    time.Time `json:"expires_at"`
	LastActivity time.Time `json:"last_activity"`
	IsActive     bool      `json:"is_active"`
}

// Note: AccountLockout is defined in auth_models.go

// OTPCode represents an OTP code
type OTPCode struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Code      string    `json:"code"`
	Purpose   string    `json:"purpose"`
	ExpiresAt time.Time `json:"expires_at"`
	Used      bool      `json:"used"`
	CreatedAt time.Time `json:"created_at"`
}

// TwoFactorAuth represents 2FA status
type TwoFactorAuth struct {
	UserID    string    `json:"user_id"`
	Enabled   bool      `json:"enabled"`
	CreatedAt time.Time `json:"created_at"`
}

// Note: OAuth types (OAuthState, OAuthProvider, GoogleUserInfo) are defined in oauth_models.go
// Note: Auth types (AuthRequest, AuthResponse, RefreshTokenRequest) are defined in auth_models.go

// Verify2FARequest represents 2FA verification request
type Verify2FARequest struct {
	Code string `json:"code"`
}

// Enable2FARequest represents 2FA enable request
type Enable2FARequest struct {
	Email string `json:"email"`
}
