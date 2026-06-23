import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence, useMotionValue, useAnimationFrame } from 'framer-motion';
import { BURGERS, FRIES, ALLERGEN_LABELS, SALSE_ALLERGENS, type BurgerDef } from './menuData';
import type { CartItem, CartFry, CartExtra } from './cartTypes';
import BurgerConfigurator from './BurgerConfigurator';
import CartPanel from './CartPanel';
import { getStoredUser, signOut, type PBUser } from './lib/supabase';
import { getOrderCount, getTier, TIERS, type Tier } from './lib/gamification';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = '', y = 14 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Ticker({ bg, text, items }: { bg: string; text: string; items: string[] }) {
  const halfRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const halfWidth = useRef(0);

  // Measure the width of one copy of the items
  useEffect(() => {
    function measure() {
      halfWidth.current = halfRef.current?.scrollWidth ?? 600;
    }
    const t = setTimeout(measure, 100);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, []);

  // Scroll left at 60px/s — when one full copy has passed, reset to 0 (seamless)
  useAnimationFrame((_, delta) => {
    const next = x.get() - (60 * delta) / 1000;
    if (halfWidth.current > 0 && next <= -halfWidth.current) {
      x.set(next + halfWidth.current);
    } else {
      x.set(next);
    }
  });

  // Render items twice side by side for seamless loop
  const row = items.map((t, i) => (
    <span key={i} className={`text-[10px] tracking-[0.3em] uppercase font-semibold shrink-0 px-5 ${text}`}>
      {t} <span className="opacity-20 mx-2">·</span>
    </span>
  ));

  return (
    <div className={`overflow-hidden py-3.5 rounded-2xl mx-4 my-2 ${bg}`}>
      <motion.div
        className="flex whitespace-nowrap will-change-transform"
        style={{ x }}
      >
        <div ref={halfRef} className="flex shrink-0">{row}</div>
        <div className="flex shrink-0">{row}</div>
      </motion.div>
    </div>
  );
}

// ─── Word-by-word stagger ────────────────────────────────────────────────────

function WordReveal({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px' });
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


// ─── Order Counter (top-left iOS pill) ───────────────────────────────────────

function OrderCounter({ hidden }: { hidden: boolean }) {
  const [user, setUser] = useState<PBUser | null>(() => getStoredUser());
  const [count, setCount] = useState(() => getOrderCount());

  useEffect(() => {
    const refresh = () => setUser(getStoredUser());
    window.addEventListener('pb-user-changed', refresh);
    return () => window.removeEventListener('pb-user-changed', refresh);
  }, []);

  if (!user) return null;
  const [prevTier, setPrevTier] = useState<Tier | null>(() => getTier(getOrderCount()));
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    function onChanged() {
      const newCount = getOrderCount();
      const newTier = getTier(newCount);
      const oldTier = getTier(count);
      if (newTier?.name !== oldTier?.name && newTier) {
        setUnlocked(true);
        setTimeout(() => setUnlocked(false), 3000);
      }
      setCount(newCount);
      setPrevTier(newTier);
    }
    window.addEventListener('pb-orders-changed', onChanged);
    return () => window.removeEventListener('pb-orders-changed', onChanged);
  }, [count]);

  const tier = getTier(count);
  const nextTier = tier ? TIERS.find(t => t.min === tier.nextMin) ?? null : TIERS[0];
  const nextMin = tier?.nextMin ?? (TIERS[0]?.min ?? 5);
  const prevMin = tier?.min ?? 0;
  const progress = tier
    ? tier.nextMin ? Math.min(1, (count - prevMin) / (tier.nextMin - prevMin)) : 1
    : Math.min(1, count / nextMin);

  void prevTier;

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="order-counter"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25 }}
          className="fixed top-4 left-4 z-30"
        >
          <AnimatePresence>
            {unlocked && tier && (
              <motion.div
                key="tier-unlock"
                initial={{ opacity: 0, y: -8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="absolute -top-10 left-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide shadow-lg"
                style={{ background: tier.color, color: '#1a0a10' }}
              >
                🎉 {tier.name} sbloccato!
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="flex flex-col gap-1 px-3 py-2 rounded-2xl backdrop-blur-md shadow-lg"
            style={{ background: 'rgba(26,10,16,0.75)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Number + tier label */}
            <div className="flex items-center gap-2">
              <motion.span
                key={count}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="text-white font-bold text-xl leading-none tabular-nums"
              >
                {count}
              </motion.span>
              <div>
                <p className="text-white/35 text-[8px] uppercase tracking-[0.2em] leading-none">ordini</p>
                {tier && (
                  <p className="text-[10px] font-semibold leading-none mt-0.5" style={{ color: tier.color }}>
                    {tier.name}
                  </p>
                )}
                {!tier && nextTier && (
                  <p className="text-white/25 text-[9px] leading-none mt-0.5">→ {nextTier.name} a {nextTier.min}</p>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-[2px] rounded-full bg-white/10 overflow-hidden w-full min-w-[60px]">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ background: tier ? tier.color : 'rgba(255,255,255,0.25)' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
  const inView = useInView(ref, { once: true, margin: '0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.15), ease: 'easeOut' }}
      className="bg-white rounded-2xl shadow-sm border border-black/5 px-5 py-6 mb-3 cursor-pointer hover:border-[#CF6990]/50 hover:bg-[#FBE8EF]/25 hover:shadow-[0_4px_24px_rgba(207,105,144,0.12)] transition-all duration-300"
      onClick={() => onAdd(burger)}
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
          {burger.popular && (
            <span className="text-[9px] font-bold text-white bg-[#CF6990] rounded px-2 py-0.5 tracking-widest uppercase leading-none">
              🔥 Il più ordinato
            </span>
          )}
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
              onClick={(e) => { e.stopPropagation(); onAdd(burger, s); }}
              className="text-[10px] tracking-[0.2em] uppercase font-semibold rounded-full border border-black/15 text-black/60 px-4 py-2 hover:border-[#CF6990] hover:text-[#CF6990] hover:bg-[#FBE8EF]/50 transition-all duration-200"
            >
              {s === 'single' ? 'Singolo' : s === 'double' ? 'Doppio' : 'Triplo'}
              <span className="ml-2 text-black/30">€{burger.prices![s]}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(burger); }}
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
  { id: 'panini', label: 'Burger' },
  { id: 'fries', label: 'Fries' },
  { id: 'salse', label: 'Salse' },
  { id: 'bibite', label: 'Drinks' },
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
  { id: 'bibite', label: 'Drinks' },
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

// ─── Fornitori Section ────────────────────────────────────────────────────────

function FornitoriSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px' });

  return (
    <div ref={ref} className="py-10 px-6 flex flex-col items-center gap-5">
      <motion.p
        className="text-[9px] tracking-[0.35em] uppercase text-black/20 font-semibold"
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        Materie prime di qualità
      </motion.p>
      <motion.p
        className="text-[13px] font-semibold text-black/50 text-center max-w-xs leading-snug"
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        Scegliamo con cura i nostri fornitori per portarti ingredienti freschi e selezionati, ogni giorno.
      </motion.p>
      <motion.p
        className="text-[9px] tracking-[0.35em] uppercase text-black/20 font-semibold"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        I nostri fornitori
      </motion.p>
      <div className="flex flex-wrap items-center justify-center gap-10">
        <motion.img
          src="/logo-non-solo-pane.jpg"
          alt="Non Solo Pane"
          className="h-14 object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={inView ? { opacity: 0.5, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          className="w-px h-10 bg-black/8"
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.45 }}
        />
        <motion.img
          src="/logo-macelleria.png"
          alt="Macelleria Franco Capobianco"
          className="h-14 object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={inView ? { opacity: 0.5, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShowcasePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [orderCount, setOrderCount] = useState(() => getOrderCount());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [configuringBurger, setConfiguringBurger] = useState<{ burger: BurgerDef; size?: import('./menuData').BurgerSize } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [fryModal, setFryModal] = useState<typeof FRIES[0] | null>(null);
  const [nuggetsModal, setNuggetsModal] = useState(false);
  const [, setScrolled] = useState(false);
  const [burgerFilter, setBurgerFilter] = useState<'all' | 'veggie' | 'spicy' | 'chicken'>('all');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [smashPopup, setSmashPopup] = useState(() => sessionStorage.getItem('pb_smash_seen') !== '1');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onOrders = () => setOrderCount(getOrderCount());
    window.addEventListener('pb-orders-changed', onOrders);
    return () => window.removeEventListener('pb-orders-changed', onOrders);
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

  function removeExtra(name: string, price: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.type === 'extra' && (i as CartExtra).name === name) as CartExtra | undefined;
      if (!existing) return prev;
      if (existing.qty <= 1) return prev.filter((i) => i.id !== existing.id);
      return prev.map((i) => i.id === existing.id ? { ...existing, qty: existing.qty - 1, totalPrice: existing.totalPrice - price } : i);
    });
  }

  function removeFry(fry: typeof FRIES[0]) {
    setCart((prev) => {
      const existing = prev.find((i) => i.type === 'fry' && (i as CartFry).fry.name === fry.name) as CartFry | undefined;
      if (!existing) return prev;
      if (existing.qty <= 1) return prev.filter((i) => i.id !== existing.id);
      return prev.map((i) => i.id === existing.id ? { ...existing, qty: existing.qty - 1, totalPrice: (existing.qty - 1) * fry.price } : i);
    });
  }

  return (
    <>
      {/* ── Smash Monday Popup ── */}
      <AnimatePresence>
        {smashPopup && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            {/* Overlay */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => { sessionStorage.setItem('pb_smash_seen', '1'); setSmashPopup(false); }}
            />
            {/* Card */}
            <motion.div
              className="relative w-full md:max-w-md mx-4 md:mx-auto overflow-hidden rounded-t-3xl md:rounded-3xl shadow-2xl"
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: '#1a0a10' }}
            >
              {/* Header band */}
              <div className="px-7 pt-8 pb-6 text-center" style={{ background: 'linear-gradient(135deg, #1a0a10 0%, #3a1020 100%)' }}>
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#CF6990] font-bold mb-2">Ogni lunedì</p>
                <h2 className="text-[42px] font-black uppercase leading-none tracking-tight text-white">SMASH</h2>
                <h2 className="text-[42px] font-black uppercase leading-none tracking-tight" style={{ color: '#CF6990' }}>MONDAY</h2>
                <p className="text-[12px] text-white/40 mt-3 font-medium leading-relaxed">
                  Il lunedì il menu cambia tutto.<br />Solo carne smashata, solo questi tre.
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/8 mx-7" />

              {/* Burgers */}
              <div className="px-7 py-5 space-y-3">
                {[
                  { name: 'Oklahoma', desc: 'Cipolla grigliata, Cheddar, Bacon, Pickles, Salsa public', price: 'da €9' },
                  { name: 'Jalapeño Popper', desc: 'Jalapeño, Cheddar, Insalata, Creamy spicy sauce', price: 'da €9' },
                  { name: 'Cheeseburger', desc: 'Cheddar, Pickles, Ketchup', price: 'da €8' },
                ].map((b) => (
                  <div key={b.name} className="flex items-center justify-between gap-4 py-2 border-b border-white/6 last:border-0">
                    <div>
                      <p className="text-[14px] font-bold text-white uppercase tracking-wide">{b.name}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">{b.desc}</p>
                    </div>
                    <span className="text-[14px] font-bold shrink-0" style={{ color: '#CF6990' }}>{b.price}</span>
                  </div>
                ))}
              </div>

              <div className="pb-8" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; }
        html { scroll-behavior: smooth; }
        @keyframes shimmer-bronze {
          0%   { filter: sepia(1) hue-rotate(340deg) saturate(3) brightness(0.9) drop-shadow(0 0 10px #cd7f32); }
          30%  { filter: sepia(1) hue-rotate(340deg) saturate(5) brightness(1.3) drop-shadow(0 0 30px #e8a050) contrast(1.2); }
          60%  { filter: sepia(1) hue-rotate(345deg) saturate(4) brightness(1.0) drop-shadow(0 0 14px #cd7f32); }
          80%  { filter: sepia(1) hue-rotate(340deg) saturate(6) brightness(1.5) drop-shadow(0 0 40px #f0b860) contrast(1.3); }
          100% { filter: sepia(1) hue-rotate(340deg) saturate(3) brightness(0.9) drop-shadow(0 0 10px #cd7f32); }
        }
        @keyframes shimmer-silver {
          0%   { filter: grayscale(1) brightness(1.3) contrast(1.1) drop-shadow(0 0 10px #b0bec5); }
          30%  { filter: grayscale(1) brightness(1.9) contrast(1.3) drop-shadow(0 0 35px #ecf0f1); }
          60%  { filter: grayscale(1) brightness(1.4) contrast(1.1) drop-shadow(0 0 12px #b0bec5); }
          80%  { filter: grayscale(1) brightness(2.1) contrast(1.4) drop-shadow(0 0 45px #ffffff); }
          100% { filter: grayscale(1) brightness(1.3) contrast(1.1) drop-shadow(0 0 10px #b0bec5); }
        }
        @keyframes shimmer-gold {
          0%   { filter: sepia(1) hue-rotate(5deg) saturate(5) brightness(1.0) drop-shadow(0 0 12px #ffd700); }
          25%  { filter: sepia(1) hue-rotate(8deg) saturate(7) brightness(1.5) drop-shadow(0 0 40px #ffe44d) contrast(1.2); }
          50%  { filter: sepia(1) hue-rotate(5deg) saturate(5) brightness(1.1) drop-shadow(0 0 16px #ffd700); }
          75%  { filter: sepia(1) hue-rotate(10deg) saturate(8) brightness(1.7) drop-shadow(0 0 55px #fff080) contrast(1.4); }
          100% { filter: sepia(1) hue-rotate(5deg) saturate(5) brightness(1.0) drop-shadow(0 0 12px #ffd700); }
        }
        @keyframes shimmer-platinum {
          0%   { filter: grayscale(0.6) brightness(1.4) hue-rotate(200deg) saturate(1.5) drop-shadow(0 0 12px #94a3b8); }
          30%  { filter: grayscale(0.3) brightness(2.0) hue-rotate(205deg) saturate(2.5) drop-shadow(0 0 45px #bfdbfe) contrast(1.3); }
          60%  { filter: grayscale(0.6) brightness(1.5) hue-rotate(198deg) saturate(1.5) drop-shadow(0 0 14px #94a3b8); }
          80%  { filter: grayscale(0.2) brightness(2.2) hue-rotate(210deg) saturate(3) drop-shadow(0 0 55px #e0f2fe) contrast(1.4); }
          100% { filter: grayscale(0.6) brightness(1.4) hue-rotate(200deg) saturate(1.5) drop-shadow(0 0 12px #94a3b8); }
        }
        @keyframes shimmer-diamond {
          0%   { filter: brightness(1.4) hue-rotate(0deg)   saturate(3) drop-shadow(0 0 20px #f9a8d4) contrast(1.1); }
          16%  { filter: brightness(2.0) hue-rotate(60deg)  saturate(5) drop-shadow(0 0 50px #fde68a) contrast(1.4); }
          33%  { filter: brightness(1.4) hue-rotate(120deg) saturate(3) drop-shadow(0 0 20px #6ee7b7) contrast(1.1); }
          50%  { filter: brightness(2.2) hue-rotate(180deg) saturate(6) drop-shadow(0 0 60px #a5f3fc) contrast(1.5); }
          66%  { filter: brightness(1.4) hue-rotate(240deg) saturate(3) drop-shadow(0 0 20px #c4b5fd) contrast(1.1); }
          83%  { filter: brightness(2.0) hue-rotate(300deg) saturate(5) drop-shadow(0 0 50px #fb7185) contrast(1.4); }
          100% { filter: brightness(1.4) hue-rotate(360deg) saturate(3) drop-shadow(0 0 20px #f9a8d4) contrast(1.1); }
        }
        .tier-bronze,.tier-silver,.tier-gold,.tier-platinum,.tier-diamond {
          will-change: filter;
          transform: translateZ(0);
        }
        .tier-bronze   { animation: shimmer-bronze   2s ease-in-out infinite; }
        .tier-silver   { animation: shimmer-silver   1.8s ease-in-out infinite; }
        .tier-gold     { animation: shimmer-gold     1.5s ease-in-out infinite; }
        .tier-platinum { animation: shimmer-platinum 1.6s ease-in-out infinite; }
        .tier-diamond  { animation: shimmer-diamond  2.5s linear infinite; }
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
              className={`w-52 md:w-72 pointer-events-none select-none${getTier(orderCount) ? ' ' + getTier(orderCount)!.shimmerClass : ' drop-shadow-2xl'}`}
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

        {/* ── Fornitori ── */}
        <FornitoriSection />

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
            {FRIES.map((f, i) => {
              const fryQty = (cart.find((ci) => ci.type === 'fry' && (ci as CartFry).fry.name === f.name) as CartFry | undefined)?.qty ?? 0;
              return (
                <motion.button
                  key={f.name}
                  onClick={() => f.name === 'Nuggets' ? setNuggetsModal(true) : setFryModal(f)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left rounded-2xl border transition-all duration-200 mb-3 px-5 py-5 flex items-center justify-between ${
                    fryQty > 0 ? 'border-[#CF6990]/40 bg-[#FBE8EF]/40' : 'border-black/5 bg-white hover:border-[#CF6990]/30 hover:bg-[#FBE8EF]/20'
                  }`}
                >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-xl md:text-2xl tracking-tight text-[#1a0a10] uppercase font-semibold leading-none">{f.name}</div>
                        {fryQty > 0 && (
                          <span className="text-[10px] bg-[#CF6990] text-white px-1.5 py-0.5 rounded-full font-bold">×{fryQty}</span>
                        )}
                      </div>
                      <div className="text-xs text-black/35">{f.desc}</div>
                      <AllergenTag allergens={f.allergens} />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-[#CF6990] tracking-widest">€{f.price % 1 === 0 ? f.price : f.price.toFixed(1)}</span>
                      {fryQty > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFry(f); }}
                          className="w-8 h-8 rounded-full border border-[#CF6990]/30 text-[#CF6990] text-base flex items-center justify-center transition-all duration-200 leading-none hover:bg-[#CF6990] hover:text-white"
                        >
                          −
                        </button>
                      )}
                      <div className="w-8 h-8 rounded-full border border-black/15 text-black/40 hover:border-[#CF6990] hover:text-[#CF6990] text-base flex items-center justify-center transition-all duration-200 leading-none">
                        +
                      </div>
                    </div>
                </motion.button>
              );
            })}
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
            {SALSE_LIST.map((s, i) => {
              const qty = (cart.filter((ci) => ci.type === 'extra' && (ci as CartExtra).name === s) as CartExtra[]).reduce((acc, ci) => acc + ci.qty, 0);
              return (
                <motion.button
                  key={s}
                  onClick={() => addExtra(s, 'salsa', 0.5)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-200 mb-2 text-left ${
                    qty > 0 ? 'border-[#CF6990]/40 bg-[#FBE8EF]/40' : 'border-black/8 bg-white hover:border-[#CF6990]/30 hover:bg-[#FBE8EF]/20'
                  }`}
                >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-black/70 uppercase tracking-wide font-medium">{s}</span>
                      {qty > 0 && (
                        <span className="text-[10px] bg-[#CF6990] text-white px-1.5 py-0.5 rounded-full font-bold">×{qty}</span>
                      )}
                      {SALSE_ALLERGENS[s] && SALSE_ALLERGENS[s].length > 0 && (
                        <span className="text-[9px] text-black/25 tracking-wider">All: {SALSE_ALLERGENS[s].join(', ')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-[#CF6990] tracking-widest">€0,50</span>
                      {qty > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeExtra(s, 0.5); }}
                          className="w-7 h-7 rounded-full border border-[#CF6990]/30 text-[#CF6990] text-sm flex items-center justify-center transition-all duration-200 leading-none hover:bg-[#CF6990] hover:text-white"
                        >
                          −
                        </button>
                      )}
                    </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ── Bibite ── */}
        <section id="bibite" className="px-6 md:px-16 pb-20 md:pb-28 scroll-mt-16">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <div className="flex items-end justify-between border-b border-black/8 pb-5 mb-2">
                <span className="text-base tracking-[0.2em] uppercase text-[#CF6990] font-bold">Drinks</span>
              </div>
            </Reveal>
            {[
              { name: 'Coca-Cola', price: 2.5 },
              { name: 'Coca-Cola Zero', price: 2.5 },
              { name: 'Fanta', price: 2.5 },
              { name: 'Sprite', price: 2.5 },
              { name: 'Fuze Tea Limone', price: 2.5 },
              { name: 'Fuze Tea Pesca', price: 2.5 },
              { name: 'Acqua Liscia', price: 1 },
              { name: 'Acqua Frizzante', price: 1 },
              { name: 'Forst 0,33', price: 3.5 },
            ].map(({ name: b, price: drinkPrice }, i) => {
              const qty = (cart.filter((i) => i.type === 'extra' && (i as CartExtra).name === b) as CartExtra[]).reduce((s, i) => s + i.qty, 0);
              return (
                <motion.button
                  key={b}
                  onClick={() => addExtra(b, 'bibita', drinkPrice)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-200 mb-2 text-left ${
                    qty > 0 ? 'border-[#CF6990]/40 bg-[#FBE8EF]/40' : 'border-black/8 bg-white hover:border-[#CF6990]/30 hover:bg-[#FBE8EF]/20'
                  }`}
                >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-black/70 uppercase tracking-wide font-medium">{b}</span>
                      {qty > 0 && (
                        <span className="text-[10px] bg-[#CF6990] text-white px-1.5 py-0.5 rounded-full font-bold">×{qty}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-[#CF6990] tracking-widest">€{drinkPrice % 1 === 0 ? drinkPrice : drinkPrice.toFixed(1)}</span>
                      {qty > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeExtra(b, drinkPrice); }}
                          className="w-7 h-7 rounded-full border border-[#CF6990]/30 text-[#CF6990] text-sm flex items-center justify-center transition-all duration-200 leading-none hover:bg-[#CF6990] hover:text-white"
                        >
                          −
                        </button>
                      )}
                    </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ── Allergen Legend ── */}
        <AllergenLegend />

        {/* ── Reviews ── */}
        <section className="px-6 md:px-16 py-12 max-w-4xl mx-auto w-full">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.35em] text-black/25 font-semibold mb-6 text-center">Cosa dicono di noi</p>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
              {/* Google */}
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#1a0a10]">4,8</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <svg key={i} viewBox="0 0 20 20" className="w-3 h-3 text-[#FBBC05]" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-black/30 tracking-wide">115 recensioni</p>
                </div>
              </div>

              <div className="w-px h-8 bg-black/8 hidden sm:block" />

              {/* Deliveroo */}
              <div className="flex items-center gap-3">
                <img src="/deliveroo-logo.webp" alt="Deliveroo" className="h-6 w-auto object-contain shrink-0" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#1a0a10]">4,7</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <svg key={i} viewBox="0 0 20 20" className="w-3 h-3 text-[#FBBC05]" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-black/30 tracking-wide">112 recensioni</p>
                </div>
              </div>

              <div className="w-px h-8 bg-black/8 hidden sm:block" />

              {/* Just Eat */}
              <div className="flex items-center gap-3">
                <img src="/just-eat-logo.png" alt="Just Eat" className="h-6 w-auto object-contain shrink-0" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#1a0a10]">4,9</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <svg key={i} viewBox="0 0 20 20" className="w-3 h-3 text-[#FBBC05]" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-black/30 tracking-wide">440+ recensioni</p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Social / Contatti ── */}
        <section className="px-6 md:px-16 py-12 max-w-4xl mx-auto w-full border-t border-black/6">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.35em] text-black/25 font-semibold mb-6 text-center">Seguici</p>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="flex items-center justify-center gap-8">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/publicburger__/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-black/35 group-hover:text-[#CF6990] transition-colors font-semibold">Instagram</span>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/PUBLICISOLADELLIRI/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#1877F2] flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-black/35 group-hover:text-[#CF6990] transition-colors font-semibold">Facebook</span>
              </a>
            </div>
          </Reveal>
        </section>

        {/* ── Lavora con noi ── */}
        <section className="px-6 md:px-16 py-10 max-w-4xl mx-auto w-full">
          <Reveal>
            <a
              href="mailto:public.isoladelliri@gmail.com?subject=Candidatura%20spontanea%20%E2%80%94%20Public%20Burger"
              className="group flex items-center justify-between w-full border border-black/8 rounded-2xl px-6 py-5 hover:border-[#CF6990] hover:bg-[#FBE8EF]/30 transition-all duration-300"
            >
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-1 font-semibold">Entra nel team</p>
                <p className="text-lg font-semibold text-[#1a0a10] tracking-tight group-hover:text-[#CF6990] transition-colors">Lavora con noi →</p>
              </div>
              <div className="w-10 h-10 rounded-full border border-black/10 group-hover:border-[#CF6990] group-hover:bg-[#CF6990] flex items-center justify-center transition-all duration-300">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-black/30 group-hover:stroke-white transition-colors" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
            </a>
          </Reveal>
        </section>

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

      {/* ── Order counter ── */}
      <OrderCounter hidden={false} />

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
