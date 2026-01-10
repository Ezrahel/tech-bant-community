package middleware

import (
	"log"
	"net/http"
	"time"
)

// RequestLoggingMiddleware logs all incoming requests
// FIXED: Issue #72 - Request logging
func RequestLoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Log request
		log.Printf("[%s] %s %s from %s", r.Method, r.URL.Path, r.URL.RawQuery, getClientIP(r))

		// Wrap response writer to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(wrapped, r)

		// FIXED: Issue #73 - Response time logging
		duration := time.Since(start)
		log.Printf("[%s] %s %s - %d - %v", r.Method, r.URL.Path, r.URL.RawQuery, wrapped.statusCode, duration)
	})
}

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
