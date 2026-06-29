import { useState, useEffect, useMemo } from 'react';
import { fetchSetting, updateSetting } from './lib/settings';

// ─── Seed Data (dal menu Public Burger) ───────────────────────────────────────

const I = {
  BUN_CLASSICO:     'fc-i-001',
  BRIOCHE:          'fc-i-002',
  PIADINA:          'fc-i-003',
  MANZO:            'fc-i-004',
  CHICKEN:          'fc-i-005',
  VEGETALE:         'fc-i-006',
  CHEDDAR:          'fc-i-007',
  BACON:            'fc-i-008',
  SCAMORZA:         'fc-i-009',
  INSALATA:         'fc-i-010',
  POMODORO:         'fc-i-011',
  CIPOLLA_CARAM:    'fc-i-012',
  CROCCHETTE:       'fc-i-013',
  PICKLES:          'fc-i-014',
  CIPOLLA_GRIG:     'fc-i-015',
  UOVO:             'fc-i-016',
  MAIONESE:         'fc-i-017',
  KETCHUP:          'fc-i-018',
  BBQ:              'fc-i-019',
  PULLED:           'fc-i-020',
  COLESLAW:         'fc-i-021',
  SALSA_PUBLIC:     'fc-i-022',
  ANELLI_PANINO:    'fc-i-023',
};

const SEED_INGREDIENTS: FCIngredient[] = [
  { id: I.BUN_CLASSICO,  name: 'Bun classico',        unit: 'pz', cost_per_unit: 0.50, category: 'pane' },
  { id: I.BRIOCHE,       name: 'Brioche Bun',          unit: 'pz', cost_per_unit: 1.50, category: 'pane' },
  { id: I.PIADINA,       name: 'Piadina',              unit: 'pz', cost_per_unit: 0.29, category: 'pane' },
  { id: I.MANZO,         name: 'Hamburger di manzo',   unit: 'pz', cost_per_unit: 1.12, category: 'carne' },
  { id: I.CHICKEN,       name: 'Cotoletta di pollo',   unit: 'pz', cost_per_unit: 1.70, category: 'carne' },
  { id: I.PULLED,        name: 'Pulled pork',          unit: 'pz', cost_per_unit: 1.50, category: 'carne' },
  { id: I.VEGETALE,      name: 'Hamburger vegetale',   unit: 'pz', cost_per_unit: 2.65, category: 'carne' },
  { id: I.CHEDDAR,       name: 'Cheddar',              unit: 'pz', cost_per_unit: 0.22, category: 'formaggio' },
  { id: I.SCAMORZA,      name: 'Scamorza',             unit: 'pz', cost_per_unit: 0.24, category: 'formaggio' },
  { id: I.UOVO,          name: 'Uovo fritto',          unit: 'pz', cost_per_unit: 0.27, category: 'altro' },
  { id: I.BACON,         name: 'Bacon croccante',      unit: 'pz', cost_per_unit: 0.13, category: 'carne' },
  { id: I.COLESLAW,      name: 'Coleslaw',             unit: 'pz', cost_per_unit: 0.50, category: 'verdura' },
  { id: I.INSALATA,      name: 'Insalata iceberg',     unit: 'pz', cost_per_unit: 0.04, category: 'verdura' },
  { id: I.POMODORO,      name: 'Pomodoro',             unit: 'pz', cost_per_unit: 0.07, category: 'verdura' },
  { id: I.CIPOLLA_CARAM, name: 'Cipolla caramellata',  unit: 'pz', cost_per_unit: 0.63, category: 'verdura' },
  { id: I.CIPOLLA_GRIG,  name: 'Cipolla grigliata',   unit: 'pz', cost_per_unit: 0.00, category: 'verdura' },
  { id: I.CROCCHETTE,    name: 'Crocchette di patate', unit: 'pz', cost_per_unit: 0.09, category: 'altro' },
  { id: I.PICKLES,       name: 'Pickles',              unit: 'pz', cost_per_unit: 0.03, category: 'verdura' },
  { id: I.ANELLI_PANINO, name: 'Anelli di cipolla (panino)', unit: 'pz', cost_per_unit: 0.00, category: 'verdura' },
  { id: I.MAIONESE,      name: 'Maionese',             unit: 'pz', cost_per_unit: 0.11, category: 'salsa' },
  { id: I.KETCHUP,       name: 'Ketchup',              unit: 'pz', cost_per_unit: 0.10, category: 'salsa' },
  { id: I.BBQ,           name: 'Salsa BBQ',            unit: 'pz', cost_per_unit: 0.12, category: 'salsa' },
  { id: I.SALSA_PUBLIC,  name: 'Salsa Public',         unit: 'pz', cost_per_unit: 0.11, category: 'salsa' },
];

const SEED_RECIPES: FCRecipe[] = [
  {
    id: 'fc-r-001', name: 'Crocche (S)', selling_price: 8.50,
    ingredients: [
      { ingredient_id: I.BUN_CLASSICO, quantity: 1 },
      { ingredient_id: I.MANZO,        quantity: 1 },
      { ingredient_id: I.BACON,        quantity: 1 },
      { ingredient_id: I.SCAMORZA,     quantity: 1 },
      { ingredient_id: I.CROCCHETTE,   quantity: 1 },
      { ingredient_id: I.MAIONESE,     quantity: 1 },
      { ingredient_id: I.KETCHUP,      quantity: 1 },
    ],
  },
  {
    id: 'fc-r-002', name: 'Ingordo (S)', selling_price: 9.50,
    ingredients: [
      { ingredient_id: I.BUN_CLASSICO,  quantity: 1 },
      { ingredient_id: I.MANZO,         quantity: 1 },
      { ingredient_id: I.SCAMORZA,      quantity: 1 },
      { ingredient_id: I.CIPOLLA_CARAM, quantity: 1 },
      { ingredient_id: I.ANELLI_PANINO, quantity: 1 },
      { ingredient_id: I.MAIONESE,      quantity: 1 },
      { ingredient_id: I.BBQ,           quantity: 1 },
    ],
  },
  {
    id: 'fc-r-003', name: 'Pulled Pork (S)', selling_price: 11.50,
    ingredients: [
      { ingredient_id: I.BRIOCHE,  quantity: 1 },
      { ingredient_id: I.PULLED,   quantity: 1 },
      { ingredient_id: I.COLESLAW, quantity: 1 },
      { ingredient_id: I.BBQ,      quantity: 1 },
    ],
  },
  {
    id: 'fc-r-004', name: 'American Burger (S)', selling_price: 9.50,
    ingredients: [
      { ingredient_id: I.BUN_CLASSICO, quantity: 1 },
      { ingredient_id: I.MANZO,        quantity: 1 },
      { ingredient_id: I.CHEDDAR,      quantity: 1 },
      { ingredient_id: I.BACON,        quantity: 1 },
      { ingredient_id: I.UOVO,         quantity: 1 },
      { ingredient_id: I.BBQ,          quantity: 1 },
    ],
  },
  {
    id: 'fc-r-005', name: 'Oklahoma (S)', selling_price: 10.50,
    ingredients: [
      { ingredient_id: I.BRIOCHE,      quantity: 1 },
      { ingredient_id: I.MANZO,        quantity: 1 },
      { ingredient_id: I.CIPOLLA_GRIG, quantity: 1 },
      { ingredient_id: I.CHEDDAR,      quantity: 1 },
      { ingredient_id: I.BACON,        quantity: 1 },
      { ingredient_id: I.PICKLES,      quantity: 1 },
      { ingredient_id: I.SALSA_PUBLIC, quantity: 1 },
    ],
  },
  {
    id: 'fc-r-006', name: 'Original (S)', selling_price: 10.50,
    ingredients: [
      { ingredient_id: I.BRIOCHE,   quantity: 1 },
      { ingredient_id: I.MANZO,     quantity: 1 },
      { ingredient_id: I.CHEDDAR,   quantity: 1 },
      { ingredient_id: I.INSALATA,  quantity: 1 },
      { ingredient_id: I.POMODORO,  quantity: 1 },
      { ingredient_id: I.KETCHUP,   quantity: 1 },
      { ingredient_id: I.MAIONESE,  quantity: 1 },
    ],
  },
  {
    id: 'fc-r-007', name: '1991 Chicken (S)', selling_price: 8.50,
    ingredients: [
      { ingredient_id: I.BUN_CLASSICO, quantity: 1 },
      { ingredient_id: I.CHICKEN,      quantity: 1 },
      { ingredient_id: I.INSALATA,     quantity: 1 },
      { ingredient_id: I.POMODORO,     quantity: 1 },
      { ingredient_id: I.MAIONESE,     quantity: 1 },
    ],
  },
  {
    id: 'fc-r-008', name: 'Fake Burger (S)', selling_price: 14.00,
    ingredients: [
      { ingredient_id: I.BRIOCHE,  quantity: 1 },
      { ingredient_id: I.VEGETALE, quantity: 1 },
      { ingredient_id: I.CHEDDAR,  quantity: 1 },
      { ingredient_id: I.INSALATA, quantity: 1 },
      { ingredient_id: I.KETCHUP,  quantity: 1 },
      { ingredient_id: I.MAIONESE, quantity: 1 },
    ],
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FCIngredient {
  id: string;
  name: string;
  unit: 'g' | 'ml' | 'pz' | 'kg' | 'l';
  cost_per_unit: number; // € per unità base (g, ml, pz)
  category: 'carne' | 'pane' | 'salsa' | 'verdura' | 'formaggio' | 'altro';
}

export interface FCRecipeItem {
  ingredient_id: string;
  quantity: number;
}

export interface FCRecipe {
  id: string;
  name: string;
  selling_price: number;
  ingredients: FCRecipeItem[];
}

type SubTab = 'ingredienti' | 'ricette' | 'analisi';

const UNIT_LABELS: Record<FCIngredient['unit'], string> = {
  g: 'g', ml: 'ml', pz: 'pz', kg: 'kg', l: 'L',
};

const CATEGORY_LABELS: Record<FCIngredient['category'], string> = {
  carne: '🥩 Carne', pane: '🍞 Pane/Bun', salsa: '🫙 Salse',
  verdura: '🥬 Verdure', formaggio: '🧀 Formaggio', altro: '📦 Altro',
};

const CATEGORY_COLORS: Record<FCIngredient['category'], string> = {
  carne: 'bg-red-50 text-red-600 border-red-200',
  pane: 'bg-amber-50 text-amber-600 border-amber-200',
  salsa: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  verdura: 'bg-green-50 text-green-600 border-green-200',
  formaggio: 'bg-orange-50 text-orange-600 border-orange-200',
  altro: 'bg-gray-50 text-gray-500 border-gray-200',
};

// ─── Food Cost Benchmark ──────────────────────────────────────────────────────

function fcStatus(pct: number): { label: string; color: string; bg: string; emoji: string } {
  if (pct < 28)  return { label: 'Ottimo',     color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', emoji: '✅' };
  if (pct < 32)  return { label: 'Buono',      color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',       emoji: '🔵' };
  if (pct < 38)  return { label: 'Attenzione', color: 'text-orange-500',  bg: 'bg-orange-50 border-orange-200',   emoji: '🟠' };
  return           { label: 'Critico',   color: 'text-red-600',    bg: 'bg-red-50 border-red-200',         emoji: '🔴' };
}

function fmt2(n: number) { return n.toFixed(2).replace('.', ','); }

// ─── Ingredienti Sub-tab ──────────────────────────────────────────────────────

function IngredientiTab({
  ingredients, setIngredients, adminToken,
}: {
  ingredients: FCIngredient[];
  setIngredients: (v: FCIngredient[]) => void;
  adminToken: string;
}) {
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<FCIngredient>>({});
  const [newIng, setNewIng] = useState<Partial<FCIngredient>>({
    name: '', unit: 'g', cost_per_unit: 0, category: 'carne',
  });
  const [search, setSearch] = useState('');

  async function save(list: FCIngredient[]) {
    setSaving(true);
    try { await updateSetting(adminToken, 'food_cost_ingredients', list); setIngredients(list); }
    catch { alert('Errore salvataggio'); }
    setSaving(false);
  }

  function addIngredient() {
    if (!newIng.name?.trim() || !newIng.cost_per_unit) return;
    const item: FCIngredient = {
      id: crypto.randomUUID(),
      name: newIng.name.trim(),
      unit: newIng.unit ?? 'g',
      cost_per_unit: Number(newIng.cost_per_unit),
      category: newIng.category ?? 'altro',
    };
    const next = [...ingredients, item];
    save(next);
    setNewIng({ name: '', unit: 'g', cost_per_unit: 0, category: 'carne' });
  }

  function deleteIngredient(id: string) {
    if (!confirm('Eliminare questo ingrediente?')) return;
    save(ingredients.filter(i => i.id !== id));
  }

  function startEdit(ing: FCIngredient) {
    setEditId(ing.id);
    setEditData({ ...ing });
  }

  function saveEdit() {
    if (!editId) return;
    const next = ingredients.map(i => i.id === editId ? { ...i, ...editData } as FCIngredient : i);
    save(next);
    setEditId(null);
  }

  const filtered = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  const byCategory = Object.keys(CATEGORY_LABELS) as FCIngredient['category'][];

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Cerca ingrediente…"
        className="w-full border border-black/12 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#CF6990] bg-white"
      />

      {/* List grouped by category */}
      {byCategory.map(cat => {
        const items = filtered.filter(i => i.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="bg-white rounded-2xl border border-black/6 shadow-sm overflow-hidden">
            <p className="px-4 py-2.5 text-[10px] uppercase tracking-[0.25em] font-bold border-b border-black/6 text-[#CF6990]">
              {CATEGORY_LABELS[cat]}
            </p>
            {items.map(ing => (
              <div key={ing.id} className="px-4 py-3 border-b border-black/4 last:border-0">
                {editId === ing.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={editData.name ?? ''} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                        className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990]" placeholder="Nome" />
                      <select value={editData.category} onChange={e => setEditData(d => ({ ...d, category: e.target.value as FCIngredient['category'] }))}
                        className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990]">
                        {byCategory.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center border border-black/12 rounded-xl overflow-hidden focus-within:border-[#CF6990]">
                        <span className="px-2 text-black/30 text-sm">€</span>
                        <input type="number" step="0.001" min="0" value={editData.cost_per_unit ?? ''}
                          onChange={e => setEditData(d => ({ ...d, cost_per_unit: parseFloat(e.target.value) }))}
                          className="flex-1 py-2 pr-2 text-sm focus:outline-none" />
                      </div>
                      <select value={editData.unit} onChange={e => setEditData(d => ({ ...d, unit: e.target.value as FCIngredient['unit'] }))}
                        className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990]">
                        {Object.keys(UNIT_LABELS).map(u => <option key={u} value={u}>/{UNIT_LABELS[u as FCIngredient['unit']]}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} disabled={saving}
                        className="px-3 py-1.5 bg-[#1a0a10] text-white text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">Salva</button>
                      <button onClick={() => setEditId(null)}
                        className="px-3 py-1.5 border border-black/12 text-black/40 text-[10px] uppercase tracking-wider rounded-xl">Annulla</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a0a10]">{ing.name}</p>
                      <p className="text-[11px] text-black/40">
                        €{fmt2(ing.cost_per_unit)} / {UNIT_LABELS[ing.unit]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(ing)}
                        className="text-[10px] uppercase tracking-wider text-black/30 hover:text-[#CF6990] transition-colors">✏</button>
                      <button onClick={() => deleteIngredient(ing.id)}
                        className="text-[10px] uppercase tracking-wider text-black/30 hover:text-red-400 transition-colors">✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}

      {/* Add new ingredient */}
      <div className="bg-white rounded-2xl border border-[#CF6990]/30 shadow-sm p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#CF6990] font-bold">+ Nuovo ingrediente</p>
        <div className="grid grid-cols-2 gap-2">
          <input value={newIng.name ?? ''} onChange={e => setNewIng(d => ({ ...d, name: e.target.value }))}
            placeholder="Nome ingrediente"
            className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990]" />
          <select value={newIng.category} onChange={e => setNewIng(d => ({ ...d, category: e.target.value as FCIngredient['category'] }))}
            className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990]">
            {byCategory.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center border border-black/12 rounded-xl overflow-hidden focus-within:border-[#CF6990]">
            <span className="px-2 text-black/30 text-sm">€</span>
            <input type="number" step="0.001" min="0" value={newIng.cost_per_unit || ''}
              onChange={e => setNewIng(d => ({ ...d, cost_per_unit: parseFloat(e.target.value) }))}
              placeholder="Costo"
              className="flex-1 py-2 pr-2 text-sm focus:outline-none" />
          </div>
          <select value={newIng.unit} onChange={e => setNewIng(d => ({ ...d, unit: e.target.value as FCIngredient['unit'] }))}
            className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990]">
            {Object.keys(UNIT_LABELS).map(u => <option key={u} value={u}>per {UNIT_LABELS[u as FCIngredient['unit']]}</option>)}
          </select>
        </div>
        <button onClick={addIngredient} disabled={saving || !newIng.name?.trim()}
          className="w-full py-2.5 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.2em] font-semibold rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
          {saving ? 'Salvataggio…' : 'Aggiungi ingrediente'}
        </button>
      </div>
    </div>
  );
}

// ─── Ricette Sub-tab ──────────────────────────────────────────────────────────

function RicetteTab({
  ingredients, recipes, setRecipes, adminToken,
}: {
  ingredients: FCIngredient[];
  recipes: FCRecipe[];
  setRecipes: (v: FCRecipe[]) => void;
  adminToken: string;
}) {
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editRecipe, setEditRecipe] = useState<FCRecipe | null>(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  async function save(list: FCRecipe[]) {
    setSaving(true);
    try { await updateSetting(adminToken, 'food_cost_recipes', list); setRecipes(list); }
    catch { alert('Errore salvataggio'); }
    setSaving(false);
  }

  function calcCost(recipe: FCRecipe) {
    return recipe.ingredients.reduce((sum, ri) => {
      const ing = ingredients.find(i => i.id === ri.ingredient_id);
      if (!ing) return sum;
      return sum + ing.cost_per_unit * ri.quantity;
    }, 0);
  }

  function addRecipe() {
    if (!newName.trim()) return;
    const r: FCRecipe = {
      id: crypto.randomUUID(), name: newName.trim(),
      selling_price: parseFloat(newPrice) || 0, ingredients: [],
    };
    setEditId(r.id);
    setEditRecipe({ ...r });
    setRecipes([...recipes, r]);
    setNewName('');
    setNewPrice('');
  }

  function deleteRecipe(id: string) {
    if (!confirm('Eliminare questa ricetta?')) return;
    save(recipes.filter(r => r.id !== id));
  }

  function startEdit(r: FCRecipe) {
    setEditId(r.id);
    setEditRecipe({ ...r, ingredients: r.ingredients.map(i => ({ ...i })) });
  }

  function addIngToEdit(ingId: string) {
    if (!editRecipe) return;
    if (editRecipe.ingredients.find(i => i.ingredient_id === ingId)) return;
    setEditRecipe(r => r ? { ...r, ingredients: [...r.ingredients, { ingredient_id: ingId, quantity: 100 }] } : r);
  }

  function removeIngFromEdit(ingId: string) {
    if (!editRecipe) return;
    setEditRecipe(r => r ? { ...r, ingredients: r.ingredients.filter(i => i.ingredient_id !== ingId) } : r);
  }

  function setQty(ingId: string, qty: number) {
    if (!editRecipe) return;
    setEditRecipe(r => r ? { ...r, ingredients: r.ingredients.map(i => i.ingredient_id === ingId ? { ...i, quantity: qty } : i) } : r);
  }

  function saveEdit() {
    if (!editRecipe) return;
    save(recipes.map(r => r.id === editRecipe.id ? editRecipe : r));
    setEditId(null);
    setEditRecipe(null);
  }

  const editCost = editRecipe ? editRecipe.ingredients.reduce((sum, ri) => {
    const ing = ingredients.find(i => i.id === ri.ingredient_id);
    return sum + (ing ? ing.cost_per_unit * ri.quantity : 0);
  }, 0) : 0;
  const editFC = editRecipe?.selling_price ? (editCost / editRecipe.selling_price) * 100 : 0;
  const editStatus = editRecipe?.selling_price ? fcStatus(editFC) : null;

  return (
    <div className="space-y-4">
      {/* Existing recipes */}
      {recipes.map(r => {
        const cost = calcCost(r);
        const fc = r.selling_price ? (cost / r.selling_price) * 100 : 0;
        const st = r.selling_price ? fcStatus(fc) : null;
        const isEditing = editId === r.id;

        return (
          <div key={r.id} className="bg-white rounded-2xl border border-black/6 shadow-sm overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-black/6">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1a0a10] text-sm">{r.name}</p>
                <p className="text-[11px] text-black/35">
                  Costo: €{fmt2(cost)} · Vendita: €{fmt2(r.selling_price)}
                  {st && <span className={`ml-2 font-semibold ${st.color}`}>{st.emoji} FC {fmt2(fc)}%</span>}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => isEditing ? (setEditId(null), setEditRecipe(null)) : startEdit(r)}
                  className="text-[10px] uppercase tracking-wider text-black/30 hover:text-[#CF6990] transition-colors">
                  {isEditing ? 'Chiudi' : '✏ Modifica'}
                </button>
                <button onClick={() => deleteRecipe(r.id)}
                  className="text-[10px] uppercase tracking-wider text-black/30 hover:text-red-400 transition-colors">✕</button>
              </div>
            </div>

            {isEditing && editRecipe && (
              <div className="px-4 py-4 space-y-4 bg-[#fdf5f8]/60">
                {/* Prezzo vendita */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-black/30 mb-1.5">Prezzo di vendita</p>
                  <div className="flex items-center border border-black/12 rounded-xl overflow-hidden focus-within:border-[#CF6990] max-w-[140px] bg-white">
                    <span className="px-2 text-black/30 text-sm">€</span>
                    <input type="number" step="0.5" min="0" value={editRecipe.selling_price || ''}
                      onChange={e => setEditRecipe(r => r ? { ...r, selling_price: parseFloat(e.target.value) || 0 } : r)}
                      className="flex-1 py-2 pr-2 text-sm focus:outline-none" />
                  </div>
                </div>

                {/* Live cost preview */}
                {editRecipe.selling_price > 0 && (
                  <div className={`rounded-xl border px-3 py-2.5 ${editStatus?.bg ?? ''}`}>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-black/40 mb-0.5">Costo</p>
                        <p className="text-[15px] font-bold text-[#1a0a10]">€{fmt2(editCost)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-black/40 mb-0.5">Food Cost</p>
                        <p className={`text-[15px] font-bold ${editStatus?.color}`}>{fmt2(editFC)}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-black/40 mb-0.5">Margine</p>
                        <p className="text-[15px] font-bold text-emerald-600">€{fmt2(editRecipe.selling_price - editCost)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ingredienti in ricetta */}
                {editRecipe.ingredients.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-black/30 mb-2">Ingredienti in ricetta</p>
                    <div className="space-y-2">
                      {editRecipe.ingredients.map(ri => {
                        const ing = ingredients.find(i => i.id === ri.ingredient_id);
                        if (!ing) return null;
                        const subtotal = ing.cost_per_unit * ri.quantity;
                        return (
                          <div key={ri.ingredient_id} className="flex items-center gap-2 bg-white rounded-xl border border-black/8 px-3 py-2">
                            <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[ing.category]} shrink-0`}>
                              {ing.category}
                            </span>
                            <span className="flex-1 text-[12px] font-semibold text-[#1a0a10] truncate">{ing.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <input type="number" min="0" step="1" value={ri.quantity}
                                onChange={e => setQty(ri.ingredient_id, parseFloat(e.target.value) || 0)}
                                className="w-16 border border-black/12 rounded-lg px-2 py-1 text-[12px] text-center focus:outline-none focus:border-[#CF6990]" />
                              <span className="text-[10px] text-black/30 w-6">{UNIT_LABELS[ing.unit]}</span>
                            </div>
                            <span className="text-[11px] font-bold text-[#A8456B] w-14 text-right tabular-nums shrink-0">€{fmt2(subtotal)}</span>
                            <button onClick={() => removeIngFromEdit(ri.ingredient_id)}
                              className="text-black/20 hover:text-red-400 text-sm shrink-0">✕</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add ingredient */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-black/30 mb-2">Aggiungi ingrediente</p>
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {ingredients
                      .filter(i => !editRecipe.ingredients.find(ri => ri.ingredient_id === i.id))
                      .map(ing => (
                        <button key={ing.id} onClick={() => addIngToEdit(ing.id)}
                          className="flex items-center gap-1.5 text-left px-2.5 py-2 rounded-xl border border-black/8 hover:border-[#CF6990] hover:bg-[#FBE8EF]/30 transition-colors bg-white">
                          <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[ing.category]} shrink-0`}>
                            {ing.category.slice(0, 3)}
                          </span>
                          <span className="text-[11px] font-medium text-[#1a0a10] truncate">{ing.name}</span>
                        </button>
                      ))}
                  </div>
                </div>

                <button onClick={saveEdit} disabled={saving}
                  className="w-full py-3 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.2em] font-semibold rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
                  {saving ? 'Salvataggio…' : 'Salva ricetta'}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* New recipe */}
      <div className="bg-white rounded-2xl border border-[#CF6990]/30 shadow-sm p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#CF6990] font-bold">+ Nuova ricetta</p>
        <input value={newName} onChange={e => setNewName(e.target.value)}
          placeholder="Nome ricetta (es. Oklahoma, Cheeseburger…)"
          className="w-full border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990]" />
        <div className="flex items-center border border-black/12 rounded-xl overflow-hidden focus-within:border-[#CF6990] max-w-[180px]">
          <span className="px-2 text-black/30 text-sm">€</span>
          <input type="number" step="0.5" value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
            placeholder="Prezzo vendita"
            className="flex-1 py-2 pr-2 text-sm focus:outline-none" />
        </div>
        <button onClick={addRecipe} disabled={!newName.trim()}
          className="w-full py-2.5 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.2em] font-semibold rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
          Crea ricetta
        </button>
      </div>
    </div>
  );
}

// ─── Analisi Sub-tab ──────────────────────────────────────────────────────────

function AnalisiTab({ ingredients, recipes }: { ingredients: FCIngredient[]; recipes: FCRecipe[] }) {
  const analysis = useMemo(() => recipes.map(r => {
    const cost = r.ingredients.reduce((sum, ri) => {
      const ing = ingredients.find(i => i.id === ri.ingredient_id);
      return sum + (ing ? ing.cost_per_unit * ri.quantity : 0);
    }, 0);
    const fc_pct = r.selling_price ? (cost / r.selling_price) * 100 : 0;
    const margin = r.selling_price - cost;
    const markup = cost > 0 ? (margin / cost) * 100 : 0;
    const recommended_price = cost > 0 ? cost / 0.30 : 0;
    const status = r.selling_price > 0 ? fcStatus(fc_pct) : null;
    return { ...r, cost, fc_pct, margin, markup, recommended_price, status };
  }), [ingredients, recipes]);

  // Summary stats
  const avgFC = analysis.filter(a => a.selling_price > 0).reduce((s, a) => s + a.fc_pct, 0) / (analysis.filter(a => a.selling_price > 0).length || 1);
  const totalMargin = analysis.reduce((s, a) => s + a.margin, 0);
  const worstFC = [...analysis].sort((a, b) => b.fc_pct - a.fc_pct)[0];
  const bestFC = [...analysis].filter(a => a.selling_price > 0).sort((a, b) => a.fc_pct - b.fc_pct)[0];

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🧮</p>
        <p className="text-sm text-black/30 uppercase tracking-widest">Nessuna ricetta ancora</p>
        <p className="text-[11px] text-black/20 mt-1">Crea le ricette nella tab "Ricette"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Benchmark reference */}
      <div className="bg-[#1a0a10] rounded-2xl p-4 text-white">
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-3">Benchmark Fast Casual</p>
        <div className="grid grid-cols-4 gap-1 text-center">
          {[
            { label: 'Ottimo', range: '< 28%', color: 'text-emerald-400' },
            { label: 'Buono', range: '28–32%', color: 'text-blue-400' },
            { label: 'Attenzione', range: '32–38%', color: 'text-orange-400' },
            { label: 'Critico', range: '> 38%', color: 'text-red-400' },
          ].map(b => (
            <div key={b.label}>
              <p className={`text-[10px] font-bold ${b.color}`}>{b.label}</p>
              <p className="text-[9px] text-white/35 mt-0.5">{b.range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      {analysis.some(a => a.selling_price > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-black/6 shadow-sm p-4 text-center">
            <p className="text-[9px] uppercase tracking-widest text-black/30 mb-1">FC Medio</p>
            <p className={`text-2xl font-bold ${fcStatus(avgFC).color}`}>{fmt2(avgFC)}%</p>
            <p className={`text-[10px] mt-1 font-semibold ${fcStatus(avgFC).color}`}>{fcStatus(avgFC).label}</p>
          </div>
          <div className="bg-white rounded-2xl border border-black/6 shadow-sm p-4 text-center">
            <p className="text-[9px] uppercase tracking-widest text-black/30 mb-1">Margine Totale</p>
            <p className="text-2xl font-bold text-emerald-600">€{fmt2(totalMargin)}</p>
            <p className="text-[10px] mt-1 text-black/30">su tutte le ricette</p>
          </div>
          {bestFC && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
              <p className="text-[9px] uppercase tracking-widest text-emerald-500 mb-1">Migliore</p>
              <p className="text-[13px] font-bold text-[#1a0a10] truncate">{bestFC.name}</p>
              <p className="text-[11px] text-emerald-600 font-semibold">{fmt2(bestFC.fc_pct)}% FC</p>
            </div>
          )}
          {worstFC && worstFC.selling_price > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
              <p className="text-[9px] uppercase tracking-widest text-red-400 mb-1">Da rivedere</p>
              <p className="text-[13px] font-bold text-[#1a0a10] truncate">{worstFC.name}</p>
              <p className="text-[11px] text-red-500 font-semibold">{fmt2(worstFC.fc_pct)}% FC</p>
            </div>
          )}
        </div>
      )}

      {/* Per-recipe cards */}
      {analysis.map(a => (
        <div key={a.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${a.status?.bg ?? 'border-black/6'}`}>
          <div className="px-4 py-3 border-b border-black/6 flex items-center justify-between">
            <p className="font-bold text-[#1a0a10]">{a.name}</p>
            {a.status && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${a.status.bg} ${a.status.color}`}>
                {a.status.emoji} {a.status.label}
              </span>
            )}
          </div>
          <div className="px-4 py-3 space-y-3">
            {/* Main metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-black/30 mb-0.5">Costo</p>
                <p className="text-[18px] font-bold text-[#1a0a10]">€{fmt2(a.cost)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-black/30 mb-0.5">Food Cost</p>
                <p className={`text-[18px] font-bold ${a.status?.color ?? 'text-black/30'}`}>
                  {a.selling_price > 0 ? `${fmt2(a.fc_pct)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-black/30 mb-0.5">Margine</p>
                <p className={`text-[18px] font-bold ${a.margin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>€{fmt2(a.margin)}</p>
              </div>
            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-2 gap-2 border-t border-black/6 pt-3">
              <div className="bg-black/3 rounded-xl px-3 py-2">
                <p className="text-[9px] uppercase tracking-widest text-black/30 mb-0.5">Prezzo vendita</p>
                <p className="text-[14px] font-bold text-[#1a0a10]">
                  {a.selling_price > 0 ? `€${fmt2(a.selling_price)}` : 'Non impostato'}
                </p>
              </div>
              <div className="bg-[#FBE8EF]/60 rounded-xl px-3 py-2">
                <p className="text-[9px] uppercase tracking-widest text-black/30 mb-0.5">Prezzo consigliato</p>
                <p className="text-[14px] font-bold text-[#A8456B]">
                  {a.cost > 0 ? `€${fmt2(a.recommended_price)}` : '—'}
                </p>
                <p className="text-[8px] text-black/25">(target 30% FC)</p>
              </div>
            </div>

            {/* Markup */}
            {a.cost > 0 && a.selling_price > 0 && (
              <div className="flex items-center gap-2">
                <p className="text-[9px] uppercase tracking-widest text-black/30 shrink-0">Markup</p>
                <div className="flex-1 h-1.5 bg-black/6 rounded-full overflow-hidden">
                  <div className="h-full bg-[#CF6990] rounded-full" style={{ width: `${Math.min(100, a.markup / 4)}%` }} />
                </div>
                <p className="text-[11px] font-bold text-[#1a0a10] w-12 text-right">{fmt2(a.markup)}%</p>
              </div>
            )}

            {/* Ingredient breakdown */}
            {a.ingredients.length > 0 && (
              <details className="group">
                <summary className="text-[10px] uppercase tracking-widest text-black/30 cursor-pointer hover:text-[#CF6990] transition-colors list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                  Dettaglio ingredienti
                </summary>
                <div className="mt-2 space-y-1">
                  {a.ingredients.map(ri => {
                    const ing = ingredients.find(i => i.id === ri.ingredient_id);
                    if (!ing) return null;
                    const sub = ing.cost_per_unit * ri.quantity;
                    const pct = a.cost > 0 ? (sub / a.cost) * 100 : 0;
                    return (
                      <div key={ri.ingredient_id} className="flex items-center gap-2">
                        <span className="text-[10px] text-black/40 w-28 truncate">{ing.name}</span>
                        <span className="text-[9px] text-black/25">{ri.quantity}{UNIT_LABELS[ing.unit]}</span>
                        <div className="flex-1 h-1 bg-black/6 rounded-full overflow-hidden">
                          <div className="h-full bg-[#CF6990]/60 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-semibold text-[#1a0a10] w-12 text-right tabular-nums">€{fmt2(sub)}</span>
                      </div>
                    );
                  })}
                </div>
              </details>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main FoodCostTab ─────────────────────────────────────────────────────────

export default function FoodCostTab({ adminToken }: { adminToken: string }) {
  const [subTab, setSubTab] = useState<SubTab>('analisi');
  const [ingredients, setIngredients] = useState<FCIngredient[]>([]);
  const [recipes, setRecipes] = useState<FCRecipe[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchSetting<FCIngredient[]>('food_cost_ingredients'),
      fetchSetting<FCRecipe[]>('food_cost_recipes'),
    ]).then(([ings, recs]) => {
      setIngredients(ings ?? []);
      setRecipes(recs ?? []);
      setLoaded(true);
    });
  }, []);

  async function loadSeedData() {
    setSeeding(true);
    try {
      await Promise.all([
        updateSetting(adminToken, 'food_cost_ingredients', SEED_INGREDIENTS),
        updateSetting(adminToken, 'food_cost_recipes', SEED_RECIPES),
      ]);
      setIngredients(SEED_INGREDIENTS);
      setRecipes(SEED_RECIPES);
    } catch { alert('Errore durante il caricamento dei dati.'); }
    setSeeding(false);
  }

  if (!loaded) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-[#CF6990] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const subTabs: { key: SubTab; label: string }[] = [
    { key: 'analisi', label: `Analisi (${recipes.length})` },
    { key: 'ricette', label: `Ricette (${recipes.length})` },
    { key: 'ingredienti', label: `Ingredienti (${ingredients.length})` },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Sub-tab bar */}
      <div className="flex bg-white border-b border-black/8 mb-4 sticky top-0 z-10">
        {subTabs.map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            className={`flex-1 py-3 text-[10px] uppercase tracking-[0.15em] font-semibold transition-colors ${
              subTab === t.key ? 'text-[#CF6990] border-b-2 border-[#CF6990]' : 'text-black/30 hover:text-black/60'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Seed banner — solo se DB vuoto */}
      {ingredients.length === 0 && (
        <div className="mx-4 mb-4 bg-[#1a0a10] rounded-2xl p-5 text-center">
          <p className="text-2xl mb-2">🍔</p>
          <p className="text-white font-bold text-sm mb-1">Nessun dato ancora</p>
          <p className="text-white/40 text-[11px] mb-4 leading-relaxed">
            Carica automaticamente gli ingredienti e le ricette del menu Public Burger<br/>
            (prezzi dal file Excel, solo panini attivi)
          </p>
          <button onClick={loadSeedData} disabled={seeding}
            className="w-full py-3 bg-[#CF6990] text-white text-[11px] uppercase tracking-[0.2em] font-bold rounded-xl hover:bg-[#A8456B] transition-colors disabled:opacity-40">
            {seeding ? 'Caricamento…' : '⬇ Carica dati Public Burger'}
          </button>
          <p className="text-white/20 text-[9px] mt-3">Cipolla grigliata e anelli in panino: costo €0 (aggiorna tu dopo)</p>
        </div>
      )}

      <div className="px-4">
        {subTab === 'ingredienti' && (
          <IngredientiTab ingredients={ingredients} setIngredients={setIngredients} adminToken={adminToken} />
        )}
        {subTab === 'ricette' && (
          <RicetteTab ingredients={ingredients} recipes={recipes} setRecipes={setRecipes} adminToken={adminToken} />
        )}
        {subTab === 'analisi' && (
          <AnalisiTab ingredients={ingredients} recipes={recipes} />
        )}
      </div>
    </div>
  );
}
