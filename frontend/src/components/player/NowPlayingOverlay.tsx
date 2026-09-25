import React, { useState } from 'react';
import { ChevronDown, Heart, ListMusic, Music, Play, X } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { formatTime } from './PlayerBar';
import { api } from '../../services/api';
import { Button } from '../ui/Button';

export const NowPlayingOverlay: React.FC = () => {
  const {
    currentSong,
    queue,
    queueIndex,
    isShuffle,
    shuffleOrder,
    isExpanded,
    toggleExpanded,
    playQueueAt,
  } = usePlayerStore();

  const [isFav, setIsFav] = useState(currentSong?.is_favorite || false);
  const [activeTab, setActiveTab] = useState<'queue' | 'lyrics'>('queue');

  if (!currentSong) return null;

  const handleToggleFavorite = async () => {
    if (!currentSong) return;
    try {
      if (isFav) {
        await api.removeFavorite(currentSong.id);
        setIsFav(false);
      } else {
        await api.addFavorite(currentSong.id);
        setIsFav(true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const coverUrl = currentSong.cover_hash
    ? `/api/covers/${currentSong.cover_hash}`
    : `/api/songs/${currentSong.id}/cover`;

  // Dynamically compute display list based on active shuffle state
  const displayQueue = isShuffle && shuffleOrder.length === queue.length
    ? shuffleOrder.map((qIdx) => ({ song: queue[qIdx], originalIndex: qIdx }))
    : queue.map((song, qIdx) => ({ song, originalIndex: qIdx }));

  return (
    <div
      className={`fixed inset-0 z-40 bg-[var(--bg)] text-[var(--fg)] flex flex-col overflow-hidden pb-36 transition-all duration-300 ease-in-out ${
        isExpanded
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      {/* Top Header Bar */}
      <div className="p-4 border-b-3 border-black bg-[var(--card-bg)] flex items-center justify-between shrink-0 shadow-[0_4px_0px_0px_#000]">
        <Button variant="ghost" size="sm" onClick={toggleExpanded} className="gap-2">
          <ChevronDown className="w-5 h-5" />
          <span className="font-extrabold uppercase">COLLAPSE PLAYER</span>
        </Button>

        <div className="text-center truncate max-w-md">
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest bg-[var(--primary)] text-black px-2 py-0.5 border border-black shadow-[2px_2px_0px_0px_#000]">
            NOW PLAYING
          </span>
          <p className="font-mono text-xs font-bold truncate text-[var(--muted)] mt-1">
            PLAYING FROM: {currentSong.album}
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={toggleExpanded} aria-label="Close Now Playing">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Split Grid Layout */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Side: Large Album Cover & Track Info */}
        <div className="md:col-span-6 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative group">
            <img
              src={coverUrl}
              alt={currentSong.title}
              className="w-64 h-64 sm:w-80 sm:h-80 lg:w-[420px] lg:h-[420px] object-cover border-4 border-black shadow-[8px_8px_0px_0px_#000] bg-gray-200 transition-transform duration-300 group-hover:scale-102"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';
              }}
            />
          </div>

          <div className="space-y-2 max-w-md w-full">
            <div className="flex items-center justify-center gap-3">
              <h2 className="font-black text-2xl sm:text-3xl uppercase tracking-tight truncate text-[var(--fg)]">
                {currentSong.title}
              </h2>
              <button
                onClick={handleToggleFavorite}
                className="p-2 border-2 border-black bg-[var(--card-bg)] shadow-[2px_2px_0px_0px_#000] hover:scale-110 transition-transform cursor-pointer shrink-0"
                title={isFav ? 'Remove Favorite' : 'Favorite'}
              >
                <Heart className={`w-6 h-6 ${isFav ? 'fill-red-500 text-red-500' : 'text-[var(--fg)]'}`} />
              </button>
            </div>
            <p className="font-mono text-base font-bold text-[var(--muted)] truncate">
              {currentSong.artist} • {currentSong.album}
            </p>
          </div>
        </div>

        {/* Right Side: Up Next Queue Panel (YouTube Music Style) */}
        <div className="md:col-span-6 neo-box h-[480px] flex flex-col bg-[var(--card-bg)] shadow-[6px_6px_0px_0px_#000]">
          {/* Queue Tabs */}
          <div className="flex border-b-3 border-black bg-[var(--muted-bg)] font-mono font-extrabold text-xs">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-r-2 border-black transition-all cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-[var(--primary)] text-black shadow-[2px_2px_0px_0px_#000]'
                  : 'text-[var(--fg)] hover:bg-[var(--card-bg)]'
              }`}
            >
              <ListMusic className="w-4 h-4" />
              <span>UP NEXT ({queue.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'lyrics'
                  ? 'bg-[var(--primary)] text-black shadow-[2px_2px_0px_0px_#000]'
                  : 'text-[var(--fg)] hover:bg-[var(--card-bg)]'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>SONG INFO</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'queue' ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono">
              {displayQueue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--muted)]">
                  <p className="font-bold">Queue is empty</p>
                </div>
              ) : (
                displayQueue.map(({ song, originalIndex }, idx) => {
                  const isCurrent = originalIndex === queueIndex;
                  const itemCoverUrl = song.cover_hash
                    ? `/api/covers/${song.cover_hash}`
                    : `/api/songs/${song.id}/cover`;

                  return (
                    <div
                      key={`${song.id}-${idx}`}
                      className={`neo-box-sm p-2 flex items-center justify-between gap-3 transition-all ${
                        isCurrent
                          ? 'bg-[var(--primary)] text-black font-extrabold shadow-[3px_3px_0px_0px_#000]'
                          : 'hover:bg-[var(--muted-bg)] text-[var(--fg)]'
                      }`}
                    >
                      <button
                        onClick={() => playQueueAt(originalIndex)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                      >
                        <div className="w-8 text-center text-xs font-bold shrink-0">
                          {isCurrent ? <Play className="w-4 h-4 fill-current mx-auto" /> : idx + 1}
                        </div>
                        <img
                          src={itemCoverUrl}
                          alt={song.title}
                          className="w-10 h-10 object-cover border border-black shrink-0 bg-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';
                          }}
                        />
                        <div className="truncate">
                          <p className="font-bold text-sm truncate">{song.title}</p>
                          <p className="text-xs opacity-80 truncate">{song.artist}</p>
                        </div>
                      </button>

                      <span className="text-xs font-semibold px-2 shrink-0">
                        {formatTime(song.duration)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 font-mono space-y-4 text-sm text-[var(--fg)]">
              <div className="neo-box-sm p-4 space-y-2 bg-[var(--muted-bg)]">
                <p><span className="font-bold">Title:</span> {currentSong.title}</p>
                <p><span className="font-bold">Artist:</span> {currentSong.artist}</p>
                <p><span className="font-bold">Album:</span> {currentSong.album}</p>
                <p><span className="font-bold">Format:</span> {currentSong.format.toUpperCase()} ({(currentSong.file_size / (1024 * 1024)).toFixed(2)} MB)</p>
                <p><span className="font-bold">Duration:</span> {formatTime(currentSong.duration)}</p>
                <p><span className="font-bold">Year:</span> {currentSong.year > 0 ? currentSong.year : '-'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
