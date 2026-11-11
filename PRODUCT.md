# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are self-hosters, home-lab enthusiasts, and personal music collectors who store their lossless and lossy music collections on local storage (NAS, home server, personal PC) and want to stream their library to desktop and mobile web browsers without subscription services or third-party cloud lock-in.

## Product Purpose

Veya exists to make personal music collections instantly accessible, beautifully organized, and effortless to play over local networks or personal VPNs. Success means instant audio playback start (<100ms seeking via HTTP Range requests), lag-free full-text search across tens of thousands of tracks, dependable background library synchronization, and an interface that feels tactile, responsive, and distinct.

## Positioning

Unlike heavyweight media platforms (Plex, Jellyfin, Navidrome) that focus on multi-user permission tiers, server-side transcoding, and cloud federation, Veya is an ultra-snappy, single-container, bloat-free personal player with direct SQLite FTS5 search, non-destructive queue management, and a signature NeoBrutalism visual identity.

## Operating Context

- **Host Environment**: Deployed via Docker / Docker Compose or standalone binary, mounting a read-only music volume (`/music:ro`) and persistent data folder (`/data`).
- **Client Environment**: Modern desktop and mobile web browsers.
- **Usage Rituals**: Background listening while working, quick full-text track search via global hotkeys, album/artist browsing, and queue management with persistent history.

## Capabilities and Constraints

- **Audio Formats**: Native support for `.mp3`, `.flac`, `.m4a`, `.aac`, `.ogg`, `.opus`, and `.wav`.
- **Streaming Architecture**: Direct HTTP Range requests (`206 Partial Content`) for instant seeking without server-side transcoding.
- **Search & Indexing**: SQLite 3 (WAL mode) with FTS5 full-text indexing virtual tables and automated triggers covering titles, artists, albums, genres, and playlists.
- **Scanner**: Asynchronous background scanner (`POST /api/library/scan` -> `202 Accepted`) using file size and `mtime` change detection to skip unchanged files.
- **Audio Engine**: Standalone `AudioEngine` singleton wrapping `HTMLAudioElement` with Zustand state management.
- **Queue & Playback**: Non-destructive shuffle mapping (`shuffleOrder`), smart 3-second track restart, and smart 30-second playback history tracking.
- **Media Controls**: Full Media Session API integration and global keyboard shortcuts (`Space`, `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `N`, `P`, `M`, `S`, `R`).
- **Architecture Constraints**: Single-container Docker deployment; currently architected for single-user/personal server usage (no multi-tenant auth or user accounts).

## Brand Commitments

- **Name**: Veya / Veya Music Player.
- **Visual Identity**: High-contrast NeoBrutalism aesthetic (defined borders, solid drop shadows, high-contrast surfaces, and Space Grotesk typography) with dark and light themes.
- **Voice**: Direct, utilitarian, tactile, and developer/self-hoster friendly.

## Evidence on Hand

- UI Screenshots committed in `docs/`:
  - `docs/Screenshot_20260925_135907.png` (Home Dashboard)
  - `docs/Screenshot_20260925_135927.png` (Songs Library)
  - `docs/Screenshot_20260925_135938.png` (Albums Grid)
  - `docs/Screenshot_20260925_142220.png` (Now Playing Overlay & Up Next Queue)
- Working full-stack repository with React 18, Vite, Tailwind CSS v4, Bun, Go, and SQLite.
- Known Absences: No public marketing/landing page yet; no multi-user authentication system.

## Product Principles

- **Speed over Spectacle**: Every user action—searching, sorting, filtering, and starting audio playback—must feel instantaneous with minimal roundtrips and zero client lag.
- **Unapologetic Tactile Identity**: Embrace the high-contrast NeoBrutalism aesthetic with prominent borders, purposeful geometry, and tactile feedback rather than generic flat design.
- **Non-Destructive Playback**: Respect listening queues and audio files: never alter original files on disk, maintain sequential queue integrity during shuffle, and ensure seamless playback resumption.
- **Zero Cloud Tethering**: Autonomous, self-contained, and private by default. Operates entirely without telemetry, external auth dependencies, or mandatory cloud connectivity.

## Accessibility & Inclusion

- High-contrast visual tokens designed to maintain legibility in both light and dark modes.
- Complete keyboard accessibility with global hotkeys for all core playback controls.
- Integration with standard OS Media Session API for physical hardware and headset media buttons.
