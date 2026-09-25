package handlers

import (
	"encoding/json"
	"net/http"

	"veya/backend/internal/repository"
)

type HistoryHandler struct {
	historyRepo *repository.HistoryRepository
}

func NewHistoryHandler(historyRepo *repository.HistoryRepository) *HistoryHandler {
	return &HistoryHandler{historyRepo: historyRepo}
}

type addHistoryReq struct {
	SongID int64 `json:"song_id"`
}

func (h *HistoryHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	page := ParseIntParam(r, "page", 1)
	limit := ParseIntParam(r, "limit", 50)

	res, err := h.historyRepo.GetHistory(page, limit)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, res)
}

func (h *HistoryHandler) AddHistory(w http.ResponseWriter, r *http.Request) {
	var req addHistoryReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.SongID == 0 {
		JSONError(w, http.StatusBadRequest, "INVALID_INPUT", "Song ID is required")
		return
	}

	if err := h.historyRepo.AddHistory(req.SongID); err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]string{"message": "History recorded"})
}
