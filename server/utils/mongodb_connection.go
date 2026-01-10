// Package utils provides MongoDB connection utilities for Firestore
// Note: Install MongoDB driver first: go get go.mongodb.org/mongo-driver/mongo
package utils

import (
	"fmt"
	"os"
	"strings"
)

// GetMongoDBConnectionString constructs MongoDB connection string from environment variables
// Returns empty string if credentials are not configured
func GetMongoDBConnectionString() string {
	// Try to get full connection string first
	connStr := os.Getenv("MONGODB_CONNECTION_STRING")
	if connStr != "" {
		// Replace placeholders if they exist
		username := os.Getenv("MONGODB_USERNAME")
		password := os.Getenv("MONGODB_PASSWORD")

		if username != "" && password != "" {
			connStr = strings.Replace(connStr, "<username>", username, -1)
			connStr = strings.Replace(connStr, "<password>", password, -1)
		}

		return connStr
	}

	// Build connection string from components
	username := os.Getenv("MONGODB_USERNAME")
	password := os.Getenv("MONGODB_PASSWORD")
	host := os.Getenv("MONGODB_HOST")
	database := os.Getenv("MONGODB_DATABASE")

	if username == "" || password == "" {
		return ""
	}

	if host == "" {
		host = "e6f6f6c4-1fa9-40f6-bd52-84c1eb07b130.nam5.firestore.goog:443"
	}

	if database == "" {
		database = "tech-bant"
	}

	// URL encode password if needed
	encodedPassword := strings.ReplaceAll(password, "@", "%40")
	encodedPassword = strings.ReplaceAll(encodedPassword, ":", "%3A")
	encodedPassword = strings.ReplaceAll(encodedPassword, "/", "%2F")
	encodedPassword = strings.ReplaceAll(encodedPassword, "?", "%3F")
	encodedPassword = strings.ReplaceAll(encodedPassword, "#", "%23")
	encodedPassword = strings.ReplaceAll(encodedPassword, "[", "%5B")
	encodedPassword = strings.ReplaceAll(encodedPassword, "]", "%5D")

	return fmt.Sprintf(
		"mongodb://%s:%s@%s/%s?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false",
		username,
		encodedPassword,
		host,
		database,
	)
}
