package models

import (
	"time"
)

type MediaType string

const (
	MediaTypeImage MediaType = "image"
	MediaTypeVideo MediaType = "video"
	MediaTypeGIF   MediaType = "gif"
)

type Media struct {
	ID        string    `json:"$id,omitempty"`
	PostID    string    `json:"post_id,omitempty"`
	UserID    string    `json:"user_id"`
	Type      MediaType `json:"type"`
	URL       string    `json:"url"`
	Name      string    `json:"name"`
	Size      int64     `json:"size"`
	MimeType  string    `json:"mime_type"`
	FileID    string    `json:"file_id"` // Appwrite file ID
	CreatedAt time.Time `json:"$createdAt,omitempty"`
	UpdatedAt time.Time `json:"$updatedAt,omitempty"`
}

type UploadMediaResponse struct {
	ID       string    `json:"id"`
	Type     MediaType `json:"type"`
	URL      string    `json:"url"`
	Name     string    `json:"name"`
	Size     int64     `json:"size"`
	MimeType string    `json:"mime_type"`
}