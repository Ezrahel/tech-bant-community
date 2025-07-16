package models

import (
	"time"
)

type LikeType string

const (
	LikeTypePost    LikeType = "post"
	LikeTypeComment LikeType = "comment"
)

type Like struct {
	ID        string    `json:"$id,omitempty"`
	UserID    string    `json:"user_id"`
	PostID    string    `json:"post_id,omitempty"`
	CommentID string    `json:"comment_id,omitempty"`
	Type      LikeType  `json:"type"`
	CreatedAt time.Time `json:"$createdAt,omitempty"`
}

type CreateLikeRequest struct {
	PostID    string   `json:"post_id,omitempty"`
	CommentID string   `json:"comment_id,omitempty"`
	Type      LikeType `json:"type" validate:"required"`
}