package constants

import "time"

// FIXED: Issue #71 - Extract magic numbers to constants

// Time constants
const (
	OTPExpiryDuration      = 10 * time.Minute
	SessionExpiryDuration  = 24 * time.Hour
	RefreshTokenExpiry     = 7 * 24 * time.Hour
	AccountLockoutDuration = 15 * time.Minute
	CleanupInterval        = 1 * time.Hour
	RequestTimeout         = 30 * time.Second
	HealthCheckTimeout     = 2 * time.Second
)

// Attempt limits
const (
	MaxLoginAttempts           = 5
	MaxOTPVerificationAttempts = 5
	MaxPasswordResetAttempts   = 5
)

// Size limits
const (
	MaxPostTitleLength   = 200
	MaxPostContentLength = 10000
	MaxCommentLength     = 10000
	MaxBioLength         = 500
	MaxNameLength        = 100
	MaxLocationLength    = 100
	MaxSearchQueryLength = 100
	MaxTagsPerPost       = 10
	MaxTagLength         = 50
	MaxMediaPerPost      = 10
	MaxOffset            = 10000           // Maximum offset for pagination
	MaxJSONBodySize      = 1 * 1024 * 1024 // 1MB max JSON body
)

// File upload limits
const (
	MaxFileSize      = 10 * 1024 * 1024 // 10MB
	MaxFileSizeBytes = 10 << 20
)

// Rate limiting defaults
const (
	DefaultRateLimitWindow = 15 * time.Minute
	DefaultBurstLimit      = 3
)

// Validation constants
const (
	MinPasswordLength = 8
	MaxPasswordLength = 128
	MinUserIDLength   = 1
	MaxUserIDLength   = 128
)
