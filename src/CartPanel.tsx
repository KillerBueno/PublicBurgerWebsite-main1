import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CartItem, CartExtra } from './cartTypes';
import { saveOrder } from './lib/orders';
import { getStoredUser } from './lib/supabase';

interface Props {
  items: CartItem[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

type OrderType = 'asporto' | 'consegna';

const WHATSAPP_NUMBER = '393420006928';

function buildWhatsAppMessage(items: CartItem[], orderType: OrderType, name: string, time: string): string {
  const sizeLabel = (s: string | null) =>
    s ? ({ single: 'Singolo', double: 'Doppio', triple: 'Triplo' } as Record<string, string>)[s] : '';

  const orderLabel = orderType === 'asporto'
    ? `Asporto${name ? ` — Nome: ${name}` : ''}${time ? ` — Orario richiesto: ${time}` : ''}`
    : `Consegna a domicilio${time ? ` — Orario richiesto: ${time}` : ''}`;
  const total = items.reduce((s, i) => s + i.totalPrice, 0);

  const itemLines = items.map((item, i) => {
    if (item.type === 'burger') {
      const size = sizeLabel(item.size);
      let line = `${i + 1}. ${item.burger.name}${size ? ` (${size})` : ''}`;
      if (item.combo) line += ` — Combo`;
      if (item.combo && item.drink) line += ` con ${item.drink}${item.drinkExtra > 0 ? ` (+€${item.drinkExtra})` : ''}`;
      if (item.removed.length) line += `\n   Senza: ${item.removed.join(', ')}`;
      if (item.extras.length) line += `\n   Aggiunte: ${item.extras.join(', ')}`;
      line += `  —  €${item.totalPrice.toFixed(2)}`;
      return line;
    } else if (item.type === 'fry') {
      return `${i + 1}. ${item.fry.name} x${item.qty}  —  €${item.totalPrice.toFixed(2)}`;
    } else {
      return `${i + 1}. ${item.name} x${item.qty}  —  €${item.totalPrice.toFixed(2)}`;
    }
  });

  return [
    `Ciao! Vorrei ordinare da Public Burger.`,
    ``,
    `*Il mio ordine:*`,
    itemLines.join('\n'),
    ``,
    `*Totale: €${total.toFixed(2)}*`,
    ``,
    `*${orderLabel}*`,
    ``,
    `Grazie mille!`,
  ].join('\n');
}

export default function CartPanel({ items, onRemove, onClose }: Props) {
  const [orderType, setOrderType] = useState<OrderType>('asporto');
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const total = items.reduce((s, i) => s + i.totalPrice, 0);

  function handleWhatsApp() {
    const msg = buildWhatsAppMessage(items, orderType, name.trim(), time.trim());
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    // Save order to Supabase
    const user = getStoredUser();
    saveOrder({
      customer_name: name.trim() || user?.name || 'Anonimo',
      order_type: orderType === 'consegna' ? 'domicilio' : 'asporto',
      items: items.map(item => {
        if (item.type === 'burger') return {
          type: 'burger', name: item.burger.name,
          size: item.size ?? undefined, removed: item.removed, extras: item.extras,
          price: item.totalPrice,
        };
        if (item.type === 'fry') return { type: 'fry', name: item.fry.name, qty: item.qty, price: item.totalPrice };
        return { type: 'extra', name: (item as CartExtra).name, qty: (item as CartExtra).qty, price: item.totalPrice };
      }),
      total,
      user_email: user?.email ?? null,
      user_name: user?.name ?? null,
      notes: time.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Overlay */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="relative w-full max-w-sm bg-white flex flex-col shadow-2xl rounded-l-3xl overflow-hidden"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-black/8 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#CF6990] font-semibold">Il tuo ordine</p>
            <h3 className="text-lg font-semibold uppercase tracking-tight mt-0.5">
              Carrello {items.length > 0 && <span className="text-[#CF6990]">({items.length})</span>}
            </h3>
          </div>
          <button onClick={onClose} className="text-black/30 hover:text-black text-2xl leading-none">×</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
          <AnimatePresence>
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-40 text-center"
              >
                <div className="text-4xl mb-3">🍔</div>
                <p className="text-sm uppercase tracking-widest text-black/30">Carrello vuoto</p>
              </motion.div>
            ) : (
              items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="rounded-2xl border border-black/6 p-4 shadow-sm"
                >
                  {item.type === 'burger' ? (
                    <>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-xs uppercase tracking-widest font-semibold">{item.burger.name}</span>
                          {item.size && (
                            <span className="text-[10px] uppercase tracking-wider text-[#CF6990] bg-[#FBE8EF] px-2 py-0.5">
                              {item.size === 'single' ? 'Singolo' : item.size === 'double' ? 'Doppio' : 'Triplo'}
                            </span>
                          )}
                          {item.combo && (
                            <span className="text-[10px] uppercase tracking-wider text-black bg-[#F2C438] px-2 py-0.5">
                              Combo
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-[#A8456B] shrink-0">€{item.totalPrice.toFixed(2)}</span>
                      </div>
                      {item.combo && item.drink && (
                        <p className="text-xs text-black/40">🥤 {item.drink}{item.drinkExtra > 0 ? ` (+€${item.drinkExtra})` : ''}</p>
                      )}
                      {item.removed.length > 0 && (
                        <p className="text-xs text-black/40 mt-0.5">❌ Senza: {item.removed.join(', ')}</p>
                      )}
                      {item.extras.length > 0 && (
                        <p className="text-xs text-black/40 mt-0.5">➕ {item.extras.join(', ')}</p>
                      )}
                    </>
                  ) : item.type === 'fry' ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase tracking-widest font-semibold">{item.fry.name}</span>
                        <span className="ml-2 text-[10px] text-black/40">x{item.qty}</span>
                      </div>
                      <span className="text-sm font-semibold text-[#A8456B]">€{item.totalPrice.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-black/30 uppercase tracking-widest mr-2">
                          {(item as CartExtra).category === 'salsa' ? 'Salsa' : 'Bibita'}
                        </span>
                        <span className="text-xs uppercase tracking-widest font-semibold">{(item as CartExtra).name}</span>
                        <span className="ml-2 text-[10px] text-black/40">x{item.qty}</span>
                      </div>
                      <span className="text-sm font-semibold text-[#A8456B]">€{item.totalPrice.toFixed(2)}</span>
                    </div>
                  )}
                  <button
                    onClick={() => onRemove(item.id)}
                    className="mt-3 text-[10px] uppercase tracking-widest text-black/25 hover:text-red-400 transition-colors"
                  >
                    Rimuovi
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-black/8 shrink-0 bg-white space-y-4">

          {/* Asporto / Consegna */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 mb-2">Modalità ordine</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrderType('asporto')}
                className={`py-3 text-[10px] uppercase tracking-widest font-bold rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                  orderType === 'asporto' ? 'border-[#CF6990] bg-[#FBE8EF] text-[#A8456B]' : 'border-black/10 text-black/40 hover:border-[#CF6990]/40'
                }`}
              >
                <span className="text-lg">🥡</span>
                Asporto
              </button>
              <button
                onClick={() => setOrderType('consegna')}
                className={`py-3 text-[10px] uppercase tracking-widest font-bold border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                  orderType === 'consegna' ? 'border-[#CF6990] bg-[#FBE8EF] text-[#A8456B]' : 'border-black/10 text-black/40 hover:border-[#CF6990]/40'
                }`}
              >
                <span className="text-lg">🛵</span>
                Consegna
              </button>
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
                <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 mb-2">Nome per il ritiro</p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Il tuo nome..."
                  className="w-full rounded-xl border border-black/15 px-4 py-3 text-sm focus:outline-none focus:border-[#CF6990] placeholder-black/25 uppercase tracking-wide"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Orario */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 mb-2">Orario preferito</p>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-black/15 px-4 py-3 text-sm focus:outline-none focus:border-[#CF6990] text-black/70 tracking-wide"
            />
            <p className="text-[10px] text-black/30 mt-1.5 leading-relaxed">
              Gli orari sono indicativi e possono variare in base alla disponibilità del locale.
            </p>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-black/40">Totale</span>
            <span className="text-2xl font-semibold text-[#A8456B]">€{total.toFixed(2)}</span>
          </div>

          {/* WhatsApp button */}
          <button
            onClick={handleWhatsApp}
            disabled={items.length === 0}
            className="w-full py-4 rounded-2xl bg-[#25D366] text-white text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-3 hover:bg-[#1ebe5d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Invia ordine su WhatsApp
          </button>
          <p className="text-[10px] text-black/25 text-center uppercase tracking-wider">
            Il messaggio sarà già precompilato — premi solo Invia
          </p>
        </div>
      </motion.div>
    </div>
  );
}
