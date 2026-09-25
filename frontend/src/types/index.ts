export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  album_artist: string;
  artist_id: number;
  album_id: number;
  genre: string;
  track_number: number;
  disc_number: number;
  year: number;
  duration: number; // in seconds
  format: string;
  file_size: number;
  modified_at: number;
  cover_hash?: string;
  is_favorite: boolean;
  created_at: string;
}

export interface Album {
  id: number;
  title: string;
  album_artist: string;
  cover_hash?: string;
  year: number;
  song_count: number;
  created_at: string;
}

export interface Artist {
  id: number;
  name: string;
  song_count: number;
  created_at: string;
}

export interface Playlist {
  id: number;
  name: string;
  description: string;
  track_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlaybackHistory {
  id: number;
  song_id: number;
  played_at: string;
  song?: Song;
}

export interface ScanStatus {
  is_scanning: boolean;
  progress: number;
  total: number;
  scanned: number;
  added: number;
  updated: number;
  deleted: number;
  errors: number;
  current_file: string;
  message: string;
}

export interface SearchResult {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export type RepeatMode = 'off' | 'all' | 'one';
