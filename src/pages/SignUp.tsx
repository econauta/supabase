import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface SignUpProps {
  onSwitchToLogin: () => void;
}

export default function SignUp({ onSwitchToLogin }: SignUpProps) {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.signUp.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.signUp.passwordTooShort'));
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-dark-800 border border-accent/50">
            <div className="bg-dark-700 px-4 py-2 border-b border-dark-700 flex items-center gap-2">
              <span className="text-accent text-xs">[OK]</span>
              <span className="text-xs text-light-100 uppercase tracking-wider">{t('auth.signUp.successTitle')}</span>
            </div>
            <div className="p-5 text-xs text-gray-500 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-accent shrink-0">$</span>
                <span>{t('auth.signUp.successMessage')}</span>
              </div>
              <Button onClick={onSwitchToLogin} className="w-full">
                {t('auth.signUp.goToSignIn')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="text-xs text-light-100 uppercase tracking-wider">{t('auth.signUp.title')}</span>
            <span className="text-gray-600 text-xs">]</span>
          </div>

          <div className="p-5">
            <div className="text-xs text-gray-600 mb-5 space-y-0.5">
              <div className="flex items-center gap-1">
                <span className="text-accent">#</span>
                <span className="text-gray-500">auth --mode=register</span>
              </div>
              <div className="text-gray-500">{t('auth.signUp.subtitle')}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                type="email"
                label={t('auth.signUp.email')}
                placeholder={t('auth.signUp.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                id="password"
                type="password"
                label={t('auth.signUp.password')}
                placeholder={t('auth.signUp.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                id="confirmPassword"
                type="password"
                label={t('auth.signUp.confirmPassword')}
                placeholder={t('auth.signUp.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {error && (
                <div className="px-3 py-2 bg-dark-900 border border-red-500/40 text-xs text-red-400">
                  <span className="text-red-500">[ERR]</span> {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full">
                {t('auth.signUp.createAccount')}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-dark-700 text-xs text-gray-600">
              <span className="text-accent">#</span>{' '}
              {t('auth.signUp.hasAccount')}{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-accent hover:underline"
              >
                {t('auth.signUp.signIn')}
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
