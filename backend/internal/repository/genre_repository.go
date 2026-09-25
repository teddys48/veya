package repository

import (
	"database/sql"
	"fmt"
)

type GenreRepository struct {
	db *sql.DB
}

func NewGenreRepository(db *sql.DB) *GenreRepository {
	return &GenreRepository{db: db}
}

func (r *GenreRepository) GetOrCreate(name string) (int64, error) {
	if name == "" {
		return 0, nil
	}

	var id int64
	err := r.db.QueryRow("SELECT id FROM genres WHERE name = ?", name).Scan(&id)
	if err == nil {
		return id, nil
	}

	res, err := r.db.Exec("INSERT INTO genres (name) VALUES (?)", name)
	if err != nil {
		err2 := r.db.QueryRow("SELECT id FROM genres WHERE name = ?", name).Scan(&id)
		if err2 == nil {
			return id, nil
		}
		return 0, fmt.Errorf("failed to create genre: %w", err)
	}

	return res.LastInsertId()
}
