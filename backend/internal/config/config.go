package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                         string
	AppwriteEndpoint             string
	AppwriteProjectID            string
	AppwriteAPIKey               string
	AppwriteDatabaseID           string
	AppwriteUsersCollectionID    string
	AppwritePostsCollectionID    string
	AppwriteCommentsCollectionID string
	AppwriteLikesCollectionID    string
	AppwriteMediaCollectionID    string
	AppwriteStorageBucketID      string
	GoogleClientID               string
	GoogleClientSecret           string
	GitHubClientID               string
	GitHubClientSecret           string
	JWTSecret                    string
	AdminEmail                   string
	AdminPassword                string
	GoogleRedirectURL            string
	GitHubRedirectURL            string
}

func Load() *Config {
	// Load .env file if it exists
	godotenv.Load()

	return &Config{
		Port:                         getEnv("PORT", "8080"),
		AppwriteEndpoint:             getEnv("APPWRITE_ENDPOINT", "https://fra.cloud.appwrite.io/v1"),
		AppwriteProjectID:            getEnv("APPWRITE_PROJECT_ID", "687554510016ab1d992a"),
		AppwriteAPIKey:               getEnv("APPWRITE_API_KEY", "techbant"),
		AppwriteDatabaseID:           getEnv("APPWRITE_DATABASE_ID", "nothing-community-db"),
		AppwriteUsersCollectionID:    getEnv("APPWRITE_USERS_COLLECTION_ID", "users"),
		AppwritePostsCollectionID:    getEnv("APPWRITE_POSTS_COLLECTION_ID", "posts"),
		AppwriteCommentsCollectionID: getEnv("APPWRITE_COMMENTS_COLLECTION_ID", "comments"),
		AppwriteLikesCollectionID:    getEnv("APPWRITE_LIKES_COLLECTION_ID", "likes"),
		AppwriteMediaCollectionID:    getEnv("APPWRITE_MEDIA_COLLECTION_ID", "media"),
		AppwriteStorageBucketID:      getEnv("APPWRITE_STORAGE_BUCKET_ID", "media-bucket"),
		GoogleClientID:               getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret:           getEnv("GOOGLE_CLIENT_SECRET", ""),
		GitHubClientID:               getEnv("GITHUB_CLIENT_ID", ""),
		GitHubClientSecret:           getEnv("GITHUB_CLIENT_SECRET", ""),
		JWTSecret:                    getEnv("JWT_SECRET", "your-secret-key"),
		AdminEmail:                   getEnv("ADMIN_EMAIL", "ditech@ditechagency.com"),
		AdminPassword:                getEnv("ADMIN_PASSWORD", "Taepryung024@"),
		GoogleRedirectURL:            getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/v1/auth/google/callback"),
		GitHubRedirectURL:            getEnv("GITHUB_REDIRECT_URL", "http://localhost:8080/api/v1/auth/github/callback"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
