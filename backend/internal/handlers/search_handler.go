package handlers

import (
	"net/http"

	"veya/backend/internal/repository"
)

type SearchHandler struct {
	searchRepo *repository.SearchRepository
}

func NewSearchHandler(searchRepo *repository.SearchRepository) *SearchHandler {
	return &SearchHandler{searchRepo: searchRepo}
}

func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	limit := ParseIntParam(r, "limit", 20)

	res, err := h.searchRepo.SearchFTS(q, limit)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "SEARCH_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, res)
}
