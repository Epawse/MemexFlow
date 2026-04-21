import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/AuthProvider';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';

export function LoginPage() {
  const { t } = useTranslation();
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setSuccessMessage(t('auth.signUpSuccess'));
      } else {
        await signIn(email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await signInWithOAuth(provider);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FDFBF7] dark:bg-[#0f0f11]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/70 dark:bg-white/[0.06] backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08),0_8px_20px_rgba(0,0,0,0.04)] border border-white/50 dark:border-white/[0.1]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('app.name')}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isSignUp ? t('auth.signUp') : t('auth.login')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <div className="relative">
            <Input
              id="password"
              label={t('auth.password')}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 text-xs transition-colors cursor-pointer"
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showPassword ? t('auth.hide') : t('auth.show')}
            </button>
          </div>

          {successMessage && (
            <div className="text-sm text-green-600 dark:text-green-400">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} disabled={loading} className="w-full">
            {isSignUp ? t('auth.signUp') : t('auth.signIn')}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200/60 dark:border-white/[0.08]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white/70 dark:bg-white/[0.06] text-gray-500">
              {t('auth.orContinueWith')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300/80 dark:border-white/[0.08] rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50/60 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50 cursor-pointer bg-white/40 dark:bg-white/[0.04]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('auth.google')}
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('github')}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300/80 dark:border-white/[0.08] rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50/60 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50 cursor-pointer bg-white/40 dark:bg-white/[0.04]"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            {t('auth.github')}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMessage(null); }}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 cursor-pointer transition-colors"
          >
            {isSignUp
              ? t('auth.alreadyHaveAccount')
              : t('auth.noAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
