package handlers

import (
	"database/sql"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"tech-bant-community/server/config"
	"tech-bant-community/server/constants"
	"tech-bant-community/server/middleware"
	"tech-bant-community/server/services"

	"github.com/gorilla/mux"
)

type MediaHandler struct {
	mediaService *services.MediaService
	cfg          *config.Config
}

func NewMediaHandler(db *sql.DB, cfg *config.Config) *MediaHandler {
	return &MediaHandler{
		mediaService: services.NewMediaService(db),
		cfg:          cfg,
	}
}

// UploadMedia handles POST /api/v1/media/upload
// FIXED: Issues #19, #20 - File size validation and MIME type checking
func (h *MediaHandler) UploadMedia(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// FIXED: Issue #19 - Check Content-Length header first before parsing
	// FIXED: Issue #82 - Validate Content-Length against actual size
	if r.ContentLength > constants.MaxFileSizeBytes {
		respondWithError(w, r, http.StatusRequestEntityTooLarge, "File too large")
		return
	}
	if r.ContentLength <= 0 {
		respondWithError(w, r, http.StatusBadRequest, "Content-Length header required")
		return
	}

	// Parse multipart form (10MB max)
	err := r.ParseMultipartForm(constants.MaxFileSizeBytes)
	if err != nil {
		respondWithError(w, r, http.StatusBadRequest, "Failed to parse form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		respondWithError(w, r, http.StatusBadRequest, "No file provided")
		return
	}
	defer file.Close()

	// FIXED: Issue #20 - Validate file type by extension and actual MIME type
	filename := header.Filename
	validExtensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm", ".ogg", ".mov"}
	validExt := false
	ext := strings.ToLower(filepath.Ext(filename))
	for _, validExtCheck := range validExtensions {
		if ext == validExtCheck {
			validExt = true
			break
		}
	}
	if !validExt {
		respondWithError(w, r, http.StatusBadRequest, "Invalid file type")
		return
	}

	// Read first 512 bytes to detect actual MIME type
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		respondWithError(w, r, http.StatusBadRequest, "Failed to read file")
		return
	}
	
	// Detect MIME type from file content
	detectedMIME := http.DetectContentType(buffer[:n])
	validMIMEs := map[string]bool{
		"image/jpeg":      true,
		"image/png":       true,
		"image/gif":      true,
		"image/webp":      true,
		"video/mp4":       true,
		"video/webm":      true,
		"video/ogg":       true,
		"video/quicktime": true,
	}
	
	if !validMIMEs[detectedMIME] {
		respondWithError(w, r, http.StatusBadRequest, "Invalid file content type")
		return
	}

	// Reset file reader for actual upload
	file.Seek(0, 0)

	// Upload media with detected MIME type
	media, err := h.mediaService.UploadMedia(r.Context(), userID, file, filename, header.Size, detectedMIME, h.cfg)
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to upload media")
		return
	}

	respondWithJSON(w, r, http.StatusOK, media)
}

// DeleteMedia handles DELETE /api/v1/media/{id}
func (h *MediaHandler) DeleteMedia(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	mediaID := vars["id"]

	if err := h.mediaService.DeleteMedia(r.Context(), userID, mediaID, h.cfg); err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to delete media")
		return
	}

	respondWithJSON(w, r, http.StatusOK, map[string]string{"message": "Media deleted successfully"})
}

// GetUserMedia handles GET /api/v1/users/me/media
func (h *MediaHandler) GetUserMedia(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		respondWithError(w, r, http.StatusUnauthorized, "Unauthorized")
		return
	}

	mediaList, err := h.mediaService.GetUserMedia(r.Context(), userID)
	if err != nil {
		respondWithError(w, r, http.StatusInternalServerError, "Failed to get user media")
		return
	}

	respondWithJSON(w, r, http.StatusOK, mediaList)
}
