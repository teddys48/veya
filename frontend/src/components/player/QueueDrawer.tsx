import React, { useEffect, useRef } from 'react';
import { X, Trash2, ListMusic, Music, Play } from 'lucide-react';
import { usePlayerStore, getDisplayQueue } from '../../stores/usePlayerStore';
import { Button } from '../ui/Button';

export interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose }) => {
  const { queue, queueIndex, isShuffle, shuffleOrder, playQueueAt, removeFromQueue, clearQueue } = usePlayerStore();
  const activeItemRef = useRef<HTMLDivElement | null>(null);

  const displayQueue = getDisplayQueue(queue, isShuffle, shuffleOrder);

  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [isOpen, queueIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Playback Queue"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[var(--card-bg)] border-l-3 border-[var(--border-color)] shadow-[-8px_0px_0px_0px_#000] flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b-3 border-[var(--border-color)] bg-[var(--primary)] text-black flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-lg uppercase">
            <ListMusic className="w-6 h-6" aria-hidden="true" />
            <h2>PLAYBACK QUEUE ({queue.length})</h2>
          </div>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <Button variant="danger" size="sm" onClick={clearQueue} aria-label="Clear all songs in queue" title="Clear queue">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close queue drawer">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Queue Item List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {displayQueue.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--muted)] font-mono">
              <Music className="w-12 h-12 mb-3 stroke-1" aria-hidden="true" />
              <p className="font-bold text-base">QUEUE IS EMPTY</p>
              <p className="text-xs mt-1">Add songs from your library to start playing</p>
            </div>
          ) : (
            displayQueue.map(({ song, originalIndex }, idx) => {
              const isCurrent = originalIndex === queueIndex;
              const coverUrl = song.cover_hash
                ? `/api/covers/${song.cover_hash}`
                : `/api/songs/${song.id}/cover`;

              return (
                <div
                  key={`${song.id}-${idx}`}
                  ref={isCurrent ? activeItemRef : null}
                  className={`neo-box-sm p-2 flex items-center justify-between gap-3 transition-all ${
                    isCurrent
                      ? '!bg-[var(--primary)] !text-black font-extrabold shadow-[3px_3px_0px_0px_#000]'
                      : 'hover:bg-[var(--muted-bg)] text-[var(--fg)]'
                  }`}
                >
                  <button
                    onClick={() => playQueueAt(originalIndex)}
                    aria-label={`Play queue track ${idx + 1}: ${song.title} by ${song.artist}`}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                  >
                    <div className="w-6 text-center text-xs font-mono font-bold shrink-0">
                      {isCurrent ? <Play className="w-4 h-4 fill-black text-black mx-auto" aria-label="Currently playing" /> : idx + 1}
                    </div>
                    <img
                      src={coverUrl}
                      alt={song.title}
                      loading="lazy"
                      decoding="async"
                      className="w-10 h-10 object-cover border border-[var(--border-color)] shrink-0 bg-[var(--muted-bg)]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';
                      }}
                    />
                    <div className="truncate">
                      <p className={`font-bold text-sm truncate ${isCurrent ? '!text-black' : ''}`}>{song.title}</p>
                      <p className={`text-xs font-mono opacity-90 truncate ${isCurrent ? '!text-black' : ''}`}>{song.artist}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => removeFromQueue(originalIndex)}
                    aria-label={`Remove ${song.title} from queue`}
                    className={`p-2 border border-[var(--border-color)] transition-colors cursor-pointer shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center ${
                      isCurrent ? 'bg-black text-white hover:bg-red-600' : 'hover:bg-red-500 hover:text-white'
                    }`}
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
    </>
  );
};

