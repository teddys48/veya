package repository

import (
	"database/sql"
	"fmt"
	"time"

	"veya/backend/internal/models"
)

type HistoryRepository struct {
	db *sql.DB
}

func NewHistoryRepository(db *sql.DB) *HistoryRepository {
	return &HistoryRepository{db: db}
}

func (r *HistoryRepository) AddHistory(songID int64) error {
	// Check deduplication: if played in last 60s, skip
	var count int
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM playback_history
		WHERE song_id = ? AND played_at > datetime('now', '-60 seconds')
	`, songID).Scan(&count)
	if err == nil && count > 0 {
		return nil // Deduplicated
	}

	_, err = r.db.Exec("INSERT INTO playback_history (song_id) VALUES (?)", songID)
	if err != nil {
		return fmt.Errorf("failed to insert history: %w", err)
	}

	// Purge history entries beyond 1000 records
	_, _ = r.db.Exec(`
		DELETE FROM playback_history
		WHERE id NOT IN (
			SELECT id FROM playback_history
			ORDER BY played_at DESC
			LIMIT 1000
		)
	`)

	return nil
}

func (r *HistoryRepository) GetHistory(page, limit int) (*models.PaginatedResponse[models.PlaybackHistory], error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	var total int64
	if err := r.db.QueryRow("SELECT COUNT(*) FROM playback_history").Scan(&total); err != nil {
		return nil, fmt.Errorf("failed to count history: %w", err)
	}

	query := `
		SELECT h.id, h.song_id, h.played_at,
		       s.id, s.file_path, s.title, s.artist, s.album_artist,
		       COALESCE(s.artist_id, 0), COALESCE(s.album_id, 0),
		       COALESCE(al.title, ''), COALESCE(g.name, ''),
		       s.track_number, s.disc_number, s.year, s.duration,
		       s.format, s.file_size, s.modified_at, s.cover_hash,
		       CASE WHEN f.song_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite,
		       s.created_at
		FROM playback_history h
		JOIN songs s ON h.song_id = s.id
		LEFT JOIN albums al ON s.album_id = al.id
		LEFT JOIN genres g ON s.genre_id = g.id
		LEFT JOIN favorites f ON s.id = f.song_id
		ORDER BY h.played_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query history: %w", err)
	}
	defer rows.Close()

	var history []models.PlaybackHistory
	for rows.Next() {
		var h models.PlaybackHistory
		var s models.Song
		var isFav int
		var playedStr, songCreatedStr string

		err := rows.Scan(
			&h.ID, &h.SongID, &playedStr,
			&s.ID, &s.FilePath, &s.Title, &s.Artist, &s.AlbumArtist,
			&s.ArtistID, &s.AlbumID, &s.Album, &s.Genre,
			&s.TrackNumber, &s.DiscNumber, &s.Year, &s.Duration,
			&s.Format, &s.FileSize, &s.ModifiedAt, &s.CoverHash,
			&isFav, &songCreatedStr,
		)
		if err == nil {
			s.IsFavorite = (isFav == 1)
			s.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", songCreatedStr)
			h.PlayedAt, _ = time.Parse("2006-01-02 15:04:05", playedStr)
			h.Song = &s
			history = append(history, h)
		}
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}

	return &models.PaginatedResponse[models.PlaybackHistory]{
		Data:       history,
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}, nil
}
