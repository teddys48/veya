import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { SongsPage } from './pages/SongsPage';
import { AlbumsPage } from './pages/AlbumsPage';
import { AlbumDetailPage } from './pages/AlbumDetailPage';
import { ArtistsPage } from './pages/ArtistsPage';
import { ArtistDetailPage } from './pages/ArtistDetailPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { PlaylistDetailPage } from './pages/PlaylistDetailPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { HistoryPage } from './pages/HistoryPage';
import { SearchPage } from './pages/SearchPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="songs" element={<SongsPage />} />
            <Route path="albums" element={<AlbumsPage />} />
            <Route path="albums/:id" element={<AlbumDetailPage />} />
            <Route path="artists" element={<ArtistsPage />} />
            <Route path="artists/:id" element={<ArtistDetailPage />} />
            <Route path="playlists" element={<PlaylistsPage />} />
            <Route path="playlists/:id" element={<PlaylistDetailPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="search" element={<SearchPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
