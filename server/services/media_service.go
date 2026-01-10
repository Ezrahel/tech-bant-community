package services

import (
	"bytes"
	"context"
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"time"

	"tech-bant-community/server/config"
	"tech-bant-community/server/database"
	"tech-bant-community/server/models"

	"github.com/google/uuid"
)

// MediaService handles media operations
type MediaService struct {
	db *sql.DB
}

// NewMediaService creates a new MediaService instance
func NewMediaService(db *sql.DB) *MediaService {
	return &MediaService{db: db}
}

// UploadMedia uploads a file to Supabase Storage and creates a media record
func (s *MediaService) UploadMedia(ctx context.Context, userID string, file io.Reader, filename string, size int64, detectedMIME string, cfg *config.Config) (*models.MediaAttachment, error) {
	// Determine media type
	var mediaType string
	if len(detectedMIME) >= 5 {
		if detectedMIME[:5] == "image" {
			mediaType = "image"
		} else if detectedMIME[:5] == "video" {
			mediaType = "video"
		} else {
			mediaType = "image" // default
		}
	} else {
		mediaType = "image" // default
	}

	// Generate unique filename
	mediaID := uuid.New()
	objectPath := fmt.Sprintf("%s/%s", mediaID.String(), filename)

	// Read file into bytes for upload
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// Upload to Supabase Storage using HTTP API
	// The supabase-go library doesn't have Storage.From, so we use HTTP directly
	uploadURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", cfg.SupabaseURL, cfg.StorageBucket, objectPath)

	req, err := http.NewRequestWithContext(ctx, "POST", uploadURL, bytes.NewReader(fileBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create upload request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+cfg.SupabaseServiceKey)
	req.Header.Set("Content-Type", detectedMIME)
	req.Header.Set("x-upsert", "false")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to upload to Supabase Storage: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to upload to Supabase Storage: %s", string(body))
	}

	// Get public URL
	publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", cfg.SupabaseURL, cfg.StorageBucket, objectPath)

	// Create media record in PostgreSQL
	query := `
		INSERT INTO public.media (id, user_id, url, type, size, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, user_id, post_id, url, type, size, created_at
	`

	row := database.QueryRowWithContext(ctx, query,
		mediaID, userID, publicURL, mediaType, size, time.Now().UTC(),
	)

	var media models.MediaAttachment
	var postID *string
	var createdAt time.Time
	err = row.Scan(
		&media.ID, &userID, &postID, &media.URL, &media.Type, &media.Size, &createdAt,
	)
	if err != nil {
		// Rollback: delete from storage
		deleteURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", cfg.SupabaseURL, cfg.StorageBucket, objectPath)
		req, _ := http.NewRequestWithContext(ctx, "DELETE", deleteURL, nil)
		req.Header.Set("Authorization", "Bearer "+cfg.SupabaseServiceKey)
		client := &http.Client{Timeout: 5 * time.Second}
		client.Do(req)
		return nil, fmt.Errorf("failed to create media record: %w", err)
	}

	media.Name = filename

	return &media, nil
}

// GetMedia gets media by ID
func (s *MediaService) GetMedia(ctx context.Context, mediaID string) (*models.MediaAttachment, string, error) {
	query := "SELECT id, user_id, post_id, url, type, size, created_at FROM public.media WHERE id = $1"
	row := database.QueryRowWithContext(ctx, query, mediaID)

	var media models.MediaAttachment
	var userID string
	var postID *string
	var createdAt time.Time
	err := row.Scan(&media.ID, &userID, &postID, &media.URL, &media.Type, &media.Size, &createdAt)
	if err != nil {
		return nil, "", err
	}

	return &media, userID, nil
}

// DeleteMedia deletes media from Supabase Storage and database
func (s *MediaService) DeleteMedia(ctx context.Context, userID, mediaID string, cfg *config.Config) error {
	// Get media to verify ownership and get file path
	media, mediaUserID, err := s.GetMedia(ctx, mediaID)
	if err != nil {
		return err
	}

	// Verify ownership
	if mediaUserID != userID {
		return fmt.Errorf("unauthorized")
	}

	// Extract file path from URL
	// URL format: {supabaseURL}/storage/v1/object/public/{bucket}/{path}
	// We need to extract the path part
	filePath := extractFilePathFromURL(media.URL, cfg.SupabaseURL, cfg.StorageBucket)

	// Delete from Supabase Storage using HTTP API
	deleteURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", cfg.SupabaseURL, cfg.StorageBucket, filePath)
	req, err := http.NewRequestWithContext(ctx, "DELETE", deleteURL, nil)
	if err == nil {
		req.Header.Set("Authorization", "Bearer "+cfg.SupabaseServiceKey)
		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Do(req)
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
				fmt.Printf("Warning: Failed to delete from storage: status %d\n", resp.StatusCode)
			}
		} else {
			fmt.Printf("Warning: Failed to delete from storage: %v\n", err)
		}
	}

	// Delete from database
	query := "DELETE FROM public.media WHERE id = $1"
	_, err = database.ExecWithContext(ctx, query, mediaID)
	return err
}

// GetUserMedia gets all media for a user
func (s *MediaService) GetUserMedia(ctx context.Context, userID string) ([]*models.MediaAttachment, error) {
	limit := 100
	offset := 0
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
		SELECT id, user_id, post_id, url, type, size, created_at
		FROM public.media
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := database.QueryWithContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var mediaList []*models.MediaAttachment
	for rows.Next() {
		var media models.MediaAttachment
		var scannedUserID string
		var postID *string
		var createdAt time.Time

		err := rows.Scan(&media.ID, &scannedUserID, &postID, &media.URL, &media.Type, &media.Size, &createdAt)
		if err != nil {
			continue
		}

		mediaList = append(mediaList, &media)
	}

	return mediaList, nil
}

// extractFilePathFromURL extracts file path from Supabase Storage URL
func extractFilePathFromURL(url, supabaseURL, bucket string) string {
	// URL format: {supabaseURL}/storage/v1/object/public/{bucket}/{path}
	prefix := fmt.Sprintf("%s/storage/v1/object/public/%s/", supabaseURL, bucket)
	if len(url) > len(prefix) {
		return url[len(prefix):]
	}
	return ""
}
