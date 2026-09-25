package repository

import (
	"database/sql"
	"fmt"
	"time"

	"veya/backend/internal/models"
)

type ArtistRepository struct {
	db *sql.DB
}

func NewArtistRepository(db *sql.DB) *ArtistRepository {
	return &ArtistRepository{db: db}
}

func (r *ArtistRepository) GetOrCreate(name string) (int64, error) {
	if name == "" {
		name = "Unknown Artist"
	}

	var id int64
	err := r.db.QueryRow("SELECT id FROM artists WHERE name = ?", name).Scan(&id)
	if err == nil {
		return id, nil
	}

	res, err := r.db.Exec("INSERT INTO artists (name) VALUES (?)", name)
	if err != nil {
		err2 := r.db.QueryRow("SELECT id FROM artists WHERE name = ?", name).Scan(&id)
		if err2 == nil {
			return id, nil
		}
		return 0, fmt.Errorf("failed to create artist: %w", err)
	}

	return res.LastInsertId()
}

func (r *ArtistRepository) GetAll(page, limit int, search string) (*models.PaginatedResponse[models.Artist], error) {
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
		whereClause += " AND name LIKE ?"
		args = append(args, "%"+search+"%")
	}

	var total int64
	countQuery := "SELECT COUNT(*) FROM artists " + whereClause
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, fmt.Errorf("failed to count artists: %w", err)
	}

	query := fmt.Sprintf(`
		SELECT ar.id, ar.name, ar.created_at,
		       (SELECT COUNT(*) FROM songs WHERE artist_id = ar.id OR artist = ar.name) AS song_count
		FROM artists ar
		%s
		ORDER BY ar.name ASC
		LIMIT ? OFFSET ?
	`, whereClause)

	queryArgs := append(args, limit, offset)
	rows, err := r.db.Query(query, queryArgs...)
	if err != nil {
		return nil, fmt.Errorf("failed to query artists: %w", err)
	}
	defer rows.Close()

	var artists []models.Artist
	for rows.Next() {
		var a models.Artist
		var createdAtStr string
		if err := rows.Scan(&a.ID, &a.Name, &createdAtStr, &a.SongCount); err != nil {
			return nil, fmt.Errorf("failed to scan artist: %w", err)
		}
		a.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
		artists = append(artists, a)
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}

	return &models.PaginatedResponse[models.Artist]{
		Data:       artists,
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}, nil
}

func (r *ArtistRepository) GetByID(id int64) (*models.Artist, []models.Song, error) {
	var a models.Artist
	var createdAtStr string

	err := r.db.QueryRow(`
		SELECT ar.id, ar.name, ar.created_at,
		       (SELECT COUNT(*) FROM songs WHERE artist_id = ar.id OR artist = ar.name) AS song_count
		FROM artists ar WHERE ar.id = ?
	`, id).Scan(&a.ID, &a.Name, &createdAtStr, &a.SongCount)
	if err == sql.ErrNoRows {
		return nil, nil, nil
	}
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get artist by id: %w", err)
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
		WHERE s.artist_id = ? OR s.artist = ?
		ORDER BY al.title ASC, s.track_number ASC, s.title ASC
	`, id, a.Name)
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
