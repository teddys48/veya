package handlers

import (
	"net/http"

	"veya/backend/internal/repository"
)

type FavoriteHandler struct {
	favRepo *repository.FavoriteRepository
}

func NewFavoriteHandler(favRepo *repository.FavoriteRepository) *FavoriteHandler {
	return &FavoriteHandler{favRepo: favRepo}
}

func (h *FavoriteHandler) GetFavorites(w http.ResponseWriter, r *http.Request) {
	favs, err := h.favRepo.GetFavorites()
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, favs)
}

func (h *FavoriteHandler) AddFavorite(w http.ResponseWriter, r *http.Request) {
	songIdStr := r.PathValue("songId")
	songID, err := ParseInt64Path(songIdStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_ID", "Invalid song ID")
		return
	}

	if err := h.favRepo.AddFavorite(songID); err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]string{"message": "Added to favorites"})
}

func (h *FavoriteHandler) RemoveFavorite(w http.ResponseWriter, r *http.Request) {
	songIdStr := r.PathValue("songId")
	songID, err := ParseInt64Path(songIdStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_ID", "Invalid song ID")
		return
	}

	if err := h.favRepo.RemoveFavorite(songID); err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]string{"message": "Removed from favorites"})
}
