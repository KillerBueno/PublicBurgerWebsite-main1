import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_EXTRAS, DRINKS } from './menuData';
import type { BurgerDef, BurgerSize } from './menuData';
import type { CartBurger } from './cartTypes';

interface Props {
  burger: BurgerDef;
  preselectedSize?: BurgerSize;
  onConfirm: (item: CartBurger) => void;
  onClose: () => void;
}

type Step = 'size' | 'combo' | 'remove' | 'extras' | 'drink';

const STEP_LABELS: Record<Step, string> = {
  size: 'Grandezza', combo: 'Combo', remove: 'Rimuovi', extras: 'Aggiunte', drink: 'Bibita',
};

function buildSteps(burger: BurgerDef, isCombo: boolean, hasPresize: boolean): Step[] {
  const hasCombo = burger.combo > 0;
  if (!burger.prices) {
    return ['combo', 'remove', 'extras', ...(isCombo && hasCombo ? ['drink' as Step] : [])];
  }
  const s: Step[] = hasPresize ? [] : ['size'];
  return [...s, 'combo', 'remove', 'extras', ...(isCombo ? ['drink' as Step] : [])];
}

export default function BurgerConfigurator({ burger, preselectedSize, onConfirm, onClose }: Props) {
  const [size, setSize] = useState<BurgerSize>(preselectedSize ?? 'single');
  const [combo, setCombo] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [drink, setDrink] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState(1);

  const steps = buildSteps(burger, combo, !!preselectedSize);
  const currentStep = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    const s = buildSteps(burger, combo, !!preselectedSize);
    if (stepIndex >= s.length) setStepIndex(s.length - 1);
  }, [combo]);

  function goNext() { setDir(1); setStepIndex((i) => Math.min(i + 1, steps.length - 1)); }
  function goBack() { setDir(-1); setStepIndex((i) => Math.max(i - 1, 0)); }
  function toggleRemove(ing: string) { setRemoved((p) => p.includes(ing) ? p.filter((x) => x !== ing) : [...p, ing]); }
  function toggleExtra(ing: string) { setExtras((p) => p.includes(ing) ? p.filter((x) => x !== ing) : [...p, ing]); }

  function calcPrice() {
    let base = burger.prices ? burger.prices[size] : (burger.fixedPrice ?? 0);
    if (combo) base += burger.combo;
    if (drink) base += DRINKS.find((d) => d.name === drink)?.extra ?? 0;
    return base;
  }

  function handleConfirm() {
    const d = drink ? DRINKS.find((x) => x.name === drink) : null;
    onConfirm({
      id: crypto.randomUUID(), type: 'burger', burger,
      size: burger.prices ? size : null,
      combo, removed, extras,
      drink: combo ? drink : null,
      drinkExtra: d?.extra ?? 0,
      totalPrice: calcPrice(),
    });
    onClose();
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  const isMultiSelect = currentStep === 'remove' || currentStep === 'extras';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative w-full md:max-w-md bg-white flex flex-col max-h-[92vh] shadow-2xl rounded-t-3xl md:rounded-3xl overflow-hidden"
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_e, info) => { if (info.offset.y > 80 || info.velocity.y > 500) onClose(); }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 rounded-full bg-black/15" />
        </div>

        {/* Header */}
        <div className="px-7 pt-4 pb-5 border-b border-black/6 shrink-0">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[9px] tracking-[0.35em] uppercase text-[#CF6990] font-medium mb-1">
                {STEP_LABELS[currentStep]}
              </p>
              <h3 className="text-2xl tracking-tight uppercase font-light">{burger.name}</h3>
            </div>
            <button onClick={onClose} className="text-black/20 hover:text-black/60 transition-colors text-2xl leading-none mt-1">×</button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                className="h-[2px] flex-1 rounded-full"
                initial={false}
                animate={{ backgroundColor: i <= stepIndex ? '#CF6990' : '#e5e5e5' }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-7 py-6 min-h-0">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={currentStep}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >

              {/* SIZE */}
              {currentStep === 'size' && burger.prices && (
                <div className="space-y-2">
                  {(['single', 'double', 'triple'] as BurgerSize[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSize(s); goNext(); }}
                      className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-black/8 hover:border-[#CF6990] hover:bg-[#FBE8EF]/40 transition-all duration-200 group"
                    >
                      <span className="text-sm uppercase tracking-widest font-medium text-black/70 group-hover:text-[#1a0a10]">
                        {s === 'single' ? 'Singolo' : s === 'double' ? 'Doppio' : 'Triplo'}
                      </span>
                      <span className="text-lg text-black/40 group-hover:text-[#CF6990] transition-colors">€{burger.prices![s]}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* COMBO */}
              {currentStep === 'combo' && (
                <div className="space-y-2">
                  <button
                    onClick={() => { setCombo(true); goNext(); }}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-black/8 hover:border-[#CF6990] hover:bg-[#FBE8EF]/40 transition-all duration-200 group"
                  >
                    <div className="text-left">
                      <div className="text-sm uppercase tracking-widest font-medium text-black/70 group-hover:text-[#1a0a10]">Combo</div>
                      <div className="text-xs text-black/30 mt-0.5">Patatine + bibita incluse</div>
                    </div>
                    <span className="text-lg text-black/40 group-hover:text-[#CF6990] transition-colors">+€{burger.combo}</span>
                  </button>
                  <button
                    onClick={() => { setCombo(false); setDrink(null); goNext(); }}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-black/8 hover:border-[#CF6990] hover:bg-[#FBE8EF]/40 transition-all duration-200 group"
                  >
                    <div className="text-sm uppercase tracking-widest font-medium text-black/70 group-hover:text-[#1a0a10]">Solo il panino</div>
                    <span className="text-black/20">—</span>
                  </button>
                </div>
              )}

              {/* REMOVE */}
              {currentStep === 'remove' && (
                <div>
                  <p className="text-[9px] tracking-[0.3em] uppercase text-black/30 mb-4">Tocca per rimuovere</p>
                  <div className="space-y-1.5">
                    {burger.ingredients.map((ing) => {
                      const active = !removed.includes(ing);
                      return (
                        <button
                          key={ing}
                          onClick={() => toggleRemove(ing)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left ${
                            active
                              ? 'border-black/8 bg-white hover:border-black/20'
                              : 'border-red-100 bg-red-50/50'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 border rounded-full flex-shrink-0 transition-all ${
                            active ? 'border-black/20 bg-[#CF6990]' : 'border-red-200 bg-white'
                          }`} />
                          <span className={`text-sm transition-all ${active ? 'text-black/70' : 'line-through text-black/25'}`}>
                            {ing}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* EXTRAS */}
              {currentStep === 'extras' && (
                <div>
                  <p className="text-[9px] tracking-[0.3em] uppercase text-black/30 mb-4">Tocca per aggiungere</p>
                  <div className="space-y-1.5">
                    {ALL_EXTRAS.filter((e) => !burger.ingredients.includes(e)).map((ing) => {
                      const active = extras.includes(ing);
                      return (
                        <button
                          key={ing}
                          onClick={() => toggleExtra(ing)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left ${
                            active ? 'border-[#CF6990]/30 bg-[#FBE8EF]/50' : 'border-black/8 bg-white hover:border-black/20'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 border rounded-full flex-shrink-0 transition-all ${
                            active ? 'border-[#CF6990] bg-[#CF6990]' : 'border-black/20 bg-white'
                          }`} />
                          <span className={`text-sm ${active ? 'text-[#1a0a10]' : 'text-black/50'}`}>{ing}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DRINK */}
              {currentStep === 'drink' && (
                <div>
                  <p className="text-[9px] tracking-[0.3em] uppercase text-black/30 mb-4">Scegli la bibita</p>
                  <div className="space-y-2">
                    {DRINKS.map((d) => (
                      <button
                        key={d.name}
                        onClick={() => {
                          const selectedDrink = d.name;
                          const drinkExtra = d.extra ?? 0;
                          let base = burger.prices ? burger.prices[size] : (burger.fixedPrice ?? 0);
                          base += burger.combo;
                          base += drinkExtra;
                          onConfirm({
                            id: crypto.randomUUID(), type: 'burger', burger,
                            size: burger.prices ? size : null,
                            combo: true, removed, extras,
                            drink: selectedDrink,
                            drinkExtra,
                            totalPrice: base,
                          });
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-black/8 hover:border-[#CF6990] hover:bg-[#FBE8EF]/40 transition-all duration-200 group"
                      >
                        <span className="text-sm uppercase tracking-widest font-medium text-black/70 group-hover:text-[#1a0a10]">{d.name}</span>
                        {d.extra > 0
                          ? <span className="text-sm text-black/30 group-hover:text-[#CF6990] transition-colors">+€{d.extra}</span>
                          : <span className="text-[10px] text-black/20 uppercase tracking-wider">inclusa</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-black/6 shrink-0 flex items-center justify-between">
          {stepIndex > 0 ? (
            <button onClick={goBack} className="w-10 h-10 flex items-center justify-center bg-black/10 hover:bg-[#CF6990] text-black/70 hover:text-white transition-all duration-200 rounded-full text-xl font-black">
              ←
            </button>
          ) : <div className="w-9" />}

          <div className="text-center">
            <div className="text-[9px] tracking-[0.3em] uppercase text-black/25 mb-0.5">Totale</div>
            <div className="text-lg font-medium text-[#CF6990]">€{calcPrice()}</div>
          </div>

          {isLast ? (
            <button
              onClick={handleConfirm}
              className="text-[10px] tracking-[0.2em] uppercase font-semibold rounded-full bg-[#1a0a10] text-white px-5 py-2.5 hover:bg-[#CF6990] transition-colors duration-300"
            >
              Aggiungi
            </button>
          ) : isMultiSelect ? (
            <button onClick={goNext} className="w-10 h-10 flex items-center justify-center bg-black/10 hover:bg-[#CF6990] text-black/70 hover:text-white transition-all duration-200 rounded-full text-xl font-black">
              →
            </button>
          ) : <div className="w-9" />}
        </div>
      </motion.div>
    </div>
  );
}
