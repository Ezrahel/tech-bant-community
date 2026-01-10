package middleware

import (
	"net/http"

	"tech-bant-community/server/constants"
)

const (
	maxRequestBodySize = constants.MaxFileSizeBytes // Use constant
)

// ContentTypeMiddleware validates Content-Type header for JSON requests
// FIXED: Issue #32 - Content-Type validation
func ContentTypeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only validate for POST, PUT, PATCH requests
		if r.Method == "POST" || r.Method == "PUT" || r.Method == "PATCH" {
			contentType := r.Header.Get("Content-Type")
			if contentType != "application/json" && contentType != "application/json; charset=utf-8" {
				// Allow multipart/form-data for file uploads
				if contentType != "multipart/form-data" && !contains(contentType, "multipart/form-data") {
					http.Error(w, "Content-Type must be application/json", http.StatusUnsupportedMediaType)
					return
				}
			}
		}
		next.ServeHTTP(w, r)
	})
}

// BodySizeMiddleware limits request body size
// FIXED: Issue #33 - Request body size limit
// FIXED: Issue #85 - JSON size limits
func BodySizeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check Content-Length header first
		if r.ContentLength > maxRequestBodySize {
			http.Error(w, "Request body too large", http.StatusRequestEntityTooLarge)
			return
		}

		// FIXED: Issue #85 - Different limits for JSON vs file uploads
		var maxSize int64 = maxRequestBodySize
		if r.Header.Get("Content-Type") == "application/json" {
			maxSize = constants.MaxJSONBodySize
		}

		// Limit the request body reader
		r.Body = http.MaxBytesReader(w, r.Body, maxSize)
		next.ServeHTTP(w, r)
	})
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && s[:len(substr)] == substr)
}

