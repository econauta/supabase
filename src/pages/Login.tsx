import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface LoginProps {
  onSwitchToSignUp: () => void;
}

export default function Login({ onSwitchToSignUp }: LoginProps) {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-xs text-gray-600 font-mono">
          <div>sentinela v1.0.0 -- Database Wake Monitor</div>
          <div className="text-gray-600">────────────────────────────────────────</div>
        </div>

        <div className="bg-dark-800 border border-dark-700">
          <div className="bg-dark-700 px-4 py-2 border-b border-dark-700 flex items-center gap-2">
            <span className="text-gray-600 text-xs">[</span>
            <span className="text-xs text-light-100 uppercase tracking-wider">{t('auth.login.title')}</span>
            <span className="text-gray-600 text-xs">]</span>
          </div>

          <div className="p-5">
            <div className="text-xs text-gray-600 mb-5 space-y-0.5">
              <div className="flex items-center gap-1">
                <span className="text-accent">#</span>
                <span className="text-gray-500">auth --mode=login</span>
              </div>
              <div className="text-gray-500">{t('auth.login.subtitle')}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                type="email"
                label={t('auth.login.email')}
                placeholder={t('auth.login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                id="password"
                type="password"
                label={t('auth.login.password')}
                placeholder={t('auth.login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && (
                <div className="px-3 py-2 bg-dark-900 border border-red-500/40 text-xs text-red-400">
                  <span className="text-red-500">[ERR]</span> {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full">
                {t('auth.login.signIn')}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-dark-700 text-xs text-gray-600">
              <span className="text-accent">#</span>{' '}
              {t('auth.login.noAccount')}{' '}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="text-accent hover:underline"
              >
                {t('auth.login.signUp')}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-600 font-mono text-center">
          <span className="animate-blink">_</span>
        </div>
      </div>
    </div>
  );
}
