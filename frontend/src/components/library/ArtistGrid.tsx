import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Artist } from '../../types';
import { Card } from '../ui/Card';

export interface ArtistGridProps {
  artists: Artist[];
}

export const ArtistGrid: React.FC<ArtistGridProps> = ({ artists }) => {
  const navigate = useNavigate();

  if (!artists || artists.length === 0) {
    return (
      <div className="neo-box p-8 text-center text-[var(--muted)] font-mono my-4">
        <Users className="w-12 h-12 mx-auto mb-3 stroke-1 text-[var(--fg)]" />
        <p className="font-bold text-lg text-[var(--fg)] uppercase">No artists found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 my-4">
      {artists.map((artist) => (
        <Card
          key={artist.id}
          onClick={() => navigate(`/artists/${artist.id}`)}
          className="cursor-pointer group text-center flex flex-col items-center justify-between"
        >
          <div className="w-24 h-24 rounded-full border-3 border-black bg-[var(--accent-pink)] text-black flex items-center justify-center my-3 shadow-[3px_3px_0px_0px_#000] group-hover:scale-105 transition-transform">
            <Users className="w-10 h-10" />
          </div>

          <div className="w-full">
            <h4 className="font-extrabold text-base truncate text-[var(--fg)] group-hover:text-[var(--accent-pink)]">
              {artist.name}
            </h4>
            <p className="text-xs font-mono font-bold text-[var(--muted)] mt-1">
              {artist.song_count} TRACKS
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};
