import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ListMusic, Play, ArrowLeft, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { Playlist, Song } from '../types';
import { Button } from '../components/ui/Button';
import { usePlayerStore } from '../stores/usePlayerStore';
import { formatTime } from '../components/player/PlayerBar';

export const PlaylistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playSong = usePlayerStore((s) => s.playSong);

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlaylist = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getPlaylist(Number(id));
      if (res) {
        setPlaylist(res.playlist);
        setSongs(res.songs || []);
      }
    } catch (err) {
      console.error('Failed to load playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const handleRemoveTrack = async (songId: number) => {
    if (!playlist) return;
    try {
      await api.removeSongFromPlaylist(playlist.id, songId);
      loadPlaylist();
    } catch (err) {
      console.error('Failed to remove track from playlist:', err);
    }
  };

  const handlePlayPlaylist = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  if (loading) {
    return <div className="p-8 font-mono font-bold text-center">Loading Playlist...</div>;
  }

  if (!playlist) {
    return <div className="p-8 font-mono font-bold text-center text-red-500">Playlist not found.</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> BACK
      </Button>

      {/* Playlist Header Banner */}
      <div className="neo-box p-6 bg-[var(--accent-cyan)] text-black flex flex-col sm:flex-row items-center gap-6">
        <div className="w-32 h-32 border-3 border-black bg-black text-[var(--accent-cyan)] flex items-center justify-center shrink-0 shadow-[4px_4px_0px_0px_#fff]">
          <ListMusic className="w-16 h-16" />
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          <span className="text-xs font-mono font-extrabold uppercase bg-black text-white px-2 py-0.5 inline-block">
            PLAYLIST
          </span>
          <h1 className="font-black text-3xl sm:text-4xl uppercase tracking-tight truncate">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="font-mono text-xs font-bold opacity-80">{playlist.description}</p>
          )}
          <p className="font-mono text-xs font-bold pt-1">{songs.length} TRACKS</p>
          <div className="pt-2">
            <Button variant="primary" onClick={handlePlayPlaylist} disabled={songs.length === 0}>
              <Play className="w-4 h-4 fill-current" /> PLAY PLAYLIST
            </Button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="neo-box overflow-hidden my-4">
        {songs.length === 0 ? (
          <div className="p-8 text-center font-mono text-[var(--muted)]">
            <p className="font-bold text-base">Playlist is empty</p>
            <p className="text-xs mt-1">Add tracks from the Songs or Albums pages</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-3 border-black bg-[var(--primary)] text-black font-extrabold text-xs uppercase tracking-wider font-mono">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Artist</th>
                  <th className="p-3 hidden sm:table-cell w-20 text-center">Duration</th>
                  <th className="p-3 w-16 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/20 font-mono text-sm">
                {songs.map((song, idx) => {
                  const coverUrl = song.cover_hash
                    ? `/api/covers/${song.cover_hash}`
                    : `/api/songs/${song.id}/cover`;

                  return (
                    <tr key={`${song.id}-${idx}`} className="hover:bg-[var(--muted-bg)] text-[var(--fg)]">
                      <td className="p-3 text-center">
                        <button
                          onClick={() => playSong(song, songs)}
                          className="w-8 h-8 mx-auto flex items-center justify-center font-bold text-xs hover:bg-[var(--primary)] hover:text-black border border-black transition-all cursor-pointer"
                        >
                          {idx + 1}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={coverUrl}
                            alt={song.title}
                            className="w-8 h-8 object-cover border border-black shrink-0 bg-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';
                            }}
                          />
                          <span className="font-extrabold truncate">{song.title}</span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold truncate">{song.artist}</td>
                      <td className="p-3 hidden sm:table-cell text-center">{formatTime(song.duration)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRemoveTrack(song.id)}
                          className="p-1.5 border border-black hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                          title="Remove from playlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
