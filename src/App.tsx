import { useState } from 'react';
import ShowcasePage from './ShowcasePage';
import MenuDisplay from './MenuDisplay';

const AUTH_KEY = 'pb_auth';

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  if (window.location.pathname === '/display') return <MenuDisplay />;

  if (!authed) {
    function handleLogin(e: React.FormEvent) {
      e.preventDefault();
      if (user === 'admin' && pass === 'Public1010') {
        sessionStorage.setItem(AUTH_KEY, '1');
        setAuthed(true);
      } else {
        setError(true);
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(150deg, #8B2D51 0%, #CF6990 50%, #E8A0B8 100%)' }}>
        <div className="bg-white w-full max-w-xs mx-4 p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <img src="/logo-public-burger.png" alt="Public Burger" className="h-12 mb-4" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-black/30">Accesso riservato</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-black/40 mb-1.5">Utente</label>
              <input
                type="text"
                value={user}
                onChange={(e) => { setUser(e.target.value); setError(false); }}
                autoComplete="username"
                className="w-full border border-black/15 px-4 py-3 text-sm focus:outline-none focus:border-[#CF6990] tracking-wide"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-black/40 mb-1.5">Password</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => { setPass(e.target.value); setError(false); }}
                autoComplete="current-password"
                className="w-full border border-black/15 px-4 py-3 text-sm focus:outline-none focus:border-[#CF6990] tracking-wide"
              />
            </div>
            {error && (
              <p className="text-[11px] text-red-400 uppercase tracking-wider text-center">Credenziali errate</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.25em] font-semibold hover:bg-[#CF6990] transition-colors duration-300 mt-2"
            >
              Entra
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <ShowcasePage />;
}
