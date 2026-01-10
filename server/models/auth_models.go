package models

import "time"

// AuthRequest represents a login/signup request
type AuthRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name,omitempty"` // Only for signup
}

// AuthResponse represents an authentication response
type AuthResponse struct {
	Token        string   `json:"token"`
	RefreshToken string   `json:"refreshToken,omitempty"`
	ExpiresIn    int64    `json:"expiresIn"`
	User         *User    `json:"user"`
	Roles        []string `json:"roles"`
	Permissions  []string `json:"permissions"`
}

// RefreshTokenRequest represents a token refresh request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken"`
}

// ChangePasswordRequest represents a password change request
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

// ResetPasswordRequest represents a password reset request
type ResetPasswordRequest struct {
	Email string `json:"email"`
}

// ConfirmPasswordResetRequest represents a password reset confirmation with OTP
type ConfirmPasswordResetRequest struct {
	Email       string `json:"email"`
	OTPCode     string `json:"otpCode"`
	NewPassword string `json:"newPassword"`
}

// VerifyEmailRequest represents an email verification request
type VerifyEmailRequest struct {
	Token string `json:"token"`
}

// UserSession represents a user session
type UserSession struct {
	ID           string    `firestore:"id" json:"id"`
	UserID       string    `firestore:"user_id" json:"user_id"`
	TokenID      string    `firestore:"token_id" json:"token_id"`
	IPAddress    string    `firestore:"ip_address" json:"ip_address"`
	UserAgent    string    `firestore:"user_agent" json:"user_agent"`
	CreatedAt    time.Time `firestore:"created_at" json:"created_at"`
	ExpiresAt    time.Time `firestore:"expires_at" json:"expires_at"`
	LastActivity time.Time `firestore:"last_activity" json:"last_activity"`
	IsActive     bool      `firestore:"is_active" json:"is_active"`
}

// SecurityEvent represents a security audit event
type SecurityEvent struct {
	ID        string    `firestore:"id" json:"id"`
	UserID    string    `firestore:"user_id" json:"user_id"`
	EventType string    `firestore:"event_type" json:"event_type"` // login, logout, failed_login, password_change, etc.
	IPAddress string    `firestore:"ip_address" json:"ip_address"`
	UserAgent string    `firestore:"user_agent" json:"user_agent"`
	Success   bool      `firestore:"success" json:"success"`
	Reason    string    `firestore:"reason,omitempty" json:"reason,omitempty"`
	CreatedAt time.Time `firestore:"created_at" json:"created_at"`
}

// AccountLockout represents account lockout information
type AccountLockout struct {
	UserID            string    `firestore:"user_id" json:"user_id"`
	FailedAttempts    int       `firestore:"failed_attempts" json:"failed_attempts"`
	LockedUntil       time.Time `firestore:"locked_until,omitempty" json:"locked_until,omitempty"`
	LastFailedAttempt time.Time `firestore:"last_failed_attempt" json:"last_failed_attempt"`
}

// Role represents a user role
type Role struct {
	ID          string   `firestore:"id" json:"id"`
	Name        string   `firestore:"name" json:"name"`
	Description string   `firestore:"description" json:"description"`
	Permissions []string `firestore:"permissions" json:"permissions"`
}

// Permission constants
const (
	PermissionReadPosts     = "posts:read"
	PermissionWritePosts    = "posts:write"
	PermissionDeletePosts   = "posts:delete"
	PermissionModeratePosts = "posts:moderate"

	PermissionReadUsers   = "users:read"
	PermissionWriteUsers  = "users:write"
	PermissionDeleteUsers = "users:delete"

	PermissionReadComments     = "comments:read"
	PermissionWriteComments    = "comments:write"
	PermissionDeleteComments   = "comments:delete"
	PermissionModerateComments = "comments:moderate"

	PermissionReadAdmin   = "admin:read"
	PermissionWriteAdmin  = "admin:write"
	PermissionDeleteAdmin = "admin:delete"

	PermissionManageAdmins = "admins:manage"
)

// Role constants
const (
	RoleUser       = "user"
	RoleModerator  = "moderator"
	RoleAdmin      = "admin"
	RoleSuperAdmin = "super_admin"
)

// GetRolePermissions returns permissions for a role
func GetRolePermissions(role string) []string {
	switch role {
	case RoleSuperAdmin:
		return []string{
			PermissionReadPosts, PermissionWritePosts, PermissionDeletePosts, PermissionModeratePosts,
			PermissionReadUsers, PermissionWriteUsers, PermissionDeleteUsers,
			PermissionReadComments, PermissionWriteComments, PermissionDeleteComments, PermissionModerateComments,
			PermissionReadAdmin, PermissionWriteAdmin, PermissionDeleteAdmin,
			PermissionManageAdmins,
		}
	case RoleAdmin:
		return []string{
			PermissionReadPosts, PermissionWritePosts, PermissionDeletePosts, PermissionModeratePosts,
			PermissionReadUsers, PermissionWriteUsers,
			PermissionReadComments, PermissionWriteComments, PermissionDeleteComments, PermissionModerateComments,
			PermissionReadAdmin, PermissionWriteAdmin,
		}
	case RoleModerator:
		return []string{
			PermissionReadPosts, PermissionWritePosts, PermissionModeratePosts,
			PermissionReadUsers,
			PermissionReadComments, PermissionWriteComments, PermissionModerateComments,
		}
	case RoleUser:
		return []string{
			PermissionReadPosts, PermissionWritePosts,
			PermissionReadUsers,
			PermissionReadComments, PermissionWriteComments,
		}
	default:
		return []string{PermissionReadPosts, PermissionReadUsers, PermissionReadComments}
	}
}
