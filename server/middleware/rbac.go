package middleware

import (
	"context"
	"database/sql"
	"net/http"

	"tech-bant-community/server/database"
	"tech-bant-community/server/models"
)

const (
	UserRolesKey       contextKey = "userRoles"
	UserPermissionsKey contextKey = "userPermissions"
)

// RBACMiddleware checks if user has required permissions
func RBACMiddleware(requiredPermissions ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID := GetUserID(r.Context())
			if userID == "" {
				respondWithError(w, http.StatusUnauthorized, "Authentication required")
				return
			}

			// Get user from PostgreSQL
			query := "SELECT role, is_active FROM public.users WHERE id = $1"
			row := database.QueryRowWithContext(r.Context(), query, userID)
			var role string
			var isActive bool
			err := row.Scan(&role, &isActive)
			if err != nil {
				if err == sql.ErrNoRows {
					respondWithError(w, http.StatusForbidden, "User not found")
				} else {
					respondWithError(w, http.StatusForbidden, "Failed to verify permissions")
				}
				return
			}

			// Check if account is active
			if !isActive {
				respondWithError(w, http.StatusForbidden, "Account is inactive")
				return
			}

			// Get user permissions
			permissions := models.GetRolePermissions(role)

			// Check if user has all required permissions
			hasAllPermissions := true
			for _, required := range requiredPermissions {
				hasPermission := false
				for _, perm := range permissions {
					if perm == required {
						hasPermission = true
						break
					}
				}
				if !hasPermission {
					hasAllPermissions = false
					break
				}
			}

			if !hasAllPermissions {
				respondWithError(w, http.StatusForbidden, "Insufficient permissions")
				return
			}

			// Add roles and permissions to context
			ctx := context.WithValue(r.Context(), UserRolesKey, []string{role})
			ctx = context.WithValue(ctx, UserPermissionsKey, permissions)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RoleMiddleware checks if user has required role
func RoleMiddleware(requiredRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID := GetUserID(r.Context())
			if userID == "" {
				respondWithError(w, http.StatusUnauthorized, "Authentication required")
				return
			}

			// Get user from PostgreSQL
			query := "SELECT role, is_active FROM public.users WHERE id = $1"
			row := database.QueryRowWithContext(r.Context(), query, userID)
			var role string
			var isActive bool
			err := row.Scan(&role, &isActive)
			if err != nil {
				if err == sql.ErrNoRows {
					respondWithError(w, http.StatusForbidden, "User not found")
				} else {
					respondWithError(w, http.StatusForbidden, "Failed to verify role")
				}
				return
			}

			// Check if account is active
			if !isActive {
				respondWithError(w, http.StatusForbidden, "Account is inactive")
				return
			}

			// Check if user has required role
			hasRole := false
			for _, requiredRole := range requiredRoles {
				if role == requiredRole {
					hasRole = true
					break
				}
			}

			// Super admin has access to everything
			if role == models.RoleSuperAdmin {
				hasRole = true
			}

			if !hasRole {
				respondWithError(w, http.StatusForbidden, "Insufficient role privileges")
				return
			}

			// Add roles and permissions to context
			permissions := models.GetRolePermissions(role)
			ctx := context.WithValue(r.Context(), UserRolesKey, []string{role})
			ctx = context.WithValue(ctx, UserPermissionsKey, permissions)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserRoles extracts user roles from context
func GetUserRoles(ctx context.Context) []string {
	if roles, ok := ctx.Value(UserRolesKey).([]string); ok {
		return roles
	}
	return []string{}
}

// GetUserPermissions extracts user permissions from context
func GetUserPermissions(ctx context.Context) []string {
	if permissions, ok := ctx.Value(UserPermissionsKey).([]string); ok {
		return permissions
	}
	return []string{}
}

// HasPermission checks if user has a specific permission
func HasPermission(ctx context.Context, permission string) bool {
	permissions := GetUserPermissions(ctx)
	for _, perm := range permissions {
		if perm == permission {
			return true
		}
	}
	return false
}

// HasRole checks if user has a specific role
func HasRole(ctx context.Context, role string) bool {
	roles := GetUserRoles(ctx)
	for _, r := range roles {
		if r == role {
			return true
		}
	}
	return false
}
