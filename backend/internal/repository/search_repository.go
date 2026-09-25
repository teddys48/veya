package repository

import (
	"database/sql"
	"strings"
	"time"

	"veya/backend/internal/models"
)

type SearchRepository struct {
	db *sql.DB
}

func NewSearchRepository(db *sql.DB) *SearchRepository {
	return &SearchRepository{db: db}
}

func (r *SearchRepository) SearchFTS(query string, limit int) (*models.SearchResult, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	cleanQuery := strings.TrimSpace(query)
	if cleanQuery == "" {
		return &models.SearchResult{
			Songs:     []models.Song{},
			Albums:    []models.Album{},
			Artists:   []models.Artist{},
			Playlists: []models.Playlist{},
		}, nil
	}

	tokens := strings.Fields(cleanQuery)
	var ftsTokens []string
	for _, token := range tokens {
		t := strings.Trim(token, `"'*`)
		if t != "" {
			ftsTokens = append(ftsTokens, t+"*")
		}
	}
	ftsQuery := strings.Join(ftsTokens, " ")
	if ftsQuery == "" {
		ftsQuery = cleanQuery + "*"
	}

	songsQuery := `
		SELECT s.id, s.file_path, s.title, s.artist, s.album_artist,
		       COALESCE(s.artist_id, 0), COALESCE(s.album_id, 0),
		       COALESCE(al.title, ''), COALESCE(g.name, ''),
		       s.track_number, s.disc_number, s.year, s.duration,
		       s.format, s.file_size, s.modified_at, s.cover_hash,
		       CASE WHEN f.song_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite,
		       s.created_at
		FROM songs_fts fts
		JOIN songs s ON fts.song_id = s.id
		LEFT JOIN albums al ON s.album_id = al.id
		LEFT JOIN genres g ON s.genre_id = g.id
		LEFT JOIN favorites f ON s.id = f.song_id
		WHERE songs_fts MATCH ?
		ORDER BY rank
		LIMIT ?
	`

	rows, err := r.db.Query(songsQuery, ftsQuery, limit)
	songs := []models.Song{}
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var s models.Song
			var isFav int
			var cStr string
			if err := rows.Scan(
				&s.ID, &s.FilePath, &s.Title, &s.Artist, &s.AlbumArtist,
				&s.ArtistID, &s.AlbumID, &s.Album, &s.Genre,
				&s.TrackNumber, &s.DiscNumber, &s.Year, &s.Duration,
				&s.Format, &s.FileSize, &s.ModifiedAt, &s.CoverHash,
				&isFav, &cStr,
			); err == nil {
				s.IsFavorite = (isFav == 1)
				s.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", cStr)
				songs = append(songs, s)
			}
		}
	}

	likePattern := "%" + cleanQuery + "%"
	albumQuery := `
		SELECT a.id, a.title, a.album_artist, a.cover_hash, a.year, a.created_at,
		       (SELECT COUNT(*) FROM songs WHERE album_id = a.id) AS song_count
		FROM albums a
		WHERE a.title LIKE ? OR a.album_artist LIKE ?
		ORDER BY a.title ASC
		LIMIT ?
	`
	albumRows, err := r.db.Query(albumQuery, likePattern, likePattern, limit)
	albums := []models.Album{}
	if err == nil {
		defer albumRows.Close()
		for albumRows.Next() {
			var a models.Album
			var cStr string
			if err := albumRows.Scan(&a.ID, &a.Title, &a.AlbumArtist, &a.CoverHash, &a.Year, &cStr, &a.SongCount); err == nil {
				a.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", cStr)
				albums = append(albums, a)
			}
		}
	}

	artistQuery := `
		SELECT ar.id, ar.name, ar.created_at,
		       (SELECT COUNT(*) FROM songs WHERE artist_id = ar.id OR artist = ar.name) AS song_count
		FROM artists ar
		WHERE ar.name LIKE ?
		ORDER BY ar.name ASC
		LIMIT ?
	`
	artistRows, err := r.db.Query(artistQuery, likePattern, limit)
	artists := []models.Artist{}
	if err == nil {
		defer artistRows.Close()
		for artistRows.Next() {
			var ar models.Artist
			var cStr string
			if err := artistRows.Scan(&ar.ID, &ar.Name, &cStr, &ar.SongCount); err == nil {
				ar.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", cStr)
				artists = append(artists, ar)
			}
		}
	}

	playlistQuery := `
		SELECT p.id, p.name, p.description, p.created_at, p.updated_at,
		       (SELECT COUNT(*) FROM playlist_songs WHERE playlist_id = p.id) AS track_count
		FROM playlists p
		WHERE p.name LIKE ? OR p.description LIKE ?
		ORDER BY p.updated_at DESC
		LIMIT ?
	`
	playlistRows, err := r.db.Query(playlistQuery, likePattern, likePattern, limit)
	playlists := []models.Playlist{}
	if err == nil {
		defer playlistRows.Close()
		for playlistRows.Next() {
			var p models.Playlist
			var cStr, uStr string
			if err := playlistRows.Scan(&p.ID, &p.Name, &p.Description, &cStr, &uStr, &p.TrackCount); err == nil {
				p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", cStr)
				p.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", uStr)
				playlists = append(playlists, p)
			}
		}
	}

	return &models.SearchResult{
		Songs:     songs,
		Albums:    albums,
		Artists:   artists,
		Playlists: playlists,
	}, nil
}
