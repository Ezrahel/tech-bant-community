package middleware

import (
	"context"
	"net/http"
	"strings"

	"tech-bant-community/server/supabase"

	"github.com/golang-jwt/jwt/v5"
)

// SupabaseAuthMiddleware validates Supabase JWT tokens
// Note: contextKey, UserIDKey, and UserEmailKey are already defined in auth.go
func SupabaseAuthMiddleware(next http.Handler) http.Handler {
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

		tokenString := parts[1]
		ctx := r.Context()

		// Verify the token using Supabase JWT secret
		// Note: In production, you should verify against Supabase's public keys
		// For now, we'll use a simple JWT verification
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Verify signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			// In production, get JWT secret from config
			// For now, return a placeholder - this should be from config
			return []byte("your-jwt-secret"), nil
		})

		if err != nil || !token.Valid {
			respondWithError(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			respondWithError(w, http.StatusUnauthorized, "Invalid token claims")
			return
		}

		// Get user ID from claims (Supabase uses 'sub' for user ID)
		userID, ok := claims["sub"].(string)
		if !ok {
			respondWithError(w, http.StatusUnauthorized, "Invalid user ID in token")
			return
		}

		// Get email from claims
		email, _ := claims["email"].(string)

		// Add user info to context
		ctx = context.WithValue(ctx, UserIDKey, userID)
		if email != "" {
			ctx = context.WithValue(ctx, UserEmailKey, email)
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// VerifySupabaseToken verifies a Supabase JWT token and returns user info
func VerifySupabaseToken(ctx context.Context, tokenString string) (string, string, error) {
	// Use Supabase client to verify token
	// This is a placeholder - implement actual Supabase token verification
	client := supabase.GetClient()
	if client == nil {
		return "", "", jwt.ErrSignatureInvalid
	}

	// Parse and verify token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		// Get JWT secret from config
		return []byte("your-jwt-secret"), nil
	})

	if err != nil || !token.Valid {
		return "", "", err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", "", jwt.ErrSignatureInvalid
	}

	userID, _ := claims["sub"].(string)
	email, _ := claims["email"].(string)

	return userID, email, nil
}
