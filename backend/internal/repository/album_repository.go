package repository

import (
	"database/sql"
	"fmt"
	"time"

	"veya/backend/internal/models"
)

type AlbumRepository struct {
	db *sql.DB
}

func NewAlbumRepository(db *sql.DB) *AlbumRepository {
	return &AlbumRepository{db: db}
}

func (r *AlbumRepository) GetOrCreate(title, albumArtist string, year int, coverHash string) (int64, error) {
	if title == "" {
		title = "Unknown Album"
	}
	if albumArtist == "" {
		albumArtist = "Unknown Artist"
	}
	if year < 1900 || year > 2100 {
		year = 0
	}

	var id int64
	err := r.db.QueryRow("SELECT id FROM albums WHERE title = ? AND album_artist = ?", title, albumArtist).Scan(&id)
	if err == nil {
		if coverHash != "" {
			_, _ = r.db.Exec("UPDATE albums SET cover_hash = ? WHERE id = ? AND (cover_hash IS NULL OR cover_hash = '')", coverHash, id)
		}
		if year >= 1900 && year <= 2100 {
			_, _ = r.db.Exec("UPDATE albums SET year = ? WHERE id = ? AND (year IS NULL OR year < 1900 OR year > 2100)", year, id)
		}
		return id, nil
	}

	res, err := r.db.Exec("INSERT INTO albums (title, album_artist, year, cover_hash) VALUES (?, ?, ?, ?)", title, albumArtist, year, coverHash)
	if err != nil {
		// Retrying fetch in case of race condition
		err2 := r.db.QueryRow("SELECT id FROM albums WHERE title = ? AND album_artist = ?", title, albumArtist).Scan(&id)
		if err2 == nil {
			return id, nil
		}
		return 0, fmt.Errorf("failed to create album: %w", err)
	}

	return res.LastInsertId()
}

func (r *AlbumRepository) GetAll(page, limit int, search string) (*models.PaginatedResponse[models.Album], error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	if search != "" {
		whereClause += " AND (title LIKE ? OR album_artist LIKE ?)"
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern)
	}

	var total int64
	countQuery := "SELECT COUNT(*) FROM albums " + whereClause
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, fmt.Errorf("failed to count albums: %w", err)
	}

	query := fmt.Sprintf(`
		SELECT a.id, a.title, a.album_artist, a.cover_hash, a.year, a.created_at,
		       (SELECT COUNT(*) FROM songs WHERE album_id = a.id) AS song_count
		FROM albums a
		%s
		ORDER BY a.title ASC
		LIMIT ? OFFSET ?
	`, whereClause)

	queryArgs := append(args, limit, offset)
	rows, err := r.db.Query(query, queryArgs...)
	if err != nil {
		return nil, fmt.Errorf("failed to query albums: %w", err)
	}
	defer rows.Close()

	var albums []models.Album
	for rows.Next() {
		var a models.Album
		var createdAtStr string
		if err := rows.Scan(&a.ID, &a.Title, &a.AlbumArtist, &a.CoverHash, &a.Year, &createdAtStr, &a.SongCount); err != nil {
			return nil, fmt.Errorf("failed to scan album: %w", err)
		}
		a.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
		albums = append(albums, a)
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}

	return &models.PaginatedResponse[models.Album]{
		Data:       albums,
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}, nil
}

func (r *AlbumRepository) GetByID(id int64) (*models.Album, []models.Song, error) {
	var a models.Album
	var createdAtStr string

	err := r.db.QueryRow(`
		SELECT a.id, a.title, a.album_artist, a.cover_hash, a.year, a.created_at,
		       (SELECT COUNT(*) FROM songs WHERE album_id = a.id) AS song_count
		FROM albums a WHERE a.id = ?
	`, id).Scan(&a.ID, &a.Title, &a.AlbumArtist, &a.CoverHash, &a.Year, &createdAtStr, &a.SongCount)
	if err == sql.ErrNoRows {
		return nil, nil, nil
	}
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get album by id: %w", err)
	}
	a.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)

	rows, err := r.db.Query(`
		SELECT s.id, s.file_path, s.title, s.artist, s.album_artist,
		       COALESCE(s.artist_id, 0), COALESCE(s.album_id, 0),
		       COALESCE(al.title, ''), COALESCE(g.name, ''),
		       s.track_number, s.disc_number, s.year, s.duration,
		       s.format, s.file_size, s.modified_at, s.cover_hash,
		       CASE WHEN f.song_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite,
		       s.created_at
		FROM songs s
		LEFT JOIN albums al ON s.album_id = al.id
		LEFT JOIN genres g ON s.genre_id = g.id
		LEFT JOIN favorites f ON s.id = f.song_id
		WHERE s.album_id = ?
		ORDER BY s.disc_number ASC, s.track_number ASC, s.title ASC
	`, id)
	if err != nil {
		return &a, nil, err
	}
	defer rows.Close()

	var songs []models.Song
	for rows.Next() {
		var s models.Song
		var isFav int
		var createdStr string
		err := rows.Scan(
			&s.ID, &s.FilePath, &s.Title, &s.Artist, &s.AlbumArtist,
			&s.ArtistID, &s.AlbumID, &s.Album, &s.Genre,
			&s.TrackNumber, &s.DiscNumber, &s.Year, &s.Duration,
			&s.Format, &s.FileSize, &s.ModifiedAt, &s.CoverHash,
			&isFav, &createdStr,
		)
		if err == nil {
			s.IsFavorite = (isFav == 1)
			s.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdStr)
			songs = append(songs, s)
		}
	}

	return &a, songs, nil
}
