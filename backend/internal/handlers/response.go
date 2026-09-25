package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
)

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type ErrorResponse struct {
	Error APIError `json:"error"`
}

func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		_ = json.NewEncoder(w).Encode(data)
	}
}

func JSONError(w http.ResponseWriter, status int, code, message string) {
	JSON(w, status, ErrorResponse{
		Error: APIError{
			Code:    code,
			Message: message,
		},
	})
}

func ParseIntParam(r *http.Request, key string, fallback int) int {
	valStr := r.URL.Query().Get(key)
	if valStr == "" {
		return fallback
	}
	val, err := strconv.Atoi(valStr)
	if err != nil {
		return fallback
	}
	return val
}

func ParseInt64Path(pathVal string) (int64, error) {
	return strconv.ParseInt(pathVal, 10, 64)
}
