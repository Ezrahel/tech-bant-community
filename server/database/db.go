package database

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"tech-bant-community/server/supabase"

	"github.com/google/uuid"
)

// GetDB returns the database connection
func GetDB() *sql.DB {
	return supabase.GetDB()
}

// ExecWithContext executes a query with context
func ExecWithContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	db := GetDB()
	if db == nil {
		return nil, errors.New("database connection not available")
	}
	return db.ExecContext(ctx, query, args...)
}

// QueryRowWithContext queries a single row with context
func QueryRowWithContext(ctx context.Context, query string, args ...interface{}) *sql.Row {
	db := GetDB()
	if db == nil {
		return nil
	}
	return db.QueryRowContext(ctx, query, args...)
}

// QueryWithContext queries multiple rows with context
func QueryWithContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error) {
	db := GetDB()
	if db == nil {
		return nil, errors.New("database connection not available")
	}
	return db.QueryContext(ctx, query, args...)
}

// BeginTx starts a transaction
func BeginTx(ctx context.Context) (*sql.Tx, error) {
	db := GetDB()
	if db == nil {
		return nil, errors.New("database connection not available")
	}
	return db.BeginTx(ctx, nil)
}

// ParseUUID parses a string to UUID
func ParseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}

// NewUUID generates a new UUID
func NewUUID() uuid.UUID {
	return uuid.New()
}

// UUIDToString converts UUID to string
func UUIDToString(id uuid.UUID) string {
	return id.String()
}

// TimeToTimestamp converts time.Time to PostgreSQL timestamp
func TimeToTimestamp(t time.Time) time.Time {
	return t.UTC()
}

// ScanUser scans a user from database row
func ScanUser(row *sql.Row) (*UserRow, error) {
	var u UserRow
	var createdAt, updatedAt time.Time
	err := row.Scan(
		&u.ID,
		&u.Name,
		&u.Email,
		&u.Avatar,
		&u.Bio,
		&u.Location,
		&u.Website,
		&u.IsAdmin,
		&u.IsVerified,
		&u.IsActive,
		&u.Role,
		&u.Provider,
		&u.PostsCount,
		&u.FollowersCount,
		&u.FollowingCount,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return nil, err
	}
	u.CreatedAt = createdAt
	u.UpdatedAt = updatedAt
	return &u, nil
}

// UserRow represents a user row from database
type UserRow struct {
	ID             string
	Name           string
	Email          string
	Avatar         sql.NullString
	Bio            sql.NullString
	Location       sql.NullString
	Website        sql.NullString
	IsAdmin        bool
	IsVerified     bool
	IsActive       bool
	Role           string
	Provider       string
	PostsCount     int
	FollowersCount int
	FollowingCount int
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// ToModel converts UserRow to models.User
func (u *UserRow) ToModel() map[string]interface{} {
	result := map[string]interface{}{
		"id":              u.ID,
		"name":            u.Name,
		"email":           u.Email,
		"is_admin":        u.IsAdmin,
		"is_verified":     u.IsVerified,
		"is_active":       u.IsActive,
		"role":            u.Role,
		"provider":        u.Provider,
		"posts_count":     u.PostsCount,
		"followers_count": u.FollowersCount,
		"following_count": u.FollowingCount,
		"created_at":      u.CreatedAt,
		"updated_at":      u.UpdatedAt,
	}
	if u.Avatar.Valid {
		result["avatar"] = u.Avatar.String
	}
	if u.Bio.Valid {
		result["bio"] = u.Bio.String
	}
	if u.Location.Valid {
		result["location"] = u.Location.String
	}
	if u.Website.Valid {
		result["website"] = u.Website.String
	}
	return result
}

// HandleNotFoundError handles not found errors gracefully
func HandleNotFoundError(err error) error {
	if err == sql.ErrNoRows {
		return fmt.Errorf("not found")
	}
	return err
}
