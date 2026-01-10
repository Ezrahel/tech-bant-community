package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"tech-bant-community/server/database"
	"tech-bant-community/server/models"
	"tech-bant-community/server/utils"

	"github.com/google/uuid"
)

// CommentService handles comment operations
type CommentService struct {
	db *sql.DB
}

// NewCommentService creates a new CommentService instance
func NewCommentService(db *sql.DB) *CommentService {
	return &CommentService{db: db}
}

// CreateComment creates a comment on a post using PostgreSQL transaction
func (s *CommentService) CreateComment(ctx context.Context, userID, postID string, req *models.CreateCommentRequest) (*models.Comment, error) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	// Validate and sanitize comment content
	content, err := utils.SanitizeAndValidatePostContent(req.Content)
	if err != nil {
		return nil, utils.WrapError(err, "invalid comment content")
	}

	// Get user
	userService := NewUserService(s.db)
	user, err := userService.GetUser(ctx, userID)
	if err != nil {
		return nil, utils.WrapError(err, "failed to get user")
	}

	now := time.Now().UTC()
	commentID := uuid.New()

	// Start transaction
	tx, err := database.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert comment
	commentQuery := `
		INSERT INTO public.comments (id, post_id, author_id, content, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, post_id, author_id, content, created_at, updated_at
	`

	var comment models.Comment
	err = tx.QueryRowContext(ctx, commentQuery,
		commentID, postID, userID, content, now, now,
	).Scan(
		&comment.ID, &comment.PostID, &comment.AuthorID, &comment.Content,
		&comment.CreatedAt, &comment.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create comment: %w", err)
	}

	// Increment post comments count
	_, err = tx.ExecContext(ctx, "UPDATE public.posts SET comments = comments + 1 WHERE id = $1", postID)
	if err != nil {
		return nil, fmt.Errorf("failed to increment comments count: %w", err)
	}

	// Increment comments counter
	_, err = tx.ExecContext(ctx, `
		INSERT INTO public.counters (collection_name, count, updated_at)
		VALUES ('comments', 1, $1)
		ON CONFLICT (collection_name) DO UPDATE SET count = counters.count + 1, updated_at = $1
	`, now)
	if err != nil {
		return nil, fmt.Errorf("failed to increment counter: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Populate author
	comment.Author = user
	comment.Likes = 0 // Will be calculated from likes table if needed

	return &comment, nil
}

// GetComments gets comments for a post with author information
func (s *CommentService) GetComments(ctx context.Context, postID string, limit, offset int) ([]*models.Comment, error) {
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
		SELECT c.id, c.post_id, c.author_id, c.content, c.created_at, c.updated_at,
		       u.id, u.name, u.email, u.avatar, u.is_admin, u.is_verified,
		       COUNT(l.id) as likes_count
		FROM public.comments c
		JOIN public.users u ON c.author_id = u.id
		LEFT JOIN public.likes l ON l.comment_id = c.id
		WHERE c.post_id = $1
		GROUP BY c.id, u.id
		ORDER BY c.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := database.QueryWithContext(ctx, query, postID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get comments: %w", err)
	}
	defer rows.Close()

	var comments []*models.Comment
	for rows.Next() {
		var comment models.Comment
		var author models.User
		var avatar sql.NullString
		var likesCount int

		err := rows.Scan(
			&comment.ID, &comment.PostID, &comment.AuthorID, &comment.Content,
			&comment.CreatedAt, &comment.UpdatedAt,
			&author.ID, &author.Name, &author.Email, &avatar, &author.IsAdmin, &author.IsVerified,
			&likesCount,
		)
		if err != nil {
			continue
		}

		comment.Likes = likesCount
		if avatar.Valid {
			author.Avatar = avatar.String
		}
		comment.Author = &author
		comments = append(comments, &comment)
	}

	return comments, nil
}

// UpdateComment updates a comment
func (s *CommentService) UpdateComment(ctx context.Context, userID, commentID string, req *models.UpdateCommentRequest) (*models.Comment, error) {
	// Verify ownership
	comment, err := s.getCommentByID(ctx, commentID)
	if err != nil {
		return nil, err
	}
	if comment.AuthorID != userID {
		return nil, fmt.Errorf("unauthorized")
	}

	// Validate and sanitize content
	content, err := utils.SanitizeAndValidatePostContent(req.Content)
	if err != nil {
		return nil, utils.WrapError(err, "invalid comment content")
	}

	query := `
		UPDATE public.comments
		SET content = $1, updated_at = $2
		WHERE id = $3
		RETURNING id, post_id, author_id, content, created_at, updated_at
	`

	row := database.QueryRowWithContext(ctx, query, content, time.Now().UTC(), commentID)
	var updatedComment models.Comment
	err = row.Scan(
		&updatedComment.ID, &updatedComment.PostID, &updatedComment.AuthorID, &updatedComment.Content,
		&updatedComment.CreatedAt, &updatedComment.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Get author
	userService := NewUserService(s.db)
	author, _ := userService.GetUser(ctx, updatedComment.AuthorID)
	updatedComment.Author = author

	return &updatedComment, nil
}

// DeleteComment deletes a comment
func (s *CommentService) DeleteComment(ctx context.Context, userID, commentID string) error {
	// Verify ownership
	comment, err := s.getCommentByID(ctx, commentID)
	if err != nil {
		return err
	}
	if comment.AuthorID != userID {
		return fmt.Errorf("unauthorized")
	}

	// Start transaction
	tx, err := database.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Delete comment (CASCADE will handle related records)
	_, err = tx.ExecContext(ctx, "DELETE FROM public.comments WHERE id = $1", commentID)
	if err != nil {
		return err
	}

	// Decrement post comments count
	_, err = tx.ExecContext(ctx, "UPDATE public.posts SET comments = comments - 1 WHERE id = $1", comment.PostID)
	if err != nil {
		return err
	}

	// Decrement comments counter
	_, err = tx.ExecContext(ctx, "UPDATE public.counters SET count = count - 1 WHERE collection_name = 'comments'")
	if err != nil {
		return err
	}

	return tx.Commit()
}

// LikeComment toggles like on a comment
func (s *CommentService) LikeComment(ctx context.Context, userID, commentID string) error {
	// Check if already liked
	checkQuery := "SELECT id FROM public.likes WHERE comment_id = $1 AND user_id = $2"
	var likeID string
	err := database.QueryRowWithContext(ctx, checkQuery, commentID, userID).Scan(&likeID)

	tx, err := database.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err == nil {
		// Unlike: delete like
		_, err = tx.ExecContext(ctx, "DELETE FROM public.likes WHERE id = $1", likeID)
	} else {
		// Like: insert like
		likeID := uuid.New()
		_, err = tx.ExecContext(ctx, "INSERT INTO public.likes (id, comment_id, user_id, created_at) VALUES ($1, $2, $3, $4)", likeID, commentID, userID, time.Now().UTC())
	}

	if err != nil {
		return err
	}

	return tx.Commit()
}

// getCommentByID gets a comment by ID
func (s *CommentService) getCommentByID(ctx context.Context, commentID string) (*models.Comment, error) {
	query := "SELECT id, post_id, author_id, content, created_at, updated_at FROM public.comments WHERE id = $1"
	row := database.QueryRowWithContext(ctx, query, commentID)
	var comment models.Comment
	err := row.Scan(
		&comment.ID, &comment.PostID, &comment.AuthorID, &comment.Content,
		&comment.CreatedAt, &comment.UpdatedAt,
	)
	return &comment, err
}

