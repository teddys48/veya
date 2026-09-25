import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Song, Playlist } from '../types';
import { SongTable } from '../components/library/SongTable';
import { SectionHeader } from '../components/library/SectionHeader';

export const FavoritesPage: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const fetchFavs = async () => {
    try {
      const [favRes, plRes] = await Promise.all([
        api.getFavorites(),
        api.getPlaylists(),
      ]);
      setSongs(favRes || []);
      setPlaylists(plRes || []);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    }
  };

  useEffect(() => {
    fetchFavs();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <SectionHeader
        title={`Favorites (${songs.length})`}
        subtitle="Your bookmarked favorite tracks"
      />
      <SongTable songs={songs} playlists={playlists} onPlaylistsChange={fetchFavs} />
    </div>
  );
};
