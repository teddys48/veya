import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  ListMusic,
  Heart,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import { QueueDrawer } from './QueueDrawer';
import { api } from '../../services/api';

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const PlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  } = usePlayerStore();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isFav, setIsFav] = useState(currentSong?.is_favorite || false);

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

  const coverUrl = currentSong?.cover_hash
    ? `/api/covers/${currentSong.cover_hash}`
    : currentSong
    ? `/api/songs/${currentSong.id}/cover`
    : '';

  return (
    <>
      <footer className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-[var(--card-bg)] border-t-3 border-black p-3 select-none flex flex-col gap-2 shadow-[0_-4px_0px_0px_#000]">
        {/* Seek Progress Bar */}
        <div className="flex items-center gap-2 px-2">
          <span className="text-xs font-mono font-bold text-[var(--fg)] min-w-[36px]">
            {formatTime(progress)}
          </span>
          <Slider
            value={progress}
            max={duration || 100}
            onChange={(val) => seek(val)}
            ariaLabel="Seek slider"
          />
          <span className="text-xs font-mono font-bold text-[var(--fg)] min-w-[36px] text-right">
            {formatTime(duration)}
          </span>
        </div>

        {/* Main Player Bar Controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Currently Playing Track Info */}
          <div className="flex items-center gap-3 min-w-0 w-1/4">
            {currentSong ? (
              <div className="relative group shrink-0">
                <img
                  src={coverUrl}
                  alt={currentSong.title}
                  className="w-12 h-12 border-2 border-black object-cover shadow-[2px_2px_0px_0px_#000] bg-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 border-2 border-black bg-[var(--muted-bg)] flex items-center justify-center shrink-0">
                <span className="font-mono text-xs font-bold">VEYA</span>
              </div>
            )}

            <div className="truncate">
              <h4 className="font-extrabold text-sm truncate text-[var(--fg)]">
                {currentSong ? currentSong.title : 'No track selected'}
              </h4>
              <p className="text-xs font-mono text-[var(--muted)] truncate">
                {currentSong ? `${currentSong.artist} • ${currentSong.album}` : 'Select a song to play'}
              </p>
            </div>

            {currentSong && (
              <button
                onClick={handleToggleFavorite}
                className="p-1 text-[var(--fg)] hover:scale-110 transition-transform cursor-pointer shrink-0"
                title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            )}
          </div>

          {/* Center Controls (Play, Pause, Prev, Next, Shuffle, Repeat) */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleShuffle}
              className={`p-1.5 border-2 border-black transition-all cursor-pointer ${
                isShuffle ? 'bg-[var(--accent-cyan)] shadow-[2px_2px_0px_0px_#000]' : 'bg-[var(--card-bg)]'
              }`}
              title="Toggle Shuffle"
            >
              <Shuffle className="w-4 h-4 text-black" />
            </button>

            <button
              onClick={previous}
              className="neo-btn p-2 text-black"
              title="Previous Track (Double click if > 3s)"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!currentSong}
              className="neo-btn p-3 bg-[var(--primary)] text-black rounded-none shadow-[3px_3px_0px_0px_#000]"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>

            <button onClick={next} className="neo-btn p-2 text-black" title="Next Track">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={cycleRepeat}
              className={`p-1.5 border-2 border-black transition-all cursor-pointer ${
                repeatMode !== 'off' ? 'bg-[var(--accent-pink)] shadow-[2px_2px_0px_0px_#000]' : 'bg-[var(--card-bg)]'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4 text-black" /> : <Repeat className="w-4 h-4 text-black" />}
            </button>
          </div>

          {/* Right Controls (Volume, Queue Drawer toggle) */}
          <div className="flex items-center gap-3 w-1/4 justify-end">
            <div className="hidden sm:flex items-center gap-2 w-32">
              <button onClick={toggleMute} className="cursor-pointer text-[var(--fg)]">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <Slider
                value={isMuted ? 0 : volume}
                min={0}
                max={1}
                step={0.01}
                onChange={(val) => setVolume(val)}
                ariaLabel="Volume control"
              />
            </div>

            <Button
              variant={isQueueOpen ? 'accent' : 'ghost'}
              size="sm"
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              title="Open Queue"
            >
              <ListMusic className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </footer>

      {/* Queue Drawer Panel */}
      <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
    </>
  );
};
