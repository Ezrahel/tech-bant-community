package supabase

import (
	"context"
	"database/sql"
	"log"
	"time"

	"tech-bant-community/server/config"

	_ "github.com/lib/pq" // PostgreSQL driver
	"github.com/supabase-community/supabase-go"
)

var (
	Client     *supabase.Client
	DB         *sql.DB
	StorageURL string
)

// Initialize initializes Supabase services
func Initialize(cfg *config.Config) error {
	ctx := context.Background()

	// Validate required configuration
	if cfg.SupabaseURL == "" {
		log.Fatal("SUPABASE_URL is required")
	}
	if cfg.SupabaseServiceKey == "" {
		log.Fatal("SUPABASE_SERVICE_ROLE_KEY is required")
	}

	// Initialize Supabase client
	client, err := supabase.NewClient(
		cfg.SupabaseURL,
		cfg.SupabaseServiceKey,
		nil,
	)
	if err != nil {
		return err
	}
	Client = client

	// Initialize direct PostgreSQL connection if DB URL is provided
	if cfg.SupabaseDBURL != "" {
		db, err := sql.Open("postgres", cfg.SupabaseDBURL)
		if err != nil {
			return err
		}

		// Test connection
		ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		if err := db.PingContext(ctx); err != nil {
			return err
		}

		// Set connection pool settings
		db.SetMaxOpenConns(25)
		db.SetMaxIdleConns(5)
		db.SetConnMaxLifetime(5 * time.Minute)

		DB = db
		log.Println("PostgreSQL connection established")
	}

	StorageURL = cfg.SupabaseURL
	log.Println("Supabase initialized successfully")
	return nil
}

// Close closes all Supabase connections
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

// GetDB returns the database connection
func GetDB() *sql.DB {
	return DB
}

// GetClient returns the Supabase client
func GetClient() *supabase.Client {
	return Client
}
