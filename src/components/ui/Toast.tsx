import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const prefixes = {
    success: '[OK]',
    error: '[ERR]',
    warning: '[WARN]',
  };

  const colors = {
    success: 'text-accent border-accent/40',
    error: 'text-red-400 border-red-500/40',
    warning: 'text-yellow-400 border-yellow-500/40',
  };

  return (
    <div className={`flex items-start gap-3 px-3 py-2.5 bg-dark-800 border ${colors[toast.type]} animate-slide-in`}>
      <span className={`text-xs font-bold shrink-0 ${colors[toast.type].split(' ')[0]}`}>{prefixes[toast.type]}</span>
      <p className="text-xs text-light-200 flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-600 hover:text-light-100 transition-colors shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-1 max-w-sm w-80">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (type: ToastData['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}
