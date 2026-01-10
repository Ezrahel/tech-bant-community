package services

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"tech-bant-community/server/database"
	"tech-bant-community/server/models"
	"tech-bant-community/server/utils"
)

// UserService handles user operations
type UserService struct {
	db    *sql.DB
	cache *CacheService
}

// NewUserService creates a new UserService instance
func NewUserService(db *sql.DB) *UserService {
	return &UserService{db: db, cache: nil}
}

// NewUserServiceWithCache creates a new UserService instance with cache
func NewUserServiceWithCache(db *sql.DB, cache *CacheService) *UserService {
	return &UserService{db: db, cache: cache}
}

// GetOrCreateUser gets or creates a user profile in PostgreSQL
func (s *UserService) GetOrCreateUser(ctx context.Context, userID, email, name string) (*models.User, error) {
	// Try to get user first
	user, err := s.GetUser(ctx, userID)
	if err == nil && user != nil {
		return user, nil
	}

	// Create new user
	now := time.Now().UTC()
	avatar := "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop"

	query := `
		INSERT INTO public.users (id, name, email, avatar, bio, location, website, is_admin, is_verified, is_active, role, provider, posts_count, followers_count, following_count, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		ON CONFLICT (id) DO UPDATE SET updated_at = $17
		RETURNING id, name, email, avatar, bio, location, website, is_admin, is_verified, is_active, role, provider, posts_count, followers_count, following_count, created_at, updated_at
	`

	row := database.QueryRowWithContext(ctx, query,
		userID, name, email, avatar,
		"", "", "", // bio, location, website
		false, false, true, // is_admin, is_verified, is_active
		models.RoleUser, "email",
		0, 0, 0, // posts_count, followers_count, following_count
		now, now,
	)

	return s.scanUser(row)
}

// GetUser gets a user by ID with posts count
func (s *UserService) GetUser(ctx context.Context, userID string) (*models.User, error) {
	query := `
		SELECT u.id, u.name, u.email, u.avatar, u.bio, u.location, u.website, 
		       u.is_admin, u.is_verified, u.is_active, u.role, u.provider,
		       u.posts_count, u.followers_count, u.following_count,
		       u.created_at, u.updated_at,
		       COUNT(p.id) as actual_posts_count
		FROM public.users u
		LEFT JOIN public.posts p ON p.author_id = u.id
		WHERE u.id = $1
		GROUP BY u.id
	`

	row := database.QueryRowWithContext(ctx, query, userID)
	var user models.User
	var avatar, bio, location, website sql.NullString
	var actualPostsCount int

	err := row.Scan(
		&user.ID, &user.Name, &user.Email, &avatar, &bio, &location, &website,
		&user.IsAdmin, &user.IsVerified, &user.IsActive, &user.Role, &user.Provider,
		&user.PostsCount, &user.FollowersCount, &user.FollowingCount,
		&user.CreatedAt, &user.UpdatedAt,
		&actualPostsCount,
	)
	if err != nil {
		return nil, err
	}

	// Update posts count if different
	if actualPostsCount != user.PostsCount {
		user.PostsCount = actualPostsCount
		// Optionally update the count in database
		_, _ = database.ExecWithContext(ctx, "UPDATE public.users SET posts_count = $1 WHERE id = $2", actualPostsCount, userID)
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

// UpdateUser updates user profile
func (s *UserService) UpdateUser(ctx context.Context, userID string, req *models.UpdateProfileRequest) (*models.User, error) {
	updates := []string{"updated_at = $1"}
	args := []interface{}{time.Now().UTC()}
	argIndex := 2

	if req.Name != "" {
		name := utils.SanitizeString(req.Name)
		if !utils.ValidateLength(name, 1, 100) {
			return nil, fmt.Errorf("name must be between 1 and 100 characters")
		}
		updates = append(updates, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, name)
		argIndex++
	}

	if req.Bio != "" {
		bio := utils.SanitizeString(req.Bio)
		if !utils.ValidateLength(bio, 0, 500) {
			return nil, fmt.Errorf("bio must be less than 500 characters")
		}
		updates = append(updates, fmt.Sprintf("bio = $%d", argIndex))
		args = append(args, bio)
		argIndex++
	}

	if req.Location != "" {
		location := utils.SanitizeString(req.Location)
		if !utils.ValidateLength(location, 0, 100) {
			return nil, fmt.Errorf("location must be less than 100 characters")
		}
		updates = append(updates, fmt.Sprintf("location = $%d", argIndex))
		args = append(args, location)
		argIndex++
	}

	if req.Website != "" {
		if !utils.ValidateURL(req.Website) {
			return nil, fmt.Errorf("invalid website URL")
		}
		updates = append(updates, fmt.Sprintf("website = $%d", argIndex))
		args = append(args, req.Website)
		argIndex++
	}

	if req.Avatar != "" {
		if !utils.ValidateURL(req.Avatar) {
			return nil, fmt.Errorf("invalid avatar URL")
		}
		updates = append(updates, fmt.Sprintf("avatar = $%d", argIndex))
		args = append(args, req.Avatar)
		argIndex++
	}

	if len(updates) == 1 {
		// Only updated_at, no other changes
		return s.GetUser(ctx, userID)
	}

	args = append(args, userID)
	query := fmt.Sprintf("UPDATE public.users SET %s WHERE id = $%d", strings.Join(updates, ", "), argIndex)
	_, err := database.ExecWithContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	return s.GetUser(ctx, userID)
}

// SearchUsers searches users by name
func (s *UserService) SearchUsers(ctx context.Context, query string, limit int) ([]*models.User, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	sqlQuery := `
		SELECT id, name, email, avatar, bio, location, website, is_admin, is_verified, is_active, role, provider, posts_count, followers_count, following_count, created_at, updated_at
		FROM public.users
		WHERE name ILIKE $1 OR email ILIKE $1
		ORDER BY name
		LIMIT $2
	`

	searchPattern := "%" + query + "%"
	rows, err := database.QueryWithContext(ctx, sqlQuery, searchPattern, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to search users: %w", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		var user models.User
		var avatar, bio, location, website sql.NullString

		err := rows.Scan(
			&user.ID, &user.Name, &user.Email, &avatar, &bio, &location, &website,
			&user.IsAdmin, &user.IsVerified, &user.IsActive, &user.Role, &user.Provider,
			&user.PostsCount, &user.FollowersCount, &user.FollowingCount,
			&user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			continue
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

		users = append(users, &user)
	}

	return users, nil
}

// GetUserPosts gets posts by a user
func (s *UserService) GetUserPosts(ctx context.Context, userID string, limit, offset int) ([]*models.Post, error) {
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
		SELECT id, title, content, author_id, category, tags, likes, comments, views, shares, is_pinned, is_hot, location, published_at, created_at, updated_at
		FROM public.posts
		WHERE author_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := database.QueryWithContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get user posts: %w", err)
	}
	defer rows.Close()

	var posts []*models.Post
	for rows.Next() {
		var post models.Post
		var location sql.NullString

		err := rows.Scan(
			&post.ID, &post.Title, &post.Content, &post.AuthorID, &post.Category,
			&post.Tags, &post.Likes, &post.Comments, &post.Views, &post.Shares,
			&post.IsPinned, &post.IsHot, &location,
			&post.PublishedAt, &post.CreatedAt, &post.UpdatedAt,
		)
		if err != nil {
			continue
		}

		if location.Valid {
			post.Location = location.String
		}

		posts = append(posts, &post)
	}

	return posts, nil
}

// scanUser scans a user from database row
func (s *UserService) scanUser(row *sql.Row) (*models.User, error) {
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

