import React from 'react';
import { X, Trash2, ListMusic, Music } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { Button } from '../ui/Button';

export interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose }) => {
  const { queue, queueIndex, currentSong, playQueueAt, removeFromQueue, clearQueue } = usePlayerStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[var(--card-bg)] border-l-3 border-black shadow-[-8px_0px_0px_0px_#000] flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b-3 border-black bg-[var(--primary)] text-black flex items-center justify-between">
        <div className="flex items-center gap-2 font-black text-lg uppercase">
          <ListMusic className="w-6 h-6" />
          <span>PLAYBACK QUEUE ({queue.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <Button variant="danger" size="sm" onClick={clearQueue} title="Clear queue">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close queue">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Queue Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--muted)] font-mono">
            <Music className="w-12 h-12 mb-3 stroke-1" />
            <p className="font-bold text-base">QUEUE IS EMPTY</p>
            <p className="text-xs mt-1">Add songs from your library to start playing</p>
          </div>
        ) : (
          queue.map((song, idx) => {
            const isCurrent = idx === queueIndex;
            const coverUrl = song.cover_hash
              ? `/api/covers/${song.cover_hash}`
              : `/api/songs/${song.id}/cover`;

            return (
              <div
                key={`${song.id}-${idx}`}
                className={`neo-box-sm p-2 flex items-center justify-between gap-3 transition-all ${
                  isCurrent ? 'bg-[var(--primary)] text-black font-bold' : 'hover:bg-[var(--muted-bg)] text-[var(--fg)]'
                }`}
              >
                <button
                  onClick={() => playQueueAt(idx)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                >
                  <img
                    src={coverUrl}
                    alt={song.title}
                    className="w-10 h-10 object-cover border border-black shrink-0 bg-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';
                    }}
                  />
                  <div className="truncate">
                    <p className="font-bold text-sm truncate">{song.title}</p>
                    <p className="text-xs font-mono opacity-80 truncate">{song.artist}</p>
                  </div>
                </button>

                <button
                  onClick={() => removeFromQueue(idx)}
                  className="p-1.5 hover:bg-red-500 hover:text-white border border-black transition-colors cursor-pointer"
                  title="Remove from queue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
