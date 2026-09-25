import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc, Play } from 'lucide-react';
import { Album } from '../../types';
import { Card } from '../ui/Card';
import { api } from '../../services/api';
import { usePlayerStore } from '../../stores/usePlayerStore';

export interface AlbumGridProps {
  albums: Album[];
}

export const AlbumGrid: React.FC<AlbumGridProps> = ({ albums }) => {
  const navigate = useNavigate();
  const playSong = usePlayerStore((s) => s.playSong);

  const handlePlayAlbum = async (e: React.MouseEvent, albumId: number) => {
    e.stopPropagation();
    try {
      const data = await api.getAlbum(albumId);
      if (data && data.songs && data.songs.length > 0) {
        playSong(data.songs[0], data.songs);
      }
    } catch (err) {
      console.error('Failed to play album:', err);
    }
  };

  if (!albums || albums.length === 0) {
    return (
      <div className="neo-box p-8 text-center text-[var(--muted)] font-mono my-4">
        <Disc className="w-12 h-12 mx-auto mb-3 stroke-1 text-[var(--fg)]" />
        <p className="font-bold text-lg text-[var(--fg)] uppercase">No albums found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 my-4">
      {albums.map((album) => {
        const coverUrl = album.cover_hash ? `/api/covers/${album.cover_hash}` : '';

        return (
          <Card
            key={album.id}
            onClick={() => navigate(`/albums/${album.id}`)}
            className="cursor-pointer group flex flex-col justify-between"
          >
            {/* Album Cover Art with Hover Play Button Overlay */}
            <div className="relative aspect-square w-full mb-3 overflow-hidden border-2 border-black bg-gray-200 shadow-[2px_2px_0px_0px_#000] group">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--primary)] text-black">
                  <Disc className="w-12 h-12 stroke-1" />
                </div>
              )}

              {/* Hover Play Button Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                <button
                  onClick={(e) => handlePlayAlbum(e, album.id)}
                  className="neo-btn p-3 bg-[var(--primary)] text-black rounded-full border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Play Album"
                >
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </button>
              </div>
            </div>

            {/* Title & Info */}
            <div>
              <h4 className="font-extrabold text-base truncate text-[var(--fg)] group-hover:text-[var(--primary)]">
                {album.title}
              </h4>
              <p className="text-xs font-mono text-[var(--muted)] truncate mt-0.5">
                {album.album_artist}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t-2 border-black/20 text-[10px] font-mono font-bold text-[var(--fg)]">
                <span>{album.year > 0 ? album.year : ''}</span>
                <span>{album.song_count} TRACKS</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
