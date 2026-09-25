package repository

import (
	"database/sql"
	"fmt"
	"time"

	"veya/backend/internal/models"
)

type SongRepository struct {
	db *sql.DB
}

type FileMeta struct {
	ID         int64
	FileSize   int64
	ModifiedAt int64
	Year       int
	Duration   float64
}

func NewSongRepository(db *sql.DB) *SongRepository {
	return &SongRepository{db: db}
}

func (r *SongRepository) GetAll(page, limit int, sort, genre string) (*models.PaginatedResponse[models.Song], error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	whereClause := "WHERE 1=1"
	args := []interface{}{}

	if genre != "" {
		whereClause += " AND g.name = ?"
		args = append(args, genre)
	}

	var countQuery string
	if genre != "" {
		countQuery = "SELECT COUNT(*) FROM songs s JOIN genres g ON s.genre_id = g.id " + whereClause
	} else {
		countQuery = "SELECT COUNT(*) FROM songs s " + whereClause
	}

	var total int64
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count songs: %w", err)
	}

	orderBy := "s.title ASC"
	switch sort {
	case "artist":
		orderBy = "s.artist ASC, s.title ASC"
	case "album":
		orderBy = "s.album_artist ASC, al.title ASC, s.track_number ASC"
	case "recent":
		orderBy = "s.created_at DESC"
	case "year":
		orderBy = "s.year DESC, s.title ASC"
	}

	query := fmt.Sprintf(`
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
		%s
		ORDER BY %s
		LIMIT ? OFFSET ?
	`, whereClause, orderBy)

	queryArgs := append(args, limit, offset)
	rows, err := r.db.Query(query, queryArgs...)
	if err != nil {
		return nil, fmt.Errorf("failed to query songs: %w", err)
	}
	defer rows.Close()

	var songs []models.Song
	for rows.Next() {
		var s models.Song
		var isFav int
		var createdAtStr string

		err := rows.Scan(
			&s.ID, &s.FilePath, &s.Title, &s.Artist, &s.AlbumArtist,
			&s.ArtistID, &s.AlbumID, &s.Album, &s.Genre,
			&s.TrackNumber, &s.DiscNumber, &s.Year, &s.Duration,
			&s.Format, &s.FileSize, &s.ModifiedAt, &s.CoverHash,
			&isFav, &createdAtStr,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan song: %w", err)
		}

		s.IsFavorite = (isFav == 1)
		s.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
		songs = append(songs, s)
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}

	return &models.PaginatedResponse[models.Song]{
		Data:       songs,
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}, nil
}

func (r *SongRepository) GetByID(id int64) (*models.Song, error) {
	query := `
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
		WHERE s.id = ?
	`

	var s models.Song
	var isFav int
	var createdAtStr string

	err := r.db.QueryRow(query, id).Scan(
		&s.ID, &s.FilePath, &s.Title, &s.Artist, &s.AlbumArtist,
		&s.ArtistID, &s.AlbumID, &s.Album, &s.Genre,
		&s.TrackNumber, &s.DiscNumber, &s.Year, &s.Duration,
		&s.Format, &s.FileSize, &s.ModifiedAt, &s.CoverHash,
		&isFav, &createdAtStr,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get song by id: %w", err)
	}

	s.IsFavorite = (isFav == 1)
	s.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
	return &s, nil
}

func (r *SongRepository) GetAllFileMetadata() (map[string]FileMeta, error) {
	rows, err := r.db.Query("SELECT id, file_path, file_size, modified_at, year, duration FROM songs")
	if err != nil {
		return nil, fmt.Errorf("failed to query song file metadata: %w", err)
	}
	defer rows.Close()

	metaMap := make(map[string]FileMeta)
	for rows.Next() {
		var id int64
		var path string
		var size, mtime int64
		var year int
		var duration float64
		if err := rows.Scan(&id, &path, &size, &mtime, &year, &duration); err != nil {
			return nil, err
		}
		metaMap[path] = FileMeta{ID: id, FileSize: size, ModifiedAt: mtime, Year: year, Duration: duration}
	}
	return metaMap, nil
}

func (r *SongRepository) Upsert(s *models.Song, artistID, albumID, genreID int64) (int64, error) {
	query := `
		INSERT INTO songs (
			file_path, title, artist, album_artist, artist_id, album_id, genre_id,
			track_number, disc_number, year, duration, format, file_size, modified_at, cover_hash
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(file_path) DO UPDATE SET
			title = excluded.title,
			artist = excluded.artist,
			album_artist = excluded.album_artist,
			artist_id = excluded.artist_id,
			album_id = excluded.album_id,
			genre_id = excluded.genre_id,
			track_number = excluded.track_number,
			disc_number = excluded.disc_number,
			year = excluded.year,
			duration = excluded.duration,
			format = excluded.format,
			file_size = excluded.file_size,
			modified_at = excluded.modified_at,
			cover_hash = excluded.cover_hash
	`

	var genreVal interface{}
	if genreID > 0 {
		genreVal = genreID
	}
	var artistVal interface{}
	if artistID > 0 {
		artistVal = artistID
	}
	var albumVal interface{}
	if albumID > 0 {
		albumVal = albumID
	}

	res, err := r.db.Exec(query,
		s.FilePath, s.Title, s.Artist, s.AlbumArtist, artistVal, albumVal, genreVal,
		s.TrackNumber, s.DiscNumber, s.Year, s.Duration, s.Format, s.FileSize, s.ModifiedAt, s.CoverHash,
	)
	if err != nil {
		return 0, fmt.Errorf("failed to upsert song: %w", err)
	}

	id, err := res.LastInsertId()
	if err != nil || id == 0 {
		// If updated, get ID by path
		err = r.db.QueryRow("SELECT id FROM songs WHERE file_path = ?", s.FilePath).Scan(&id)
	}
	return id, err
}

func (r *SongRepository) DeleteByFilePath(path string) error {
	_, err := r.db.Exec("DELETE FROM songs WHERE file_path = ?", path)
	return err
}
