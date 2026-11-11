import React, { useState } from 'react';
import { Play, Heart, Plus, Music } from 'lucide-react';
import { Song, Playlist } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { formatTime } from '../player/PlayerBar';
import { api } from '../../services/api';
import { Button } from '../ui/Button';

export interface SongTableProps {
  songs: Song[];
  playlists?: Playlist[];
  onPlaylistsChange?: () => void;
}

export const SongTable: React.FC<SongTableProps> = ({ songs, playlists = [], onPlaylistsChange }) => {
  const { currentSong, isPlaying, playSong, toggleFavorite } = usePlayerStore();
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<Song | null>(null);

  const handleToggleFavorite = async (song: Song) => {
    try {
      song.is_favorite = !song.is_favorite;
      await toggleFavorite(song.id);
      onPlaylistsChange?.();
    } catch (err) {
      console.error('Failed to update favorite:', err);
    }
  };

  const handleAddToPlaylist = async (playlistId: number, songId: number) => {
    try {
      await api.addSongToPlaylist(playlistId, songId);
      setSelectedSongForPlaylist(null);
      onPlaylistsChange?.();
    } catch (err) {
      console.error('Failed to add song to playlist:', err);
    }
  };

  if (!songs || songs.length === 0) {
    return (
      <div className="neo-box p-8 text-center text-[var(--muted)] font-mono my-4">
        <Music className="w-12 h-12 mx-auto mb-3 stroke-1 text-[var(--fg)]" />
        <p className="font-bold text-lg text-[var(--fg)] uppercase">No songs found</p>
        <p className="text-xs mt-1">Scan your music library to populate songs</p>
      </div>
    );
  }

  return (
    <div className="neo-box overflow-hidden my-4">
      <div className="w-full">
        <table className="w-full text-left border-collapse table-fixed font-mono text-sm">
          <thead>
            <tr className="border-b-3 border-[var(--border-color)] bg-[var(--primary)] text-black font-extrabold text-xs uppercase tracking-wider">
              <th scope="col" className="p-2.5 w-10 text-center">#</th>
              <th scope="col" className="p-2.5 w-[38%] sm:w-[32%] md:w-[30%]">Title</th>
              <th scope="col" className="p-2.5 w-[30%] sm:w-[24%] md:w-[22%]">Artist</th>
              <th scope="col" className="p-2.5 hidden md:table-cell md:w-[24%]">Album</th>
              <th scope="col" className="p-2.5 w-16 sm:w-20 text-center">Duration</th>
              <th scope="col" className="p-2.5 w-20 sm:w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[var(--border-color)]/20">
            {songs.map((song, index) => {
              const isCurrent = currentSong?.id === song.id;
              const coverUrl = song.cover_hash
                ? `/api/covers/${song.cover_hash}`
                : `/api/songs/${song.id}/cover`;

              return (
                <tr
                  key={song.id}
                  className={`group transition-colors ${
                    isCurrent
                      ? 'bg-[var(--accent-cyan)]/30 font-bold'
                      : 'hover:bg-[var(--muted-bg)] text-[var(--fg)]'
                  }`}
                >
                  {/* Track Index / Play Trigger */}
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => playSong(song, songs)}
                      aria-label={`Play track ${index + 1}: ${song.title} by ${song.artist}`}
                      className="w-8 h-8 mx-auto flex items-center justify-center font-bold text-xs hover:bg-[var(--primary)] hover:text-black border border-[var(--border-color)] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                    >
                      {isCurrent && isPlaying ? (
                        <span className="animate-pulse text-green-600 font-extrabold" aria-label="Playing">▶</span>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </button>
                  </td>

                  {/* Title & Artwork with Hover Play Button Overlay */}
                  <td className="p-2.5 overflow-hidden">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => playSong(song, songs)}
                        aria-label={`Play ${song.title}`}
                        className="relative w-8 h-8 border border-[var(--border-color)] shrink-0 bg-[var(--muted-bg)] overflow-hidden group/img cursor-pointer p-0 text-left focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                      >
                        <img
                          src={coverUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-4 h-4 text-[var(--primary)] fill-current" />
                        </div>
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-sm truncate text-[var(--fg)]" title={song.title}>
                          {song.title}
                        </p>
                        <p className="text-xs text-[var(--fg)] opacity-80 md:hidden truncate" title={song.artist}>
                          {song.artist}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Artist */}
                  <td className="p-2.5 font-bold truncate text-[var(--fg)]" title={song.artist}>
                    {song.artist}
                  </td>

                  {/* Album (High Contrast Color for both Light & Dark Theme!) */}
                  <td className="p-2.5 hidden md:table-cell font-medium truncate text-[var(--fg)] opacity-95" title={song.album}>
                    {song.album}
                  </td>

                  {/* Duration */}
                  <td className="p-2.5 text-center font-bold text-xs text-[var(--fg)]">
                    {formatTime(song.duration)}
                  </td>

                  {/* Action Buttons */}
                  <td className="p-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(song)}
                        aria-label={song.is_favorite ? `Remove ${song.title} from favorites` : `Add ${song.title} to favorites`}
                        className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950 border border-[var(--border-color)] transition-colors cursor-pointer"
                        title={song.is_favorite ? 'Remove Favorite' : 'Favorite'}
                      >
                        <Heart className={`w-4 h-4 ${song.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      {playlists.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedSongForPlaylist(song)}
                          aria-label={`Add ${song.title} to playlist`}
                          className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center hover:bg-[var(--primary)] border border-[var(--border-color)] transition-colors cursor-pointer text-black"
                          title="Add to Playlist"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Playlist Selection Popup */}
      {selectedSongForPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="neo-box p-6 bg-[var(--card-bg)] max-w-sm w-full space-y-4">
            <h3 className="font-black text-lg uppercase text-[var(--fg)]">Add to Playlist</h3>
            <p className="text-xs font-mono text-[var(--muted)] truncate">"{selectedSongForPlaylist.title}"</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => handleAddToPlaylist(pl.id, selectedSongForPlaylist.id)}
                  className="w-full neo-btn text-left justify-start font-mono text-sm py-2"
                >
                  + {pl.name}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedSongForPlaylist(null)} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
