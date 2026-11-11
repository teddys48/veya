import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { api } from '../services/api';
import { Song, Playlist } from '../types';
import { SongTable } from '../components/library/SongTable';
import { SectionHeader } from '../components/library/SectionHeader';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Loader2 } from 'lucide-react';
import { useScrollStore } from '../stores/useScrollStore';

const PATH_KEY = '/songs';

export const SongsPage: React.FC = () => {
  const cached = useScrollStore.getState().pageCaches[PATH_KEY];

  const [songs, setSongs] = useState<Song[]>(cached?.data || []);
  const [playlists, setPlaylists] = useState<Playlist[]>(cached?.extra?.playlists || []);
  const [page, setPage] = useState(cached?.page || 1);
  const [totalPages, setTotalPages] = useState(cached?.totalPages || 1);
  const [total, setTotal] = useState(cached?.total || 0);
  const [sort, setSort] = useState(cached?.extra?.sort || 'title');
  const [loading, setLoading] = useState(!cached);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Sync state to cache whenever it changes
  useEffect(() => {
    if (songs.length > 0) {
      useScrollStore.getState().setPageCache(PATH_KEY, {
        data: songs,
        page,
        totalPages,
        total,
        extra: { playlists, sort },
      });
    }
  }, [songs, playlists, page, totalPages, total, sort]);

  // Restore scroll position after mount / render
  useLayoutEffect(() => {
    const savedScrollPos = useScrollStore.getState().scrollPositions[PATH_KEY];
    if (savedScrollPos !== undefined && savedScrollPos > 0) {
      const mainEl = document.getElementById('main-content-container');
      if (mainEl) {
        mainEl.scrollTop = savedScrollPos;
      }
    }
  }, []);

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
    if (!cached) {
      fetchInitialSongs();
    }
  }, [cached, fetchInitialSongs]);

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
            <label htmlFor="sort-select" className="font-bold">SORT BY:</label>
            <select
              id="sort-select"
              aria-label="Sort library songs by"
              value={sort}
              onChange={(e) => {
                const newSort = e.target.value;
                setSort(newSort);
                // Clear cache on explicit sort change
                useScrollStore.getState().clearPageCache(PATH_KEY);
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

