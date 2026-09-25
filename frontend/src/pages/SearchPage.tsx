import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { SearchResult, Playlist } from '../types';
import { SongTable } from '../components/library/SongTable';
import { AlbumGrid } from '../components/library/AlbumGrid';
import { ArtistGrid } from '../components/library/ArtistGrid';
import { SectionHeader } from '../components/library/SectionHeader';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<SearchResult>({
    songs: [],
    albums: [],
    artists: [],
    playlists: [],
  });
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const doSearch = async () => {
      if (!query.trim()) return;
      try {
        setLoading(true);
        const [searchRes, plRes] = await Promise.all([
          api.search(query.trim()),
          api.getPlaylists(),
        ]);
        setResults(searchRes);
        setPlaylists(plRes || []);
      } catch (err) {
        console.error('Failed to execute search:', err);
      } finally {
        setLoading(false);
      }
    };
    doSearch();
  }, [query]);

  return (
    <div className="space-y-8 pb-12">
      <SectionHeader
        title={`Search Results for "${query}"`}
        subtitle="Powered by SQLite FTS5 full-text indexing"
      />

      {loading ? (
        <div className="p-8 font-mono font-bold text-center">Searching library...</div>
      ) : (
        <>
          {/* Matching Songs */}
          {results.songs.length > 0 && (
            <div>
              <h3 className="font-extrabold text-lg uppercase tracking-tight text-[var(--fg)] mb-2">
                Songs ({results.songs.length})
              </h3>
              <SongTable songs={results.songs} playlists={playlists} />
            </div>
          )}

          {/* Matching Albums */}
          {results.albums.length > 0 && (
            <div>
              <h3 className="font-extrabold text-lg uppercase tracking-tight text-[var(--fg)] mb-2">
                Albums ({results.albums.length})
              </h3>
              <AlbumGrid albums={results.albums} />
            </div>
          )}

          {/* Matching Artists */}
          {results.artists.length > 0 && (
            <div>
              <h3 className="font-extrabold text-lg uppercase tracking-tight text-[var(--fg)] mb-2">
                Artists ({results.artists.length})
              </h3>
              <ArtistGrid artists={results.artists} />
            </div>
          )}

          {results.songs.length === 0 && results.albums.length === 0 && results.artists.length === 0 && (
            <div className="neo-box p-8 text-center font-mono text-[var(--muted)]">
              <p className="font-bold text-lg text-[var(--fg)]">No results found for "{query}"</p>
              <p className="text-xs mt-1">Try searching with a different title, artist, or album keyword</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
