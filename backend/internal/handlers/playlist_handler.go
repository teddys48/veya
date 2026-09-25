package handlers

import (
	"encoding/json"
	"net/http"

	"veya/backend/internal/models"
	"veya/backend/internal/repository"
)

type PlaylistHandler struct {
	playlistRepo *repository.PlaylistRepository
}

func NewPlaylistHandler(playlistRepo *repository.PlaylistRepository) *PlaylistHandler {
	return &PlaylistHandler{playlistRepo: playlistRepo}
}

type createPlaylistReq struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type addSongReq struct {
	SongID int64 `json:"song_id"`
}

type reorderSongsReq struct {
	SongIDs []int64 `json:"song_ids"`
}

func (h *PlaylistHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	playlists, err := h.playlistRepo.GetAll()
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	if playlists == nil {
		playlists = []models.Playlist{}
	}
	JSON(w, http.StatusOK, playlists)
}

func (h *PlaylistHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := ParseInt64Path(idStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist ID")
		return
	}

	playlist, songs, err := h.playlistRepo.GetByID(id)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	if playlist == nil {
		JSONError(w, http.StatusNotFound, "PLAYLIST_NOT_FOUND", "Playlist not found")
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"playlist": playlist,
		"songs":    songs,
	})
}

func (h *PlaylistHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createPlaylistReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		JSONError(w, http.StatusBadRequest, "INVALID_INPUT", "Name is required")
		return
	}

	playlist, err := h.playlistRepo.Create(req.Name, req.Description)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusCreated, playlist)
}

func (h *PlaylistHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := ParseInt64Path(idStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist ID")
		return
	}

	var req createPlaylistReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		JSONError(w, http.StatusBadRequest, "INVALID_INPUT", "Name is required")
		return
	}

	if err := h.playlistRepo.Update(id, req.Name, req.Description); err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]string{"message": "Playlist updated"})
}

func (h *PlaylistHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := ParseInt64Path(idStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist ID")
		return
	}

	if err := h.playlistRepo.Delete(id); err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]string{"message": "Playlist deleted"})
}

func (h *PlaylistHandler) AddSong(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := ParseInt64Path(idStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist ID")
		return
	}

	var req addSongReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.SongID == 0 {
		JSONError(w, http.StatusBadRequest, "INVALID_INPUT", "Song ID is required")
		return
	}

	if err := h.playlistRepo.AddSong(id, req.SongID); err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]string{"message": "Song added to playlist"})
}

func (h *PlaylistHandler) RemoveSong(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	playlistID, err := ParseInt64Path(idStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist ID")
		return
	}

	songIdStr := r.PathValue("songId")
	songID, err := ParseInt64Path(songIdStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_SONG_ID", "Invalid song ID")
		return
	}

	if err := h.playlistRepo.RemoveSong(playlistID, songID); err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]string{"message": "Song removed from playlist"})
}

func (h *PlaylistHandler) ReorderSongs(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	playlistID, err := ParseInt64Path(idStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist ID")
		return
	}

	var req reorderSongsReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_INPUT", "Invalid song IDs list")
		return
	}

	if err := h.playlistRepo.ReorderSongs(playlistID, req.SongIDs); err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]string{"message": "Playlist reordered"})
}
