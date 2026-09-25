import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ListMusic, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { Playlist } from '../types';
import { SectionHeader } from '../components/library/SectionHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const PlaylistsPage: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const fetchPlaylists = async () => {
    try {
      const data = await api.getPlaylists();
      setPlaylists(data || []);
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.createPlaylist(name.trim(), description.trim());
      setName('');
      setDescription('');
      setIsModalOpen(false);
      fetchPlaylists();
    } catch (err) {
      console.error('Failed to create playlist:', err);
    }
  };

  const handleDeletePlaylist = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await api.deletePlaylist(id);
      fetchPlaylists();
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <SectionHeader
        title={`Playlists (${playlists.length})`}
        subtitle="Create and organize custom music playlists"
        action={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" /> CREATE PLAYLIST
          </Button>
        }
      />

      {playlists.length === 0 ? (
        <div className="neo-box p-8 text-center text-[var(--muted)] font-mono my-4">
          <ListMusic className="w-12 h-12 mx-auto mb-3 stroke-1 text-[var(--fg)]" />
          <p className="font-bold text-lg text-[var(--fg)] uppercase">No playlists created yet</p>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} className="mt-4">
            Create Your First Playlist
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4">
          {playlists.map((pl) => (
            <Card
              key={pl.id}
              onClick={() => navigate(`/playlists/${pl.id}`)}
              className="cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 bg-[var(--accent-cyan)] border-2 border-black flex items-center justify-center text-black shrink-0 shadow-[2px_2px_0px_0px_#000]">
                  <ListMusic className="w-6 h-6" />
                </div>
                <button
                  onClick={(e) => handleDeletePlaylist(e, pl.id)}
                  className="p-1.5 border border-black hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                  title="Delete playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h4 className="font-extrabold text-lg truncate text-[var(--fg)] group-hover:text-[var(--primary)]">
                  {pl.name}
                </h4>
                {pl.description && (
                  <p className="text-xs font-mono text-[var(--muted)] line-clamp-2 mt-1">
                    {pl.description}
                  </p>
                )}
                <div className="pt-3 mt-3 border-t-2 border-black/20 font-mono text-xs font-bold text-[var(--fg)]">
                  {pl.track_count} TRACKS
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Playlist">
        <form onSubmit={handleCreatePlaylist} className="space-y-4">
          <Input
            label="Playlist Name"
            placeholder="e.g. Synthwave Favorites"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Description (Optional)"
            placeholder="e.g. Best retro futuristic electronic beats"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
