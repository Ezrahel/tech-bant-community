package utils

import (
	"fmt"
	"html"
	"regexp"
	"strings"
	"unicode"

	"github.com/microcosm-cc/bluemonday"
)

var (
	// HTML sanitizer
	htmlSanitizer = bluemonday.UGCPolicy()

	// Email regex
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

	// User ID regex (alphanumeric, underscore, hyphen, max 128 chars)
	userIDRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]{1,128}$`)

	// Post ID regex
	postIDRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]{1,128}$`)
)

// SanitizeString sanitizes a string input
func SanitizeString(input string) string {
	// Trim whitespace
	input = strings.TrimSpace(input)
	// HTML escape
	input = html.EscapeString(input)
	// Remove null bytes
	input = strings.ReplaceAll(input, "\x00", "")
	return input
}

// SanitizeHTML sanitizes HTML content
func SanitizeHTML(input string) string {
	return htmlSanitizer.Sanitize(input)
}

// ValidateEmail validates email format
func ValidateEmail(email string) bool {
	email = strings.TrimSpace(strings.ToLower(email))
	return emailRegex.MatchString(email) && len(email) <= 254
}

// ValidateUserID validates user ID format
func ValidateUserID(userID string) bool {
	return userIDRegex.MatchString(userID)
}

// ValidatePostID validates post ID format
func ValidatePostID(postID string) bool {
	return postIDRegex.MatchString(postID)
}

// ValidateLength validates string length
func ValidateLength(input string, min, max int) bool {
	length := len([]rune(input))
	return length >= min && length <= max
}

// SanitizeAndValidatePostTitle sanitizes and validates post title
func SanitizeAndValidatePostTitle(title string) (string, error) {
	title = SanitizeString(title)
	if !ValidateLength(title, 1, 200) {
		return "", fmt.Errorf("title must be between 1 and 200 characters")
	}
	return title, nil
}

// SanitizeAndValidatePostContent sanitizes and validates post content
func SanitizeAndValidatePostContent(content string) (string, error) {
	content = SanitizeHTML(content)
	if !ValidateLength(content, 1, 10000) {
		return "", fmt.Errorf("content must be between 1 and 10000 characters")
	}
	return content, nil
}

// SanitizeTags sanitizes and validates tags
func SanitizeTags(tags []string, maxTags int) ([]string, error) {
	if len(tags) > maxTags {
		return nil, fmt.Errorf("maximum %d tags allowed", maxTags)
	}

	sanitized := make([]string, 0, len(tags))
	seen := make(map[string]bool)

	for _, tag := range tags {
		tag = strings.TrimSpace(SanitizeString(tag))
		if tag == "" {
			continue
		}
		// Remove special characters, keep alphanumeric and spaces
		tag = regexp.MustCompile(`[^a-zA-Z0-9\s]`).ReplaceAllString(tag, "")
		tag = strings.ToLower(tag)

		// Limit tag length
		if len(tag) > 50 {
			tag = tag[:50]
		}

		// Remove duplicates
		if !seen[tag] {
			seen[tag] = true
			sanitized = append(sanitized, tag)
		}
	}

	return sanitized, nil
}

// ValidatePassword validates password strength
func ValidatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}
	if len(password) > 128 {
		return fmt.Errorf("password must be less than 128 characters")
	}

	var (
		hasUpper   = false
		hasLower   = false
		hasNumber  = false
		hasSpecial = false
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if !hasUpper {
		return fmt.Errorf("password must contain at least one uppercase letter")
	}
	if !hasLower {
		return fmt.Errorf("password must contain at least one lowercase letter")
	}
	if !hasNumber {
		return fmt.Errorf("password must contain at least one number")
	}
	if !hasSpecial {
		return fmt.Errorf("password must contain at least one special character")
	}

	return nil
}

// ValidateURL validates URL format
func ValidateURL(url string) bool {
	if url == "" {
		return true // Empty is allowed
	}
	matched, _ := regexp.MatchString(`^https?://[^\s/$.?#].[^\s]*$`, url)
	return matched && len(url) <= 2048
}

// ValidateCategory validates post category
func ValidateCategory(category string) bool {
	validCategories := map[string]bool{
		"general": true,
		"tech":    true,
		"reviews": true,
		"updates": true,
		"gists":   true,
		"banter":  true,
	}
	return validCategories[strings.ToLower(category)]
}
