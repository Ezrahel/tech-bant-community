package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"tech-bant-community/server/firebase"
)

type contextKey string

const UserIDKey contextKey = "userID"
const UserEmailKey contextKey = "userEmail"

// AuthMiddleware validates Firebase ID tokens
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

		// Verify the token
		decodedToken, err := firebase.AuthClient.VerifyIDToken(ctx, token)
		if err != nil {
			// Don't leak error details for security
			respondWithError(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		// Add user info to context
		ctx = context.WithValue(ctx, UserIDKey, decodedToken.UID)
		if email, ok := decodedToken.Claims["email"].(string); ok {
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

				decodedToken, err := firebase.AuthClient.VerifyIDToken(ctx, token)
				if err == nil {
					ctx = context.WithValue(ctx, UserIDKey, decodedToken.UID)
					if email, ok := decodedToken.Claims["email"].(string); ok {
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

		// Check if user is admin in Firestore
		ctx := r.Context()
		userDoc, err := firebase.DB.Collection("users").Doc(userID.(string)).Get(ctx)
		if err != nil {
			respondWithError(w, http.StatusForbidden, "Failed to verify admin status")
			return
		}

		isAdmin, ok := userDoc.Data()["is_admin"].(bool)
		if !ok || !isAdmin {
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
