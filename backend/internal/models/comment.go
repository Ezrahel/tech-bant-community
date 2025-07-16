package models

import (
	"time"
)

type Comment struct {
	ID            string    `json:"$id,omitempty"`
	Content       string    `json:"content" validate:"required,min=1,max=1000"`
	PostID        string    `json:"post_id" validate:"required"`
	AuthorID      string    `json:"author_id"`
	AuthorName    string    `json:"author_name"`
	AuthorAvatar  string    `json:"author_avatar"`
	AuthorAdmin   bool      `json:"author_admin"`
	AuthorVerified bool     `json:"author_verified"`
	ParentID      string    `json:"parent_id,omitempty"`
	LikesCount    int64     `json:"likes_count"`
	CreatedAt     time.Time `json:"$createdAt,omitempty"`
	UpdatedAt     time.Time `json:"$updatedAt,omitempty"`
}

type CreateCommentRequest struct {
	Content  string `json:"content" validate:"required,min=1,max=1000"`
	PostID   string `json:"post_id" validate:"required"`
	ParentID string `json:"parent_id,omitempty"`
}

type UpdateCommentRequest struct {
	Content string `json:"content" validate:"required,min=1,max=1000"`
}

type CommentResponse struct {
	ID         string            `json:"id"`
	Content    string            `json:"content"`
	PostID     string            `json:"post_id"`
	ParentID   string            `json:"parent_id,omitempty"`
	Author     User              `json:"author"`
	LikesCount int64             `json:"likes_count"`
	Replies    []CommentResponse `json:"replies,omitempty"`
	IsLiked    bool              `json:"is_liked"`
	CreatedAt  time.Time         `json:"created_at"`
	UpdatedAt  time.Time         `json:"updated_at"`
}