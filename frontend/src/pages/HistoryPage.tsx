import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PlaybackHistory } from '../types';
import { SectionHeader } from '../components/library/SectionHeader';
import { usePlayerStore } from '../stores/usePlayerStore';
import { History, Play } from 'lucide-react';

function formatHistoryDate(dateStr: string): string {
  if (!dateStr) return '-';
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<PlaybackHistory[]>([]);
  const playSong = usePlayerStore((s) => s.playSong);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.getHistory(1, 50);
        setHistory(res.data || []);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <SectionHeader
        title="Recently Played History"
        subtitle="Deduplicated history of tracks played for 30s+"
      />

      {history.length === 0 ? (
        <div className="neo-box p-8 text-center text-[var(--muted)] font-mono my-4">
          <History className="w-12 h-12 mx-auto mb-3 stroke-1 text-[var(--fg)]" />
          <p className="font-bold text-lg text-[var(--fg)] uppercase">No playback history yet</p>
        </div>
      ) : (
        <div className="neo-box overflow-hidden my-4">
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed font-mono text-sm">
              <thead>
                <tr className="border-b-3 border-black bg-[var(--primary)] text-black font-extrabold text-xs uppercase tracking-wider">
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5 w-[40%] sm:w-[32%] md:w-[28%]">Song Title</th>
                  <th className="p-2.5 w-[30%] sm:w-[26%] md:w-[22%]">Artist</th>
                  <th className="p-2.5 hidden md:table-cell md:w-[24%]">Album</th>
                  <th className="p-2.5 w-28 sm:w-36 text-right">Played At</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/20">
                {history.map((h, idx) => {
                  if (!h.song) return null;
                  const song = h.song;
                  return (
                    <tr key={`${h.id}-${idx}`} className="hover:bg-[var(--muted-bg)] text-[var(--fg)] transition-colors">
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => playSong(song)}
                          className="w-7 h-7 mx-auto flex items-center justify-center font-bold text-xs hover:bg-[var(--primary)] hover:text-black border border-black transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </td>
                      <td className="p-2.5 font-extrabold truncate text-[var(--fg)]" title={song.title}>
                        {song.title}
                      </td>
                      <td className="p-2.5 font-bold truncate text-[var(--fg)]" title={song.artist}>
                        {song.artist}
                      </td>
                      <td className="p-2.5 hidden md:table-cell font-medium truncate text-[var(--fg)] opacity-95" title={song.album}>
                        {song.album}
                      </td>
                      <td className="p-2.5 text-right text-xs text-[var(--fg)] font-bold opacity-90 truncate">
                        {formatHistoryDate(h.played_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
