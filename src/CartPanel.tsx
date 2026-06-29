import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import type { CartItem, CartExtra } from './cartTypes';
import { saveOrder } from './lib/orders';
import { getStoredUser } from './lib/supabase';
import { incrementOrderCount } from './lib/gamification';

interface Props {
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQty?: (id: string, delta: number) => void;
  onClose: () => void;
  onOrderSent?: (items: CartItem[]) => void;
}

type OrderType = 'asporto' | 'consegna';
type Step = 'cart' | 'checkout';

const WHATSAPP_NUMBER = '393420006928';

function buildWhatsAppMessage(items: CartItem[], orderType: OrderType, name: string, time: string): string {
  const SIZE: Record<string, string> = { single: 'Singolo', double: 'Doppio', triple: 'Triplo' };
  const total = items.reduce((s, i) => s + i.totalPrice, 0);

  const lines: string[] = [];
  lines.push('Ciao! Ordine Public Burger:');
  lines.push('');

  let n = 1;
  for (const item of items) {
    if (item.type === 'burger') {
      const size = item.size ? ` (${SIZE[item.size] ?? item.size})` : '';
      const combo = item.combo ? ' [COMBO]' : '';
      lines.push(`${n++}. ${item.burger.name}${size}${combo} - EUR ${item.totalPrice.toFixed(2)}`);
      if (item.combo && item.drink) lines.push(`   Bibita: ${item.drink}`);
      for (const r of item.removed) lines.push(`   - ${r}`);
      for (const e of item.extras)  lines.push(`   + ${e}`);
    } else if (item.type === 'fry') {
      lines.push(`${n++}. ${item.fry.name} x${item.qty} - EUR ${item.totalPrice.toFixed(2)}`);
    } else if (item.type === 'extra') {
      lines.push(`${n++}. ${item.name} x${item.qty} - EUR ${item.totalPrice.toFixed(2)}`);
    }
  }

  lines.push('');
  lines.push(`Totale: EUR ${total.toFixed(2)}`);
  lines.push('');

  if (orderType === 'asporto') {
    lines.push('Asporto');
    if (name) lines.push(`Nome: ${name}`);
  } else {
    lines.push('Consegna a domicilio');
  }
  if (time) lines.push(`Orario: ${time}`);
  lines.push('');
  lines.push('Grazie!');

  return lines.join('\n');
}

function QtyControl({ qty, onMinus, onPlus }: { qty: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="flex items-center gap-0">
      <button
        onClick={onMinus}
        className="w-7 h-7 rounded-full bg-black/8 flex items-center justify-center text-black/50 hover:bg-[#FBE8EF] hover:text-[#A8456B] transition-colors text-[16px] leading-none font-bold"
      >
        −
      </button>
      <span className="w-7 text-center text-[13px] font-bold text-[#1a0a10] tabular-nums">{qty}</span>
      <button
        onClick={onPlus}
        className="w-7 h-7 rounded-full bg-black/8 flex items-center justify-center text-black/50 hover:bg-[#FBE8EF] hover:text-[#A8456B] transition-colors text-[16px] leading-none font-bold"
      >
        +
      </button>
    </div>
  );
}

const SWIPE_THRESHOLD = -72;

function ItemCard({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: CartItem;
  onRemove: () => void;
  onUpdateQty?: (delta: number) => void;
}) {
  const isBurger = item.type === 'burger';
  const isFry = item.type === 'fry';
  const isExtra = item.type === 'extra';
  const canQty = (isFry || isExtra) && !!onUpdateQty;

  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const dragRef = useRef(false);

  function handleDragEnd() {
    if (x.get() < SWIPE_THRESHOLD) {
      animate(x, -400, { duration: 0.25, ease: 'easeIn' }).then(onRemove);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      className="relative rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
    >
      {/* Delete background */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-0 bg-red-500 rounded-2xl flex items-center justify-end pr-5"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </motion.div>

      {/* Card content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: SWIPE_THRESHOLD * 1.4, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        style={{ x }}
        onDragStart={() => { dragRef.current = true; }}
        onDragEnd={handleDragEnd}
        className="relative bg-white rounded-2xl border border-black/6 px-4 py-3.5 flex items-center gap-3 cursor-grab active:cursor-grabbing select-none"
      >
        {/* Info */}
        <div className="flex-1 min-w-0">
          {isBurger && (
            <>
              <div className="flex flex-wrap gap-1 mb-1">
                {item.size && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#A8456B] bg-[#FBE8EF] px-1.5 py-0.5 rounded-full">
                    {item.size === 'single' ? 'Singolo' : item.size === 'double' ? 'Doppio' : 'Triplo'}
                  </span>
                )}
                {item.combo && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#8B6914] bg-[#FFF3CC] px-1.5 py-0.5 rounded-full">
                    Combo
                  </span>
                )}
              </div>
              <p className="text-[14px] font-bold text-[#1a0a10] uppercase tracking-tight leading-tight">{item.burger.name}</p>
              {item.combo && item.drink && (
                <p className="text-[11px] text-black/35 mt-0.5">🥤 {item.drink}</p>
              )}
              {item.removed.length > 0 && (
                <p className="text-[11px] text-black/35">Senza: {item.removed.join(', ')}</p>
              )}
              {item.extras.length > 0 && (
                <p className="text-[11px] text-black/35">+ {item.extras.join(', ')}</p>
              )}
            </>
          )}
          {isFry && (
            <p className="text-[14px] font-bold text-[#1a0a10] uppercase tracking-tight">{item.fry.name}</p>
          )}
          {isExtra && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-black/30 bg-black/6 px-1.5 py-0.5 rounded-full shrink-0">
                {(item as CartExtra).category === 'salsa' ? 'Salsa' : 'Drink'}
              </span>
              <p className="text-[14px] font-bold text-[#1a0a10] truncate">{(item as CartExtra).name}</p>
            </div>
          )}
        </div>

        {/* Qty + price */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-[16px] font-bold text-[#A8456B] tabular-nums">€{item.totalPrice.toFixed(2)}</span>
          {canQty ? (
            <QtyControl
              qty={item.qty as number}
              onMinus={() => onUpdateQty!(-1)}
              onPlus={() => onUpdateQty!(+1)}
            />
          ) : (
            <button
              onClick={onRemove}
              className="text-[11px] font-semibold uppercase tracking-wide text-black/25 hover:text-red-400 transition-colors"
            >
              Rimuovi
            </button>
          )}
          {canQty && (
            <button
              onClick={onRemove}
              className="text-[10px] font-semibold uppercase tracking-wide text-black/20 hover:text-red-400 transition-colors"
            >
              Rimuovi
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CartPanel({ items, onRemove, onUpdateQty, onClose, onOrderSent }: Props) {
  const [step, setStep] = useState<Step>('cart');
  const [orderType, setOrderType] = useState<OrderType>('asporto');
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const total = items.reduce((s, i) => s + i.totalPrice, 0);
  const user = getStoredUser();

  function handleWhatsApp() {
    if (!user) return;
    const msg = buildWhatsAppMessage(items, orderType, name.trim(), time.trim());
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    incrementOrderCount();
    onOrderSent?.(items);

    saveOrder({
      customer_name: name.trim() || user.name || 'Anonimo',
      order_type: orderType === 'consegna' ? 'domicilio' : 'asporto',
      items: items.map(item => {
        if (item.type === 'burger') return {
          type: 'burger', name: item.burger.name,
          size: item.size ?? undefined, removed: item.removed, extras: item.extras,
          combo: item.combo || undefined, drink: item.drink || undefined,
          price: item.totalPrice,
        };
        if (item.type === 'fry') return { type: 'fry', name: item.fry.name, qty: item.qty, price: item.totalPrice };
        return { type: 'extra', name: (item as CartExtra).name, qty: (item as CartExtra).qty, price: item.totalPrice };
      }),
      total,
      user_email: user.email ?? null,
      user_name: user.name ?? null,
      notes: time.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Overlay */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="relative w-full max-w-sm flex flex-col shadow-2xl rounded-l-3xl overflow-hidden"
        style={{ background: '#F2F2F7' }}
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-4 shrink-0 bg-[#F2F2F7]">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2.5">
              {step === 'checkout' && (
                <button
                  onClick={() => setStep('cart')}
                  className="w-8 h-8 rounded-full bg-black/8 flex items-center justify-center text-black/50 hover:text-[#A8456B] transition-colors mr-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h3 className="text-[22px] font-bold text-[#1a0a10] tracking-tight">
                {step === 'cart' ? 'Carrello' : 'Il tuo ordine'}
              </h3>
              {step === 'cart' && items.length > 0 && (
                <span className="text-[12px] font-bold text-white bg-[#CF6990] min-w-[22px] h-[22px] rounded-full flex items-center justify-center leading-none px-1.5">
                  {items.length}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/8 flex items-center justify-center text-black/40 hover:text-black/70 text-[20px] leading-none transition-colors"
            >
              ×
            </button>
          </div>
          <p className="text-[12px] font-semibold text-black/30 uppercase tracking-widest">
            {step === 'cart' ? 'Rivedi e modifica' : 'Modalità e dettagli'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="px-5 pb-3 shrink-0 flex items-center gap-2">
          <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step === 'cart' ? 'bg-[#CF6990]' : 'bg-[#CF6990]'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step === 'checkout' ? 'bg-[#CF6990]' : 'bg-black/10'}`} />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait" initial={false}>
          {step === 'cart' ? (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Items list */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 min-h-0">
                <AnimatePresence>
                  {items.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-48 text-center"
                    >
                      <div className="text-5xl mb-4">🍔</div>
                      <p className="text-[14px] font-bold text-black/20 uppercase tracking-widest">Carrello vuoto</p>
                      <p className="text-[12px] text-black/15 mt-1 font-medium">Aggiungi qualcosa dal menu</p>
                    </motion.div>
                  ) : (
                    items.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onRemove={() => onRemove(item.id)}
                        onUpdateQty={onUpdateQty ? (delta) => onUpdateQty(item.id, delta) : undefined}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Footer step 1 */}
              <div className="shrink-0 bg-white border-t border-black/6 px-5 pt-4 pb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold uppercase tracking-wide text-black/40">Totale</span>
                  <span className="text-[28px] font-bold text-[#A8456B] tabular-nums leading-none">€{total.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setStep('checkout')}
                  disabled={items.length === 0}
                  className="w-full py-4 rounded-2xl bg-[#1a0a10] text-white text-[13px] font-bold uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-[#A8456B] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Procedi all'ordine
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 min-h-0">
                {/* Order type */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/30 mb-2.5">Modalità ordine</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['asporto', 'consegna'] as OrderType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setOrderType(type)}
                        className={`py-3.5 text-[12px] font-bold uppercase tracking-wide rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-1.5 ${
                          orderType === type
                            ? 'border-[#CF6990] bg-[#FBE8EF] text-[#A8456B]'
                            : 'border-black/10 bg-black/3 text-black/35 hover:border-[#CF6990]/40'
                        }`}
                      >
                        <span className="text-[20px]">{type === 'asporto' ? '🥡' : '🛵'}</span>
                        {type === 'asporto' ? 'Asporto' : 'Consegna'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nome (solo asporto) */}
                <AnimatePresence>
                  {orderType === 'asporto' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/30 mb-2">Nome per il ritiro</p>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Il tuo nome…"
                        className="w-full rounded-xl border border-black/10 bg-[#F2F2F7] px-4 py-3 text-[14px] font-medium focus:outline-none focus:border-[#CF6990] focus:bg-white placeholder-black/20 transition-all"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Orario */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/30 mb-2">Orario preferito</p>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-[#F2F2F7] px-4 py-3 text-[14px] font-medium focus:outline-none focus:border-[#CF6990] focus:bg-white text-black/55 transition-all"
                  />
                </div>

                {/* Riepilogo ordine */}
                <div className="bg-white rounded-2xl border border-black/6 px-4 py-3 space-y-1.5" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/30 mb-2">Riepilogo</p>
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-black/60 font-medium truncate">
                        {item.type === 'burger' ? item.burger.name : item.type === 'fry' ? `${item.fry.name} ×${item.qty}` : `${(item as CartExtra).name} ×${item.qty}`}
                      </span>
                      <span className="text-[12px] font-bold text-[#1a0a10] tabular-nums shrink-0">€{item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-black/6 pt-2 mt-2 flex items-center justify-between">
                    <span className="text-[13px] font-bold text-black/50 uppercase tracking-wide">Totale</span>
                    <span className="text-[20px] font-bold text-[#A8456B] tabular-nums leading-none">€{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer step 2 */}
              <div className="shrink-0 bg-white border-t border-black/6 px-5 pt-4 pb-6 space-y-3">
                {user ? (
                  <>
                    <button
                      onClick={handleWhatsApp}
                      disabled={items.length === 0}
                      className="w-full py-4 rounded-2xl bg-[#25D366] text-white text-[13px] font-bold uppercase tracking-wide flex items-center justify-center gap-3 hover:bg-[#1ebe5d] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Conferma su WhatsApp
                    </button>
                    <p className="text-[11px] text-black/20 text-center font-medium">Il messaggio sarà già precompilato</p>
                  </>
                ) : (
                  <div className="rounded-2xl border border-[#CF6990]/30 bg-[#FBE8EF]/60 px-4 py-4 text-center space-y-3">
                    <p className="text-[13px] font-semibold text-[#a8456b]">Devi accedere per ordinare</p>
                    <p className="text-[11px] text-black/40">Il login ci aiuta a tenere traccia degli ordini ed evitare richieste false.</p>
                    <a href="/login"
                      className="inline-block px-5 py-2.5 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.2em] font-semibold rounded-xl hover:bg-[#CF6990] transition-colors">
                      Accedi / Registrati
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
