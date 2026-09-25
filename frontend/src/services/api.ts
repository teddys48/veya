import { Song, Album, Artist, Playlist, SearchResult, PaginatedResponse, PlaybackHistory, ScanStatus } from '../types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(errorData?.error?.message || 'API request failed');
  }
  return res.json();
}

export const api = {
  getSongs: async (page = 1, limit = 50, sort = '', genre = ''): Promise<PaginatedResponse<Song>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (sort) params.set('sort', sort);
    if (genre) params.set('genre', genre);
    const res = await fetch(`/api/songs?${params.toString()}`);
    return handleResponse(res);
  },

  getSong: async (id: number): Promise<Song> => {
    const res = await fetch(`/api/songs/${id}`);
    return handleResponse(res);
  },

  getAlbums: async (page = 1, limit = 50, q = ''): Promise<PaginatedResponse<Album>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set('q', q);
    const res = await fetch(`/api/albums?${params.toString()}`);
    return handleResponse(res);
  },

  getAlbum: async (id: number): Promise<{ album: Album; songs: Song[] }> => {
    const res = await fetch(`/api/albums/${id}`);
    return handleResponse(res);
  },

  getArtists: async (page = 1, limit = 50, q = ''): Promise<PaginatedResponse<Artist>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set('q', q);
    const res = await fetch(`/api/artists?${params.toString()}`);
    return handleResponse(res);
  },

  getArtist: async (id: number): Promise<{ artist: Artist; songs: Song[] }> => {
    const res = await fetch(`/api/artists/${id}`);
    return handleResponse(res);
  },

  getPlaylists: async (): Promise<Playlist[]> => {
    const res = await fetch('/api/playlists');
    return handleResponse(res);
  },

  getPlaylist: async (id: number): Promise<{ playlist: Playlist; songs: Song[] }> => {
    const res = await fetch(`/api/playlists/${id}`);
    return handleResponse(res);
  },

  createPlaylist: async (name: string, description: string): Promise<Playlist> => {
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    return handleResponse(res);
  },

  updatePlaylist: async (id: number, name: string, description: string): Promise<void> => {
    const res = await fetch(`/api/playlists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    await handleResponse(res);
  },

  deletePlaylist: async (id: number): Promise<void> => {
    const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
    await handleResponse(res);
  },

  addSongToPlaylist: async (playlistId: number, songId: number): Promise<void> => {
    const res = await fetch(`/api/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: songId }),
    });
    await handleResponse(res);
  },

  removeSongFromPlaylist: async (playlistId: number, songId: number): Promise<void> => {
    const res = await fetch(`/api/playlists/${playlistId}/songs/${songId}`, { method: 'DELETE' });
    await handleResponse(res);
  },

  reorderPlaylist: async (playlistId: number, songIds: number[]): Promise<void> => {
    const res = await fetch(`/api/playlists/${playlistId}/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_ids: songIds }),
    });
    await handleResponse(res);
  },

  search: async (q: string): Promise<SearchResult> => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    return handleResponse(res);
  },

  getFavorites: async (): Promise<Song[]> => {
    const res = await fetch('/api/favorites');
    return handleResponse(res);
  },

  addFavorite: async (songId: number): Promise<void> => {
    const res = await fetch(`/api/favorites/${songId}`, { method: 'POST' });
    await handleResponse(res);
  },

  removeFavorite: async (songId: number): Promise<void> => {
    const res = await fetch(`/api/favorites/${songId}`, { method: 'DELETE' });
    await handleResponse(res);
  },

  getHistory: async (page = 1, limit = 50): Promise<PaginatedResponse<PlaybackHistory>> => {
    const res = await fetch(`/api/history?page=${page}&limit=${limit}`);
    return handleResponse(res);
  },

  triggerScan: async (): Promise<{ message: string; status: ScanStatus }> => {
    const res = await fetch('/api/library/scan', { method: 'POST' });
    return handleResponse(res);
  },

  getScanStatus: async (): Promise<ScanStatus> => {
    const res = await fetch('/api/library/scan/status');
    return handleResponse(res);
  },
};
