package handlers

import (
	"net/http"

	"veya/backend/internal/repository"
)

type AlbumHandler struct {
	albumRepo *repository.AlbumRepository
}

func NewAlbumHandler(albumRepo *repository.AlbumRepository) *AlbumHandler {
	return &AlbumHandler{albumRepo: albumRepo}
}

func (h *AlbumHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	page := ParseIntParam(r, "page", 1)
	limit := ParseIntParam(r, "limit", 50)
	q := r.URL.Query().Get("q")

	res, err := h.albumRepo.GetAll(page, limit, q)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, res)
}

func (h *AlbumHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := ParseInt64Path(idStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_ID", "Invalid album ID")
		return
	}

	album, songs, err := h.albumRepo.GetByID(id)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	if album == nil {
		JSONError(w, http.StatusNotFound, "ALBUM_NOT_FOUND", "Album not found")
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"album": album,
		"songs": songs,
	})
}
