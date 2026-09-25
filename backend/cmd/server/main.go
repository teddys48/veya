package main

import (
	"context"
	"embed"
	"errors"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"veya/backend/internal/config"
	"veya/backend/internal/database"
	"veya/backend/internal/handlers"
	"veya/backend/internal/middleware"
	"veya/backend/internal/repository"
	"veya/backend/internal/service"
)

//go:embed dist/*
var staticFS embed.FS

func main() {
	cfg := config.Load()

	// Initialize structured logger
	var logger *slog.Logger
	if cfg.LogLevel == "debug" {
		logger = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))
	} else {
		logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	}
	slog.SetDefault(logger)

	slog.Info("Starting Veya Music Server", "port", cfg.Port, "env", cfg.Env)

	// Ensure directories exist
	_ = os.MkdirAll(cfg.CoversDir, 0755)
	_ = os.MkdirAll(cfg.MusicDir, 0755)
	_ = os.MkdirAll(filepath.Dir(cfg.DBPath), 0755)

	// Initialize Database
	db, err := database.InitDB(cfg.DBPath)
	if err != nil {
		slog.Error("Failed to initialize database", "error", err)
		os.Exit(1)
	}
	defer db.Close()
	slog.Info("Database initialized successfully", "db_path", cfg.DBPath)

	// Initialize Repositories
	songRepo := repository.NewSongRepository(db)
	albumRepo := repository.NewAlbumRepository(db)
	artistRepo := repository.NewArtistRepository(db)
	genreRepo := repository.NewGenreRepository(db)
	playlistRepo := repository.NewPlaylistRepository(db)
	searchRepo := repository.NewSearchRepository(db)
	favRepo := repository.NewFavoriteRepository(db)
	historyRepo := repository.NewHistoryRepository(db)

	// Initialize Services
	coverSvc := service.NewCoverService(cfg.CoversDir)
	audioSvc := service.NewAudioService(songRepo, cfg.MusicDir)
	scannerSvc := service.NewScannerService(cfg.MusicDir, songRepo, albumRepo, artistRepo, genreRepo, coverSvc)

	// Initial automatic scan on server startup if library is empty
	go func() {
		meta, err := songRepo.GetAllFileMetadata()
		if err == nil && len(meta) == 0 {
			slog.Info("Empty music library detected, triggering initial scan...")
			scannerSvc.StartScan()
		}
	}()

	// Initialize Handlers
	songH := handlers.NewSongHandler(songRepo, audioSvc, coverSvc)
	albumH := handlers.NewAlbumHandler(albumRepo)
	artistH := handlers.NewArtistHandler(artistRepo)
	playlistH := handlers.NewPlaylistHandler(playlistRepo)
	searchH := handlers.NewSearchHandler(searchRepo)
	favH := handlers.NewFavoriteHandler(favRepo)
	historyH := handlers.NewHistoryHandler(historyRepo)
	scanH := handlers.NewScanHandler(scannerSvc)
	coverH := handlers.NewCoverHandler(coverSvc)
	healthH := handlers.NewHealthHandler(db)

	// Register Router
	mux := http.NewServeMux()

	// Health endpoint
	mux.HandleFunc("GET /api/health", healthH.Health)

	// Song Endpoints
	mux.HandleFunc("GET /api/songs", songH.GetAll)
	mux.HandleFunc("GET /api/songs/{id}", songH.GetByID)
	mux.HandleFunc("GET /api/songs/{id}/stream", songH.Stream)
	mux.HandleFunc("GET /api/songs/{id}/cover", songH.GetCover)

	// Album Endpoints
	mux.HandleFunc("GET /api/albums", albumH.GetAll)
	mux.HandleFunc("GET /api/albums/{id}", albumH.GetByID)

	// Artist Endpoints
	mux.HandleFunc("GET /api/artists", artistH.GetAll)
	mux.HandleFunc("GET /api/artists/{id}", artistH.GetByID)

	// Playlist Endpoints
	mux.HandleFunc("GET /api/playlists", playlistH.GetAll)
	mux.HandleFunc("POST /api/playlists", playlistH.Create)
	mux.HandleFunc("GET /api/playlists/{id}", playlistH.GetByID)
	mux.HandleFunc("PATCH /api/playlists/{id}", playlistH.Update)
	mux.HandleFunc("DELETE /api/playlists/{id}", playlistH.Delete)
	mux.HandleFunc("POST /api/playlists/{id}/songs", playlistH.AddSong)
	mux.HandleFunc("DELETE /api/playlists/{id}/songs/{songId}", playlistH.RemoveSong)
	mux.HandleFunc("PUT /api/playlists/{id}/reorder", playlistH.ReorderSongs)

	// Search Endpoint
	mux.HandleFunc("GET /api/search", searchH.Search)

	// Favorites Endpoints
	mux.HandleFunc("GET /api/favorites", favH.GetFavorites)
	mux.HandleFunc("POST /api/favorites/{songId}", favH.AddFavorite)
	mux.HandleFunc("DELETE /api/favorites/{songId}", favH.RemoveFavorite)

	// History Endpoints
	mux.HandleFunc("GET /api/history", historyH.GetHistory)
	mux.HandleFunc("POST /api/history", historyH.AddHistory)

	// Library Scan Endpoints
	mux.HandleFunc("POST /api/library/scan", scanH.StartScan)
	mux.HandleFunc("GET /api/library/scan/status", scanH.GetStatus)

	// Cover Cache Endpoint
	mux.HandleFunc("GET /api/covers/{hash}", coverH.GetCoverByHash)

	// Serve Static Single Page Application (SPA) with fallback to index.html
	subFS, err := fs.Sub(staticFS, "dist")
	var staticHandler http.Handler
	if err == nil {
		fileServer := http.FileServer(http.FS(subFS))
		staticHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			path := strings.TrimPrefix(r.URL.Path, "/")
			if path == "" {
				fileServer.ServeHTTP(w, r)
				return
			}
			f, err := subFS.Open(path)
			if err != nil {
				// Fallback to index.html for React SPA routing
				r.URL.Path = "/"
				fileServer.ServeHTTP(w, r)
				return
			}
			f.Close()
			fileServer.ServeHTTP(w, r)
		})
	} else {
		staticHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !strings.HasPrefix(r.URL.Path, "/api/") {
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write([]byte("Veya Music Backend API Server running. Build frontend dist to view SPA."))
			}
		})
	}

	mux.Handle("/", staticHandler)

	// Wrap with Middleware
	handler := middleware.CORS(middleware.Logger(mux))

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Graceful Shutdown Setup
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		slog.Info("Server listening on port " + cfg.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("Server failed to start", "error", err)
			os.Exit(1)
		}
	}()

	<-stopChan
	slog.Info("Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	} else {
		slog.Info("Server stopped cleanly")
	}
}
