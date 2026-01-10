package services

import (
	"context"
	"database/sql"
	"time"

	"tech-bant-community/server/database"
)

// CleanupService handles cleanup operations
type CleanupService struct {
	db *sql.DB
}

// NewCleanupService creates a new CleanupService instance
func NewCleanupService(db *sql.DB) *CleanupService {
	return &CleanupService{db: db}
}

// CleanupExpiredOTPs removes expired OTP codes from PostgreSQL
func (s *CleanupService) CleanupExpiredOTPs(ctx context.Context) error {
	query := "DELETE FROM public.otps WHERE expires_at < NOW() OR (used = true AND created_at < NOW() - INTERVAL '1 day')"
	_, err := database.ExecWithContext(ctx, query)
	return err
}

// CleanupExpiredSessions removes expired sessions from PostgreSQL
func (s *CleanupService) CleanupExpiredSessions(ctx context.Context) error {
	query := "DELETE FROM public.sessions WHERE expires_at < NOW() OR (is_active = false AND last_activity < NOW() - INTERVAL '7 days')"
	_, err := database.ExecWithContext(ctx, query)
	return err
}

// StartCleanupJob starts background cleanup job (unchanged, just uses new methods)
func (s *CleanupService) StartCleanupJob(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Hour) // Run every hour
	go func() {
		for {
			select {
			case <-ticker.C:
				cleanupCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
				s.CleanupExpiredOTPs(cleanupCtx)
				s.CleanupExpiredSessions(cleanupCtx)
				cancel()
			case <-ctx.Done():
				ticker.Stop()
				return
			}
		}
	}()
}
