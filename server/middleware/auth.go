package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"tech-bant-community/server/database"
)

type contextKey string

const UserIDKey contextKey = "userID"
const UserEmailKey contextKey = "userEmail"

// AuthMiddleware validates Supabase JWT tokens
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			respondWithError(w, http.StatusUnauthorized, "Missing authorization header")
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			respondWithError(w, http.StatusUnauthorized, "Invalid authorization header format")
			return
		}

		token := parts[1]
		ctx := r.Context()

		// Verify the token via Supabase
		userID, email, err := VerifySupabaseToken(ctx, token)
		if err != nil {
			// Don't leak error details for security
			respondWithError(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		// Add user info to context
		ctx = context.WithValue(ctx, UserIDKey, userID)
		if email != "" {
			ctx = context.WithValue(ctx, UserEmailKey, email)
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// OptionalAuthMiddleware allows requests with or without auth
func OptionalAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				token := parts[1]
				ctx := r.Context()

				userID, email, err := VerifySupabaseToken(ctx, token)
				if err == nil {
					ctx = context.WithValue(ctx, UserIDKey, userID)
					if email != "" {
						ctx = context.WithValue(ctx, UserEmailKey, email)
					}
					r = r.WithContext(ctx)
				}
			}
		}
		next.ServeHTTP(w, r)
	})
}

// AdminMiddleware checks if user is admin
func AdminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(UserIDKey)
		if userID == nil {
			respondWithError(w, http.StatusUnauthorized, "Authentication required")
			return
		}

		// Check if user is admin in Postgres
		ctx := r.Context()
		var isAdmin bool
		err := database.QueryRowWithContext(ctx, "SELECT is_admin FROM public.users WHERE id = $1", userID.(string)).Scan(&isAdmin)
		if err != nil || !isAdmin {
			respondWithError(w, http.StatusForbidden, "Admin access required")
			return
		}

		next.ServeHTTP(w, r)
	})
}

// GetUserID extracts user ID from context
func GetUserID(ctx context.Context) string {
	if userID, ok := ctx.Value(UserIDKey).(string); ok {
		return userID
	}
	return ""
}

// GetUserEmail extracts user email from context
func GetUserEmail(ctx context.Context) string {
	if email, ok := ctx.Value(UserEmailKey).(string); ok {
		return email
	}
	return ""
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
