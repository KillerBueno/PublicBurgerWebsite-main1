import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence, useMotionValue, useAnimationFrame } from 'framer-motion';
import { BURGERS, FRIES, ALLERGEN_LABELS, SALSE_ALLERGENS, type BurgerDef } from './menuData';
import type { CartItem, CartFry, CartExtra } from './cartTypes';
import BurgerConfigurator from './BurgerConfigurator';
import CartPanel from './CartPanel';
import { getStoredUser, signOut, type PBUser } from './lib/supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = '', y = 24 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Ticker({ bg, text, items }: { bg: string; text: string; items: string[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(2000); // start hidden off-screen right
  const dims = useRef({ from: 2000, to: -2000 });

  // Measure once fonts + layout settle
  useEffect(() => {
    function measure() {
      const cw = wrapRef.current?.clientWidth ?? 400;
      const iw = innerRef.current?.scrollWidth ?? 1000;
      dims.current = { from: cw, to: -iw };
      x.set(cw); // jump to start position (off-screen right, invisible)
    }
    const t = setTimeout(measure, 80);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, []);

  // Drive animation manually — 90px/s, reset is instant (bar is black = invisible)
  useAnimationFrame((_, delta) => {
    const current = x.get();
    const next = current - (90 * delta) / 1000;
    if (next <= dims.current.to) {
      x.set(dims.current.from); // instant reset off-screen right
    } else {
      x.set(next);
    }
  });

  return (
    <div ref={wrapRef} className={`overflow-hidden py-3.5 rounded-2xl mx-4 my-2 ${bg}`}>
      <motion.div
        ref={innerRef}
        className="flex whitespace-nowrap will-change-transform"
        style={{ x }}
      >
        {items.map((t, i) => (
          <span key={i} className={`text-[10px] tracking-[0.3em] uppercase font-semibold shrink-0 px-5 ${text}`}>
            {t} <span className="opacity-20 mx-2">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Word-by-word stagger ────────────────────────────────────────────────────

function WordReveal({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const words = text.split(' ');
  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}


// ─── Cart FAB ─────────────────────────────────────────────────────────────────

function CartFAB({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      className="fixed bottom-6 right-6 z-40 bg-[#1a0a10] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:bg-[#CF6990] transition-colors duration-300"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 1.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute -top-1.5 -right-1.5 bg-[#CF6990] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-24 right-6 z-50 bg-[#1a0a10] text-white px-4 py-3 shadow-2xl flex items-center gap-2 max-w-[220px]"
    >
      <span className="text-[#CF6990] text-base">✓</span>
      <span className="text-[11px] uppercase tracking-[0.15em] font-medium leading-tight">{message}</span>
    </motion.div>
  );
}

// ─── Allergen tag ─────────────────────────────────────────────────────────────

function AllergenTag({ allergens }: { allergens: number[] }) {
  if (!allergens.length) return null;
  return (
    <p className="text-[9px] text-black/25 tracking-wider mt-1.5">
      Allergeni: {allergens.join(', ')}
    </p>
  );
}

// ─── Burger row ───────────────────────────────────────────────────────────────

function BurgerRow({ burger, index, onAdd }: {
  burger: BurgerDef;
  index: number;
  onAdd: (b: BurgerDef, size?: import('./menuData').BurgerSize) => void;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl shadow-sm border border-black/5 px-5 py-6 mb-3"
    >
      {/* Name row */}
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl md:text-3xl tracking-tight text-[#1a0a10] uppercase leading-none">
            {burger.name}
          </h3>
          {burger.spicy && <span className="text-sm leading-none">🌶️</span>}
          {(burger.tag === 'Chicken' || burger.tag === 'Wrap') && <span className="text-sm leading-none">🍗</span>}
          {burger.tag === 'Veggie' && <span className="text-sm leading-none">🌿</span>}
        </div>
        <div className="shrink-0 text-right">
          {burger.prices ? (
            <span className="text-sm text-[#CF6990] tracking-widest">da €{burger.prices.single}</span>
          ) : (
            <span className="text-sm text-[#CF6990] tracking-widest">€{burger.fixedPrice}</span>
          )}
        </div>
      </div>

      {/* Ingredients */}
      <p className="text-sm text-black/40 leading-relaxed max-w-lg">
        {burger.ingredients.join(', ')}
      </p>
      <AllergenTag allergens={burger.allergens} />
      <div className="mb-5" />

      {/* Size buttons or add button */}
      {burger.prices ? (
        <div className="flex flex-wrap gap-2">
          {(['single', 'double', 'triple'] as const).map((s) => (
            <button
              key={s}
              onClick={() => onAdd(burger, s)}
              className="text-[10px] tracking-[0.2em] uppercase font-semibold rounded-full border border-black/15 text-black/60 px-4 py-2 hover:border-[#CF6990] hover:text-[#CF6990] hover:bg-[#FBE8EF]/50 transition-all duration-200"
            >
              {s === 'single' ? 'Singolo' : s === 'double' ? 'Doppio' : 'Triplo'}
              <span className="ml-2 text-black/30">€{burger.prices![s]}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => onAdd(burger)}
          className="text-[10px] tracking-[0.2em] uppercase font-semibold rounded-full border border-black/15 text-black/60 px-4 py-2 hover:border-[#CF6990] hover:text-[#CF6990] hover:bg-[#FBE8EF]/50 transition-all duration-200"
        >
          Singolo
          <span className="ml-2 text-black/30">€{burger.fixedPrice}</span>
        </button>
      )}
    </motion.div>
  );
}


// ─── Extra row (salse / bibite) ───────────────────────────────────────────────

function ExtraRow({ name, price, onAdd, cart, allergens }: { name: string; price: number; onAdd: () => void; cart: CartItem[]; allergens?: number[] }) {
  const qty = (cart.filter((i) => i.type === 'extra' && (i as CartExtra).name === name) as CartExtra[])
    .reduce((s, i) => s + i.qty, 0);
  const [flash, setFlash] = useState(false);

  function handleAdd() {
    onAdd();
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3.5 bg-white rounded-xl shadow-sm border border-black/5 mb-2">
      <div className="flex items-center gap-4">
        <div>
          <span className="text-sm text-black/70 uppercase tracking-wide font-medium">{name}</span>
          {allergens && allergens.length > 0 && (
            <p className="text-[9px] text-black/25 tracking-wider mt-0.5">Allergeni: {allergens.join(', ')}</p>
          )}
        </div>
        {qty > 0 && (
          <span className="text-[10px] bg-[#CF6990] text-white px-1.5 py-0.5 rounded-full font-bold">×{qty}</span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm text-[#CF6990] tracking-widest">€{price % 1 === 0 ? price : price.toFixed(1)}</span>
        <motion.button
          onClick={handleAdd}
          animate={flash ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.4 }}
          className="w-7 h-7 rounded-full border border-black/15 text-black/40 hover:border-[#CF6990] hover:text-[#CF6990] text-base flex items-center justify-center transition-colors duration-200 leading-none"
        >
          +
        </motion.button>
      </div>
    </div>
  );
}

// ─── Fry Modal ────────────────────────────────────────────────────────────────

const SALSE_LIST = ['Ketchup', 'Maionese', 'BBQ', 'Salsa Burger', 'Salsa Smokey', 'Salsa Public', 'Senape', 'Salsa Piccante'];

function FryModal({ fry, onConfirm, onClose }: { fry: typeof FRIES[0]; onConfirm: (sauces: string[]) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  function toggle(s: string) { setSelected((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]); }
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />
      <motion.div className="relative w-full md:max-w-md bg-white flex flex-col max-h-[80vh] shadow-2xl rounded-t-3xl md:rounded-3xl overflow-hidden"
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
        <div className="px-6 pt-6 pb-4 border-b border-black/6 flex items-start justify-between shrink-0">
          <div>
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#CF6990] font-medium mb-1">Aggiungi al carrello</p>
            <h3 className="text-xl tracking-tight uppercase font-semibold">{fry.name}</h3>
            <p className="text-xs text-black/40 mt-0.5">{fry.desc}</p>
          </div>
          <button onClick={onClose} className="text-black/20 hover:text-black/60 text-2xl leading-none mt-1">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          <p className="text-[9px] tracking-[0.3em] uppercase text-black/30 mb-3">Vuoi aggiungere una salsa?</p>
          <button onClick={() => { onConfirm([]); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 mb-3 rounded-xl border border-black/8 hover:border-black/25 text-left transition-all duration-150">
            <span className="w-3.5 h-3.5 border border-black/20 rounded-full flex-shrink-0" />
            <span className="text-sm text-black/40">Nessuna salsa</span>
          </button>
          <div className="space-y-1.5">
            {SALSE_LIST.map((s) => {
              const active = selected.includes(s);
              return (
                <button key={s} onClick={() => toggle(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border transition-all duration-150 text-left ${
                    active ? 'border-[#CF6990]/30 bg-[#FBE8EF]/50' : 'border-black/8 hover:border-black/20'}`}>
                  <span className={`w-3.5 h-3.5 border rounded-full flex-shrink-0 transition-all ${
                    active ? 'border-[#CF6990] bg-[#CF6990]' : 'border-black/20'}`} />
                  <span className={`text-sm ${active ? 'text-[#1a0a10]' : 'text-black/50'}`}>{s}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-black/8 shrink-0 flex items-center justify-between gap-3">
          <div>
            <div className="text-[9px] tracking-[0.3em] uppercase text-black/25 mb-0.5">Totale</div>
            <div className="text-lg font-semibold text-[#CF6990]">€{fry.price.toFixed(1)}</div>
          </div>
          <button onClick={() => { onConfirm(selected); onClose(); }}
            className="text-[10px] tracking-[0.2em] uppercase font-bold bg-[#1a0a10] text-white px-6 py-3 hover:bg-[#CF6990] transition-colors duration-300">
            Aggiungi al carrello
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Nuggets Modal ────────────────────────────────────────────────────────────

const NUGGETS_SIZES = [
  { label: '6 pezzi', qty: 6, price: 6 },
  { label: '12 pezzi', qty: 12, price: 8.5 },
  { label: '20 pezzi', qty: 20, price: 15 },
];

function NuggetsModal({ onConfirm, onClose }: { onConfirm: (label: string, price: number, sauces: string[]) => void; onClose: () => void }) {
  const [step, setStep] = useState<'size' | 'salse'>('size');
  const [chosenSize, setChosenSize] = useState<{ label: string; price: number } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  function toggle(s: string) { setSelected((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]); }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />
      <motion.div className="relative w-full md:max-w-md bg-white flex flex-col max-h-[80vh] shadow-2xl"
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
        <div className="px-6 pt-6 pb-4 border-b border-black/8 flex items-start justify-between shrink-0">
          <div>
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#CF6990] font-medium mb-1">
              {step === 'size' ? 'Quanti nuggets?' : 'Aggiungi una salsa'}
            </p>
            <h3 className="text-xl tracking-tight uppercase font-semibold">Nuggets</h3>
            {step === 'salse' && chosenSize && (
              <p className="text-xs text-black/40 mt-0.5">{chosenSize.label} — €{chosenSize.price}</p>
            )}
          </div>
          <button onClick={onClose} className="text-black/20 hover:text-black/60 text-2xl leading-none mt-1">×</button>
        </div>

        {step === 'size' ? (
          <div className="px-6 py-5 space-y-2">
            {NUGGETS_SIZES.map(({ label, qty, price }) => (
              <button key={qty}
                onClick={() => { setChosenSize({ label, price }); setStep('salse'); }}
                className="w-full flex items-center justify-between px-5 py-4 border border-black/8 hover:border-[#CF6990] hover:bg-[#FBE8EF]/40 transition-all duration-200 group">
                <span className="text-sm uppercase tracking-widest font-semibold text-black/70 group-hover:text-[#1a0a10]">{label}</span>
                <span className="text-lg text-[#CF6990] font-semibold">€{price}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              <p className="text-[9px] tracking-[0.3em] uppercase text-black/30 mb-3">Vuoi aggiungere una salsa?</p>
              <button onClick={() => { onConfirm(`Nuggets ${chosenSize!.label}`, chosenSize!.price, []); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 mb-3 rounded-xl border border-black/8 hover:border-black/25 text-left transition-all duration-150">
                <span className="w-3.5 h-3.5 border border-black/20 rounded-full flex-shrink-0" />
                <span className="text-sm text-black/40">Nessuna salsa</span>
              </button>
              <div className="space-y-1.5">
                {SALSE_LIST.map((s) => {
                  const active = selected.includes(s);
                  return (
                    <button key={s} onClick={() => toggle(s)}
                      className={`w-full flex items-center gap-3 px-4 py-3 border transition-all duration-150 text-left ${active ? 'border-[#CF6990]/30 bg-[#FBE8EF]/50' : 'border-black/8 hover:border-black/20'}`}>
                      <span className={`w-3.5 h-3.5 border rounded-full flex-shrink-0 ${active ? 'border-[#CF6990] bg-[#CF6990]' : 'border-black/20'}`} />
                      <span className={`text-sm ${active ? 'text-[#1a0a10]' : 'text-black/50'}`}>{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-black/8 shrink-0 flex items-center justify-between gap-3">
              <button onClick={() => setStep('size')} className="text-black/30 hover:text-black/60 text-lg">←</button>
              <div className="text-center">
                <div className="text-[9px] tracking-[0.3em] uppercase text-black/25 mb-0.5">Totale</div>
                <div className="text-lg font-semibold text-[#CF6990]">€{chosenSize!.price}</div>
              </div>
              <button onClick={() => { onConfirm(`Nuggets ${chosenSize!.label}`, chosenSize!.price, selected); onClose(); }}
                className="text-[10px] tracking-[0.2em] uppercase font-bold bg-[#1a0a10] text-white px-5 py-2.5 hover:bg-[#CF6990] transition-colors duration-300">
                Aggiungi
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── Sub nav ─────────────────────────────────────────────────────────────────

const SUB_ITEMS = [
  { id: 'panini', label: 'Panini' },
  { id: 'fries', label: 'Fries' },
  { id: 'salse', label: 'Salse' },
  { id: 'bibite', label: 'Bibite' },
] as const;

function SubNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState('panini');
  const [user, setUser] = useState<PBUser | null>(() => getStoredUser());
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setUser(getStoredUser());
    window.addEventListener('pb-user-changed', refresh);
    return () => window.removeEventListener('pb-user-changed', refresh);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    document.addEventListener('click', close, { capture: true, once: true });
    return () => document.removeEventListener('click', close, { capture: true });
  }, [userMenuOpen]);

  useEffect(() => {
    function onScroll() {
      const v = window.scrollY;
      setVisible(v > window.innerHeight * 0.65);
      const mid = v + window.innerHeight * 0.4;
      const sections = ['bibite', 'salse', 'fries', 'panini'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && mid >= el.offsetTop) { setActive(id); break; }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleClick(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-black/6 flex items-center"
        >
          {/* Logo dentro la barra */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="shrink-0 pl-4 pr-2 py-2"
          >
            <img src="/logo-public-burger.png" alt="Public" className="h-8" />
          </button>

          {/* Voci centrate nel resto dello spazio */}
          <div className="flex-1 flex items-center justify-center">
          {SUB_ITEMS.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => handleClick(id)}
                className={`relative px-5 md:px-8 py-4 text-xs md:text-sm tracking-[0.15em] uppercase font-bold transition-colors duration-200 ${
                  isActive ? 'text-[#CF6990]' : 'text-black/40 hover:text-black/70'
                }`}
              >
                {label}
                {isActive && (
                  <motion.div
                    layoutId="subnav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#CF6990]"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </button>
            );
          })}
          </div>
          {/* Login / user button */}
          {user ? (
            <div className="shrink-0 pr-4 pl-2 relative">
              <button onClick={e => { e.stopPropagation(); setUserMenuOpen(o => !o); }} className="flex flex-col items-center gap-0.5">
                {user.avatar_url
                  ? <img src={user.avatar_url} className="w-9 h-9 rounded-full object-cover border-2 border-[#CF6990]/30" />
                  : <span className="w-9 h-9 rounded-full bg-[#CF6990] text-white text-sm font-bold flex items-center justify-center">{user.name?.[0]?.toUpperCase()}</span>
                }
                <span className="text-[9px] text-black/40 tracking-wide leading-none">Ciao {user.name?.split(' ')[0]}</span>
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-black/8 overflow-hidden z-50"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="px-4 py-3 border-b border-black/6">
                      <p className="text-[11px] font-semibold text-[#1a0a10] truncate">{user.name}</p>
                      <p className="text-[10px] text-black/35 truncate">{user.email}</p>
                    </div>
                    {user.email === 'prrsmn91@gmail.com' && (
                      <a href="/admin" className="flex items-center gap-2 px-4 py-3 text-[11px] font-semibold text-[#CF6990] hover:bg-[#fdf5f8] transition-colors border-b border-black/6">
                        <span>⚙️</span> Dashboard Admin
                      </a>
                    )}
                    <button
                      onClick={() => { signOut(); setUser(null); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-[11px] font-semibold text-black/50 hover:bg-red-50 hover:text-red-500 transition-colors text-left"
                    >
                      <span>→</span> Esci
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <a
              href="/login"
              className="shrink-0 pr-4 pl-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-black/40 hover:text-[#CF6990] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Accedi
            </a>
          )}
        </motion.div>
      )}
    </AnimatePresence>

    {/* Bottone login fisso visibile prima che appaia la SubNav */}
    <AnimatePresence>
      {!visible && (
        user ? (
          <motion.div
            key="avatar-fixed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 right-4 z-30"
          >
            <button
              onClick={e => { e.stopPropagation(); setUserMenuOpen(o => !o); }}
              className="flex flex-col items-center gap-1"
            >
              {user.avatar_url
                ? <img src={user.avatar_url} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg" />
                : <span className="w-12 h-12 rounded-full bg-[#CF6990] text-white text-base font-bold flex items-center justify-center shadow-lg">{user.name?.[0]?.toUpperCase()}</span>
              }
              <span className="text-[10px] text-white/80 tracking-wide font-medium drop-shadow">Ciao {user.name?.split(' ')[0]}</span>
            </button>
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-black/8 overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="px-4 py-3 border-b border-black/6">
                    <p className="text-[11px] font-semibold text-[#1a0a10] truncate">{user.name}</p>
                    <p className="text-[10px] text-black/35 truncate">{user.email}</p>
                  </div>
                  {user.email === 'prrsmn91@gmail.com' && (
                    <a href="/admin" className="flex items-center gap-2 px-4 py-3 text-[11px] font-semibold text-[#CF6990] hover:bg-[#fdf5f8] transition-colors border-b border-black/6">
                      <span>⚙️</span> Dashboard Admin
                    </a>
                  )}
                  <button
                    onClick={() => { signOut(); setUser(null); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-[11px] font-semibold text-black/50 hover:bg-red-50 hover:text-red-500 transition-colors text-left"
                  >
                    <span>→</span> Esci
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.a
            key="login-fixed"
            href="/login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 backdrop-blur-md border border-black/8 text-[10px] uppercase tracking-[0.2em] font-semibold text-black/50 hover:text-[#CF6990] hover:border-[#CF6990]/30 transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Accedi
          </motion.a>
        )
      )}
    </AnimatePresence>
    </>
  );
}

// ─── Opening hours ────────────────────────────────────────────────────────────

function isOpen(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0=dom, 1=lun, ..., 6=sab
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;
  const open = 18 * 60 + 30; // 18:30

  // ven(5) e sab(6): chiude alle 02:00 del giorno dopo → chiude a 26*60
  if (day === 5 || day === 6) {
    return mins >= open || mins < 2 * 60;
  }
  // lun-gio(1-4) e dom(0): chiude a mezzanotte → 24*60 (mins non arriva mai a 24*60, usiamo 0-59 del mattino)
  return mins >= open || mins < 60; // aperto fino alle 00:59
}

function OpeningHours() {
  const open = isOpen();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.6 }}
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${open ? 'bg-green-400' : 'bg-red-400'}`}
          style={{ boxShadow: open ? '0 0 6px #4ade80' : '0 0 6px #f87171' }}
        />
        <span className="text-white/90 text-[11px] uppercase tracking-[0.25em] font-semibold">
          {open ? 'Aperto ora' : 'Chiuso'}
        </span>
      </div>
      <p className="text-white/40 text-[10px] tracking-widest">
        Lun–Gio &amp; Dom&nbsp;&nbsp;18:30–00:00
      </p>
      <p className="text-white/40 text-[10px] tracking-widest">
        Ven–Sab&nbsp;&nbsp;18:30–02:00
      </p>
    </motion.div>
  );
}

// ─── Allergen Legend ──────────────────────────────────────────────────────────

function AllergenLegend() {
  const [open, setOpen] = useState(false);
  return (
    <section className="px-6 md:px-16 pb-10 max-w-4xl mx-auto">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 border-t border-black/8 group"
      >
        <span className="text-[10px] uppercase tracking-[0.25em] text-black/40 group-hover:text-[#CF6990] transition-colors font-semibold">
          Informazioni sugli allergeni
        </span>
        <span className={`text-black/25 text-lg transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>↓</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6">
              <p className="text-[10px] text-black/35 leading-relaxed mb-4 max-w-xl">
                I numeri indicati accanto a ogni prodotto si riferiscono agli allergeni presenti secondo il Reg. UE 1169/2011. Per allergie o intolleranze gravi si prega di informare il personale.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(ALLERGEN_LABELS).map(([num, label]) => (
                  <div key={num} className="flex items-center gap-2 py-1.5 px-3 bg-[#fafafa] rounded-xl border border-black/5">
                    <span className="text-[10px] font-bold text-[#CF6990] w-4 shrink-0">{num}</span>
                    <span className="text-[10px] text-black/50 uppercase tracking-wide">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Burger filters ───────────────────────────────────────────────────────────

type BurgerFilter = 'all' | 'veggie' | 'spicy' | 'chicken';

const FILTERS: { id: BurgerFilter; label: string }[] = [
  { id: 'all', label: 'Tutti' },
  { id: 'spicy', label: '🌶 Spicy' },
  { id: 'veggie', label: '🌿 Veggie' },
  { id: 'chicken', label: '🍗 Chicken' },
];

function BurgerFilters({ active, onChange }: { active: BurgerFilter; onChange: (f: BurgerFilter) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold border transition-all duration-200 ${
            active === f.id
              ? 'bg-[#1a0a10] text-white border-[#1a0a10]'
              : 'border-black/10 text-black/40 hover:border-black/30 hover:text-black/60'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ─── Anchor nav ───────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'panini', label: 'Burger' },
  { id: 'fries', label: 'Patatine' },
  { id: 'salse', label: 'Salse' },
  { id: 'bibite', label: 'Bibite' },
] as const;

function AnchorNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string>('panini');

  useEffect(() => {
    const onScroll = () => {
      const panini = document.getElementById('panini');
      const footer = document.querySelector('footer');
      if (!panini) return;
      const top = panini.getBoundingClientRect().top;
      const footerTop = footer ? footer.getBoundingClientRect().top : Infinity;
      setVisible(top <= 64 && footerTop > 100);

      // highlight active section
      for (const s of [...SECTIONS].reverse()) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 80) {
          setActive(s.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-black/6 shadow-sm"
        >
          <div className="flex gap-1 px-4 py-3 overflow-x-auto scrollbar-none max-w-4xl mx-auto">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className={`shrink-0 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] font-semibold transition-all duration-200 rounded-full ${
                  active === s.id
                    ? 'bg-[#1a0a10] text-white'
                    : 'text-black/40 hover:text-black/70'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShowcasePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [configuringBurger, setConfiguringBurger] = useState<{ burger: BurgerDef; size?: import('./menuData').BurgerSize } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [fryModal, setFryModal] = useState<typeof FRIES[0] | null>(null);
  const [nuggetsModal, setNuggetsModal] = useState(false);
  const [, setScrolled] = useState(false);
  const [burgerFilter, setBurgerFilter] = useState<'all' | 'veggie' | 'spicy' | 'chicken'>('all');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  function addBurger(item: CartItem) {
    setCart((prev) => [...prev, item]);
    if (item.type === 'burger') showToast(item.burger.name);
  }

  function addFry(fry: typeof FRIES[0], sauces: string[]) {
    setCart((prev) => {
      const existing = prev.find((i) => i.type === 'fry' && i.fry.name === fry.name) as CartFry | undefined;
      const next = existing
        ? prev.map((i) => i.id === existing.id
            ? { ...existing, qty: existing.qty + 1, totalPrice: (existing.qty + 1) * fry.price }
            : i)
        : [...prev, { id: crypto.randomUUID(), type: 'fry', fry, qty: 1, totalPrice: fry.price } as CartFry];
      // add selected sauces as extras
      const sauceItems: CartExtra[] = sauces.map((name) => ({
        id: crypto.randomUUID(), type: 'extra', name, category: 'salsa', qty: 1, totalPrice: 0,
      }));
      return [...next, ...sauceItems];
    });
    showToast(fry.name);
  }

  function addExtra(name: string, category: 'salsa' | 'bibita', price: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.type === 'extra' && (i as CartExtra).name === name) as CartExtra | undefined;
      if (existing) {
        return prev.map((i) => i.id === existing.id ? { ...existing, qty: existing.qty + 1, totalPrice: existing.totalPrice + price } : i);
      }
      return [...prev, { id: crypto.randomUUID(), type: 'extra', name, category, qty: 1, totalPrice: price } as CartExtra];
    });
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; }
        html { scroll-behavior: smooth; }
      `}</style>

      <div className="bg-white text-[#1a0a10] antialiased overflow-x-hidden">

        {/* ── Nav ── (empty, logo handled by AnimatedLogo) */}

        {/* ── Hero ── */}
        <section
          ref={heroRef}
          className="relative flex flex-col overflow-hidden"
          style={{
            height: '100svh',
            background: 'linear-gradient(150deg, #8B2D51 0%, #CF6990 50%, #E8A0B8 100%)',
          }}
        >
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />

          {/* Large background text */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          >
            <span className="text-[35vw] font-semibold text-white/5 leading-none tracking-tighter uppercase whitespace-nowrap">
              PUBLIC
            </span>
          </motion.div>

          {/* Logo — occupa lo spazio centrale, rimpicciolisce scrollando */}
          <motion.div
            className="flex-1 flex items-center justify-center min-h-0"
            style={{ opacity: useTransform(scrollYProgress, [0, 0.45], [1, 0]) }}
          >
            <motion.img
              src="/logo-public-burger.png"
              alt="Public Burger"
              className="w-52 md:w-72 drop-shadow-2xl pointer-events-none select-none"
              style={{ scale: useTransform(scrollYProgress, [0, 0.45], [1, 0.55]) }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>

          {/* Bottom — orari + Burger Lovers, sempre visibile */}
          <div className="shrink-0 px-6 md:px-12 pb-10 md:pb-14 flex items-end justify-between">
            <div>
              <OpeningHours />
              <h1 className="text-[11vw] md:text-[7vw] text-white leading-[0.88] tracking-tight uppercase font-light overflow-hidden mt-3">
                {'Burger\nLovers'.split('\n').map((line, li) => (
                  <span key={li} className="block" style={{ overflow: li === 1 ? 'visible' : 'hidden' }}>
                    {line.split('').map((ch, ci) => (
                      <motion.span
                        key={ci}
                        className="inline-block"
                        style={{ whiteSpace: ch === ' ' ? 'pre' : undefined }}
                        initial={{ y: '110%', opacity: 0 }}
                        animate={{ y: '0%', opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 + li * 0.15 + ci * 0.035, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {ch}
                      </motion.span>
                    ))}
                    {li === 1 && (
                      <motion.span
                        className="inline-block ml-3"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
                      >
                        🧡🍔
                      </motion.span>
                    )}
                  </span>
                ))}
              </h1>
            </div>
            <motion.a
              href="#menu"
              className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-medium flex-shrink-0 mb-1"
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              Scorri ↓
            </motion.a>
          </div>
        </section>

        {/* ── Ticker ── */}
        <Ticker
          bg="bg-[#1a0a10]"
          text="text-white/50"
          items={['Ordina ora', 'Asporto e consegna', 'Isola del Liri', '+39 342 000 6928', 'Ogni sera dalle 18:30']}
        />

        {/* ── Statement ── */}
        <section className="px-6 md:px-16 py-16 md:py-24 max-w-5xl mx-auto">
          <WordReveal
            text="Ingredienti freschi, ricette dirette. Il panino che non dimentichi."
            className="text-2xl md:text-4xl lg:text-5xl text-[#1a0a10]/80 leading-tight font-light tracking-tight max-w-3xl"
          />
          <Reveal delay={0.3} className="mt-8">
            <motion.div
              className="h-px bg-[#CF6990]"
              initial={{ width: 0 }}
              whileInView={{ width: 48 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </Reveal>
        </section>

        {/* ── Anchor nav ── */}
        <AnchorNav />

        {/* ── Panini ── */}
        <section id="panini" className="px-6 md:px-16 pb-20 md:pb-28 max-w-4xl mx-auto scroll-mt-16">
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/8 pb-5">
              <span className="text-base tracking-[0.2em] uppercase text-[#CF6990] font-bold">Burgers</span>
              <BurgerFilters active={burgerFilter} onChange={setBurgerFilter} />
            </div>
          </Reveal>

          {BURGERS.filter((b) => {
            if (burgerFilter === 'veggie') return b.tag === 'Veggie';
            if (burgerFilter === 'spicy') return b.spicy;
            if (burgerFilter === 'chicken') return b.tag === 'Chicken' || b.tag === 'Wrap';
            return true;
          }).map((b, i) => (
            <BurgerRow key={b.name} burger={b} index={i} onAdd={(burger, size) => setConfiguringBurger({ burger, size })} />
          ))}

        </section>

        {/* ── Fries ── */}
        <section id="fries" className="px-6 md:px-16 pb-16 md:pb-20 scroll-mt-16">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <div className="flex items-end justify-between border-b border-black/8 pb-5 mb-2">
                <span className="text-base tracking-[0.2em] uppercase text-[#CF6990] font-bold">Fries / Appetizer</span>
              </div>
            </Reveal>
            {FRIES.map((f, i) => (
              <Reveal key={f.name} delay={i * 0.07}>
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-5 py-5 mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-xl md:text-2xl tracking-tight text-[#1a0a10] uppercase font-semibold leading-none mb-1">{f.name}</div>
                    <div className="text-xs text-black/35">{f.desc}</div>
                    <AllergenTag allergens={f.allergens} />
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm text-[#CF6990] tracking-widest">€{f.price % 1 === 0 ? f.price : f.price.toFixed(1)}</span>
                    <button onClick={() => f.name === 'Nuggets' ? setNuggetsModal(true) : setFryModal(f)}
                      className="w-8 h-8 rounded-full border border-black/15 text-black/40 hover:border-[#CF6990] hover:text-[#CF6990] text-base flex items-center justify-center transition-all duration-200 leading-none">
                      +
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Salse ── */}
        <section id="salse" className="px-6 md:px-16 pb-16 md:pb-20 scroll-mt-16">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <div className="flex items-end justify-between border-b border-black/8 pb-5 mb-2">
                <span className="text-base tracking-[0.2em] uppercase text-[#CF6990] font-bold">Salse</span>
              </div>
            </Reveal>
            {SALSE_LIST.map((s, i) => (
              <Reveal key={s} delay={i * 0.05}>
                <ExtraRow name={s} price={0.5} onAdd={() => addExtra(s, 'salsa', 0.5)} cart={cart} allergens={SALSE_ALLERGENS[s] ?? []} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Bibite ── */}
        <section id="bibite" className="px-6 md:px-16 pb-20 md:pb-28 scroll-mt-16">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <div className="flex items-end justify-between border-b border-black/8 pb-5 mb-2">
                <span className="text-base tracking-[0.2em] uppercase text-[#CF6990] font-bold">Bibite</span>
              </div>
            </Reveal>
            {['Coca-Cola', 'Coca-Cola Zero', 'Fanta', 'Sprite', 'Fuze Tea Limone', 'Fuze Tea Pesca', 'Acqua Liscia', 'Acqua Frizzante'].map((b, i) => {
              const drinkPrice = (b === 'Acqua Liscia' || b === 'Acqua Frizzante') ? 1 : 2.5;
              return (
                <Reveal key={b} delay={i * 0.05}>
                  <ExtraRow name={b} price={drinkPrice} onAdd={() => addExtra(b, 'bibita', drinkPrice)} cart={cart} />
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── Allergen Legend ── */}
        <AllergenLegend />

        {/* ── Footer ── */}
        <footer className="bg-[#120608] border-t border-white/5 px-6 md:px-16 py-10 md:py-14">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <img src="/logo-public-burger.png" alt="Public" className="h-8 opacity-70" />
            <div className="text-white/20 text-xs leading-relaxed text-left md:text-right">
              <p className="text-white/40 font-medium mb-1">Public Burger — Isola del Liri (FR)</p>
              <p className="text-white/30 mb-1">+39 342 000 6928</p>
              © {new Date().getFullYear()} — I prezzi potrebbero subire variazioni.
            </div>
          </div>
        </footer>

      </div>

      {/* ── Sub nav ── */}
      <SubNav />


      {/* ── Cart FAB ── */}
      <CartFAB count={cart.length} onClick={() => setCartOpen(true)} />

      <AnimatePresence>
        {configuringBurger && (
          <BurgerConfigurator
            burger={configuringBurger.burger}
            preselectedSize={configuringBurger.size}
            onConfirm={addBurger}
            onClose={() => setConfiguringBurger(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen && (
          <CartPanel
            items={cart}
            onRemove={removeItem}
            onClose={() => setCartOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fryModal && (
          <FryModal
            fry={fryModal}
            onConfirm={(sauces) => addFry(fryModal, sauces)}
            onClose={() => setFryModal(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {nuggetsModal && (
          <NuggetsModal
            onConfirm={(label, price, sauces) => {
              setCart((prev) => {
                const item: CartFry = { id: crypto.randomUUID(), type: 'fry', fry: { name: label, desc: 'Nuggets', price, allergens: [1, 3, 6, 10] }, qty: 1, totalPrice: price };
                const sauceItems: CartExtra[] = sauces.map((name) => ({ id: crypto.randomUUID(), type: 'extra', name, category: 'salsa', qty: 1, totalPrice: 0 }));
                return [...prev, item, ...sauceItems];
              });
            }}
            onClose={() => setNuggetsModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && <Toast key={toast + Date.now()} message={`${toast} aggiunto`} />}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-[#1a0a10] text-white/30 py-10 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-center md:text-left">
            <p className="text-white/50 font-semibold mb-1">Public Burger</p>
            <p>Piazza De Boncompagni 18 — Isola del Liri (FR)</p>
            <p>P.IVA 02854710601 — Titolare: Graziella Parravano</p>
          </div>
          <div className="flex gap-6 text-[10px] uppercase tracking-[0.3em]">
            <a href="/privacy" className="hover:text-[#CF6990] transition-colors">Privacy Policy</a>
            <a href="/cookie" className="hover:text-[#CF6990] transition-colors">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </>
  );
}
