import { useState, useEffect } from 'react';

const COOKIE_KEY = 'pb_cookie_consent';

export type ConsentValue = 'accepted' | 'rejected' | null;

export function getConsent(): ConsentValue {
  return localStorage.getItem(COOKIE_KEY) as ConsentValue;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      // Piccolo delay per non sovrapporsi allo splash
      const t = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
    // Carica Google GSI ora
    loadGSI();
  }

  function reject() {
    localStorage.setItem(COOKIE_KEY, 'rejected');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9990,
        width: 'calc(100% - 32px)',
        maxWidth: 480,
        background: '#1a0a10',
        borderRadius: 16,
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
        Questo sito usa cookie tecnici per il login. Cliccando{' '}
        <strong style={{ color: 'white' }}>Accetta</strong> consenti anche i cookie di Google.{' '}
        <a href="/cookie" style={{ color: '#CF6990', textDecoration: 'underline' }}>
          Cookie policy
        </a>
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={reject}
          style={{
            flex: 1,
            padding: '10px 0',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 10,
            color: 'rgba(255,255,255,0.6)',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Rifiuta
        </button>
        <button
          onClick={accept}
          style={{
            flex: 1,
            padding: '10px 0',
            background: '#CF6990',
            border: 'none',
            borderRadius: 10,
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Accetta
        </button>
      </div>
    </div>
  );
}

function loadGSI() {
  if (document.getElementById('gsi-script')) return;
  const s = document.createElement('script');
  s.id = 'gsi-script';
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
}

// Chiamata all'avvio: se ha già accettato, carica subito GSI
export function initGSI() {
  if (getConsent() === 'accepted') {
    loadGSI();
  }
}
