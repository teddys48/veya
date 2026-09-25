import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Disc, Play, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { Album, Song, Playlist } from '../types';
import { SongTable } from '../components/library/SongTable';
import { Button } from '../components/ui/Button';
import { usePlayerStore } from '../stores/usePlayerStore';

export const AlbumDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playSong = usePlayerStore((s) => s.playSong);

  const [album, setAlbum] = useState<Album | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlbumData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [albumRes, plRes] = await Promise.all([
          api.getAlbum(Number(id)),
          api.getPlaylists(),
        ]);
        if (albumRes) {
          setAlbum(albumRes.album);
          setSongs(albumRes.songs || []);
        }
        setPlaylists(plRes || []);
      } catch (err) {
        console.error('Failed to load album detail:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAlbumData();
  }, [id]);

  const handlePlayAlbum = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  if (loading) {
    return <div className="p-8 font-mono font-bold text-center">Loading Album...</div>;
  }

  if (!album) {
    return <div className="p-8 font-mono font-bold text-center text-red-500">Album not found.</div>;
  }

  const coverUrl = album.cover_hash ? `/api/covers/${album.cover_hash}` : '';

  return (
    <div className="space-y-6 pb-12">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> BACK
      </Button>

      {/* Album Header Banner */}
      <div className="neo-box p-6 bg-[var(--card-bg)] flex flex-col sm:flex-row items-center sm:items-end gap-6">
        <div
          onClick={handlePlayAlbum}
          className="relative w-40 h-40 border-3 border-black bg-gray-200 shadow-[4px_4px_0px_0px_#000] shrink-0 overflow-hidden group cursor-pointer"
        >
          {coverUrl ? (
            <img src={coverUrl} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--primary)] text-black">
              <Disc className="w-16 h-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="neo-btn p-3 bg-[var(--primary)] text-black rounded-full border-2 border-black shadow-[3px_3px_0px_0px_#000]">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
          </div>
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          <span className="text-xs font-mono font-extrabold uppercase bg-black text-white px-2 py-0.5 inline-block">
            ALBUM
          </span>
          <h1 className="font-black text-3xl sm:text-4xl uppercase tracking-tight truncate text-[var(--fg)]">
            {album.title}
          </h1>
          <p className="font-mono text-base font-extrabold text-[var(--muted)]">{album.album_artist}</p>
          <div className="flex items-center justify-center sm:justify-start gap-4 font-mono text-xs font-bold pt-2 text-[var(--fg)]">
            <span>{album.year > 0 ? album.year : ''}</span>
            <span>•</span>
            <span>{songs.length} SONGS</span>
          </div>
          <div className="pt-3">
            <Button variant="primary" onClick={handlePlayAlbum} disabled={songs.length === 0}>
              <Play className="w-4 h-4 fill-current" /> PLAY ALBUM
            </Button>
          </div>
        </div>
      </div>

      <SongTable songs={songs} playlists={playlists} />
    </div>
  );
};
