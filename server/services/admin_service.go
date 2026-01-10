package services

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"tech-bant-community/server/config"
	"tech-bant-community/server/database"
	"tech-bant-community/server/models"
	"tech-bant-community/server/utils"
)

// AdminService handles admin operations
type AdminService struct {
	db    *sql.DB
	cache *CacheService
}

// NewAdminService creates a new AdminService instance
func NewAdminService(db *sql.DB) *AdminService {
	return &AdminService{db: db, cache: nil}
}

// NewAdminServiceWithCache creates a new AdminService instance with cache
func NewAdminServiceWithCache(db *sql.DB, cache *CacheService) *AdminService {
	return &AdminService{db: db, cache: cache}
}

// GetStats gets dashboard statistics using SQL aggregations
func (s *AdminService) GetStats(ctx context.Context) (*models.AdminStats, error) {
	stats := &models.AdminStats{}

	// Use counter documents for efficient counting
	usersCount, err := utils.GetCount(ctx, "users")
	if err != nil {
		return nil, utils.WrapError(err, "failed to get users count")
	}
	stats.TotalUsers = int(usersCount)

	postsCount, err := utils.GetCount(ctx, "posts")
	if err != nil {
		return nil, utils.WrapError(err, "failed to get posts count")
	}
	stats.TotalPosts = int(postsCount)

	commentsCount, err := utils.GetCount(ctx, "comments")
	if err != nil {
		return nil, utils.WrapError(err, "failed to get comments count")
	}
	stats.TotalComments = int(commentsCount)

	// Count admins using SQL
	query := "SELECT COUNT(*) FROM public.users WHERE role IN ('admin', 'super_admin')"
	err = database.QueryRowWithContext(ctx, query).Scan(&stats.TotalAdmins)
	if err != nil {
		return nil, utils.WrapError(err, "failed to count admins")
	}

	// Active users (users with activity in last 30 days)
	thirtyDaysAgo := time.Now().UTC().AddDate(0, 0, -30)
	query = "SELECT COUNT(*) FROM public.users WHERE updated_at >= $1"
	err = database.QueryRowWithContext(ctx, query, thirtyDaysAgo).Scan(&stats.ActiveUsers)
	if err != nil {
		stats.ActiveUsers = 0 // Don't fail on this
	}

	// New users today
	today := time.Now().UTC().Truncate(24 * time.Hour)
	query = "SELECT COUNT(*) FROM public.users WHERE created_at >= $1"
	err = database.QueryRowWithContext(ctx, query, today).Scan(&stats.NewUsersToday)
	if err != nil {
		stats.NewUsersToday = 0
	}

	// New posts today
	query = "SELECT COUNT(*) FROM public.posts WHERE created_at >= $1"
	err = database.QueryRowWithContext(ctx, query, today).Scan(&stats.NewPostsToday)
	if err != nil {
		stats.NewPostsToday = 0
	}

	// New comments today
	query = "SELECT COUNT(*) FROM public.comments WHERE created_at >= $1"
	err = database.QueryRowWithContext(ctx, query, today).Scan(&stats.NewCommentsToday)
	if err != nil {
		stats.NewCommentsToday = 0
	}

	// Total likes (count all like documents)
	query = "SELECT COUNT(*) FROM public.likes"
	err = database.QueryRowWithContext(ctx, query).Scan(&stats.TotalLikes)
	if err != nil {
		stats.TotalLikes = 0
	}

	// Total bookmarks
	query = "SELECT COUNT(*) FROM public.bookmarks"
	err = database.QueryRowWithContext(ctx, query).Scan(&stats.TotalBookmarks)
	if err != nil {
		stats.TotalBookmarks = 0
	}

	// Total media
	query = "SELECT COUNT(*) FROM public.media"
	err = database.QueryRowWithContext(ctx, query).Scan(&stats.TotalMedia)
	if err != nil {
		stats.TotalMedia = 0
	}

	return stats, nil
}

// GetAdmins gets all admins
func (s *AdminService) GetAdmins(ctx context.Context, limit, offset int) ([]*models.User, error) {
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
		SELECT id, name, email, avatar, bio, location, website, is_admin, is_verified, is_active, role, provider, posts_count, followers_count, following_count, created_at, updated_at
		FROM public.users
		WHERE role IN ('admin', 'super_admin')
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := database.QueryWithContext(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get admins: %w", err)
	}
	defer rows.Close()

	var admins []*models.User
	for rows.Next() {
		var admin models.User
		var avatar, bio, location, website sql.NullString

		err := rows.Scan(
			&admin.ID, &admin.Name, &admin.Email, &avatar, &bio, &location, &website,
			&admin.IsAdmin, &admin.IsVerified, &admin.IsActive, &admin.Role, &admin.Provider,
			&admin.PostsCount, &admin.FollowersCount, &admin.FollowingCount,
			&admin.CreatedAt, &admin.UpdatedAt,
		)
		if err != nil {
			continue
		}

		if avatar.Valid {
			admin.Avatar = avatar.String
		}
		if bio.Valid {
			admin.Bio = bio.String
		}
		if location.Valid {
			admin.Location = location.String
		}
		if website.Valid {
			admin.Website = website.String
		}

		admins = append(admins, &admin)
	}

	return admins, nil
}

// CreateAdmin creates a new admin using Supabase Auth
func (s *AdminService) CreateAdmin(ctx context.Context, req *models.CreateAdminRequest, cfg *config.Config) (*models.User, error) {
	// Validate role
	if req.Role != models.RoleAdmin && req.Role != models.RoleSuperAdmin {
		return nil, errors.New("invalid role")
	}

	// Create user in Supabase Auth using Admin API
	createUserURL := fmt.Sprintf("%s/auth/v1/admin/users", cfg.SupabaseURL)
	payload := map[string]interface{}{
		"email":         req.Email,
		"password":      req.Password,
		"email_confirm": true,
		"user_metadata": map[string]interface{}{
			"name": req.Name,
		},
		"app_metadata": map[string]interface{}{
			"role": req.Role,
		},
	}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal admin user request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", createUserURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create admin user request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("apikey", cfg.SupabaseServiceKey)
	httpReq.Header.Set("Authorization", "Bearer "+cfg.SupabaseServiceKey)

	client := &http.Client{Timeout: 10 * time.Second}
	httpResp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call Supabase Auth Admin API: %w", err)
	}
	defer httpResp.Body.Close()

	body, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Supabase Auth Admin API response: %w", err)
	}

	if httpResp.StatusCode != http.StatusOK && httpResp.StatusCode != http.StatusCreated {
		var errorResp struct {
			Msg string `json:"msg"`
		}
		json.Unmarshal(body, &errorResp)
		return nil, fmt.Errorf("failed to create admin user in Supabase Auth: %s", errorResp.Msg)
	}

	var authResponse struct {
		User struct {
			ID string `json:"id"`
		} `json:"user"`
	}
	if err := json.Unmarshal(body, &authResponse); err != nil {
		return nil, fmt.Errorf("failed to parse Supabase Auth Admin API response: %w", err)
	}

	if authResponse.User.ID == "" {
		return nil, errors.New("failed to create user: no user ID returned")
	}

	userID := authResponse.User.ID
	now := time.Now().UTC()

	// Create admin profile in PostgreSQL
	query := `
		INSERT INTO public.users (id, name, email, avatar, is_admin, is_verified, is_active, role, provider, posts_count, followers_count, following_count, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id, name, email, avatar, bio, location, website, is_admin, is_verified, is_active, role, provider, posts_count, followers_count, following_count, created_at, updated_at
	`

	avatar := "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop"
	row := database.QueryRowWithContext(ctx, query,
		userID, req.Name, req.Email, avatar,
		true, true, true, // is_admin, is_verified, is_active
		req.Role, "email",
		0, 0, 0, // posts_count, followers_count, following_count
		now, now,
	)

	var user models.User
	var bio, location, website sql.NullString
	err = row.Scan(
		&user.ID, &user.Name, &user.Email, &user.Avatar, &bio, &location, &website,
		&user.IsAdmin, &user.IsVerified, &user.IsActive, &user.Role, &user.Provider,
		&user.PostsCount, &user.FollowersCount, &user.FollowingCount,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		// Rollback: delete auth user via Admin API
		deleteUserURL := fmt.Sprintf("%s/auth/v1/admin/users/%s", cfg.SupabaseURL, userID)
		delReq, _ := http.NewRequestWithContext(ctx, "DELETE", deleteUserURL, nil)
		delReq.Header.Set("apikey", cfg.SupabaseServiceKey)
		delReq.Header.Set("Authorization", "Bearer "+cfg.SupabaseServiceKey)
		delClient := &http.Client{Timeout: 5 * time.Second}
		delClient.Do(delReq)
		return nil, fmt.Errorf("failed to create admin profile: %w", err)
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

// UpdateAdminRole updates an admin's role
func (s *AdminService) UpdateAdminRole(ctx context.Context, adminID, role string) error {
	if role != models.RoleAdmin && role != models.RoleSuperAdmin {
		return errors.New("invalid role")
	}

	query := `
		UPDATE public.users
		SET role = $1, is_admin = true, updated_at = $2
		WHERE id = $3 AND role IN ('admin', 'super_admin')
	`
	_, err := database.ExecWithContext(ctx, query, role, time.Now().UTC(), adminID)
	return err
}

// DeleteAdmin deletes an admin
func (s *AdminService) DeleteAdmin(ctx context.Context, adminID string, cfg *config.Config) error {
	// Get admin role first to check if it's super admin
	query := "SELECT role FROM public.users WHERE id = $1"
	var role string
	err := database.QueryRowWithContext(ctx, query, adminID).Scan(&role)
	if err != nil {
		return err
	}

	// Prevent deleting super admin (safety check)
	if role == models.RoleSuperAdmin {
		// Count remaining super admins
		countQuery := "SELECT COUNT(*) FROM public.users WHERE role = 'super_admin'"
		var count int
		err := database.QueryRowWithContext(ctx, countQuery).Scan(&count)
		if err == nil && count <= 1 {
			return errors.New("cannot delete the last super admin")
		}
	}

	// Delete from Supabase Auth using Admin API
	deleteUserURL := fmt.Sprintf("%s/auth/v1/admin/users/%s", cfg.SupabaseURL, adminID)
	httpReq, err := http.NewRequestWithContext(ctx, "DELETE", deleteUserURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete user request: %w", err)
	}
	httpReq.Header.Set("apikey", cfg.SupabaseServiceKey)
	httpReq.Header.Set("Authorization", "Bearer "+cfg.SupabaseServiceKey)

	client := &http.Client{Timeout: 10 * time.Second}
	httpResp, err := client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("failed to call Supabase Auth Admin API: %w", err)
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK && httpResp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(httpResp.Body)
		return fmt.Errorf("failed to delete admin user in Supabase Auth: status %d, %s", httpResp.StatusCode, string(body))
	}

	// Delete from PostgreSQL (CASCADE will handle related records)
	_, err = database.ExecWithContext(ctx, "DELETE FROM public.users WHERE id = $1", adminID)
	return err
}
