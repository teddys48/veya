import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Input } from '../ui/Input';

export const Header: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="h-16 border-b-3 border-black bg-[var(--card-bg)] px-4 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
        <Input
          type="text"
          placeholder="Search songs, albums, artists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pr-10 text-sm py-1.5"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--fg)] hover:scale-110 transition-transform cursor-pointer"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
};
