import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { api } from '../services/api';
import { Artist } from '../types';
import { ArtistGrid } from '../components/library/ArtistGrid';
import { SectionHeader } from '../components/library/SectionHeader';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Loader2 } from 'lucide-react';
import { useScrollStore } from '../stores/useScrollStore';

const PATH_KEY = '/artists';

export const ArtistsPage: React.FC = () => {
  const cached = useScrollStore.getState().pageCaches[PATH_KEY];

  const [artists, setArtists] = useState<Artist[]>(cached?.data || []);
  const [page, setPage] = useState(cached?.page || 1);
  const [totalPages, setTotalPages] = useState(cached?.totalPages || 1);
  const [total, setTotal] = useState(cached?.total || 0);
  const [loading, setLoading] = useState(!cached);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Sync state to cache whenever it changes
  useEffect(() => {
    if (artists.length > 0) {
      useScrollStore.getState().setPageCache(PATH_KEY, {
        data: artists,
        page,
        totalPages,
        total,
      });
    }
  }, [artists, page, totalPages, total]);

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

  const fetchInitialArtists = useCallback(async () => {
    try {
      setLoading(true);
      setPage(1);
      const res = await api.getArtists(1, 40);
      setArtists(res.data || []);
      setTotalPages(res.total_pages || 1);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch artists:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cached) {
      fetchInitialArtists();
    }
  }, [cached, fetchInitialArtists]);

  const loadMoreArtists = useCallback(async () => {
    if (isFetchingMore || page >= totalPages) return;
    const nextPage = page + 1;
    try {
      setIsFetchingMore(true);
      const res = await api.getArtists(nextPage, 40);
      const newArtists = res.data || [];
      setArtists((prev) => [
        ...prev,
        ...newArtists.filter((na) => !prev.some((pa) => pa.id === na.id)),
      ]);
      setPage(nextPage);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Failed to load more artists:', err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, page, totalPages]);

  const sentryRef = useInfiniteScroll(loadMoreArtists, page < totalPages, isFetchingMore || loading);

  return (
    <div className="space-y-6 pb-16">
      <SectionHeader title={`Artists (${total})`} subtitle="Browse your music library by artists" />

      <ArtistGrid artists={artists} />

      {/* Infinite Scroll Sentinel */}
      <div ref={sentryRef} className="py-6 flex flex-col items-center justify-center font-mono">
        {isFetchingMore && (
          <div className="flex items-center gap-2 bg-[var(--primary)] text-black font-extrabold px-4 py-2 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>LOADING MORE ARTISTS...</span>
          </div>
        )}
        {!isFetchingMore && page >= totalPages && artists.length > 0 && (
          <p className="text-xs font-bold text-[var(--muted)] border-2 border-black px-4 py-1.5 bg-[var(--card-bg)] shadow-[2px_2px_0px_0px_#000]">
            END OF ARTISTS ({artists.length} / {total})
          </p>
        )}
      </div>
    </div>
  );
};

