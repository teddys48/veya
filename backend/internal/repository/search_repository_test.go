package repository

import (
	"os"
	"path/filepath"
	"testing"

	"veya/backend/internal/database"
	"veya/backend/internal/models"
)

func TestSearchRepositoryFTS(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "veya_fts_test")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	dbPath := filepath.Join(tempDir, "test.db")
	db, err := database.InitDB(dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	defer db.Close()

	artistRepo := NewArtistRepository(db)
	albumRepo := NewAlbumRepository(db)
	songRepo := NewSongRepository(db)
	searchRepo := NewSearchRepository(db)

	artistID, _ := artistRepo.GetOrCreate("Neon Waves")
	albumID, _ := albumRepo.GetOrCreate("Cyber City", "Neon Waves", 2024, "")

	_, err = songRepo.Upsert(&models.Song{
		FilePath:    "/music/synthwave.mp3",
		Title:       "Midnight Cyberpunk City",
		Artist:      "Neon Waves",
		AlbumArtist: "Neon Waves",
		Format:      "mp3",
	}, artistID, albumID, 0)
	if err != nil {
		t.Fatalf("failed to insert song: %v", err)
	}

	// Test FTS search
	results, err := searchRepo.SearchFTS("Cyberpunk", 10)
	if err != nil {
		t.Fatalf("search failed: %v", err)
	}

	if len(results.Songs) != 1 {
		t.Fatalf("expected 1 song in search results, got %d", len(results.Songs))
	}
	if results.Songs[0].Title != "Midnight Cyberpunk City" {
		t.Errorf("unexpected song title: %s", results.Songs[0].Title)
	}
}
