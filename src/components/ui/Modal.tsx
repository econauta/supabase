import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-dark-900/85"
        onClick={onClose}
      />
      <div className={`relative w-full ${sizes[size]} bg-dark-800 border border-dark-700 animate-fade-in`}>
        <div className="bg-dark-700 px-4 py-2 flex items-center justify-between border-b border-dark-700">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-xs">[</span>
            <span className="text-xs text-light-100 uppercase tracking-wider">{title}</span>
            <span className="text-gray-600 text-xs">]</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-light-100 transition-colors text-xs border border-dark-700 hover:border-gray-600 px-1.5 py-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="py-6 pr-2">
          <div className="px-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
