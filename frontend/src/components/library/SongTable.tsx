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
  const { currentSong, isPlaying, playSong, addToQueue, playNext } = usePlayerStore();
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<Song | null>(null);

  const handleToggleFavorite = async (song: Song) => {
    try {
      if (song.is_favorite) {
        await api.removeFavorite(song.id);
        song.is_favorite = false;
      } else {
        await api.addFavorite(song.id);
        song.is_favorite = true;
      }
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
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-3 border-black bg-[var(--primary)] text-black font-extrabold text-xs uppercase tracking-wider font-mono">
              <th className="p-3 w-12 text-center">#</th>
              <th className="p-3">Title</th>
              <th className="p-3">Artist</th>
              <th className="p-3 hidden md:table-cell">Album</th>
              <th className="p-3 hidden sm:table-cell w-20 text-center">Duration</th>
              <th className="p-3 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black/20 font-mono text-sm">
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
                  <td className="p-3 text-center">
                    <button
                      onClick={() => playSong(song, songs)}
                      className="w-8 h-8 mx-auto flex items-center justify-center font-bold text-xs hover:bg-[var(--primary)] hover:text-black border border-black transition-all cursor-pointer"
                    >
                      {isCurrent && isPlaying ? (
                        <span className="animate-pulse text-green-600 font-extrabold">▶</span>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </button>
                  </td>

                  {/* Title & Artwork */}
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={coverUrl}
                        alt={song.title}
                        className="w-9 h-9 object-cover border border-black shrink-0 bg-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';
                        }}
                      />
                      <div className="truncate">
                        <p className="font-extrabold truncate text-[var(--fg)]">{song.title}</p>
                        <p className="text-xs text-[var(--muted)] md:hidden truncate">{song.artist}</p>
                      </div>
                    </div>
                  </td>

                  {/* Artist */}
                  <td className="p-3 font-semibold truncate text-[var(--fg)]">{song.artist}</td>

                  {/* Album */}
                  <td className="p-3 hidden md:table-cell text-[var(--muted)] truncate">{song.album}</td>

                  {/* Duration */}
                  <td className="p-3 hidden sm:table-cell text-center font-semibold text-[var(--fg)]">
                    {formatTime(song.duration)}
                  </td>

                  {/* Action Buttons */}
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleFavorite(song)}
                        className="p-1.5 hover:bg-red-100 border border-black transition-colors cursor-pointer"
                        title={song.is_favorite ? 'Remove Favorite' : 'Favorite'}
                      >
                        <Heart className={`w-4 h-4 ${song.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      {playlists.length > 0 && (
                        <button
                          onClick={() => setSelectedSongForPlaylist(song)}
                          className="p-1.5 hover:bg-[var(--primary)] border border-black transition-colors cursor-pointer"
                          title="Add to Playlist"
                        >
                          <Plus className="w-4 h-4 text-black" />
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
            <h3 className="font-black text-lg uppercase">Add to Playlist</h3>
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
