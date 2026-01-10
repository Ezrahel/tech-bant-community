package utils

import (
	"context"
	"database/sql"
	"time"

	"tech-bant-community/server/database"
)

// GetCount gets count for a collection using PostgreSQL counters table
func GetCount(ctx context.Context, collectionName string) (int64, error) {
	query := "SELECT count FROM public.counters WHERE collection_name = $1"
	row := database.QueryRowWithContext(ctx, query, collectionName)
	var count int64
	err := row.Scan(&count)
	if err == sql.ErrNoRows {
		return 0, nil // Counter doesn't exist, return 0
	}
	return count, err
}

// IncrementCount increments a counter atomically in PostgreSQL
func IncrementCount(ctx context.Context, collectionName string, delta int64) error {
	query := `
		INSERT INTO public.counters (collection_name, count, updated_at)
		VALUES ($1, $2, $3)
		ON CONFLICT (collection_name) DO UPDATE 
		SET count = counters.count + $2, updated_at = $3
	`
	_, err := database.ExecWithContext(ctx, query, collectionName, delta, time.Now().UTC())
	return err
}

// InitializeCounter initializes a counter if it doesn't exist in PostgreSQL
func InitializeCounter(ctx context.Context, collectionName string, initialCount int64) error {
	query := `
		INSERT INTO public.counters (collection_name, count, updated_at)
		VALUES ($1, $2, $3)
		ON CONFLICT (collection_name) DO NOTHING
	`
	_, err := database.ExecWithContext(ctx, query, collectionName, initialCount, time.Now().UTC())
	return err
}

