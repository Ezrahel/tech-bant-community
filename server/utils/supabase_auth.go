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

// VerifyPasswordWithSupabase verifies password using Supabase Auth REST API
func VerifyPasswordWithSupabase(ctx context.Context, supabaseURL, supabaseAnonKey, email, password string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	url := fmt.Sprintf("%s/auth/v1/token?grant_type=password", supabaseURL)

	payload := map[string]interface{}{
		"email":    email,
		"password":  password,
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
	req.Header.Set("apikey", supabaseAnonKey)

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
			Error            string `json:"error"`
			ErrorDescription string `json:"error_description"`
		}
		if err := json.Unmarshal(body, &errorResp); err == nil {
			return "", errors.New("invalid credentials")
		}
		return "", errors.New("invalid credentials")
	}

	var successResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(body, &successResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	return successResp.AccessToken, nil
}

