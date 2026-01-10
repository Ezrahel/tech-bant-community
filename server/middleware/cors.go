package middleware

import (
	"net/http"

	"tech-bant-community/server/config"

	"github.com/rs/cors"
)

// CORS creates a CORS middleware
func CORS(cfg *config.Config) func(http.Handler) http.Handler {
	c := cors.New(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID"},
		ExposedHeaders:   []string{"Link", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "ETag"},
		AllowCredentials: true,
		MaxAge:           300,
		Debug:            false, // Set to true for CORS debugging
	})
	return c.Handler
}
