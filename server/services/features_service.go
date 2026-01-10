package services

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"tech-bant-community/server/database"
	"tech-bant-community/server/models"

	"github.com/google/uuid"
)

// FollowService handles user follow/unfollow operations
type FollowService struct{}

func NewFollowService() *FollowService {
	return &FollowService{}
}

// FollowUser creates a follow relationship
func (s *FollowService) FollowUser(ctx context.Context, followerID, followingID string) error {
	if followerID == followingID {
		return errors.New("cannot follow yourself")
	}

	tx, err := database.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert follow
	followID := uuid.New()
	_, err = tx.ExecContext(ctx, `
		INSERT INTO public.follows (id, follower_id, following_id, created_at)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (follower_id, following_id) DO NOTHING
	`, followID, followerID, followingID, time.Now().UTC())
	if err != nil {
		return err
	}

	// Increment counts
	_, err = tx.ExecContext(ctx, "UPDATE public.users SET following_count = following_count + 1 WHERE id = $1", followerID)
	if err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, "UPDATE public.users SET followers_count = followers_count + 1 WHERE id = $1", followingID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// UnfollowUser removes a follow relationship
func (s *FollowService) UnfollowUser(ctx context.Context, followerID, followingID string) error {
	tx, err := database.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Delete follow
	_, err = tx.ExecContext(ctx, "DELETE FROM public.follows WHERE follower_id = $1 AND following_id = $2", followerID, followingID)
	if err != nil {
		return err
	}

	// Decrement counts
	_, _ = tx.ExecContext(ctx, "UPDATE public.users SET following_count = following_count - 1 WHERE id = $1", followerID)
	_, _ = tx.ExecContext(ctx, "UPDATE public.users SET followers_count = followers_count - 1 WHERE id = $1", followingID)

	return tx.Commit()
}

// IsFollowing checks if user is following another user
func (s *FollowService) IsFollowing(ctx context.Context, followerID, followingID string) (bool, error) {
	query := "SELECT id FROM public.follows WHERE follower_id = $1 AND following_id = $2"
	var id string
	err := database.QueryRowWithContext(ctx, query, followerID, followingID).Scan(&id)
	return err == nil, nil
}

// ReportService handles content reporting
type ReportService struct{}

func NewReportService() *ReportService {
	return &ReportService{}
}

// ReportPost creates a report for a post
func (s *ReportService) ReportPost(ctx context.Context, reporterID, postID, reason string) error {
	reportID := uuid.New()
	query := `
		INSERT INTO public.reports (id, reporter_id, post_id, reason, status, created_at)
		VALUES ($1, $2, $3, $4, 'pending', $5)
	`
	_, err := database.ExecWithContext(ctx, query, reportID, reporterID, postID, reason, time.Now().UTC())
	return err
}

// ReportComment creates a report for a comment
func (s *ReportService) ReportComment(ctx context.Context, reporterID, commentID, reason string) error {
	reportID := uuid.New()
	query := `
		INSERT INTO public.reports (id, reporter_id, comment_id, reason, status, created_at)
		VALUES ($1, $2, $3, $4, 'pending', $5)
	`
	_, err := database.ExecWithContext(ctx, query, reportID, reporterID, commentID, reason, time.Now().UTC())
	return err
}

// GetReports gets all reports (admin only)
func (s *ReportService) GetReports(ctx context.Context, limit, offset int, status string) ([]*models.Report, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	query := `
		SELECT id, reporter_id, post_id, comment_id, reason, status, created_at, reviewed_at, reviewed_by
		FROM public.reports
		WHERE ($1 = '' OR status = $1)
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := database.QueryWithContext(ctx, query, status, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reports []*models.Report
	for rows.Next() {
		var report models.Report
		var postID, commentID, reviewedBy sql.NullString
		var reviewedAt sql.NullTime

		err := rows.Scan(
			&report.ID, &report.ReporterID, &postID, &commentID, &report.Reason, &report.Status,
			&report.CreatedAt, &reviewedAt, &reviewedBy,
		)
		if err != nil {
			continue
		}

		if postID.Valid {
			report.PostID = postID.String
		}
		if commentID.Valid {
			report.CommentID = commentID.String
		}
		if reviewedAt.Valid {
			report.ReviewedAt = &reviewedAt.Time
		}
		if reviewedBy.Valid {
			report.ReviewedBy = reviewedBy.String
		}

		reports = append(reports, &report)
	}

	return reports, nil
}

// ResolveReport resolves a report (admin only)
func (s *ReportService) ResolveReport(ctx context.Context, reportID string, status string, reviewedBy string) error {
	if status != "resolved" && status != "rejected" {
		return errors.New("invalid status, must be 'resolved' or 'rejected'")
	}

	query := `
		UPDATE public.reports
		SET status = $1, reviewed_at = $2, reviewed_by = $3
		WHERE id = $4
	`
	_, err := database.ExecWithContext(ctx, query, status, time.Now().UTC(), reviewedBy, reportID)
	return err
}

// BanService handles user banning (admin)
type BanService struct{}

func NewBanService() *BanService {
	return &BanService{}
}

// BanUser bans a user
func (s *BanService) BanUser(ctx context.Context, userID string) error {
	query := "UPDATE public.users SET is_active = false, updated_at = $1 WHERE id = $2"
	_, err := database.ExecWithContext(ctx, query, time.Now().UTC(), userID)
	return err
}

// UnbanUser unbans a user
func (s *BanService) UnbanUser(ctx context.Context, userID string) error {
	query := "UPDATE public.users SET is_active = true, updated_at = $1 WHERE id = $2"
	_, err := database.ExecWithContext(ctx, query, time.Now().UTC(), userID)
	return err
}

// VerifyUser verifies a user (admin)
func (s *BanService) VerifyUser(ctx context.Context, userID string) error {
	query := "UPDATE public.users SET is_verified = true, updated_at = $1 WHERE id = $2"
	_, err := database.ExecWithContext(ctx, query, time.Now().UTC(), userID)
	return err
}

// PromoteToAdmin promotes a user to admin (super admin only)
func (s *BanService) PromoteToAdmin(ctx context.Context, userID, role string) error {
	if role != models.RoleAdmin && role != models.RoleSuperAdmin {
		return errors.New("invalid role")
	}
	query := "UPDATE public.users SET role = $1, is_admin = true, updated_at = $2 WHERE id = $3"
	_, err := database.ExecWithContext(ctx, query, role, time.Now().UTC(), userID)
	return err
}
