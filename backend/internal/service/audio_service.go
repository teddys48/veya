package service

import (
	"errors"
	"os"
	"path/filepath"
	"strings"

	"veya/backend/internal/repository"
)

var (
	ErrSongNotFound      = errors.New("song not found")
	ErrAccessDenied      = errors.New("access denied: path outside music directory")
	ErrAudioFileNotFound = errors.New("audio file not found on disk")
)

type AudioService struct {
	songRepo *repository.SongRepository
	musicDir string
}

func NewAudioService(songRepo *repository.SongRepository, musicDir string) *AudioService {
	cleanDir, _ := filepath.Abs(filepath.Clean(musicDir))
	return &AudioService{
		songRepo: songRepo,
		musicDir: cleanDir,
	}
}

func (s *AudioService) ResolveSongFilePath(songID int64) (string, string, error) {
	song, err := s.songRepo.GetByID(songID)
	if err != nil || song == nil {
		return "", "", ErrSongNotFound
	}

	targetPath := song.FilePath
	absTarget, err := filepath.Abs(filepath.Clean(targetPath))
	if err != nil {
		return "", "", ErrAccessDenied
	}

	// Security validation using filepath.Rel
	rel, err := filepath.Rel(s.musicDir, absTarget)
	if err != nil || strings.HasPrefix(rel, "..") || filepath.IsAbs(rel) {
		return "", "", ErrAccessDenied
	}

	if _, err := os.Stat(absTarget); os.IsNotExist(err) {
		return "", "", ErrAudioFileNotFound
	}

	return absTarget, song.Title, nil
}
