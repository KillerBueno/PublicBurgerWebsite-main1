import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, supabaseReady } from './lib/supabase';

type Provider = 'google' | 'apple' | 'facebook';

const REDIRECT_URL = window.location.origin;

const PROVIDERS: { id: Provider; label: string; icon: React.ReactNode; bg: string; text: string; border: string }[] = [
  {
    id: 'google',
    label: 'Continua con Google',
    bg: 'bg-white hover:bg-gray-50',
    text: 'text-[#1a0a10]',
    border: 'border border-black/10',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'apple',
    label: 'Continua con Apple',
    bg: 'bg-black hover:bg-neutral-900',
    text: 'text-white',
    border: 'border border-black',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Continua con Facebook',
    bg: 'bg-[#1877F2] hover:bg-[#166FE5]',
    text: 'text-white',
    border: 'border border-[#1877F2]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
];

async function signInWith(provider: Provider) {
  await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: REDIRECT_URL },
  });
}

export default function LoginPage() {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleProvider(provider: Provider) {
    if (!supabaseReady) {
      setError('Supabase non ancora configurato. Segui le istruzioni nella dashboard Vercel.');
      return;
    }
    setError(null);
    setLoading(provider);
    try {
      await signInWith(provider);
    } catch {
      setError('Errore durante l\'accesso. Riprova.');
      setLoading(null);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(150deg, #8B2D51 0%, #CF6990 50%, #E8A0B8 100%)' }}
    >
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-10 pb-8 text-center border-b border-black/5">
          <img src="/logo-public-burger.png" alt="Public Burger" className="h-14 mx-auto mb-5" />
          <h1 className="text-xl font-semibold tracking-tight text-[#1a0a10]">Accedi o Registrati</h1>
          <p className="text-[11px] text-black/35 uppercase tracking-[0.2em] mt-1.5">
            Scegli come continuare
          </p>
        </div>

        {/* Social buttons */}
        <div className="px-8 py-8 space-y-3">
          {PROVIDERS.map((p) => (
            <motion.button
              key={p.id}
              onClick={() => handleProvider(p.id)}
              disabled={loading !== null}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl ${p.bg} ${p.text} ${p.border} transition-all duration-200 disabled:opacity-50`}
            >
              <span className="shrink-0">{p.icon}</span>
              <span className="flex-1 text-center text-[13px] font-semibold tracking-wide">
                {loading === p.id ? 'Connessione…' : p.label}
              </span>
              {loading === p.id && (
                <span className="shrink-0 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
            </motion.button>
          ))}

          {error && (
            <p className="text-[11px] text-red-400 text-center uppercase tracking-wider pt-1">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 text-center">
          <p className="text-[10px] text-black/25 leading-relaxed">
            Continuando, accetti i nostri{' '}
            <a href="/privacy" className="underline hover:text-[#CF6990]">Termini di servizio</a>
            {' '}e la{' '}
            <a href="/privacy" className="underline hover:text-[#CF6990]">Privacy Policy</a>.
          </p>
        </div>
      </motion.div>

      {/* Back link */}
      <motion.a
        href="/"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-white/50 text-[11px] uppercase tracking-[0.25em] hover:text-white transition-colors"
      >
        ← Torna al menu
      </motion.a>
    </div>
  );
}
