package utils

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

// VerifyPasswordWithFirebase verifies password using Firebase Auth REST API
// FIXED: Issue #6 - Proper password verification
func VerifyPasswordWithFirebase(ctx context.Context, apiKey, email, password string) (string, error) {
	// Add timeout
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	url := fmt.Sprintf("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=%s", apiKey)
	
	payload := map[string]interface{}{
		"email":             email,
		"password":           password,
		"returnSecureToken": true,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to verify password: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp struct {
			Error struct {
				Message string `json:"message"`
				Code    int    `json:"code"`
			} `json:"error"`
		}
		if err := json.Unmarshal(body, &errorResp); err == nil {
			// Return generic error to prevent email enumeration
			return "", errors.New("invalid credentials")
		}
		return "", errors.New("invalid credentials")
	}

	var successResp struct {
		IDToken string `json:"idToken"`
	}
	if err := json.Unmarshal(body, &successResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	return successResp.IDToken, nil
}

