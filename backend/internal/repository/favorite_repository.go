package repository

import (
	"database/sql"
	"fmt"
	"time"

	"veya/backend/internal/models"
)

type FavoriteRepository struct {
	db *sql.DB
}

func NewFavoriteRepository(db *sql.DB) *FavoriteRepository {
	return &FavoriteRepository{db: db}
}

func (r *FavoriteRepository) AddFavorite(songID int64) error {
	_, err := r.db.Exec("INSERT OR IGNORE INTO favorites (song_id) VALUES (?)", songID)
	return err
}

func (r *FavoriteRepository) RemoveFavorite(songID int64) error {
	_, err := r.db.Exec("DELETE FROM favorites WHERE song_id = ?", songID)
	return err
}

func (r *FavoriteRepository) GetFavorites() ([]models.Song, error) {
	query := `
		SELECT s.id, s.file_path, s.title, s.artist, s.album_artist,
		       COALESCE(s.artist_id, 0), COALESCE(s.album_id, 0),
		       COALESCE(al.title, ''), COALESCE(g.name, ''),
		       s.track_number, s.disc_number, s.year, s.duration,
		       s.format, s.file_size, s.modified_at, s.cover_hash,
		       1 AS is_favorite, s.created_at
		FROM favorites f
		JOIN songs s ON f.song_id = s.id
		LEFT JOIN albums al ON s.album_id = al.id
		LEFT JOIN genres g ON s.genre_id = g.id
		ORDER BY f.created_at DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query favorites: %w", err)
	}
	defer rows.Close()

	var songs []models.Song
	for rows.Next() {
		var s models.Song
		var isFav int
		var cStr string
		err := rows.Scan(
			&s.ID, &s.FilePath, &s.Title, &s.Artist, &s.AlbumArtist,
			&s.ArtistID, &s.AlbumID, &s.Album, &s.Genre,
			&s.TrackNumber, &s.DiscNumber, &s.Year, &s.Duration,
			&s.Format, &s.FileSize, &s.ModifiedAt, &s.CoverHash,
			&isFav, &cStr,
		)
		if err == nil {
			s.IsFavorite = true
			s.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", cStr)
			songs = append(songs, s)
		}
	}
	return songs, nil
}
