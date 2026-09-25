package service

import (
	"os"
	"path/filepath"
	"testing"

	"veya/backend/internal/database"
	"veya/backend/internal/models"
	"veya/backend/internal/repository"
)

func TestAudioServicePathSecurity(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "veya_music_test")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	musicDir := filepath.Join(tempDir, "music")
	_ = os.MkdirAll(musicDir, 0755)

	dbPath := filepath.Join(tempDir, "test.db")
	db, err := database.InitDB(dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	defer db.Close()

	songRepo := repository.NewSongRepository(db)
	audioSvc := NewAudioService(songRepo, musicDir)

	// Create valid song file
	validSongPath := filepath.Join(musicDir, "song.mp3")
	_ = os.WriteFile(validSongPath, []byte("fake mp3 data"), 0644)

	songID, err := songRepo.Upsert(&models.Song{
		FilePath: validSongPath,
		Title:    "Valid Song",
		Artist:   "Artist",
		Format:   "mp3",
	}, 0, 0, 0)
	if err != nil {
		t.Fatalf("failed to insert song: %v", err)
	}

	// 1. Test valid path resolution
	resolved, title, err := audioSvc.ResolveSongFilePath(songID)
	if err != nil {
		t.Errorf("expected valid song resolution, got err: %v", err)
	}
	if title != "Valid Song" || resolved != validSongPath {
		t.Errorf("unexpected resolution: %s, %s", title, resolved)
	}

	// 2. Test Path Traversal Prevention
	outsidePath := filepath.Join(tempDir, "secret.txt")
	_ = os.WriteFile(outsidePath, []byte("secret"), 0644)

	badSongID, err := songRepo.Upsert(&models.Song{
		FilePath: outsidePath,
		Title:    "Malicious Song",
		Artist:   "Hacker",
		Format:   "txt",
	}, 0, 0, 0)
	if err != nil {
		t.Fatalf("failed to insert malicious song record: %v", err)
	}

	_, _, err = audioSvc.ResolveSongFilePath(badSongID)
	if err != ErrAccessDenied {
		t.Errorf("expected ErrAccessDenied for path outside music dir, got: %v", err)
	}
}
