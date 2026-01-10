package middleware

import (
	"crypto/md5"
	"fmt"
	"net/http"
)

// ETagMiddleware adds ETag headers for caching
// FIXED: Issue #80 - ETag support
func ETagMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only add ETag for GET requests
		if r.Method != "GET" {
			next.ServeHTTP(w, r)
			return
		}

		// Wrap response writer to capture body
		etagWriter := &etagResponseWriter{
			ResponseWriter: w,
			body:           make([]byte, 0),
		}

		next.ServeHTTP(etagWriter, r)

		// Generate ETag from response body
		if len(etagWriter.body) > 0 {
			etag := fmt.Sprintf(`"%x"`, md5.Sum(etagWriter.body))
			w.Header().Set("ETag", etag)

			// Check if client sent If-None-Match header
			if match := r.Header.Get("If-None-Match"); match == etag {
				w.WriteHeader(http.StatusNotModified)
				return
			}
		}
	})
}

type etagResponseWriter struct {
	http.ResponseWriter
	body []byte
}

func (erw *etagResponseWriter) Write(b []byte) (int, error) {
	erw.body = append(erw.body, b...)
	return erw.ResponseWriter.Write(b)
}
