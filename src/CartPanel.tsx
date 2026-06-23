import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CartItem, CartExtra } from './cartTypes';
import { saveOrder } from './lib/orders';
import { getStoredUser } from './lib/supabase';
import { incrementOrderCount } from './lib/gamification';

interface Props {
  items: CartItem[];
  onRemove: (id: string) => void;
  onClose: () => void;
  onOrderSent?: (items: CartItem[]) => void;
}

type OrderType = 'asporto' | 'consegna';

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

function ItemCard({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const isExtra = item.type === 'extra';
  const isFry = item.type === 'fry';
  const isBurger = item.type === 'burger';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl border border-black/6 overflow-hidden"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
    >
      <div className="px-4 py-4">
        {isBurger ? (
          <>
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex-1 min-w-0">
                <span className="text-[15px] font-bold text-[#1a0a10] uppercase tracking-tight leading-tight block mb-1.5">{item.burger.name}</span>
                <div className="flex flex-wrap gap-1.5">
                  {item.size && (
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#A8456B] bg-[#FBE8EF] px-2 py-0.5 rounded-full">
                      {item.size === 'single' ? 'Singolo' : item.size === 'double' ? 'Doppio' : 'Triplo'}
                    </span>
                  )}
                  {item.combo && (
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#8B6914] bg-[#FFF3CC] px-2 py-0.5 rounded-full">
                      Combo
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[17px] font-bold text-[#A8456B] shrink-0 tabular-nums">€{item.totalPrice.toFixed(2)}</span>
            </div>
            {item.combo && item.drink && (
              <p className="text-[12px] text-black/40 mt-1">🥤 {item.drink}{item.drinkExtra > 0 ? ` +€${item.drinkExtra}` : ''}</p>
            )}
            {item.removed.length > 0 && (
              <p className="text-[12px] text-black/40 mt-0.5">Senza: {item.removed.join(', ')}</p>
            )}
            {item.extras.length > 0 && (
              <p className="text-[12px] text-black/40 mt-0.5">+ {item.extras.join(', ')}</p>
            )}
          </>
        ) : isFry ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[15px] font-bold text-[#1a0a10] uppercase tracking-tight">{item.fry.name}</span>
              <span className="ml-2 text-[12px] font-semibold text-black/35">×{item.qty}</span>
            </div>
            <span className="text-[17px] font-bold text-[#A8456B] tabular-nums">€{item.totalPrice.toFixed(2)}</span>
          </div>
        ) : isExtra ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wide text-black/30 bg-black/6 px-2 py-0.5 rounded-full shrink-0">
                {(item as CartExtra).category === 'salsa' ? 'Salsa' : 'Drink'}
              </span>
              <span className="text-[15px] font-bold text-[#1a0a10] truncate">{(item as CartExtra).name}</span>
              <span className="text-[12px] font-semibold text-black/35 shrink-0">×{item.qty}</span>
            </div>
            <span className="text-[17px] font-bold text-[#A8456B] tabular-nums ml-2 shrink-0">€{item.totalPrice.toFixed(2)}</span>
          </div>
        ) : null}
      </div>
      <div className="border-t border-black/5 px-4 py-2 flex justify-end">
        <button
          onClick={onRemove}
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-black/25 hover:text-red-400 transition-colors py-0.5"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Rimuovi
        </button>
      </div>
    </motion.div>
  );
}

export default function CartPanel({ items, onRemove, onClose, onOrderSent }: Props) {
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
              <h3 className="text-[22px] font-bold text-[#1a0a10] tracking-tight">Carrello</h3>
              {items.length > 0 && (
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
          <p className="text-[12px] font-semibold text-black/30 uppercase tracking-widest">Il tuo ordine</p>
        </div>

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
                <ItemCard key={item.id} item={item} onRemove={() => onRemove(item.id)} />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-white border-t border-black/6 px-5 pt-5 pb-6 space-y-4">

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

          {/* Totale */}
          <div className="flex items-center justify-between pt-1 border-t border-black/6">
            <span className="text-[14px] font-bold uppercase tracking-wide text-black/40">Totale</span>
            <span className="text-[28px] font-bold text-[#A8456B] tabular-nums leading-none">€{total.toFixed(2)}</span>
          </div>

          {/* WhatsApp / Login gate */}
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
                Invia ordine su WhatsApp
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
    </div>
  );
}
