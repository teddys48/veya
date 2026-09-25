package models

import (
	"time"
)

type Artist struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	SongCount int       `json:"song_count,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type Album struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	AlbumArtist string    `json:"album_artist"`
	CoverHash   string    `json:"cover_hash,omitempty"`
	Year        int       `json:"year"`
	SongCount   int       `json:"song_count,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type Genre struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type Song struct {
	ID          int64     `json:"id"`
	FilePath    string    `json:"-"` // Hidden from API for security
	Title       string    `json:"title"`
	Artist      string    `json:"artist"`
	Album       string    `json:"album"`
	AlbumArtist string    `json:"album_artist"`
	ArtistID    int64     `json:"artist_id"`
	AlbumID     int64     `json:"album_id"`
	Genre       string    `json:"genre"`
	TrackNumber int       `json:"track_number"`
	DiscNumber  int       `json:"disc_number"`
	Year        int       `json:"year"`
	Duration    float64   `json:"duration"` // Duration in seconds
	Format      string    `json:"format"`
	FileSize    int64     `json:"file_size"`
	ModifiedAt  int64     `json:"modified_at"`
	CoverHash   string    `json:"cover_hash,omitempty"`
	IsFavorite  bool      `json:"is_favorite"`
	CreatedAt   time.Time `json:"created_at"`
}

type Playlist struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	TrackCount  int       `json:"track_count"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type PlaylistSong struct {
	PlaylistID int64     `json:"playlist_id"`
	SongID     int64     `json:"song_id"`
	Position   int       `json:"position"`
	AddedAt    time.Time `json:"added_at"`
	Song       *Song     `json:"song,omitempty"`
}

type Favorite struct {
	SongID    int64     `json:"song_id"`
	CreatedAt time.Time `json:"created_at"`
}

type PlaybackHistory struct {
	ID       int64     `json:"id"`
	SongID   int64     `json:"song_id"`
	PlayedAt time.Time `json:"played_at"`
	Song     *Song     `json:"song,omitempty"`
}

type ScanStatus struct {
	IsScanning  bool   `json:"is_scanning"`
	Progress    int    `json:"progress"`
	Total       int    `json:"total"`
	Scanned     int    `json:"scanned"`
	Added       int    `json:"added"`
	Updated     int    `json:"updated"`
	Deleted     int    `json:"deleted"`
	Errors      int    `json:"errors"`
	CurrentFile string `json:"current_file"`
	Message     string `json:"message"`
}

type SearchResult struct {
	Songs     []Song     `json:"songs"`
	Albums    []Album    `json:"albums"`
	Artists   []Artist   `json:"artists"`
	Playlists []Playlist `json:"playlists"`
}

type PaginatedResponse[T any] struct {
	Data       []T   `json:"data"`
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}
