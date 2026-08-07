import { useEffect, useState } from 'react';
import { fetchSetting, updateSetting, type PriceOverrides } from './lib/settings';
import {
  normalizeMenu, defaultMenu, sizesFromSingle, emptyBurger, emptyFry,
  ALLERGEN_OPTIONS, SIZE_ADD,
  type CustomMenu, type BurgerDef, type FryDef, type DrinkItem,
} from './lib/menu';

type Group = 'burger' | 'fritti' | 'bibite' | 'salse' | 'aggiunte';

const GROUPS: { key: Group; label: string }[] = [
  { key: 'burger', label: 'Burger' },
  { key: 'fritti', label: 'Fritti' },
  { key: 'bibite', label: 'Bibite' },
  { key: 'salse', label: 'Salse' },
  { key: 'aggiunte', label: 'Aggiunte' },
];

const TAGS = ['Slow', 'Bold', 'Spicy', 'Classic', 'Signature', 'Veggie', 'Extra', 'American', 'Chicken'];

const inputCls =
  'w-full border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]';
const labelCls = 'block text-[9px] uppercase tracking-widest text-black/35 mb-1';

// ─── Editor lista di stringhe (ingredienti / salse / aggiunte) ─────────────────
function StringList({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');
  function add() {
    const v = draft.trim();
    if (!v || items.includes(v)) { setDraft(''); return; }
    onChange([...items, v]);
    setDraft('');
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 bg-[#FBE8EF] text-[#a8456b] text-[12px] rounded-full pl-3 pr-1.5 py-1">
            {it}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="w-4 h-4 rounded-full bg-[#a8456b]/15 hover:bg-[#a8456b]/30 flex items-center justify-center text-[10px] leading-none">×</button>
          </span>
        ))}
        {items.length === 0 && <span className="text-[11px] text-black/25 italic">nessuno</span>}
      </div>
      <div className="flex gap-2">
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder} className={inputCls} />
        <button onClick={add} className="shrink-0 px-4 rounded-xl bg-[#1a0a10] text-white text-[11px] uppercase tracking-wider hover:bg-[#CF6990] transition-colors">Aggiungi</button>
      </div>
    </div>
  );
}

function AllergenPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALLERGEN_OPTIONS.map(({ n, label }) => {
        const on = value.includes(n);
        return (
          <button key={n} onClick={() => onChange(on ? value.filter(x => x !== n) : [...value, n].sort((a, b) => a - b))}
            className={`text-[11px] px-2 py-1 rounded-lg border transition-colors ${on ? 'bg-[#CF6990] text-white border-[#CF6990]' : 'bg-white text-black/40 border-black/10 hover:border-[#CF6990]/40'}`}>
            {n}. {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Card burger ───────────────────────────────────────────────────────────────
function BurgerCard({ burger, onChange, onDelete }: { burger: BurgerDef; onChange: (b: BurgerDef) => void; onDelete: () => void }) {
  const hasSizes = burger.prices !== null;
  const single = hasSizes ? burger.prices!.single : (burger.fixedPrice ?? 0);

  function setSingle(v: number) {
    if (hasSizes) onChange({ ...burger, prices: sizesFromSingle(v), fixedPrice: undefined });
    else onChange({ ...burger, fixedPrice: v, prices: null });
  }
  function setHasSizes(next: boolean) {
    if (next) onChange({ ...burger, prices: sizesFromSingle(single), fixedPrice: undefined });
    else onChange({ ...burger, prices: null, fixedPrice: single });
  }

  return (
    <div className="bg-white rounded-2xl border border-black/6 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <input value={burger.name} onChange={e => onChange({ ...burger, name: e.target.value })} placeholder="Nome burger" className={inputCls} />
        <button onClick={onDelete} className="shrink-0 text-[9px] uppercase tracking-widest text-red-400 hover:text-red-600 mt-2">Elimina</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Categoria</label>
          <select value={burger.tag} onChange={e => onChange({ ...burger, tag: e.target.value })} className={inputCls}>
            {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 mt-5 text-sm text-black/60">
          <input type="checkbox" checked={burger.spicy} onChange={e => onChange({ ...burger, spicy: e.target.checked })} />
          Piccante 🌶️
        </label>
      </div>

      <div>
        <label className={labelCls}>Ingredienti (descrizione)</label>
        <StringList items={burger.ingredients} onChange={v => onChange({ ...burger, ingredients: v })} placeholder="Aggiungi ingrediente…" />
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <label className={labelCls}>Prezzo {hasSizes ? 'Singolo' : 'fisso'} (€)</label>
          <input type="number" step="0.5" min="0" value={single}
            onChange={e => setSingle(parseFloat(e.target.value) || 0)} className={inputCls} />
        </div>
        <label className="flex items-center gap-2 mb-2 text-sm text-black/60">
          <input type="checkbox" checked={hasSizes} onChange={e => setHasSizes(e.target.checked)} />
          Taglie S/D/T
        </label>
      </div>
      {hasSizes && (
        <p className="text-[11px] text-black/35 -mt-1">
          Doppio €{sizesFromSingle(single).double.toFixed(2)} · Triplo €{sizesFromSingle(single).triple.toFixed(2)}
          <span className="text-black/25"> (incrementi standard +{SIZE_ADD.double} / +{SIZE_ADD.triple})</span>
        </p>
      )}

      <div>
        <label className={labelCls}>Allergeni</label>
        <AllergenPicker value={burger.allergens} onChange={v => onChange({ ...burger, allergens: v })} />
      </div>
    </div>
  );
}

function FryCard({ fry, onChange, onDelete }: { fry: FryDef; onChange: (f: FryDef) => void; onDelete: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-black/6 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <input value={fry.name} onChange={e => onChange({ ...fry, name: e.target.value })} placeholder="Nome" className={inputCls} />
        <button onClick={onDelete} className="shrink-0 text-[9px] uppercase tracking-widest text-red-400 hover:text-red-600 mt-2">Elimina</button>
      </div>
      <div>
        <label className={labelCls}>Descrizione</label>
        <input value={fry.desc} onChange={e => onChange({ ...fry, desc: e.target.value })} placeholder="Descrizione" className={inputCls} />
      </div>
      {fry.variants?.length ? (
        <div>
          <label className={labelCls}>Formati e prezzi</label>
          <div className="space-y-2">
            {fry.variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={v.label} placeholder="Es. 6 pezzi"
                  onChange={e => setFryVariants(fry, onChange, fry.variants!.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  className={inputCls} />
                <div className="flex items-center border border-black/12 rounded-xl overflow-hidden bg-[#fdf5f8] max-w-[110px] shrink-0">
                  <span className="px-2 text-black/30 text-sm">€</span>
                  <input type="number" step="0.5" min="0" value={v.price}
                    onChange={e => setFryVariants(fry, onChange, fry.variants!.map((x, j) => j === i ? { ...x, price: parseFloat(e.target.value) || 0 } : x))}
                    className="flex-1 py-2 pr-1 text-sm focus:outline-none bg-transparent w-0 min-w-0" />
                </div>
                <button onClick={() => setFryVariants(fry, onChange, fry.variants!.filter((_, j) => j !== i))}
                  className="shrink-0 w-6 h-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 text-sm leading-none">×</button>
              </div>
            ))}
          </div>
          <button onClick={() => setFryVariants(fry, onChange, [...fry.variants!, { label: '', price: 0 }])}
            className="mt-2 text-[11px] text-[#a8456b] font-semibold hover:underline">+ Aggiungi formato</button>
          <p className="text-[10px] text-black/30 mt-1">Il cliente sceglie il formato; in lista compare "da {prezzo minimo}".</p>
        </div>
      ) : (
        <div>
          <label className={labelCls}>Prezzo (€)</label>
          <input type="number" step="0.5" min="0" value={fry.price} onChange={e => onChange({ ...fry, price: parseFloat(e.target.value) || 0 })} className={`${inputCls} max-w-[120px]`} />
          <button onClick={() => setFryVariants(fry, onChange, [{ label: '', price: fry.price }])}
            className="block mt-2 text-[11px] text-[#a8456b] font-semibold hover:underline">+ Aggiungi formati (es. 6/12/20 pz)</button>
        </div>
      )}
      <div>
        <label className={labelCls}>Allergeni</label>
        <AllergenPicker value={fry.allergens} onChange={v => onChange({ ...fry, allergens: v })} />
      </div>
    </div>
  );
}

// Aggiorna i formati di un contorno e tiene `price` = prezzo minimo (per il "da …").
// Rimuovendo tutti i formati si salva `[]` (scelta esplicita): così il ripristino
// automatico dei default non li riaggiunge.
function setFryVariants(fry: FryDef, onChange: (f: FryDef) => void, variants: { label: string; price: number }[]) {
  if (!variants.length) {
    onChange({ ...fry, variants: [] });
    return;
  }
  const min = Math.min(...variants.map(v => v.price));
  onChange({ ...fry, variants, price: min });
}

function DrinkCard({ drink, onChange, onDelete }: { drink: DrinkItem; onChange: (d: DrinkItem) => void; onDelete: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-black/6 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <input value={drink.name} onChange={e => onChange({ ...drink, name: e.target.value })} placeholder="Nome bibita" className={inputCls} />
        <button onClick={onDelete} className="shrink-0 text-[9px] uppercase tracking-widest text-red-400 hover:text-red-600 mt-2">Elimina</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Prezzo singolo (€)</label>
          <input type="number" step="0.5" min="0" value={drink.price} onChange={e => onChange({ ...drink, price: parseFloat(e.target.value) || 0 })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Suppl. nel combo (€)</label>
          <input type="number" step="0.5" min="0" value={drink.comboExtra ?? 0} onChange={e => onChange({ ...drink, comboExtra: parseFloat(e.target.value) || 0 })} className={inputCls} />
        </div>
      </div>
      <p className="text-[10px] text-black/30">0 = inclusa nel combo. Es. birre: +€1. Tutte le bibite compaiono nella scelta del combo.</p>
    </div>
  );
}

// ─── Tab principale ────────────────────────────────────────────────────────────
export default function MenuEditorTab({ adminToken }: { adminToken: string }) {
  const [menu, setMenu] = useState<CustomMenu | null>(null);
  const [group, setGroup] = useState<Group>('burger');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchSetting<Partial<CustomMenu>>('custom_menu').then(v => setMenu(normalizeMenu(v)));
  }, []);

  function edit(patch: Partial<CustomMenu>) {
    setMenu(m => m ? { ...m, ...patch } : m);
    setDirty(true);
  }

  async function save() {
    if (!menu) return;
    // Scarta burger/voci senza nome per non sporcare il menu.
    const clean: CustomMenu = {
      burgers: menu.burgers.filter(b => b.name.trim()),
      fries: menu.fries.filter(f => f.name.trim()).map(f => {
        // Scarta i formati senza nome. Distinzione importante: `undefined` = mai
        // avuti (il ripristino può riaggiungerli), `[]` = rimossi apposta (rispettato).
        if (f.variants === undefined) return f;
        return { ...f, variants: f.variants.filter(v => v.label.trim()) };
      }),
      drinks: menu.drinks.filter(d => d.name.trim()),
      extras: menu.extras.map(s => s.trim()).filter(Boolean),
      salse: menu.salse.map(s => s.trim()).filter(Boolean),
    };
    setSaving(true);
    try {
      await updateSetting(adminToken, 'custom_menu', clean);
      // L'editor è la fonte autorevole dei prezzi: azzera eventuali override
      // rapidi (tab Disponibilità) sui prodotti del menu, altrimenti un vecchio
      // override continuerebbe a mascherare il prezzo appena impostato qui.
      const names = new Set<string>([...clean.burgers.map(b => b.name), ...clean.fries.map(f => f.name)]);
      const po = (await fetchSetting<PriceOverrides>('price_overrides')) ?? {};
      const cleanedPo: PriceOverrides = {};
      let removed = false;
      for (const [k, v] of Object.entries(po)) {
        if (names.has(k)) removed = true; else cleanedPo[k] = v;
      }
      if (removed) await updateSetting(adminToken, 'price_overrides', cleanedPo);
      setMenu(clean);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert('Errore nel salvataggio del menu.\n' + (e instanceof Error ? e.message : ''));
    }
    setSaving(false);
  }

  function resetToDefault() {
    if (!confirm('Ripristinare il menu originale? Le modifiche personalizzate verranno perse al prossimo salvataggio.')) return;
    setMenu(defaultMenu());
    setDirty(true);
  }

  if (!menu) return <div className="p-8 text-center text-black/30 text-sm">Caricamento menu…</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto pb-32 space-y-4">
      <div className="bg-[#FBE8EF]/60 rounded-2xl px-4 py-3 text-[11px] text-[#a8456b] space-y-1">
        <p>Modifica il menu vero e proprio (nomi, ingredienti, prezzi, aggiunte). Le modifiche si applicano al sito d'ordinazione dopo il salvataggio. Il cartellone in sala (/display) non è ancora collegato.</p>
        <p className="text-[#a8456b]/80">Il prezzo impostato qui è quello ufficiale: salvando, eventuali ritocchi rapidi fatti nel tab <strong>Disponibilità</strong> vengono azzerati.</p>
      </div>

      {/* Sotto-nav gruppi */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {GROUPS.map(g => (
          <button key={g.key} onClick={() => setGroup(g.key)}
            className={`shrink-0 px-3 py-2 rounded-xl text-[12px] font-semibold transition-colors ${group === g.key ? 'bg-[#1a0a10] text-white' : 'bg-white text-black/40 border border-black/8'}`}>
            {g.label}
          </button>
        ))}
      </div>

      {group === 'burger' && (
        <div className="space-y-3">
          {menu.burgers.map((b, i) => (
            <BurgerCard key={i} burger={b}
              onChange={nb => edit({ burgers: menu.burgers.map((x, j) => j === i ? nb : x) })}
              onDelete={() => edit({ burgers: menu.burgers.filter((_, j) => j !== i) })} />
          ))}
          <button onClick={() => edit({ burgers: [...menu.burgers, emptyBurger()] })}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-[#CF6990]/40 text-[#a8456b] text-sm font-semibold hover:bg-[#FBE8EF]/40 transition-colors">
            + Aggiungi burger
          </button>
        </div>
      )}

      {group === 'fritti' && (
        <div className="space-y-3">
          {menu.fries.map((f, i) => (
            <FryCard key={i} fry={f}
              onChange={nf => edit({ fries: menu.fries.map((x, j) => j === i ? nf : x) })}
              onDelete={() => edit({ fries: menu.fries.filter((_, j) => j !== i) })} />
          ))}
          <button onClick={() => edit({ fries: [...menu.fries, emptyFry()] })}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-[#CF6990]/40 text-[#a8456b] text-sm font-semibold hover:bg-[#FBE8EF]/40 transition-colors">
            + Aggiungi fritto / appetizer
          </button>
        </div>
      )}

      {group === 'bibite' && (
        <div className="space-y-3">
          {menu.drinks.map((d, i) => (
            <DrinkCard key={i} drink={d}
              onChange={nd => edit({ drinks: menu.drinks.map((x, j) => j === i ? nd : x) })}
              onDelete={() => edit({ drinks: menu.drinks.filter((_, j) => j !== i) })} />
          ))}
          <button onClick={() => edit({ drinks: [...menu.drinks, { name: '', price: 0 }] })}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-[#CF6990]/40 text-[#a8456b] text-sm font-semibold hover:bg-[#FBE8EF]/40 transition-colors">
            + Aggiungi bibita
          </button>
        </div>
      )}

      {group === 'salse' && (
        <div className="bg-white rounded-2xl border border-black/6 shadow-sm p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-black/30 mb-3">Salse vendute a parte (+€0,50)</p>
          <StringList items={menu.salse} onChange={v => edit({ salse: v })} placeholder="Aggiungi salsa…" />
        </div>
      )}

      {group === 'aggiunte' && (
        <div className="bg-white rounded-2xl border border-black/6 shadow-sm p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-black/30 mb-3">Aggiunte extra nel configuratore (+€1)</p>
          <StringList items={menu.extras} onChange={v => edit({ extras: v })} placeholder="Aggiungi ingrediente…" />
        </div>
      )}

      <button onClick={resetToDefault} className="text-[11px] text-black/30 hover:text-black/60 underline">
        Ripristina menu originale
      </button>

      {/* Barra salvataggio fissa */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-black/8 px-4 py-3 z-20">
        <div className="max-w-2xl mx-auto">
          <button onClick={save} disabled={saving || !dirty}
            className="w-full py-3.5 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.25em] font-semibold rounded-2xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
            {saved ? '✓ Menu salvato' : saving ? 'Salvataggio…' : dirty ? 'Salva menu' : 'Nessuna modifica'}
          </button>
        </div>
      </div>
    </div>
  );
}
