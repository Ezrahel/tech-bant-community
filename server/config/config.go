package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Port           string
	AllowedOrigins []string

	// Supabase Configuration
	SupabaseURL        string
	SupabaseAnonKey    string
	SupabaseServiceKey string
	SupabaseJWTSecret  string
	SupabaseDBURL      string // Direct PostgreSQL connection string

	// Storage Configuration
	StorageBucket string

	// Redis Configuration
	RedisAddr     string
	RedisPassword string
	RedisDB       int

	// OAuth Configuration
	GoogleClientID     string
	GoogleClientSecret string
	OAuthRedirectURL   string

	// Email Configuration (Resend API)
	ResendAPIKey string
	ResendFrom   string

	// OAuth Redirect Whitelist
	AllowedOAuthRedirects []string
}

func Load() *Config {
	return &Config{
		Port:           getEnv("PORT", "8080"),
		AllowedOrigins: parseStringSlice(getEnv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")),

		// Supabase Configuration
		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		SupabaseAnonKey:    getEnv("SUPABASE_ANON_KEY", ""),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		SupabaseJWTSecret:  getEnv("SUPABASE_JWT_SECRET", ""),
		SupabaseDBURL:      getEnv("SUPABASE_DB_URL", ""),

		// Storage Configuration
		StorageBucket: getEnv("STORAGE_BUCKET", "tech-bant-community"),

		// Redis Configuration
		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       getEnvAsInt("REDIS_DB", 0),

		// OAuth Configuration
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		OAuthRedirectURL:   getEnv("OAUTH_REDIRECT_URL", "http://localhost:8080/api/v1/auth/oauth/google/callback"),

		// Email Configuration
		ResendAPIKey: getEnv("RESEND_API_KEY", ""),
		ResendFrom:   getEnv("RESEND_FROM", "noreply@techbant.com"),

		// OAuth Redirect Whitelist
		AllowedOAuthRedirects: parseStringSlice(getEnv("ALLOWED_OAUTH_REDIRECTS", "http://localhost:5173,http://localhost:3000")),
	}
}

func getEnvAsInt(key string, defaultValue int) int {
	value := getEnv(key, "")
	if value == "" {
		return defaultValue
	}
	var result int
	if _, err := fmt.Sscanf(value, "%d", &result); err != nil {
		return defaultValue
	}
	return result
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func parseStringSlice(value string) []string {
	if value == "" {
		return []string{}
	}
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
