package models

// OAuthProvider represents OAuth provider type
type OAuthProvider string

const (
	OAuthProviderGoogle OAuthProvider = "google"
)

// OAuthState represents OAuth state for CSRF protection
type OAuthState struct {
	State       string        `json:"state"`
	Provider    OAuthProvider `json:"provider"`
	RedirectURL string        `json:"redirect_url,omitempty"`
	UserID      string        `json:"user_id,omitempty"` // For linking accounts
}

// OAuthCallbackRequest represents OAuth callback data
type OAuthCallbackRequest struct {
	Code  string `json:"code"`
	State string `json:"state"`
}

// GoogleUserInfo represents Google user information
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Locale        string `json:"locale"`
}

// OAuthResponse represents OAuth authentication response
type OAuthResponse struct {
	Token        string   `json:"token"`
	RefreshToken string   `json:"refreshToken,omitempty"`
	ExpiresIn    int64    `json:"expiresIn"`
	User         *User    `json:"user"`
	IsNewUser    bool     `json:"isNewUser"`
	Roles        []string `json:"roles"`
	Permissions  []string `json:"permissions"`
}
