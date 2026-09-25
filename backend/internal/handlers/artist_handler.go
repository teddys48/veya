package handlers

import (
	"net/http"

	"veya/backend/internal/repository"
)

type ArtistHandler struct {
	artistRepo *repository.ArtistRepository
}

func NewArtistHandler(artistRepo *repository.ArtistRepository) *ArtistHandler {
	return &ArtistHandler{artistRepo: artistRepo}
}

func (h *ArtistHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	page := ParseIntParam(r, "page", 1)
	limit := ParseIntParam(r, "limit", 50)
	q := r.URL.Query().Get("q")

	res, err := h.artistRepo.GetAll(page, limit, q)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, res)
}

func (h *ArtistHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := ParseInt64Path(idStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_ID", "Invalid artist ID")
		return
	}

	artist, songs, err := h.artistRepo.GetByID(id)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	if artist == nil {
		JSONError(w, http.StatusNotFound, "ARTIST_NOT_FOUND", "Artist not found")
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"artist": artist,
		"songs":  songs,
	})
}
