import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        className="neo-box w-full max-w-md p-6 bg-[var(--card-bg)] shadow-[8px_8px_0px_0px_#000] relative animate-in fade-in zoom-in duration-150"
      >
        <div className="flex items-center justify-between border-b-3 border-[var(--border-color)] pb-3 mb-4">
          <h3 id="modal-title" className="font-extrabold text-lg uppercase tracking-wide">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
