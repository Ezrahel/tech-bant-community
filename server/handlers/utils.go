package handlers

import (
	"encoding/json"
	"net/http"
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

