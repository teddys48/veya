import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Play, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { Artist, Song, Playlist } from '../types';
import { SongTable } from '../components/library/SongTable';
import { Button } from '../components/ui/Button';
import { usePlayerStore } from '../stores/usePlayerStore';

export const ArtistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playSong = usePlayerStore((s) => s.playSong);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtistData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [artistRes, plRes] = await Promise.all([
          api.getArtist(Number(id)),
          api.getPlaylists(),
        ]);
        if (artistRes) {
          setArtist(artistRes.artist);
          setSongs(artistRes.songs || []);
        }
        setPlaylists(plRes || []);
      } catch (err) {
        console.error('Failed to load artist detail:', err);
      } finally {
        setLoading(false);
      }
    };
    loadArtistData();
  }, [id]);

  const handlePlayArtist = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  if (loading) {
    return <div className="p-8 font-mono font-bold text-center">Loading Artist...</div>;
  }

  if (!artist) {
    return <div className="p-8 font-mono font-bold text-center text-red-500">Artist not found.</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> BACK
      </Button>

      {/* Artist Header Banner */}
      <div className="neo-box p-6 bg-[var(--accent-pink)] text-black flex flex-col sm:flex-row items-center gap-6">
        <div className="w-32 h-32 rounded-full border-3 border-black bg-black text-[var(--accent-pink)] flex items-center justify-center shrink-0 shadow-[4px_4px_0px_0px_#fff]">
          <Users className="w-16 h-16" />
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <span className="text-xs font-mono font-extrabold uppercase bg-black text-white px-2 py-0.5 inline-block">
            ARTIST
          </span>
          <h1 className="font-black text-3xl sm:text-4xl uppercase tracking-tight truncate">
            {artist.name}
          </h1>
          <p className="font-mono text-xs font-bold">{songs.length} TRACKS AVAILABLE</p>
          <div className="pt-2">
            <Button variant="primary" onClick={handlePlayArtist} disabled={songs.length === 0}>
              <Play className="w-4 h-4 fill-current" /> PLAY ALL TRACKS
            </Button>
          </div>
        </div>
      </div>

      <SongTable songs={songs} playlists={playlists} />
    </div>
  );
};
