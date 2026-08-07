import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ShowcasePage from './ShowcasePage';
import { handleAuthCallback } from './lib/supabase';
import CookieBanner, { initGSI } from './CookieBanner';

initGSI();

const MenuDisplay = lazy(() => import('./MenuDisplay'));
const LegalPage   = lazy(() => import('./LegalPage'));
const LoginPage   = lazy(() => import('./LoginPage'));
const AdminPage   = lazy(() => import('./AdminPage'));

const LOADING_MESSAGES = [
  'ACCENDENDO\nLA GRIGLIA',
  'FORMANDO\nI BURGER',
  'FRIGGENDO\nLE PATATINE',
];

const STEP_DURATION = 1100; // ms per messaggio

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in'); // in=entra, out=esce
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Ogni messaggio: entra (300ms) → pausa (STEP_DURATION) → esce (200ms) → prossimo
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'in') {
      timeout = setTimeout(() => setPhase('out'), STEP_DURATION);
    } else {
      timeout = setTimeout(() => {
        if (msgIndex >= LOADING_MESSAGES.length - 1) {
          onDone();
          setVisible(false);
        } else {
          setMsgIndex((i) => i + 1);
          setPhase('in');
        }
      }, 250);
    }
    return () => clearTimeout(timeout);
  }, [msgIndex, phase]);

  const fromLeft = msgIndex % 2 === 0;
  const lines = LOADING_MESSAGES[msgIndex].split('\n');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(150deg, #8B2D51 0%, #CF6990 50%, #E8A0B8 100%)',
      overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 0.3s ease',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'all' : 'none',
    }}>
      {/* Testo grande */}
      <AnimatePresence mode="wait">
        <motion.div
          key={msgIndex}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '0 6vw',
            pointerEvents: 'none',
          }}
          initial={{ x: fromLeft ? '-100%' : '100%', opacity: 0 }}
          animate={phase === 'in' ? { x: 0, opacity: 1 } : { x: fromLeft ? '100%' : '-100%', opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {lines.map((line, i) => (
            <div key={i} style={{
              fontSize: 'clamp(2rem, 9vw, 7rem)',
              fontWeight: 800,
              color: i === 0 ? '#1a0a10' : 'white',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              lineHeight: 0.95,
              textAlign: 'center',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              {line}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Logo fisso in basso */}
      <img
        src="/logo-public-burger.png"
        alt="Public Burger"
        style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 2, height: 48, opacity: 0.7 }}
      />
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;

  const [splash, setSplash] = useState(() => sessionStorage.getItem('pb_splash_done') !== '1');
  const [logoTransition, setLogoTransition] = useState(false);

  function handleSplashDone() {
    sessionStorage.setItem('pb_splash_done', '1');
    setSplash(false);
    setLogoTransition(true);
    setTimeout(() => setLogoTransition(false), 1000);
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

  if (path === '/admin')   return <Suspense fallback={null}><AdminPage /></Suspense>;
  if (path === '/display') return <Suspense fallback={null}><MenuDisplay /></Suspense>;
  if (path === '/privacy') return <Suspense fallback={null}><LegalPage page="privacy" /></Suspense>;
  if (path === '/cookie')  return <Suspense fallback={null}><LegalPage page="cookie" /></Suspense>;
  if (path === '/terms')   return <Suspense fallback={null}><LegalPage page="terms" /></Suspense>;
  if (path === '/login')   return <Suspense fallback={null}><LoginPage /></Suspense>;

  return (
    <>
      {splash && <SplashScreen onDone={handleSplashDone} />}
      <AnimatePresence>
        {logoTransition && (
          <motion.div
            key="logo-transition"
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
              background: 'linear-gradient(150deg, #8B2D51 0%, #CF6990 50%, #E8A0B8 100%)',
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.7, ease: 'easeIn' }}
          >
            <motion.img
              src="/logo-public-burger.png"
              alt=""
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 18, opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.6, 1] }}
              style={{ width: 280 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <ShowcasePage />
      <CookieBanner />
    </>
  );
}
