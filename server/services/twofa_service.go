package services

import (
	"context"
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"math/big"
	"time"

	"tech-bant-community/server/config"
	"tech-bant-community/server/database"
	"tech-bant-community/server/models"

	"golang.org/x/crypto/bcrypt"
)

type TwoFAService struct {
	cfg *config.Config
}

func NewTwoFAService(cfg *config.Config) *TwoFAService {
	return &TwoFAService{cfg: cfg}
}

// GenerateOTP generates a 6-digit OTP code
func (s *TwoFAService) GenerateOTP() string {
	n, _ := rand.Int(rand.Reader, big.NewInt(900000))
	return fmt.Sprintf("%06d", n.Int64()+100000)
}

// SendOTPEmail sends OTP code via Resend API (UPDATED: Uses Resend instead of SMTP)
func (s *TwoFAService) SendOTPEmail(ctx context.Context, emailService *EmailService, email, code, purpose string) error {
	return emailService.SendOTPEmail(ctx, email, code, purpose)
}

// CreateOTP creates and stores an OTP code in PostgreSQL
// Uses Resend API for email sending via EmailService
func (s *TwoFAService) CreateOTP(ctx context.Context, userID, email, purpose string) (*models.OTPCode, error) {
	code := s.GenerateOTP()
	otpID := database.NewUUID()
	now := time.Now().UTC()

	// Hash the OTP code before storage
	hashedCode, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash OTP: %w", err)
	}

	expiresAt := now.Add(10 * time.Minute)

	// Store in PostgreSQL
	query := `
		INSERT INTO public.otps (id, user_id, email, code, type, expires_at, used, attempts, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err = database.ExecWithContext(ctx, query,
		otpID,
		userID,
		email,
		string(hashedCode),
		purpose,
		expiresAt,
		false,
		0,
		now,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to store OTP: %w", err)
	}

	// Return OTP with plain code for sending (not stored)
	return &models.OTPCode{
		ID:        database.UUIDToString(otpID),
		UserID:    userID,
		Code:      code, // Plain code for email via Resend API
		Purpose:   purpose,
		ExpiresAt: expiresAt,
		Used:      false,
		CreatedAt: now,
	}, nil
}

// VerifyOTP verifies an OTP code using PostgreSQL transaction
func (s *TwoFAService) VerifyOTP(ctx context.Context, email, code, purpose string) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	// Start transaction
	tx, err := database.BeginTx(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback()

	// Query OTP codes for this email and purpose (with row lock)
	query := `
		SELECT id, user_id, code, expires_at, used, attempts
		FROM public.otps
		WHERE email = $1 AND type = $2 AND used = false
		ORDER BY created_at DESC
		LIMIT 1
		FOR UPDATE
	`
	var otpID, userID, hashedCode string
	var expiresAt time.Time
	var used bool
	var attempts int

	err = tx.QueryRowContext(ctx, query, email, purpose).Scan(
		&otpID, &userID, &hashedCode, &expiresAt, &used, &attempts,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, errors.New("invalid or expired code")
		}
		return false, err
	}

	now := time.Now().UTC()

	// Check if already used
	if used {
		return false, errors.New("code already used")
	}

	// Check expiration
	if expiresAt.Before(now) {
		_, _ = tx.ExecContext(ctx, "UPDATE public.otps SET used = true WHERE id = $1", otpID)
		_ = tx.Commit()
		return false, errors.New("code expired")
	}

	// Check attempts
	if attempts >= 5 {
		_, _ = tx.ExecContext(ctx, "UPDATE public.otps SET used = true WHERE id = $1", otpID)
		_ = tx.Commit()
		return false, errors.New("too many attempts, code disabled")
	}

	// Verify hashed OTP code
	if err := bcrypt.CompareHashAndPassword([]byte(hashedCode), []byte(code)); err != nil {
		// Increment attempt counter
		_, _ = tx.ExecContext(ctx, "UPDATE public.otps SET attempts = attempts + 1 WHERE id = $1", otpID)
		_ = tx.Commit()
		return false, errors.New("invalid code")
	}

	// Mark as used atomically
	_, err = tx.ExecContext(ctx, "UPDATE public.otps SET used = true WHERE id = $1", otpID)
	if err != nil {
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}

	return true, nil
}

// Enable2FA enables 2FA for a user in PostgreSQL
func (s *TwoFAService) Enable2FA(ctx context.Context, userID string) error {
	query := `
		INSERT INTO public.two_factor_auth (user_id, enabled, created_at, updated_at)
		VALUES ($1, true, $2, $2)
		ON CONFLICT (user_id) DO UPDATE SET enabled = true, updated_at = $2
	`
	_, err := database.ExecWithContext(ctx, query, userID, time.Now().UTC())
	return err
}

// Disable2FA disables 2FA for a user
func (s *TwoFAService) Disable2FA(ctx context.Context, userID string) error {
	query := `UPDATE public.two_factor_auth SET enabled = false, updated_at = $1 WHERE user_id = $2`
	_, err := database.ExecWithContext(ctx, query, time.Now().UTC(), userID)
	return err
}

// Is2FAEnabled checks if 2FA is enabled for a user
func (s *TwoFAService) Is2FAEnabled(ctx context.Context, userID string) (bool, error) {
	query := `SELECT enabled FROM public.two_factor_auth WHERE user_id = $1`
	var enabled bool
	err := database.QueryRowWithContext(ctx, query, userID).Scan(&enabled)
	if err == sql.ErrNoRows {
		return false, nil // Not enabled if record doesn't exist
	}
	return enabled, err
}

// SendLoginOTP sends OTP for login (FIXED: Added rate limiting)
func (s *TwoFAService) SendLoginOTP(ctx context.Context, emailService *EmailService, rateLimitService interface {
	CheckRateLimit(ctx context.Context, key string, limit EndpointLimit) (bool, int, time.Duration, error)
}, userID, email string) error {
	// Add timeout
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	// Rate limit OTP generation (FIXED: Issue #9)
	if rateLimitService != nil {
		limit := EndpointLimit{
			Requests: 3,
			Window:   15 * time.Minute,
			Burst:    1,
		}
		key := fmt.Sprintf("otp:%s", userID)
		allowed, _, _, err := rateLimitService.CheckRateLimit(ctx, key, limit)
		if err == nil && !allowed {
			return errors.New("too many OTP requests. Please wait before requesting another code")
		}
	}

	// Create OTP with email parameter (uses Resend API via EmailService)
	otp, err := s.CreateOTP(ctx, userID, email, "2fa")
	if err != nil {
		return err
	}

	// Send OTP email using Resend API
	return emailService.SendOTPEmail(ctx, email, otp.Code, "login")
}

// Require2FA checks if 2FA is required for an operation
func (s *TwoFAService) Require2FA(ctx context.Context, userID string) bool {
	enabled, _ := s.Is2FAEnabled(ctx, userID)
	return enabled
}
