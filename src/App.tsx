import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import ShowcasePage from './ShowcasePage';
import { handleAuthCallback } from './lib/supabase';

const MenuDisplay = lazy(() => import('./MenuDisplay'));
const LegalPage   = lazy(() => import('./LegalPage'));
const LoginPage   = lazy(() => import('./LoginPage'));
const AdminPage   = lazy(() => import('./AdminPage'));

const AUTH_KEY = 'pb_auth';

const LOADING_MESSAGES = [
  '🔥 Accendendo la griglia...',
  '🍔 Formando i burger...',
  '🧅 Friggendo gli onion rings...',
  '🍟 Friggendo le patatine...',
  '🥓 Croccantizzando il bacon...',
  '🧀 Sciogliendo il cheddar...',
];

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setMsgIndex((i) => {
        if (i >= LOADING_MESSAGES.length - 1) {
          clearInterval(intervalRef.current!);
          setTimeout(() => {
            setVisible(false);
            setTimeout(onDone, 400);
          }, 600);
          return i;
        }
        return i + 1;
      });
    }, 520);
    return () => clearInterval(intervalRef.current!);
  }, []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(150deg, #8B2D51 0%, #CF6990 50%, #E8A0B8 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 0.4s ease',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'all' : 'none',
      }}
    >
      <img src="/logo-public-burger.png" alt="Public Burger" style={{ height: 80, marginBottom: 40 }} />
      <div style={{
        fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)',
        letterSpacing: '0.05em', textAlign: 'center',
        minHeight: 24, transition: 'opacity 0.2s',
      }}>
        {LOADING_MESSAGES[msgIndex]}
      </div>
      <div style={{ marginTop: 28, display: 'flex', gap: 6 }}>
        {LOADING_MESSAGES.map((_, i) => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: '50%',
            background: i <= msgIndex ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;

  if (path === '/admin')   return <Suspense fallback={null}><AdminPage /></Suspense>;
  if (path === '/display') return <Suspense fallback={null}><MenuDisplay /></Suspense>;
  if (path === '/privacy') return <Suspense fallback={null}><LegalPage page="privacy" /></Suspense>;
  if (path === '/cookie')  return <Suspense fallback={null}><LegalPage page="cookie" /></Suspense>;
  if (path === '/login')   return <Suspense fallback={null}><LoginPage /></Suspense>;

  const [splash, setSplash] = useState(() => sessionStorage.getItem('pb_splash_done') !== '1');
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  function handleSplashDone() {
    sessionStorage.setItem('pb_splash_done', '1');
    setSplash(false);
  }

  useEffect(() => {
    if (window.location.hash.includes('access_token') || sessionStorage.getItem('pb_oauth_hash')) {
      handleAuthCallback().then(user => {
        if (user) {
          // Reload cleanly to avoid blank screen after OAuth redirect
          window.location.replace('/');
        } else {
          window.dispatchEvent(new Event('pb-user-changed'));
        }
      });
    }
  }, []);

  if (!authed) {
    function handleLogin(e: React.FormEvent) {
      e.preventDefault();
      if (pass === 'Public1010') {
        sessionStorage.setItem(AUTH_KEY, '1');
        setAuthed(true);
      } else {
        setError(true);
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(150deg, #8B2D51 0%, #CF6990 50%, #E8A0B8 100%)' }}>
        <div className="bg-white w-full max-w-xs mx-4 p-8 shadow-2xl rounded-3xl">
          <div className="flex flex-col items-center mb-8">
            <img src="/logo-public-burger.png" alt="Public Burger" className="h-12 mb-4" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-black/30">Sito in costruzione</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-black/40 mb-1.5">Password</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => { setPass(e.target.value); setError(false); }}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-black/15 px-4 py-3 text-sm focus:outline-none focus:border-[#CF6990] rounded-xl tracking-wide"
              />
            </div>
            {error && <p className="text-[11px] text-red-400 uppercase tracking-wider text-center">Password errata</p>}
            <button type="submit"
              className="w-full py-3 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.25em] font-semibold hover:bg-[#CF6990] transition-colors duration-300 rounded-2xl mt-2">
              Entra
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {splash && <SplashScreen onDone={handleSplashDone} />}
      <ShowcasePage />
    </>
  );
}
