import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';

interface EmptyStateProps {
  onAddProject: () => void;
}

export default function EmptyState({ onAddProject }: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-dark-800 border border-dark-700 p-8 text-center">
      <div className="text-xs font-mono text-gray-600 space-y-1 mb-6">
        <div># ls -la ./projects</div>
        <div className="text-gray-600">total 0</div>
        <div className="text-gray-600">drwxr-xr-x  0 root root    0 -- .</div>
        <div className="text-gray-600">drwxr-xr-x  0 root root    0 -- ..</div>
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="text-gray-600">&gt;</span>
          <span className="text-gray-500">{t('emptyState.title')}</span>
          <span className="animate-blink text-accent">_</span>
        </div>
      </div>
      <p className="text-xs text-gray-600 mb-5 max-w-md mx-auto">
        {t('emptyState.description')}
      </p>
      <Button onClick={onAddProject}>
        {t('emptyState.addFirst')}
      </Button>
    </div>
  );
}
