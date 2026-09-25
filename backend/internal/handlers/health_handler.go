package handlers

import (
	"database/sql"
	"net/http"
	"time"
)

type HealthHandler struct {
	db *sql.DB
}

func NewHealthHandler(db *sql.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	err := h.db.Ping()
	if err != nil {
		JSONError(w, http.StatusServiceUnavailable, "DATABASE_UNAVAILABLE", "Database connection failed")
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now().Format(time.RFC3339),
		"database":  "connected",
	})
}
