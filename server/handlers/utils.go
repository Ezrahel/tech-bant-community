package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
)

// FIXED: Issue #87 - Standardized error response format
// FIXED: Issue #81 - Include request ID in error responses
type StandardErrorResponse struct {
	Error     string `json:"error"`
	RequestID string `json:"request_id,omitempty"`
	Code      int    `json:"code,omitempty"`
}

func respondWithJSON(w http.ResponseWriter, r *http.Request, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")

	// Cache-Control for GET requests
	if r.Method == "GET" {
		if code >= 200 && code < 300 {
			w.Header().Set("Cache-Control", "public, max-age=30, s-maxage=30, stale-while-revalidate=60")
		} else {
			w.Header().Set("Cache-Control", "no-store")
		}
	}

	// Vary header for all responses
	if r.Method == "GET" {
		vary := w.Header().Get("Vary")
		if !strings.Contains(vary, "Accept-Encoding") {
			if vary != "" {
				vary += ", "
			}
			w.Header().Set("Vary", vary+"Accept-Encoding")
		}
	}

	w.WriteHeader(code)
	w.Write(response)
}

func respondWithError(w http.ResponseWriter, r *http.Request, code int, message string) {
	requestID := r.Header.Get("X-Request-ID")
	errorResp := StandardErrorResponse{
		Error:     message,
		RequestID: requestID,
		Code:      code,
	}
	respondWithJSON(w, r, code, errorResp)
}

