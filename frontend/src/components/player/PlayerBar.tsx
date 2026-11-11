import React, { useState, useRef, useEffect } from 'react';
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
  Maximize2,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import { QueueDrawer } from './QueueDrawer';
import { NowPlayingOverlay } from './NowPlayingOverlay';
import { api } from '../../services/api';

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const PlayerBar: React.FC = () => {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isExpanded = usePlayerStore((s) => s.isExpanded);

  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const toggleExpanded = usePlayerStore((s) => s.toggleExpanded);
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const isFav = currentSong?.is_favorite || false;
  const volumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = volumeRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = 0.05;
      const { volume, isMuted, setVolume } = usePlayerStore.getState();
      const currentVol = isMuted ? 0 : volume;

      if (e.deltaY < 0) {
        // Scroll UP -> Increase volume
        const newVol = Math.min(1, Math.round((currentVol + step) * 100) / 100);
        setVolume(newVol);
      } else if (e.deltaY > 0) {
        // Scroll DOWN -> Decrease volume
        const newVol = Math.max(0, Math.round((currentVol - step) * 100) / 100);
        setVolume(newVol);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const coverUrl = currentSong?.cover_hash
    ? `/api/covers/${currentSong.cover_hash}`
    : currentSong
    ? `/api/songs/${currentSong.id}/cover`
    : '';

  return (
    <>
      <footer className="fixed bottom-14 md:bottom-0 left-0 right-0 z-50 bg-[var(--card-bg)] border-t-4 border-[var(--border-color)] p-3 select-none flex flex-col gap-2 shadow-[0_-4px_0px_0px_#000]">
        {/* Seek Progress Bar */}
        <div className="flex items-center gap-2 px-2">
          <span className="text-xs font-mono font-bold text-[var(--fg)] min-w-[36px]">
            {formatTime(progress)}
          </span>
          <Slider
            value={progress}
            max={duration || 100}
            onChange={(val) => seek(val)}
            ariaLabel="Seek progress slider"
          />
          <span className="text-xs font-mono font-bold text-[var(--fg)] min-w-[36px] text-right">
            {formatTime(duration)}
          </span>
        </div>

        {/* Main Player Bar Controls */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Currently Playing Track Info (Click to expand overlay) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 md:w-1/4 md:flex-initial">
            <button
              onClick={toggleExpanded}
              aria-label="Expand Now Playing view"
              className="flex items-center gap-2 sm:gap-3 min-w-0 text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
              title="Click to expand Now Playing view"
            >
              {currentSong ? (
                <div className="relative group shrink-0">
                  <img
                    src={coverUrl}
                    alt={currentSong.title}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-[var(--border-color)] object-cover shadow-[2px_2px_0px_0px_#000] bg-[var(--muted-bg)] group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-[var(--border-color)] bg-[var(--muted-bg)] flex items-center justify-center shrink-0">
                  <span className="font-mono text-xs font-bold">VEYA</span>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-xs sm:text-sm truncate text-[var(--fg)] group-hover:text-[var(--primary)]">
                  {currentSong ? currentSong.title : 'No track selected'}
                </h4>
                <p className="text-xs font-mono text-[var(--muted)] truncate">
                  {currentSong ? `${currentSong.artist} • ${currentSong.album}` : 'Select a song to play'}
                </p>
              </div>
            </button>

            {currentSong && (
              <button
                onClick={() => toggleFavorite(currentSong.id)}
                aria-label={isFav ? 'Remove track from favorites' : 'Add track to favorites'}
                className="p-2 text-[var(--fg)] hover:scale-110 transition-transform cursor-pointer shrink-0 ml-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
                title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            )}
          </div>

          {/* Center Controls (Play, Pause, Prev, Next, Shuffle, Repeat) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={toggleShuffle}
              aria-label="Toggle shuffle"
              aria-pressed={isShuffle}
              className={`hidden sm:flex p-2 border-2 border-[var(--border-color)] transition-all cursor-pointer min-w-[36px] min-h-[36px] items-center justify-center ${
                isShuffle
                  ? 'bg-[var(--accent-cyan)] text-black shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-[var(--card-bg)] text-[var(--fg)] hover:bg-[var(--muted-bg)]'
              }`}
              title="Toggle Shuffle"
            >
              <Shuffle className="w-4 h-4 text-current" />
            </button>

            <button
              onClick={previous}
              aria-label="Previous track"
              className="neo-btn p-2 sm:p-2.5 text-black min-w-[40px] min-h-[40px]"
              title="Previous Track (Double click if > 3s)"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!currentSong}
              aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
              className="neo-btn p-2.5 sm:p-3 bg-[var(--primary)] text-black rounded-none shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] min-w-[44px] min-h-[44px]"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />}
            </button>

            <button
              onClick={next}
              aria-label="Next track"
              className="neo-btn p-2 sm:p-2.5 text-black min-w-[40px] min-h-[40px]"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            <button
              onClick={cycleRepeat}
              aria-label={`Cycle repeat mode, current: ${repeatMode}`}
              aria-pressed={repeatMode !== 'off'}
              className={`hidden sm:flex p-2 border-2 border-[var(--border-color)] transition-all cursor-pointer min-w-[36px] min-h-[36px] items-center justify-center ${
                repeatMode !== 'off'
                  ? 'bg-[var(--accent-pink)] text-black shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-[var(--card-bg)] text-[var(--fg)] hover:bg-[var(--muted-bg)]'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4 text-current" /> : <Repeat className="w-4 h-4 text-current" />}
            </button>
          </div>

          {/* Right Controls (Volume, Maximize Overlay, Queue Drawer toggle) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 md:w-1/4 justify-end">
            <div
              ref={volumeRef}
              className="hidden lg:flex items-center gap-2 w-36 py-1 px-1.5 rounded border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--muted-bg)] transition-all cursor-pointer group shrink-0"
              title="Scroll mouse wheel to adjust volume"
            >
              <button
                onClick={toggleMute}
                aria-label={isMuted || volume === 0 ? 'Unmute audio volume' : 'Mute audio volume'}
                className="cursor-pointer text-[var(--fg)] shrink-0 min-w-[28px] min-h-[28px] flex items-center justify-center"
              >
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
              <span className="font-mono text-xs font-extrabold w-8 text-right text-[var(--muted)] group-hover:text-[var(--fg)] shrink-0">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

            <Button
              variant={isExpanded ? 'pink' : 'ghost'}
              size="sm"
              onClick={toggleExpanded}
              aria-label={isExpanded ? 'Collapse Now Playing view' : 'Expand Now Playing view'}
              className="p-2 min-w-[36px] min-h-[36px]"
              title="Expand Now Playing view"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>

            <Button
              variant={isQueueOpen ? 'accent' : 'ghost'}
              size="sm"
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              aria-label={isQueueOpen ? 'Close playback queue drawer' : 'Open playback queue drawer'}
              aria-expanded={isQueueOpen}
              className="p-2 min-w-[36px] min-h-[36px]"
              title="Open Queue"
            >
              <ListMusic className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </footer>

      {/* YouTube Music style Now Playing Overlay View */}
      <NowPlayingOverlay />

      {/* Queue Drawer Panel */}
      <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
    </>
  );
};
