package services

import (
	"context"
	"errors"
	"fmt"

	"tech-bant-community/server/config"

	"github.com/resend/resend-go/v2"
)

type EmailService struct {
	client *resend.Client
	cfg    *config.Config
}

func NewEmailService(cfg *config.Config) *EmailService {
	var client *resend.Client
	if cfg.ResendAPIKey != "" {
		client = resend.NewClient(cfg.ResendAPIKey)
	}

	return &EmailService{
		client: client,
		cfg:    cfg,
	}
}

// SendOTPEmail sends OTP code via Resend API
func (s *EmailService) SendOTPEmail(ctx context.Context, email, code, purpose string) error {
	if s.client == nil || s.cfg.ResendAPIKey == "" {
		return errors.New("email service not configured")
	}

	subject := "Your Verification Code"
	body := fmt.Sprintf(`
Hello,

Your verification code is: <strong>%s</strong>

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
Tech Bant Community
`, code)

	params := &resend.SendEmailRequest{
		From:    s.cfg.ResendFrom,
		To:      []string{email},
		Subject: subject,
		Html:    body,
	}

	_, err := s.client.Emails.SendWithContext(ctx, params)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}
