package models

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID             string    `firestore:"id" json:"id"`
	Name           string    `firestore:"name" json:"name"`
	Email          string    `firestore:"email" json:"email,omitempty"`
	Avatar         string    `firestore:"avatar" json:"avatar"`
	Bio            string    `firestore:"bio" json:"bio,omitempty"`
	Location       string    `firestore:"location" json:"location,omitempty"`
	Website        string    `firestore:"website" json:"website,omitempty"`
	IsAdmin        bool      `firestore:"is_admin" json:"isAdmin"`
	IsVerified     bool      `firestore:"is_verified" json:"isVerified"`
	IsActive       bool      `firestore:"is_active" json:"isActive"`
	Role           string    `firestore:"role" json:"role,omitempty"`
	Provider       string    `firestore:"provider" json:"provider,omitempty"`
	CreatedAt      time.Time `firestore:"created_at" json:"createdAt"`
	UpdatedAt      time.Time `firestore:"updated_at" json:"updatedAt"`
	PostsCount     int       `firestore:"posts_count" json:"posts_count,omitempty"`
	FollowersCount int       `firestore:"followers_count" json:"followers_count,omitempty"`
	FollowingCount int       `firestore:"following_count" json:"following_count,omitempty"`
}

// Post represents a post in the system
type Post struct {
	ID          string            `firestore:"id" json:"id"`
	Title       string            `firestore:"title" json:"title"`
	Content     string            `firestore:"content" json:"content"`
	AuthorID    string            `firestore:"author_id" json:"author_id"`
	Author      *User             `firestore:"-" json:"author,omitempty"`
	Category    string            `firestore:"category" json:"category"`
	Tags        []string          `firestore:"tags" json:"tags"`
	Likes       int               `firestore:"likes" json:"likes"`
	Comments    int               `firestore:"comments" json:"comments"`
	Views       int               `firestore:"views" json:"views"`
	Shares      int               `firestore:"shares" json:"shares,omitempty"`
	IsPinned    bool              `firestore:"is_pinned" json:"isPinned,omitempty"`
	IsHot       bool              `firestore:"is_hot" json:"isHot,omitempty"`
	Media       []MediaAttachment `firestore:"media" json:"media,omitempty"`
	Location    string            `firestore:"location" json:"location,omitempty"`
	PublishedAt time.Time         `firestore:"published_at" json:"publishedAt"`
	CreatedAt   time.Time         `firestore:"created_at" json:"createdAt"`
	UpdatedAt   time.Time         `firestore:"updated_at" json:"updatedAt"`
}

// MediaAttachment represents media attached to a post
type MediaAttachment struct {
	ID   string `firestore:"id" json:"id"`
	Type string `firestore:"type" json:"type"` // image, video, gif
	URL  string `firestore:"url" json:"url"`
	Name string `firestore:"name" json:"name"`
	Size int64  `firestore:"size" json:"size"`
}

// Comment represents a comment on a post
type Comment struct {
	ID        string    `firestore:"id" json:"id"`
	PostID    string    `firestore:"post_id" json:"post_id"`
	AuthorID  string    `firestore:"author_id" json:"author_id"`
	Author    *User     `firestore:"-" json:"author,omitempty"`
	Content   string    `firestore:"content" json:"content"`
	Likes     int       `firestore:"likes" json:"likes"`
	CreatedAt time.Time `firestore:"created_at" json:"createdAt"`
	UpdatedAt time.Time `firestore:"updated_at" json:"updatedAt"`
}

// Like represents a like on a post or comment
type Like struct {
	ID        string    `firestore:"id" json:"id"`
	UserID    string    `firestore:"user_id" json:"user_id"`
	PostID    string    `firestore:"post_id,omitempty" json:"post_id,omitempty"`
	CommentID string    `firestore:"comment_id,omitempty" json:"comment_id,omitempty"`
	CreatedAt time.Time `firestore:"created_at" json:"createdAt"`
}

// Bookmark represents a bookmark
type Bookmark struct {
	ID        string    `firestore:"id" json:"id"`
	UserID    string    `firestore:"user_id" json:"user_id"`
	PostID    string    `firestore:"post_id" json:"post_id"`
	CreatedAt time.Time `firestore:"created_at" json:"createdAt"`
}

// AdminStats represents dashboard statistics
type AdminStats struct {
	TotalUsers       int `json:"total_users"`
	TotalPosts       int `json:"total_posts"`
	TotalComments    int `json:"total_comments"`
	TotalAdmins      int `json:"total_admins"`
	ActiveUsers      int `json:"active_users"`       // Users active in last 30 days
	NewUsersToday    int `json:"new_users_today"`    // New users today
	NewPostsToday    int `json:"new_posts_today"`    // New posts today
	NewCommentsToday int `json:"new_comments_today"` // New comments today
	TotalLikes       int `json:"total_likes"`        // Total likes across all posts
	TotalBookmarks   int `json:"total_bookmarks"`    // Total bookmarks
	TotalMedia       int `json:"total_media"`        // Total media files
}

// CreatePostRequest represents a request to create a post
type CreatePostRequest struct {
	Title    string   `json:"title"`
	Content  string   `json:"content"`
	Category string   `json:"category"`
	Tags     []string `json:"tags"`
	Location string   `json:"location,omitempty"`
	MediaIDs []string `json:"mediaIds,omitempty"`
}

// UpdatePostRequest represents a request to update a post
type UpdatePostRequest struct {
	Title    string   `json:"title,omitempty"`
	Content  string   `json:"content,omitempty"`
	Category string   `json:"category,omitempty"`
	Tags     []string `json:"tags,omitempty"`
	Location string   `json:"location,omitempty"`
	MediaIDs []string `json:"mediaIds,omitempty"`
}

// UpdateProfileRequest represents a request to update user profile
type UpdateProfileRequest struct {
	Name     string `json:"name,omitempty"`
	Bio      string `json:"bio,omitempty"`
	Location string `json:"location,omitempty"`
	Website  string `json:"website,omitempty"`
	Avatar   string `json:"avatar,omitempty"`
}

// CreateCommentRequest represents a request to create a comment
type CreateCommentRequest struct {
	Content string `json:"content"`
}

type UpdateCommentRequest struct {
	Content string `json:"content"`
}

// CreateAdminRequest represents a request to create an admin
type CreateAdminRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"` // admin or super_admin
}

// UpdateAdminRoleRequest represents a request to update admin role
type UpdateAdminRoleRequest struct {
	Role string `json:"role"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

// SuccessResponse represents a success response
type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}
