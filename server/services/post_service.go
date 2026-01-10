package services

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"tech-bant-community/server/database"
	"tech-bant-community/server/models"
	"tech-bant-community/server/utils"

	"github.com/google/uuid"
)

// PostService handles post operations
type PostService struct {
	db *sql.DB
}

// NewPostService creates a new PostService instance
func NewPostService(db *sql.DB) *PostService {
	return &PostService{db: db}
}

// CreatePost creates a new post in PostgreSQL
func (s *PostService) CreatePost(ctx context.Context, userID string, req *models.CreatePostRequest) (*models.Post, error) {
	// Check for duplicate posts using content hash
	contentHash := s.hashPostContent(userID, req.Title, req.Content)

	duplicateQuery := `
		SELECT id FROM public.posts
		WHERE author_id = $1 AND content_hash = $2
		LIMIT 1
	`
	var existingID string
	err := database.QueryRowWithContext(ctx, duplicateQuery, userID, contentHash).Scan(&existingID)
	if err == nil {
		return nil, fmt.Errorf("duplicate post detected")
	}

	// Get user to populate author info
	userService := NewUserService(s.db)
	user, err := userService.GetUser(ctx, userID)
	if err != nil {
		return nil, utils.WrapError(err, "failed to get user")
	}

	now := time.Now().UTC()
	postID := uuid.New()

	// Start transaction
	tx, err := database.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert post
	postQuery := `
		INSERT INTO public.posts (id, title, content, author_id, category, tags, likes, comments, views, shares, is_pinned, is_hot, location, published_at, created_at, updated_at, content_hash)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		RETURNING id, title, content, author_id, category, tags, likes, comments, views, shares, is_pinned, is_hot, location, published_at, created_at, updated_at
	`

	var post models.Post
	var location sql.NullString
	err = tx.QueryRowContext(ctx, postQuery,
		postID, req.Title, req.Content, userID, req.Category, req.Tags,
		0, 0, 0, 0, // likes, comments, views, shares
		false, false, // is_pinned, is_hot
		req.Location,
		now, now, now, // published_at, created_at, updated_at
		contentHash,
	).Scan(
		&post.ID, &post.Title, &post.Content, &post.AuthorID, &post.Category, &post.Tags,
		&post.Likes, &post.Comments, &post.Views, &post.Shares,
		&post.IsPinned, &post.IsHot, &location,
		&post.PublishedAt, &post.CreatedAt, &post.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	if location.Valid {
		post.Location = location.String
	}

	// Increment user's posts count
	_, err = tx.ExecContext(ctx, "UPDATE public.users SET posts_count = posts_count + 1 WHERE id = $1", userID)
	if err != nil {
		return nil, fmt.Errorf("failed to increment posts count: %w", err)
	}

	// Increment posts counter
	_, err = tx.ExecContext(ctx, `
		INSERT INTO public.counters (collection_name, count, updated_at)
		VALUES ('posts', 1, $1)
		ON CONFLICT (collection_name) DO UPDATE SET count = counters.count + 1, updated_at = $1
	`, now)
	if err != nil {
		return nil, fmt.Errorf("failed to increment counter: %w", err)
	}

	// Get media attachments if provided
	if len(req.MediaIDs) > 0 {
		post.Media = make([]models.MediaAttachment, 0, len(req.MediaIDs))
		for _, mediaID := range req.MediaIDs {
			if !utils.ValidatePostID(mediaID) {
				continue
			}
			mediaQuery := "SELECT id, user_id, post_id, url, type, size FROM public.media WHERE id = $1"
			var media models.MediaAttachment
			err := tx.QueryRowContext(ctx, mediaQuery, mediaID).Scan(
				&media.ID, &media.Type, &media.URL, &media.Name, &media.Size,
			)
			if err == nil {
				post.Media = append(post.Media, media)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Populate author
	post.Author = user

	return &post, nil
}

// GetPost gets a post by ID with author information
func (s *PostService) GetPost(ctx context.Context, postID string) (*models.Post, error) {
	query := `
		SELECT p.id, p.title, p.content, p.author_id, p.category, p.tags, p.likes, p.comments, p.views, p.shares, p.is_pinned, p.is_hot, p.location, p.published_at, p.created_at, p.updated_at,
		       u.id, u.name, u.email, u.avatar, u.is_admin, u.is_verified
		FROM public.posts p
		JOIN public.users u ON p.author_id = u.id
		WHERE p.id = $1
	`

	row := database.QueryRowWithContext(ctx, query, postID)
	var post models.Post
	var author models.User
	var location sql.NullString
	var avatar sql.NullString

	err := row.Scan(
		&post.ID, &post.Title, &post.Content, &post.AuthorID, &post.Category, &post.Tags,
		&post.Likes, &post.Comments, &post.Views, &post.Shares,
		&post.IsPinned, &post.IsHot, &location,
		&post.PublishedAt, &post.CreatedAt, &post.UpdatedAt,
		&author.ID, &author.Name, &author.Email, &avatar, &author.IsAdmin, &author.IsVerified,
	)
	if err != nil {
		return nil, err
	}

	if location.Valid {
		post.Location = location.String
	}
	if avatar.Valid {
		author.Avatar = avatar.String
	}

	post.Author = &author

	// Increment views
	_, _ = database.ExecWithContext(ctx, "UPDATE public.posts SET views = views + 1 WHERE id = $1", postID)

	return &post, nil
}

// GetPosts gets posts with pagination
func (s *PostService) GetPosts(ctx context.Context, limit, offset int) ([]*models.Post, error) {
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
		SELECT p.id, p.title, p.content, p.author_id, p.category, p.tags, p.likes, p.comments, p.views, p.shares, p.is_pinned, p.is_hot, p.location, p.published_at, p.created_at, p.updated_at,
		       u.id, u.name, u.email, u.avatar, u.is_admin, u.is_verified
		FROM public.posts p
		JOIN public.users u ON p.author_id = u.id
		ORDER BY p.created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := database.QueryWithContext(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*models.Post
	for rows.Next() {
		var post models.Post
		var author models.User
		var location sql.NullString
		var avatar sql.NullString

		err := rows.Scan(
			&post.ID, &post.Title, &post.Content, &post.AuthorID, &post.Category, &post.Tags,
			&post.Likes, &post.Comments, &post.Views, &post.Shares,
			&post.IsPinned, &post.IsHot, &location,
			&post.PublishedAt, &post.CreatedAt, &post.UpdatedAt,
			&author.ID, &author.Name, &author.Email, &avatar, &author.IsAdmin, &author.IsVerified,
		)
		if err != nil {
			continue
		}

		if location.Valid {
			post.Location = location.String
		}
		if avatar.Valid {
			author.Avatar = avatar.String
		}

		post.Author = &author
		posts = append(posts, &post)
	}

	return posts, nil
}

// GetPostsByCategory gets posts by category
func (s *PostService) GetPostsByCategory(ctx context.Context, category string, limit, offset int) ([]*models.Post, error) {
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
		SELECT p.id, p.title, p.content, p.author_id, p.category, p.tags, p.likes, p.comments, p.views, p.shares, p.is_pinned, p.is_hot, p.location, p.published_at, p.created_at, p.updated_at,
		       u.id, u.name, u.email, u.avatar, u.is_admin, u.is_verified
		FROM public.posts p
		JOIN public.users u ON p.author_id = u.id
		WHERE p.category = $1
		ORDER BY p.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := database.QueryWithContext(ctx, query, category, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*models.Post
	for rows.Next() {
		var post models.Post
		var author models.User
		var location sql.NullString
		var avatar sql.NullString

		err := rows.Scan(
			&post.ID, &post.Title, &post.Content, &post.AuthorID, &post.Category, &post.Tags,
			&post.Likes, &post.Comments, &post.Views, &post.Shares,
			&post.IsPinned, &post.IsHot, &location,
			&post.PublishedAt, &post.CreatedAt, &post.UpdatedAt,
			&author.ID, &author.Name, &author.Email, &avatar, &author.IsAdmin, &author.IsVerified,
		)
		if err != nil {
			continue
		}

		if location.Valid {
			post.Location = location.String
		}
		if avatar.Valid {
			author.Avatar = avatar.String
		}

		post.Author = &author
		posts = append(posts, &post)
	}

	return posts, nil
}

// UpdatePost updates a post
func (s *PostService) UpdatePost(ctx context.Context, userID, postID string, req *models.UpdatePostRequest) (*models.Post, error) {
	// Verify ownership
	post, err := s.GetPost(ctx, postID)
	if err != nil {
		return nil, err
	}
	if post.AuthorID != userID {
		return nil, fmt.Errorf("unauthorized")
	}

	updates := []string{"updated_at = $1"}
	args := []interface{}{time.Now().UTC()}
	argIndex := 2

	if req.Title != "" {
		updates = append(updates, fmt.Sprintf("title = $%d", argIndex))
		args = append(args, req.Title)
		argIndex++
	}

	if req.Content != "" {
		updates = append(updates, fmt.Sprintf("content = $%d", argIndex))
		args = append(args, req.Content)
		argIndex++
	}

	if req.Category != "" {
		updates = append(updates, fmt.Sprintf("category = $%d", argIndex))
		args = append(args, req.Category)
		argIndex++
	}

	if req.Tags != nil {
		updates = append(updates, fmt.Sprintf("tags = $%d", argIndex))
		args = append(args, req.Tags)
		argIndex++
	}

	if req.Location != "" {
		updates = append(updates, fmt.Sprintf("location = $%d", argIndex))
		args = append(args, req.Location)
		argIndex++
	}

	args = append(args, postID)
	query := fmt.Sprintf("UPDATE public.posts SET %s WHERE id = $%d", strings.Join(updates, ", "), argIndex)
	_, err = database.ExecWithContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	return s.GetPost(ctx, postID)
}

// DeletePost deletes a post
func (s *PostService) DeletePost(ctx context.Context, userID, postID string) error {
	// Verify ownership
	post, err := s.GetPost(ctx, postID)
	if err != nil {
		return err
	}
	if post.AuthorID != userID {
		return fmt.Errorf("unauthorized")
	}

	// Start transaction
	tx, err := database.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Delete post (CASCADE will handle related records)
	_, err = tx.ExecContext(ctx, "DELETE FROM public.posts WHERE id = $1", postID)
	if err != nil {
		return err
	}

	// Decrement user's posts count
	_, err = tx.ExecContext(ctx, "UPDATE public.users SET posts_count = posts_count - 1 WHERE id = $1", userID)
	if err != nil {
		return err
	}

	// Decrement posts counter
	_, err = tx.ExecContext(ctx, "UPDATE public.counters SET count = count - 1 WHERE collection_name = 'posts'")
	if err != nil {
		return err
	}

	return tx.Commit()
}

// LikePost toggles like on a post
func (s *PostService) LikePost(ctx context.Context, userID, postID string) error {
	// Check if already liked
	checkQuery := "SELECT id FROM public.likes WHERE post_id = $1 AND user_id = $2"
	var likeID string
	err := database.QueryRowWithContext(ctx, checkQuery, postID, userID).Scan(&likeID)

	tx, err := database.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err == nil {
		// Unlike: delete like and decrement count
		_, err = tx.ExecContext(ctx, "DELETE FROM public.likes WHERE id = $1", likeID)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, "UPDATE public.posts SET likes = likes - 1 WHERE id = $1", postID)
	} else {
		// Like: insert like and increment count
		likeID := uuid.New()
		_, err = tx.ExecContext(ctx, "INSERT INTO public.likes (id, post_id, user_id, created_at) VALUES ($1, $2, $3, $4)", likeID, postID, userID, time.Now().UTC())
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, "UPDATE public.posts SET likes = likes + 1 WHERE id = $1", postID)
	}

	if err != nil {
		return err
	}

	return tx.Commit()
}

// BookmarkPost toggles bookmark on a post
func (s *PostService) BookmarkPost(ctx context.Context, userID, postID string) error {
	// Check if already bookmarked
	checkQuery := "SELECT id FROM public.bookmarks WHERE post_id = $1 AND user_id = $2"
	var bookmarkID string
	err := database.QueryRowWithContext(ctx, checkQuery, postID, userID).Scan(&bookmarkID)

	if err == nil {
		// Unbookmark: delete bookmark
		_, err = database.ExecWithContext(ctx, "DELETE FROM public.bookmarks WHERE id = $1", bookmarkID)
	} else {
		// Bookmark: insert bookmark
		bookmarkID := uuid.New()
		_, err = database.ExecWithContext(ctx, "INSERT INTO public.bookmarks (id, post_id, user_id, created_at) VALUES ($1, $2, $3, $4)", bookmarkID, postID, userID, time.Now().UTC())
	}

	return err
}

// hashPostContent generates a hash for duplicate detection
func (s *PostService) hashPostContent(userID, title, content string) string {
	h := sha256.New()
	h.Write([]byte(fmt.Sprintf("%s:%s:%s", userID, title, content)))
	return hex.EncodeToString(h.Sum(nil))
}
