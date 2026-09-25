package repository

import (
	"database/sql"
	"fmt"
	"time"

	"veya/backend/internal/models"
)

type PlaylistRepository struct {
	db *sql.DB
}

func NewPlaylistRepository(db *sql.DB) *PlaylistRepository {
	return &PlaylistRepository{db: db}
}

func (r *PlaylistRepository) GetAll() ([]models.Playlist, error) {
	query := `
		SELECT p.id, p.name, p.description, p.created_at, p.updated_at,
		       (SELECT COUNT(*) FROM playlist_songs WHERE playlist_id = p.id) AS track_count
		FROM playlists p
		ORDER BY p.updated_at DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query playlists: %w", err)
	}
	defer rows.Close()

	var playlists []models.Playlist
	for rows.Next() {
		var p models.Playlist
		var createdStr, updatedStr string
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &createdStr, &updatedStr, &p.TrackCount); err != nil {
			return nil, err
		}
		p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdStr)
		p.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedStr)
		playlists = append(playlists, p)
	}
	return playlists, nil
}

func (r *PlaylistRepository) GetByID(id int64) (*models.Playlist, []models.Song, error) {
	var p models.Playlist
	var createdStr, updatedStr string

	err := r.db.QueryRow(`
		SELECT p.id, p.name, p.description, p.created_at, p.updated_at,
		       (SELECT COUNT(*) FROM playlist_songs WHERE playlist_id = p.id) AS track_count
		FROM playlists p WHERE p.id = ?
	`, id).Scan(&p.ID, &p.Name, &p.Description, &createdStr, &updatedStr, &p.TrackCount)
	if err == sql.ErrNoRows {
		return nil, nil, nil
	}
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get playlist: %w", err)
	}
	p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdStr)
	p.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedStr)

	rows, err := r.db.Query(`
		SELECT s.id, s.file_path, s.title, s.artist, s.album_artist,
		       COALESCE(s.artist_id, 0), COALESCE(s.album_id, 0),
		       COALESCE(al.title, ''), COALESCE(g.name, ''),
		       s.track_number, s.disc_number, s.year, s.duration,
		       s.format, s.file_size, s.modified_at, s.cover_hash,
		       CASE WHEN f.song_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite,
		       s.created_at
		FROM playlist_songs ps
		JOIN songs s ON ps.song_id = s.id
		LEFT JOIN albums al ON s.album_id = al.id
		LEFT JOIN genres g ON s.genre_id = g.id
		LEFT JOIN favorites f ON s.id = f.song_id
		WHERE ps.playlist_id = ?
		ORDER BY ps.position ASC
	`, id)
	if err != nil {
		return &p, nil, err
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
			s.IsFavorite = (isFav == 1)
			s.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", cStr)
			songs = append(songs, s)
		}
	}

	return &p, songs, nil
}

func (r *PlaylistRepository) Create(name, description string) (*models.Playlist, error) {
	res, err := r.db.Exec("INSERT INTO playlists (name, description) VALUES (?, ?)", name, description)
	if err != nil {
		return nil, fmt.Errorf("failed to create playlist: %w", err)
	}

	id, _ := res.LastInsertId()
	return &models.Playlist{
		ID:          id,
		Name:        name,
		Description: description,
		TrackCount:  0,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}, nil
}

func (r *PlaylistRepository) Update(id int64, name, description string) error {
	_, err := r.db.Exec("UPDATE playlists SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", name, description, id)
	return err
}

func (r *PlaylistRepository) Delete(id int64) error {
	_, err := r.db.Exec("DELETE FROM playlists WHERE id = ?", id)
	return err
}

func (r *PlaylistRepository) AddSong(playlistID, songID int64) error {
	var maxPos int
	err := r.db.QueryRow("SELECT COALESCE(MAX(position), 0) FROM playlist_songs WHERE playlist_id = ?", playlistID).Scan(&maxPos)
	if err != nil {
		maxPos = 0
	}

	_, err = r.db.Exec("INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)", playlistID, songID, maxPos+1)
	if err != nil {
		return fmt.Errorf("failed to add song to playlist: %w", err)
	}

	_, _ = r.db.Exec("UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", playlistID)
	return nil
}

func (r *PlaylistRepository) RemoveSong(playlistID, songID int64) error {
	_, err := r.db.Exec("DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?", playlistID, songID)
	if err != nil {
		return err
	}

	// Compact positions
	rows, err := r.db.Query("SELECT song_id FROM playlist_songs WHERE playlist_id = ? ORDER BY position ASC", playlistID)
	if err == nil {
		var songIDs []int64
		for rows.Next() {
			var sid int64
			if err := rows.Scan(&sid); err == nil {
				songIDs = append(songIDs, sid)
			}
		}
		rows.Close()

		r.ReorderSongs(playlistID, songIDs)
	}

	_, _ = r.db.Exec("UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", playlistID)
	return nil
}

func (r *PlaylistRepository) ReorderSongs(playlistID int64, songIDs []int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM playlist_songs WHERE playlist_id = ?", playlistID); err != nil {
		return err
	}

	for idx, sid := range songIDs {
		if _, err := tx.Exec("INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)", playlistID, sid, idx+1); err != nil {
			return err
		}
	}

	if _, err := tx.Exec("UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", playlistID); err != nil {
		return err
	}

	return tx.Commit()
}
