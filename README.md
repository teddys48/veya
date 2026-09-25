# Veya Music

A production-ready, self-hosted web music player featuring a distinct NeoBrutalism visual UI with Light/Dark mode, SQLite FTS5 full-text indexing, HTTP Range audio streaming, standalone Web Audio Engine, and asynchronous background library scanning.

---

## Screenshots

> Screenshots will be added here.

---

## Features

- **NeoBrutalism UI & Dark Mode**: High-contrast, bold visual design system with design tokens (`--bg`, `--fg`, `--primary`, `--border`, `--shadow`) supporting light and dark themes.
- **SQLite FTS5 Full-Text Search**: Global search across titles, artists, albums, genres, and playlists powered by SQLite FTS5 virtual tables with automatic triggers.
- **Incremental Library Scanner**: Asynchronous background scanner (`POST /api/library/scan` returning `202 Accepted`) that filters supported formats (`.mp3`, `.flac`, `.m4a`, `.aac`, `.ogg`, `.opus`, `.wav`) and skips unchanged files based on file size and `mtime`.
- **HTTP Range Audio Streaming**: Fast audio playback with instant seeking via HTTP Range requests (`206 Partial Content`).
- **Cover Artwork Caching**: Extracts embedded album cover art to `/data/covers/<hash>.jpg` served with `Cache-Control` browser caching.
- **Standalone AudioEngine & Queue**: `AudioEngine` singleton wrapping `HTMLAudioElement`, managed via Zustand store.
- **Non-Destructive Queue Shuffle**: Keeps original track sequence intact while mapping active playback order using `shuffleOrder`.
- **Smart Previous Track**: Restart current track at `0s` if progress $> 3\text{s}$, otherwise jump to previous track.
- **Smart History Tracking**: Logs playback to history at most once per playback session after $\ge 30\text{s}$ or track completion, with automatic retention limits.
- **Media Session API & Keyboard Shortcuts**: Exposes track metadata to OS/browser media controls and binds global hotkeys (`Space`, `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `N`, `P`, `M`, `S`, `R`).
- **Single-Container Docker**: Multi-stage Docker build serving both REST API and embedded SPA static assets.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Bun, Vite, Tailwind CSS v4, Zustand, TanStack Query, Lucide Icons.
- **Backend**: Go (1.24+), REST API, SQLite (`modernc.org/sqlite`), ID3 Tag Reader (`github.com/dhowden/tag`), Structured `slog` logging.
- **Database**: SQLite 3 with WAL mode and FTS5 search index.
- **Deployment**: Multi-stage Docker container with Alpine runtime & Docker healthchecks.

---

## Configuration

The application is configured via environment variables:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | Port for the HTTP server |
| `MUSIC_DIR` | `/music` | Read-only path to user music directory |
| `DB_PATH` | `/data/veya.db` | Absolute path to SQLite database file |
| `COVERS_DIR` | `/data/covers` | Path to store cached album cover images |
| `LOG_LEVEL` | `info` | Logging verbosity (`info`, `debug`, `error`) |
| `ENV` | `development` | Runtime environment (`development`, `production`) |

---

## Quickstart & Development

### Prerequisites
- [Bun](https://bun.sh/) (v1.0+)
- [Go](https://go.dev/) (v1.22+)

### Clone Repository
```bash
git clone https://github.com/username/veya.git
cd veya
```

### Run Frontend Dev Server
```bash
cd frontend
bun install
bun run dev
```
The Vite dev server runs at `http://localhost:5173` with proxy forwarding `/api/*` to Go server port `8080`.

### Run Backend Dev Server
```bash
cd backend
go run ./cmd/server
```

---

## Docker Deployment

### Run with Docker Compose
```bash
docker-compose up -d
```

### Build Docker Image Manually
```bash
docker build -t veya-music .
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/music:/music:ro \
  -v $(pwd)/data:/data \
  veya-music
```

---

## Music Directory Structure

Veya scans your music folder recursively regardless of directory depth:

```
/music
├── Artist A
│   ├── Album A
│   │   ├── 01 Song.mp3
│   │   └── 02 Song.mp3
│   └── Album B
│       └── Track.flac
└── Artist B
    └── Track.m4a
```

ID3/audio metadata tags are extracted as the primary source of track information.

---

## REST API Endpoints

- `GET /api/health` - Container healthcheck
- `GET /api/songs` - Paginated song list (`?page=1&limit=50&sort=artist`)
- `GET /api/songs/:id` - Get song details
- `GET /api/songs/:id/stream` - Stream audio file (HTTP Range Request)
- `GET /api/songs/:id/cover` - Get song album cover
- `GET /api/albums` - Paginated albums list
- `GET /api/albums/:id` - Get album details and track list
- `GET /api/artists` - Paginated artists list
- `GET /api/artists/:id` - Get artist details and tracks
- `GET /api/playlists` - List user playlists
- `POST /api/playlists` - Create playlist
- `GET /api/playlists/:id` - Get playlist track list
- `PATCH /api/playlists/:id` - Update playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `POST /api/playlists/:id/songs` - Add track to playlist
- `DELETE /api/playlists/:id/songs/:songId` - Remove track from playlist
- `GET /api/search?q=query` - Fast SQLite FTS5 global search
- `POST /api/library/scan` - Trigger asynchronous background scan (Returns `202 Accepted`)
- `GET /api/library/scan/status` - Check scanner progress status
- `GET /api/favorites` - Get favorite songs
- `POST /api/favorites/:songId` - Add song to favorites
- `DELETE /api/favorites/:songId` - Remove song from favorites
- `GET /api/history` - Get playback history

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                      Client Browser                      │
│   React SPA (Bun + Vite) | Zustand Store | AudioEngine  │
└────────────────────────────┬─────────────────────────────┘
                             │ REST API / Stream Requests
┌────────────────────────────▼─────────────────────────────┐
│                    Go Backend Server                     │
│   HTTP Handlers | Security Validator | Range Streamer   │
└──────────────┬─────────────────────────────┬─────────────┘
               │ Async Scan                  │ SQL Queries
┌──────────────▼─────────────┐ ┌─────────────▼─────────────┐
│   Music Files (/music)     │ │   SQLite DB (/data)       │
│   Read-Only Audio Volume   │ │   FTS5 Index & Covers     │
└────────────────────────────┘ └───────────────────────────┘
```

---

## License

[MIT License](LICENSE) placeholder.
