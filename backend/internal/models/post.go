package models

import (
	"time"
)

type PostCategory string

const (
	CategoryGeneral PostCategory = "general"
	CategoryTech    PostCategory = "tech"
	CategoryReviews PostCategory = "reviews"
	CategoryUpdates PostCategory = "updates"
	CategoryGists   PostCategory = "gists"
	CategoryBanter  PostCategory = "banter"
)

type Post struct {
	ID            string       `json:"$id,omitempty"`
	Title         string       `json:"title" validate:"required,min=1,max=200"`
	Content       string       `json:"content" validate:"required,min=1,max=2000"`
	Category      PostCategory `json:"category" validate:"required"`
	Tags          []string     `json:"tags"`
	AuthorID      string       `json:"author_id"`
	AuthorName    string       `json:"author_name"`
	AuthorAvatar  string       `json:"author_avatar"`
	AuthorAdmin   bool         `json:"author_admin"`
	AuthorVerified bool        `json:"author_verified"`
	Views         int64        `json:"views"`
	LikesCount    int64        `json:"likes_count"`
	CommentsCount int64        `json:"comments_count"`
	SharesCount   int64        `json:"shares_count"`
	IsPinned      bool         `json:"is_pinned"`
	IsHot         bool         `json:"is_hot"`
	Location      string       `json:"location"`
	MediaIDs      []string     `json:"media_ids"`
	CreatedAt     time.Time    `json:"$createdAt,omitempty"`
	UpdatedAt     time.Time    `json:"$updatedAt,omitempty"`
}

type CreatePostRequest struct {
	Title    string       `json:"title" validate:"required,min=1,max=200"`
	Content  string       `json:"content" validate:"required,min=1,max=2000"`
	Category PostCategory `json:"category" validate:"required"`
	Tags     []string     `json:"tags"`
	Location string       `json:"location"`
	MediaIDs []string     `json:"media_ids"`
}

type UpdatePostRequest struct {
	Title    string       `json:"title,omitempty" validate:"omitempty,min=1,max=200"`
	Content  string       `json:"content,omitempty" validate:"omitempty,min=1,max=2000"`
	Category PostCategory `json:"category,omitempty"`
	Tags     []string     `json:"tags,omitempty"`
	Location string       `json:"location,omitempty"`
}

type PostResponse struct {
	ID            string       `json:"id"`
	Title         string       `json:"title"`
	Content       string       `json:"content"`
	Category      PostCategory `json:"category"`
	Tags          []string     `json:"tags"`
	Author        User         `json:"author"`
	Views         int64        `json:"views"`
	LikesCount    int64        `json:"likes_count"`
	CommentsCount int64        `json:"comments_count"`
	SharesCount   int64        `json:"shares_count"`
	IsPinned      bool         `json:"is_pinned"`
	IsHot         bool         `json:"is_hot"`
	Location      string       `json:"location"`
	Media         []Media      `json:"media,omitempty"`
	IsLiked       bool         `json:"is_liked"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
}