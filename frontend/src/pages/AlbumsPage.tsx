import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { Album } from '../types';
import { AlbumGrid } from '../components/library/AlbumGrid';
import { SectionHeader } from '../components/library/SectionHeader';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Loader2 } from 'lucide-react';

export const AlbumsPage: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchInitialAlbums = useCallback(async () => {
    try {
      setLoading(true);
      setPage(1);
      const res = await api.getAlbums(1, 40);
      setAlbums(res.data || []);
      setTotalPages(res.total_pages || 1);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch albums:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialAlbums();
  }, [fetchInitialAlbums]);

  const loadMoreAlbums = useCallback(async () => {
    if (isFetchingMore || page >= totalPages) return;
    const nextPage = page + 1;
    try {
      setIsFetchingMore(true);
      const res = await api.getAlbums(nextPage, 40);
      const newAlbums = res.data || [];
      setAlbums((prev) => [
        ...prev,
        ...newAlbums.filter((na) => !prev.some((pa) => pa.id === na.id)),
      ]);
      setPage(nextPage);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Failed to load more albums:', err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, page, totalPages]);

  const sentryRef = useInfiniteScroll(loadMoreAlbums, page < totalPages, isFetchingMore || loading);

  return (
    <div className="space-y-6 pb-16">
      <SectionHeader title={`Albums (${total})`} subtitle="Browse your music library by albums" />

      <AlbumGrid albums={albums} />

      {/* Infinite Scroll Sentinel */}
      <div ref={sentryRef} className="py-6 flex flex-col items-center justify-center font-mono">
        {isFetchingMore && (
          <div className="flex items-center gap-2 bg-[var(--primary)] text-black font-extrabold px-4 py-2 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>LOADING MORE ALBUMS...</span>
          </div>
        )}
        {!isFetchingMore && page >= totalPages && albums.length > 0 && (
          <p className="text-xs font-bold text-[var(--muted)] border-2 border-black px-4 py-1.5 bg-[var(--card-bg)] shadow-[2px_2px_0px_0px_#000]">
            END OF ALBUMS ({albums.length} / {total})
          </p>
        )}
      </div>
    </div>
  );
};
