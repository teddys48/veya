import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { Song, Playlist } from '../types';
import { SongTable } from '../components/library/SongTable';
import { SectionHeader } from '../components/library/SectionHeader';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Loader2 } from 'lucide-react';

export const SongsPage: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('title');
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Initial load or sort change
  const fetchInitialSongs = useCallback(async () => {
    try {
      setLoading(true);
      setPage(1);
      const [res, plRes] = await Promise.all([
        api.getSongs(1, 50, sort),
        api.getPlaylists(),
      ]);
      setSongs(res.data || []);
      setTotalPages(res.total_pages || 1);
      setTotal(res.total || 0);
      setPlaylists(plRes || []);
    } catch (err) {
      console.error('Failed to fetch songs:', err);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    fetchInitialSongs();
  }, [fetchInitialSongs]);

  // Infinite scroll load more handler
  const loadMoreSongs = useCallback(async () => {
    if (isFetchingMore || page >= totalPages) return;
    const nextPage = page + 1;
    try {
      setIsFetchingMore(true);
      const res = await api.getSongs(nextPage, 50, sort);
      const newSongs = res.data || [];
      setSongs((prev) => [
        ...prev,
        ...newSongs.filter((ns) => !prev.some((ps) => ps.id === ns.id)),
      ]);
      setPage(nextPage);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Failed to load more songs:', err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, page, totalPages, sort]);

  const sentryRef = useInfiniteScroll(loadMoreSongs, page < totalPages, isFetchingMore || loading);

  return (
    <div className="space-y-6 pb-16">
      <SectionHeader
        title={`All Songs (${total})`}
        subtitle="Manage and play your entire track library with infinite scrolling"
        action={
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="font-bold">SORT BY:</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
              }}
              className="neo-input py-1 text-xs font-bold"
            >
              <option value="title">Title (A-Z)</option>
              <option value="artist">Artist (A-Z)</option>
              <option value="album">Album</option>
              <option value="recent">Recently Added</option>
              <option value="year">Release Year</option>
            </select>
          </div>
        }
      />

      <SongTable songs={songs} playlists={playlists} onPlaylistsChange={fetchInitialSongs} />

      {/* Infinite Scroll Sentinel & Loader */}
      <div ref={sentryRef} className="py-6 flex flex-col items-center justify-center font-mono">
        {isFetchingMore && (
          <div className="flex items-center gap-2 bg-[var(--primary)] text-black font-extrabold px-4 py-2 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>LOADING MORE TRACKS...</span>
          </div>
        )}
        {!isFetchingMore && page >= totalPages && songs.length > 0 && (
          <p className="text-xs font-bold text-[var(--muted)] border-2 border-black px-4 py-1.5 bg-[var(--card-bg)] shadow-[2px_2px_0px_0px_#000]">
            END OF MUSIC LIBRARY ({songs.length} / {total} TRACKS)
          </p>
        )}
      </div>
    </div>
  );
};
