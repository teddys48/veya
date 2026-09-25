import React, { useEffect, useState } from 'react';
import { Play, Sparkles, ListMusic } from 'lucide-react';
import { api } from '../services/api';
import { Song, Album, Playlist } from '../types';
import { SongTable } from '../components/library/SongTable';
import { AlbumGrid } from '../components/library/AlbumGrid';
import { SectionHeader } from '../components/library/SectionHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const playSong = usePlayerStore((s) => s.playSong);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [songsData, albumsData, playlistsData] = await Promise.all([
          api.getSongs(1, 10, 'recent'),
          api.getAlbums(1, 5),
          api.getPlaylists(),
        ]);
        setSongs(songsData.data || []);
        setAlbums(albumsData.data || []);
        setPlaylists(playlistsData || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handlePlayAllRecent = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner */}
      <div className="neo-box bg-[var(--primary)] text-black p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 z-10">
          <div className="inline-flex items-center gap-2 bg-black text-white font-mono text-xs font-bold px-3 py-1 uppercase tracking-widest border border-black shadow-[2px_2px_0px_0px_#fff]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>SELF-HOSTED MUSIC ENGINE</span>
          </div>
          <h1 className="font-black text-3xl sm:text-4xl uppercase tracking-tighter">
            YOUR MUSIC, YOUR RULES.
          </h1>
          <p className="font-mono text-sm font-bold opacity-90 max-w-lg">
            High performance self-hosted playback with instant range streaming and NeoBrutalism design.
          </p>
          <div className="pt-2 flex gap-3">
            <Button variant="accent" onClick={handlePlayAllRecent} disabled={songs.length === 0}>
              <Play className="w-4 h-4 fill-current" />
              <span>PLAY ALL RECENT</span>
            </Button>
          </div>
        </div>

        <div className="hidden lg:flex w-32 h-32 bg-black text-[var(--primary)] border-3 border-black items-center justify-center font-black text-4xl shadow-[4px_4px_0px_0px_#fff] shrink-0">
          VEYA
        </div>
      </div>

      {/* Playlists Quick Access */}
      {playlists.length > 0 && (
        <div>
          <SectionHeader
            title="Playlists"
            subtitle="Your custom music collections"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/playlists')}>
                View All
              </Button>
            }
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {playlists.slice(0, 4).map((pl) => (
              <Card
                key={pl.id}
                onClick={() => navigate(`/playlists/${pl.id}`)}
                className="cursor-pointer flex items-center gap-3 bg-[var(--accent-cyan)] text-black"
              >
                <div className="w-10 h-10 bg-black text-white flex items-center justify-center border border-black shrink-0">
                  <ListMusic className="w-5 h-5 text-[var(--accent-cyan)]" />
                </div>
                <div className="truncate">
                  <h4 className="font-extrabold text-sm truncate">{pl.name}</h4>
                  <p className="text-xs font-mono font-bold opacity-80">{pl.track_count} Tracks</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Featured Albums */}
      <div>
        <SectionHeader
          title="Featured Albums"
          subtitle="Explore your album library"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/albums')}>
              View All Albums
            </Button>
          }
        />
        <AlbumGrid albums={albums} />
      </div>

      {/* Recently Added Songs */}
      <div>
        <SectionHeader
          title="Recently Added Songs"
          subtitle="Latest audio files added to your collection"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/songs')}>
              View All Songs
            </Button>
          }
        />
        <SongTable songs={songs} playlists={playlists} />
      </div>
    </div>
  );
};
