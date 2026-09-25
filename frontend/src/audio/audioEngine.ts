type AudioEventCallbacks = {
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (err: string) => void;
};

export class AudioEngine {
  private audio: HTMLAudioElement;
  private callbacks: AudioEventCallbacks = {};

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';

    this.audio.addEventListener('timeupdate', () => {
      this.callbacks.onTimeUpdate?.(this.audio.currentTime);
    });

    this.audio.addEventListener('durationchange', () => {
      if (!isNaN(this.audio.duration)) {
        this.callbacks.onDurationChange?.(this.audio.duration);
      }
    });

    this.audio.addEventListener('ended', () => {
      this.callbacks.onEnded?.();
    });

    this.audio.addEventListener('play', () => {
      this.callbacks.onPlay?.();
    });

    this.audio.addEventListener('pause', () => {
      this.callbacks.onPause?.();
    });

    this.audio.addEventListener('error', (e) => {
      const msg = this.audio.error?.message || 'Audio playback error';
      this.callbacks.onError?.(msg);
    });
  }

  public setCallbacks(callbacks: AudioEventCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public load(src: string, autoPlay = true) {
    if (this.audio.src !== src) {
      this.audio.src = src;
      this.audio.load();
    }
    if (autoPlay) {
      this.play();
    }
  }

  public async play(): Promise<void> {
    try {
      await this.audio.play();
    } catch (err) {
      console.warn('Audio play request interrupted:', err);
    }
  }

  public pause() {
    this.audio.pause();
  }

  public seek(seconds: number) {
    if (!isNaN(seconds) && isFinite(seconds)) {
      this.audio.currentTime = seconds;
    }
  }

  public setVolume(volume: number) {
    // Volume strictly bounded 0.0 - 1.0
    const clamped = Math.max(0, Math.min(1, volume));
    this.audio.volume = clamped;
  }

  public setMuted(muted: boolean) {
    this.audio.muted = muted;
  }

  public getCurrentTime(): number {
    return this.audio.currentTime;
  }

  public getDuration(): number {
    return isNaN(this.audio.duration) ? 0 : this.audio.duration;
  }

  public isPaused(): boolean {
    return this.audio.paused;
  }
}

// Export singleton audio engine
export const audioEngine = new AudioEngine();
