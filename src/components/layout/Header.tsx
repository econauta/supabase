import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const BASE_LABEL = '[sentinela]';

const LEET_VARIANTS = ['[s3ntinela]', '[sentin3la]', '[sentinel4]'];

function applyLeetspeak(): string {
  return LEET_VARIANTS[Math.floor(Math.random() * LEET_VARIANTS.length)];
}

export default function Header() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [label, setLabel] = useState(BASE_LABEL);

  const userDisplay = user?.email?.split('@')[0] || 'user';

  useEffect(() => {
    let revertTimer: ReturnType<typeof setTimeout>;

    function scheduleNext() {
      const delay = 10000 + Math.random() * 20000;
      return setTimeout(() => {
        setLabel(applyLeetspeak());
        revertTimer = setTimeout(() => {
          setLabel(BASE_LABEL);
          scheduleNext();
        }, 1000);
      }, delay);
    }

    const trigger = scheduleNext();

    return () => {
      clearTimeout(trigger);
      clearTimeout(revertTimer);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-dark-800/90 backdrop-blur-md border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-11">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-accent font-bold">{label}</span>
            <span className="text-dark-700">|</span>
            <span className="text-gray-600 hidden sm:inline text-xs">{t('header.tagline')}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-600">
              <span className="text-accent">#</span>
              <span className="text-gray-500">operator</span>
              <span className="text-dark-700 mx-1">:</span>
              <span className="text-gray-400">{userDisplay}</span>
            </div>
            <button
              onClick={signOut}
              className="text-gray-500 hover:text-accent border border-dark-700 hover:border-accent/50 px-3 py-1 transition-colors text-xs"
            >
              [logout]
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-dark-700 bg-dark-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 flex items-center gap-1 text-xs">
          <span className="text-accent">root@sentinela</span>
          <span className="text-gray-600">:</span>
          <span className="text-gray-500">~</span>
          <span className="text-gray-600">#</span>
          <span className="text-gray-500 ml-1">{t('header.title')}</span>
          <span className="inline-block w-2 h-3.5 bg-accent/70 ml-1 animate-blink" />
        </div>
      </div>
    </header>
  );
}
