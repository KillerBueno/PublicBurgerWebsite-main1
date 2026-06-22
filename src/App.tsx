import { useState, useEffect } from 'react';
import ShowcasePage from './ShowcasePage';
import MenuDisplay from './MenuDisplay';
import LegalPage from './LegalPage';
import LoginPage from './LoginPage';
import { supabase, supabaseReady } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

const ADMIN_AUTH_KEY = 'pb_auth';

export default function App() {
  const path = window.location.pathname;

  // ── Static routes ──────────────────────────────────────────────────────────
  if (path === '/display') return <MenuDisplay />;
  if (path === '/privacy') return <LegalPage page="privacy" />;
  if (path === '/cookie') return <LegalPage page="cookie" />;
  if (path === '/login') return <LoginPage />;

  // ── Supabase session ───────────────────────────────────────────────────────
  const [supaUser, setSupaUser] = useState<User | null>(null);
  const [supaLoading, setSupaLoading] = useState(true);

  useEffect(() => {
    if (!supabaseReady) { setSupaLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSupaUser(data.session?.user ?? null);
      setSupaLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupaUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Legacy admin password gate (fallback) ──────────────────────────────────
  const [adminAuthed, setAdminAuthed] = useState(() => sessionStorage.getItem(ADMIN_AUTH_KEY) === '1');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  // While Supabase resolves, show nothing
  if (supaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(150deg, #8B2D51 0%, #CF6990 50%, #E8A0B8 100%)' }}>
        <img src="/logo-public-burger.png" alt="Public Burger" className="h-14 opacity-80 animate-pulse" />
      </div>
    );
  }

  // Logged in via Supabase OR via legacy admin password → show site
  if (supaUser || adminAuthed) {
    return <ShowcasePage />;
  }

  // Not authenticated → show admin password gate (legacy)
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (user === 'admin' && pass === 'Public1010') {
      sessionStorage.setItem(ADMIN_AUTH_KEY, '1');
      setAdminAuthed(true);
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
          <p className="text-[10px] tracking-[0.3em] uppercase text-black/30">Accesso riservato</p>
        </div>

        {/* Social login link */}
        <a
          href="/login"
          className="w-full flex items-center justify-center gap-2 mb-5 py-3 rounded-2xl border border-black/10 text-[12px] font-semibold text-[#1a0a10] hover:bg-[#FBE8EF]/50 hover:border-[#CF6990] transition-all duration-200"
        >
          <span>Accedi con Social</span>
          <span className="text-base">→</span>
        </a>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-black/8" />
          <span className="text-[10px] text-black/25 uppercase tracking-widest">oppure admin</span>
          <div className="flex-1 h-px bg-black/8" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-black/40 mb-1.5">Utente</label>
            <input type="text" value={user}
              onChange={(e) => { setUser(e.target.value); setError(false); }}
              autoComplete="username"
              className="w-full border border-black/15 px-4 py-3 text-sm focus:outline-none focus:border-[#CF6990] rounded-xl tracking-wide" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-black/40 mb-1.5">Password</label>
            <input type="password" value={pass}
              onChange={(e) => { setPass(e.target.value); setError(false); }}
              autoComplete="current-password"
              className="w-full border border-black/15 px-4 py-3 text-sm focus:outline-none focus:border-[#CF6990] rounded-xl tracking-wide" />
          </div>
          {error && <p className="text-[11px] text-red-400 uppercase tracking-wider text-center">Credenziali errate</p>}
          <button type="submit"
            className="w-full py-3 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.25em] font-semibold hover:bg-[#CF6990] transition-colors duration-300 rounded-2xl mt-2">
            Entra
          </button>
        </form>
      </div>
    </div>
  );
}
