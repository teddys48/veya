import { create } from 'zustand';
import { Song, RepeatMode } from '../types';
import { audioEngine } from '../audio/audioEngine';

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;
  shuffleOrder: number[];
  shuffleIndex: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;
  hasLoggedHistory: boolean;
  isExpanded: boolean;

  // Actions
  playSong: (song: Song, newQueue?: Song[]) => void;
  playQueueAt: (index: number) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (from: number, to: number) => void;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
}

function generateShuffleOrder(length: number, currentIndex: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  const filtered = indices.filter((i) => i !== currentIndex);
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }
  return [currentIndex, ...filtered];
}

// Rehydrate settings from localStorage
const savedVolume = parseFloat(localStorage.getItem('veya_volume') || '0.8');
const savedMuted = localStorage.getItem('veya_muted') === 'true';
const savedShuffle = localStorage.getItem('veya_shuffle') === 'true';
const savedRepeat = (localStorage.getItem('veya_repeat') as RepeatMode) || 'off';

audioEngine.setVolume(savedMuted ? 0 : savedVolume);
audioEngine.setMuted(savedMuted);

export const usePlayerStore = create<PlayerState>((set, get) => {
  audioEngine.setCallbacks({
    onTimeUpdate: (currentTime) => {
      const state = get();
      set({ progress: currentTime });

      if (currentTime >= 30 && state.currentSong && !state.hasLoggedHistory) {
        set({ hasLoggedHistory: true });
        recordHistory(state.currentSong.id);
      }
    },
    onDurationChange: (duration) => {
      set({ duration });
    },
    onEnded: () => {
      const state = get();
      if (state.currentSong && !state.hasLoggedHistory) {
        set({ hasLoggedHistory: true });
        recordHistory(state.currentSong.id);
      }

      if (state.repeatMode === 'one') {
        audioEngine.seek(0);
        audioEngine.play();
      } else {
        get().next();
      }
    },
    onPlay: () => set({ isPlaying: true }),
    onPause: () => set({ isPlaying: false }),
    onError: (err) => console.error('AudioEngine error:', err),
  });

  return {
    currentSong: null,
    queue: [],
    queueIndex: -1,
    shuffleOrder: [],
    shuffleIndex: -1,
    isShuffle: savedShuffle,
    repeatMode: savedRepeat,
    isPlaying: false,
    volume: savedVolume,
    isMuted: savedMuted,
    progress: 0,
    duration: 0,
    hasLoggedHistory: false,
    isExpanded: false,

    playSong: (song, newQueue) => {
      const targetQueue = newQueue && newQueue.length > 0 ? newQueue : [song];
      const index = targetQueue.findIndex((s) => s.id === song.id);
      const activeIndex = index >= 0 ? index : 0;

      const shuffleOrder = generateShuffleOrder(targetQueue.length, activeIndex);

      set({
        currentSong: song,
        queue: targetQueue,
        queueIndex: activeIndex,
        shuffleOrder,
        shuffleIndex: 0,
        hasLoggedHistory: false,
        progress: 0,
      });

      const streamUrl = `/api/songs/${song.id}/stream`;
      audioEngine.load(streamUrl, true);
    },

    playQueueAt: (index) => {
      const { queue, isShuffle, shuffleOrder } = get();
      if (index < 0 || index >= queue.length) return;

      const song = queue[index];
      let sIdx = 0;
      if (isShuffle) {
        sIdx = shuffleOrder.indexOf(index);
        if (sIdx === -1) sIdx = 0;
      }

      set({
        currentSong: song,
        queueIndex: index,
        shuffleIndex: sIdx,
        hasLoggedHistory: false,
        progress: 0,
      });

      audioEngine.load(`/api/songs/${song.id}/stream`, true);
    },

    togglePlay: () => {
      const { isPlaying, currentSong } = get();
      if (!currentSong) return;
      if (isPlaying) {
        audioEngine.pause();
      } else {
        audioEngine.play();
      }
    },

    pause: () => audioEngine.pause(),
    resume: () => audioEngine.play(),

    next: () => {
      const { queue, queueIndex, isShuffle, shuffleOrder, shuffleIndex, repeatMode } = get();
      if (queue.length === 0) return;

      let nextQueueIndex = -1;
      let nextShuffleIndex = shuffleIndex;

      if (isShuffle) {
        if (shuffleIndex < shuffleOrder.length - 1) {
          nextShuffleIndex = shuffleIndex + 1;
          nextQueueIndex = shuffleOrder[nextShuffleIndex];
        } else if (repeatMode === 'all') {
          nextShuffleIndex = 0;
          nextQueueIndex = shuffleOrder[0];
        }
      } else {
        if (queueIndex < queue.length - 1) {
          nextQueueIndex = queueIndex + 1;
        } else if (repeatMode === 'all') {
          nextQueueIndex = 0;
        }
      }

      if (nextQueueIndex !== -1) {
        const nextSong = queue[nextQueueIndex];
        set({
          currentSong: nextSong,
          queueIndex: nextQueueIndex,
          shuffleIndex: nextShuffleIndex,
          hasLoggedHistory: false,
          progress: 0,
        });
        audioEngine.load(`/api/songs/${nextSong.id}/stream`, true);
      } else {
        audioEngine.pause();
        set({ isPlaying: false, progress: 0 });
      }
    },

    previous: () => {
      const { queue, queueIndex, progress, isShuffle, shuffleOrder, shuffleIndex } = get();
      if (queue.length === 0) return;

      if (progress > 3) {
        audioEngine.seek(0);
        return;
      }

      let prevQueueIndex = -1;
      let prevShuffleIndex = shuffleIndex;

      if (isShuffle) {
        if (shuffleIndex > 0) {
          prevShuffleIndex = shuffleIndex - 1;
          prevQueueIndex = shuffleOrder[prevShuffleIndex];
        } else {
          prevQueueIndex = shuffleOrder[0];
        }
      } else {
        if (queueIndex > 0) {
          prevQueueIndex = queueIndex - 1;
        } else {
          prevQueueIndex = 0;
        }
      }

      const prevSong = queue[prevQueueIndex];
      set({
        currentSong: prevSong,
        queueIndex: prevQueueIndex,
        shuffleIndex: prevShuffleIndex,
        hasLoggedHistory: false,
        progress: 0,
      });
      audioEngine.load(`/api/songs/${prevSong.id}/stream`, true);
    },

    seek: (seconds) => {
      audioEngine.seek(seconds);
      set({ progress: seconds });
    },

    setVolume: (volume) => {
      audioEngine.setVolume(volume);
      localStorage.setItem('veya_volume', String(volume));
      set({ volume, isMuted: volume === 0 });
    },

    toggleMute: () => {
      const { isMuted, volume } = get();
      const nextMuted = !isMuted;
      audioEngine.setMuted(nextMuted);
      localStorage.setItem('veya_muted', String(nextMuted));
      set({ isMuted: nextMuted });
    },

    toggleShuffle: () => {
      const { isShuffle, queue, queueIndex } = get();
      const nextShuffle = !isShuffle;
      localStorage.setItem('veya_shuffle', String(nextShuffle));

      if (nextShuffle) {
        const shuffleOrder = generateShuffleOrder(queue.length, queueIndex >= 0 ? queueIndex : 0);
        set({ isShuffle: true, shuffleOrder, shuffleIndex: 0 });
      } else {
        set({ isShuffle: false });
      }
    },

    cycleRepeat: () => {
      const { repeatMode } = get();
      const nextMode: RepeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
      localStorage.setItem('veya_repeat', nextMode);
      set({ repeatMode: nextMode });
    },

    addToQueue: (song) => {
      set((state) => {
        const newQueue = [...state.queue, song];
        const newShuffleOrder = [...state.shuffleOrder, newQueue.length - 1];
        return { queue: newQueue, shuffleOrder: newShuffleOrder };
      });
    },

    playNext: (song) => {
      set((state) => {
        const newQueue = [...state.queue];
        const insertIdx = state.queueIndex >= 0 ? state.queueIndex + 1 : 0;
        newQueue.splice(insertIdx, 0, song);
        const newShuffleOrder = generateShuffleOrder(newQueue.length, state.queueIndex >= 0 ? state.queueIndex : 0);
        return { queue: newQueue, shuffleOrder: newShuffleOrder };
      });
    },

    removeFromQueue: (index) => {
      set((state) => {
        const newQueue = state.queue.filter((_, i) => i !== index);
        let newQueueIndex = state.queueIndex;
        if (index < state.queueIndex) {
          newQueueIndex--;
        } else if (index === state.queueIndex && newQueue.length > 0) {
          newQueueIndex = Math.min(index, newQueue.length - 1);
        }
        const newShuffleOrder = generateShuffleOrder(newQueue.length, Math.max(0, newQueueIndex));
        return {
          queue: newQueue,
          queueIndex: newQueueIndex,
          shuffleOrder: newShuffleOrder,
          shuffleIndex: 0,
        };
      });
    },

    clearQueue: () => {
      audioEngine.pause();
      set({
        currentSong: null,
        queue: [],
        queueIndex: -1,
        shuffleOrder: [],
        shuffleIndex: -1,
        isPlaying: false,
        progress: 0,
      });
    },

    reorderQueue: (from, to) => {
      set((state) => {
        const newQueue = [...state.queue];
        const [moved] = newQueue.splice(from, 1);
        newQueue.splice(to, 0, moved);
        const newQueueIndex = newQueue.findIndex((s) => s.id === state.currentSong?.id);
        return {
          queue: newQueue,
          queueIndex: newQueueIndex >= 0 ? newQueueIndex : 0,
        };
      });
    },

    toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
    setExpanded: (expanded) => set({ isExpanded: expanded }),
  };
});

async function recordHistory(songID: number) {
  try {
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: songID }),
    });
  } catch (err) {
    console.error('Failed to log playback history:', err);
  }
}
