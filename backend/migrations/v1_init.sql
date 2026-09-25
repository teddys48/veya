CREATE TABLE IF NOT EXISTS artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    album_artist TEXT NOT NULL DEFAULT '',
    artist_id INTEGER REFERENCES artists(id) ON DELETE SET NULL,
    cover_hash TEXT DEFAULT '',
    year INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(title, album_artist)
);

CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    artist TEXT NOT NULL DEFAULT '',
    album_artist TEXT NOT NULL DEFAULT '',
    artist_id INTEGER REFERENCES artists(id) ON DELETE SET NULL,
    album_id INTEGER REFERENCES albums(id) ON DELETE SET NULL,
    genre_id INTEGER REFERENCES genres(id) ON DELETE SET NULL,
    track_number INTEGER DEFAULT 0,
    disc_number INTEGER DEFAULT 0,
    year INTEGER DEFAULT 0,
    duration REAL DEFAULT 0,
    format TEXT NOT NULL DEFAULT '',
    file_size INTEGER DEFAULT 0,
    modified_at INTEGER DEFAULT 0,
    cover_hash TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlist_songs (
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, position)
);

CREATE TABLE IF NOT EXISTS favorites (
    song_id INTEGER PRIMARY KEY REFERENCES songs(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playback_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_songs_album_id ON songs(album_id);
CREATE INDEX IF NOT EXISTS idx_songs_modified_at ON songs(modified_at);
CREATE INDEX IF NOT EXISTS idx_albums_title ON albums(title);
CREATE INDEX IF NOT EXISTS idx_albums_artist ON albums(album_artist);
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);
CREATE INDEX IF NOT EXISTS idx_history_played_at ON playback_history(played_at);

CREATE VIRTUAL TABLE IF NOT EXISTS songs_fts USING fts5(
    song_id UNINDEXED,
    title,
    artist,
    album,
    album_artist,
    genre
);

CREATE TRIGGER IF NOT EXISTS songs_ai AFTER INSERT ON songs BEGIN
    INSERT INTO songs_fts(rowid, song_id, title, artist, album, album_artist, genre)
    VALUES (
        new.id,
        new.id,
        new.title,
        new.artist,
        COALESCE((SELECT title FROM albums WHERE id = new.album_id), ''),
        new.album_artist,
        COALESCE((SELECT name FROM genres WHERE id = new.genre_id), '')
    );
END;

CREATE TRIGGER IF NOT EXISTS songs_ad AFTER DELETE ON songs BEGIN
    DELETE FROM songs_fts WHERE rowid = old.id;
END;

CREATE TRIGGER IF NOT EXISTS songs_au AFTER UPDATE ON songs BEGIN
    DELETE FROM songs_fts WHERE rowid = old.id;
    INSERT INTO songs_fts(rowid, song_id, title, artist, album, album_artist, genre)
    VALUES (
        new.id,
        new.id,
        new.title,
        new.artist,
        COALESCE((SELECT title FROM albums WHERE id = new.album_id), ''),
        new.album_artist,
        COALESCE((SELECT name FROM genres WHERE id = new.genre_id), '')
    );
END;
