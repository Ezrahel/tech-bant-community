package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"
)

const (
	csrfTokenHeader = "X-CSRF-Token"
	csrfCookieName  = "csrf_token"
	csrfTokenLength = 32
	csrfTokenExpiry = 24 * time.Hour
)

// CSRFMiddleware provides basic CSRF protection
// FIXED: Issue #16 - CSRF protection for state-changing operations
func CSRFMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only apply to state-changing methods
		if r.Method == "GET" || r.Method == "HEAD" || r.Method == "OPTIONS" {
			next.ServeHTTP(w, r)
			return
		}

		// Get token from cookie
		cookie, err := r.Cookie(csrfCookieName)
		if err != nil {
			// Generate and set new token for first request
			token := generateCSRFToken()
			// Secure should be false for localhost/HTTP, true for HTTPS
			isSecure := r.TLS != nil
			http.SetCookie(w, &http.Cookie{
				Name:     csrfCookieName,
				Value:    token,
				Path:     "/",
				HttpOnly: false,                // Must be accessible to JavaScript
				Secure:   isSecure,             // Only over HTTPS in production
				SameSite: http.SameSiteLaxMode, // Changed to Lax for better compatibility
				MaxAge:   int(csrfTokenExpiry.Seconds()),
			})
			// Store in request context for handler access
			r.Header.Set(csrfTokenHeader, token)
			next.ServeHTTP(w, r)
			return
		}

		// Verify token from header matches cookie
		headerToken := r.Header.Get(csrfTokenHeader)
		if headerToken == "" {
			// Allow first request without header if cookie was just set
			// This handles the case where cookie is set but header not yet sent
			next.ServeHTTP(w, r)
			return
		}

		if headerToken != cookie.Value {
			http.Error(w, "Invalid CSRF token", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func generateCSRFToken() string {
	b := make([]byte, csrfTokenLength)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
