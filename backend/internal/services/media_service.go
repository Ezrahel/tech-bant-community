package services

import (
	"encoding/json"
	"fmt"
	"mime/multipart"
	"nothing-community-backend/internal/database"
	"nothing-community-backend/internal/models"
	"path/filepath"
	"strings"

	"github.com/appwrite/sdk-for-go/appwrite"
)

type MediaService struct {
	appwriteClient *database.AppwriteClient
}

	return &MediaService{
		appwriteClient: appwriteClient,
	}
}

func (s *MediaService) UploadMedia(userID string, file *multipart.FileHeader) (*models.UploadMediaResponse, error) {
	// Validate file type
	mediaType, err := s.getMediaType(file.Header.Get("Content-Type"))
	if err != nil {
		return nil, err
	}

	// Open file
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	// Upload to Appwrite Storage
	uploadedFile, err := s.appwriteClient.Storage.CreateFile(
		s.appwriteClient.Config.AppwriteStorageBucketID,
		appwrite.ID.Unique(),
		src,
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %v", err)
	}

	// Generate file URL
	fileURL := fmt.Sprintf("%s/storage/buckets/%s/files/%s/view?project=%s",
		s.appwriteClient.Config.AppwriteEndpoint,
		s.appwriteClient.Config.AppwriteStorageBucketID,
		uploadedFile.Id,
		s.appwriteClient.Config.AppwriteProjectID,
	)

	// Create media record in database
	mediaData := map[string]interface{}{
		"user_id":   userID,
		"type":      string(mediaType),
		"url":       fileURL,
		"name":      file.Filename,
		"size":      file.Size,
		"mime_type": file.Header.Get("Content-Type"),
		"file_id":   uploadedFile.Id,
	}

	doc, err := s.appwriteClient.Database.CreateDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteMediaCollectionID,
		appwrite.ID.Unique(),
		mediaData,
		nil,
	)
	if err != nil {
		// Clean up uploaded file if database creation fails
		s.appwriteClient.Storage.DeleteFile(
			s.appwriteClient.Config.AppwriteStorageBucketID,
			uploadedFile.Id,
		)
		return nil, fmt.Errorf("failed to create media record: %v", err)
	}

	return &models.UploadMediaResponse{
		ID:       doc.Id,
		Type:     mediaType,
		URL:      fileURL,
		Name:     file.Filename,
		Size:     file.Size,
		MimeType: file.Header.Get("Content-Type"),
	}, nil
}

func (s *MediaService) GetMedia(mediaID string) (*models.Media, error) {
	doc, err := s.appwriteClient.Database.GetDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteMediaCollectionID,
		mediaID,
		nil,
	)
	if err != nil {
		return nil, err
	}

	var media models.Media
	if err := s.mapDocumentToMedia(doc.Data, &media); err != nil {
		return nil, err
	}

	media.ID = doc.Id
	return &media, nil
}

func (s *MediaService) DeleteMedia(mediaID, userID string) error {
	// Get media record
	media, err := s.GetMedia(mediaID)
	if err != nil {
		return err
	}

	// Check if user owns the media
	if media.UserID != userID {
		return fmt.Errorf("unauthorized")
	}

	// Delete from storage
	_, err = s.appwriteClient.Storage.DeleteFile(
		s.appwriteClient.Config.AppwriteStorageBucketID,
		media.FileID,
	)
	if err != nil {
		return fmt.Errorf("failed to delete file from storage: %v", err)
	}

	// Delete from database
	_, err = s.appwriteClient.Database.DeleteDocument(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteMediaCollectionID,
		mediaID,
	)
	if err != nil {
		return fmt.Errorf("failed to delete media record: %v", err)
	}

	return nil
}

func (s *MediaService) GetMediaByUser(userID string) ([]models.Media, error) {
	queries := []string{
		fmt.Sprintf("equal(\"user_id\", \"%s\")", userID),
		"orderDesc(\"$createdAt\")",
	}

	docs, err := s.appwriteClient.Database.ListDocuments(
		s.appwriteClient.Config.AppwriteDatabaseID,
		s.appwriteClient.Config.AppwriteMediaCollectionID,
		queries,
	)
	if err != nil {
		return nil, err
	}

	var mediaList []models.Media
	for _, doc := range docs.Documents {
		var media models.Media
		if err := s.mapDocumentToMedia(doc.Data, &media); err != nil {
			continue
		}
		media.ID = doc.Id
		mediaList = append(mediaList, media)
	}

	return mediaList, nil
}

func (s *MediaService) getMediaType(mimeType string) (models.MediaType, error) {
	switch {
	case strings.HasPrefix(mimeType, "image/"):
		if mimeType == "image/gif" {
			return models.MediaTypeGIF, nil
		}
		return models.MediaTypeImage, nil
	case strings.HasPrefix(mimeType, "video/"):
		return models.MediaTypeVideo, nil
	default:
		return "", fmt.Errorf("unsupported media type: %s", mimeType)
	}
}

func (s *MediaService) mapDocumentToMedia(data interface{}, media *models.Media) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return json.Unmarshal(jsonData, media)
}