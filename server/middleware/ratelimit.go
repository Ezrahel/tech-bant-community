package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"tech-bant-community/server/services"
)

// RateLimitMiddleware creates rate limiting middleware
func RateLimitMiddleware(rateLimitService *services.RateLimitService, endpoint string, limit services.EndpointLimit, adaptive bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get identifier (IP or user ID)
			identifier := getRateLimitKey(r, endpoint)

			var allowed bool
			var count int
			var resetTime time.Duration
			var err error

			ctx := r.Context()

			if adaptive {
				allowed, count, resetTime, err = rateLimitService.CheckAdaptiveRateLimit(ctx, identifier, limit)
			} else {
				allowed, count, resetTime, err = rateLimitService.CheckRateLimit(ctx, identifier, limit)
			}

			// FIXED: Issue #53 - Always add rate limit headers, even if service unavailable
			// FIXED: Issue #83 - Graceful degradation: fallback to permissive limits on Redis failure
			if err != nil {
				// On error, allow request but add default headers
				// This provides graceful degradation - service continues even if rate limiting fails
				w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", limit.Requests))
				w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", limit.Requests))
				w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(limit.Window).Unix()))
				w.Header().Set("X-RateLimit-Status", "degraded") // Indicate degraded mode
				next.ServeHTTP(w, r)
				return
			}

			// Add rate limit headers
			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", limit.Requests))
			w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", limit.Requests-count))
			w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(resetTime).Unix()))

			if !allowed {
				// Record bad behavior for adaptive rate limiting
				if adaptive {
					rateLimitService.RecordBehavior(ctx, identifier, false)
				}

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"error":       "Rate limit exceeded",
					"retry_after": int(resetTime.Seconds()),
				})
				return
			}

			// Record good behavior for adaptive rate limiting
			if adaptive {
				rateLimitService.RecordBehavior(ctx, identifier, true)
			}

			next.ServeHTTP(w, r)
		})
	}
}

// getRateLimitKey generates a unique key for rate limiting
func getRateLimitKey(r *http.Request, endpoint string) string {
	// Try to get user ID from context (if authenticated)
	userID := GetUserID(r.Context())
	if userID != "" {
		return fmt.Sprintf("user:%s:%s", userID, endpoint)
	}

	// Fall back to IP address
	ip := getClientIP(r)
	return fmt.Sprintf("ip:%s:%s", ip, endpoint)
}

// PerEndpointRateLimit creates rate limit middleware with per-endpoint configuration
func PerEndpointRateLimit(rateLimitService *services.RateLimitService, endpointLimits map[string]services.EndpointLimit, adaptive bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get endpoint path
			path := r.URL.Path

			// Find matching endpoint limit
			var limit services.EndpointLimit
			var found bool

			// Try exact match first
			if limit, found = endpointLimits[path]; !found {
				// Try pattern matching
				for pattern, patternLimit := range endpointLimits {
					if strings.Contains(path, pattern) || matchPattern(path, pattern) {
						limit = patternLimit
						found = true
						break
					}
				}
			}

			// If no specific limit found, use default
			if !found {
				limit = services.EndpointLimit{
					Requests: 100,
					Window:   1 * time.Minute,
					Burst:    20,
				}
			}

			// Apply rate limiting
			identifier := getRateLimitKey(r, path)

			var allowed bool
			var count int
			var resetTime time.Duration
			var err error

			ctx := r.Context()

			if adaptive {
				allowed, count, resetTime, err = rateLimitService.CheckAdaptiveRateLimit(ctx, identifier, limit)
			} else {
				allowed, count, resetTime, err = rateLimitService.CheckRateLimit(ctx, identifier, limit)
			}

			if err != nil {
				next.ServeHTTP(w, r)
				return
			}

			// Add rate limit headers
			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", limit.Requests))
			w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", limit.Requests-count))
			w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(resetTime).Unix()))

			if !allowed {
				if adaptive {
					rateLimitService.RecordBehavior(ctx, identifier, false)
				}

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"error":       "Rate limit exceeded",
					"retry_after": int(resetTime.Seconds()),
				})
				return
			}

			if adaptive {
				rateLimitService.RecordBehavior(ctx, identifier, true)
			}

			next.ServeHTTP(w, r)
		})
	}
}

// matchPattern matches path patterns (simple implementation)
func matchPattern(path, pattern string) bool {
	// Replace {id} with * for matching
	pattern = strings.ReplaceAll(pattern, "{id}", "*")
	pattern = strings.ReplaceAll(pattern, "{", "")
	pattern = strings.ReplaceAll(pattern, "}", "")

	pathParts := strings.Split(path, "/")
	patternParts := strings.Split(pattern, "/")

	if len(pathParts) != len(patternParts) {
		return false
	}

	for i, part := range patternParts {
		if part != "*" && part != pathParts[i] {
			return false
		}
	}

	return true
}
