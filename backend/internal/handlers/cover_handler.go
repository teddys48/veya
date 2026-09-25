package handlers

import (
	"net/http"

	"veya/backend/internal/service"
)

type CoverHandler struct {
	coverSvc *service.CoverService
}

func NewCoverHandler(coverSvc *service.CoverService) *CoverHandler {
	return &CoverHandler{coverSvc: coverSvc}
}

func (h *CoverHandler) GetCoverByHash(w http.ResponseWriter, r *http.Request) {
	hash := r.PathValue("hash")
	coverPath, err := h.coverSvc.GetCoverPath(hash)
	if err != nil {
		JSONError(w, http.StatusNotFound, "COVER_NOT_FOUND", "Cover image not found")
		return
	}

	w.Header().Set("Cache-Control", "public, max-age=31536000")
	http.ServeFile(w, r, coverPath)
}
