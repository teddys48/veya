package handlers

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"

	"veya/backend/internal/repository"
	"veya/backend/internal/service"
)

type SongHandler struct {
	songRepo *repository.SongRepository
	audioSvc *service.AudioService
	coverSvc *service.CoverService
}

func NewSongHandler(songRepo *repository.SongRepository, audioSvc *service.AudioService, coverSvc *service.CoverService) *SongHandler {
	return &SongHandler{
		songRepo: songRepo,
		audioSvc: audioSvc,
		coverSvc: coverSvc,
	}
}

func (h *SongHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	page := ParseIntParam(r, "page", 1)
	limit := ParseIntParam(r, "limit", 50)
	sort := r.URL.Query().Get("sort")
	genre := r.URL.Query().Get("genre")

	res, err := h.songRepo.GetAll(page, limit, sort, genre)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, res)
}

func (h *SongHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := ParseInt64Path(idStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_ID", "Invalid song ID")
		return
	}

	song, err := h.songRepo.GetByID(id)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	if song == nil {
		JSONError(w, http.StatusNotFound, "SONG_NOT_FOUND", "Song not found")
		return
	}

	JSON(w, http.StatusOK, song)
}

func (h *SongHandler) Stream(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := ParseInt64Path(idStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_ID", "Invalid song ID")
		return
	}

	filePath, title, err := h.audioSvc.ResolveSongFilePath(id)
	if err != nil {
		if errors.Is(err, service.ErrSongNotFound) || errors.Is(err, service.ErrAudioFileNotFound) {
			JSONError(w, http.StatusNotFound, "SONG_NOT_FOUND", err.Error())
			return
		}
		if errors.Is(err, service.ErrAccessDenied) {
			JSONError(w, http.StatusForbidden, "FORBIDDEN", "Path traversal forbidden")
			return
		}
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	file, err := os.Open(filePath)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "CANNOT_OPEN_FILE", "Failed to open audio file")
		return
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "FILE_STAT_ERROR", "Failed to stat audio file")
		return
	}

	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Content-Type", mimeTypeFromExt(filePath))

	// http.ServeContent handles HTTP Range Requests automatically!
	http.ServeContent(w, r, title, stat.ModTime(), file)
}

func (h *SongHandler) GetCover(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := ParseInt64Path(idStr)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "INVALID_ID", "Invalid song ID")
		return
	}

	song, err := h.songRepo.GetByID(id)
	if err != nil || song == nil || song.CoverHash == "" {
		JSONError(w, http.StatusNotFound, "COVER_NOT_FOUND", "Cover artwork not found")
		return
	}

	coverPath, err := h.coverSvc.GetCoverPath(song.CoverHash)
	if err != nil {
		JSONError(w, http.StatusNotFound, "COVER_NOT_FOUND", "Cover image file missing")
		return
	}

	w.Header().Set("Cache-Control", "public, max-age=31536000")
	http.ServeFile(w, r, coverPath)
}

func mimeTypeFromExt(path string) string {
	ext := filepath.Ext(path)
	switch ext {
	case ".mp3":
		return "audio/mpeg"
	case ".flac":
		return "audio/flac"
	case ".m4a":
		return "audio/mp4"
	case ".aac":
		return "audio/aac"
	case ".ogg":
		return "audio/ogg"
	case ".opus":
		return "audio/opus"
	case ".wav":
		return "audio/wav"
	default:
		return "audio/mpeg"
	}
}
