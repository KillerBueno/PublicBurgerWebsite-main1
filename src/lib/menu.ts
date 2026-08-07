// Menu effettivo = menu base (menuData.ts) sovrascritto dal menu personalizzato
// salvato in Supabase (`settings.custom_menu`). Se non esiste alcun custom_menu,
// tutto ricade sul menu base: il comportamento resta identico a prima.
//
// È l'unica fonte da cui derivano tutte le "sezioni collegate":
//   - lista burger del sito e del configuratore
//   - lista fritti / appetizer
//   - lista bibite (Drinks)
//   - lista salse vendute a parte
//   - lista "aggiunte extra" (ingredienti) del configuratore
// Aggiungendo un burger o un ingrediente dall'editor admin, compaiono ovunque.

import {
  BURGERS, FRIES, ALL_EXTRAS,
  type BurgerDef, type FryDef,
} from '../menuData';

export type { BurgerDef, FryDef };

/** Bibita: venduta singolarmente (price) e scegliibile nel combo (comboExtra). */
export interface DrinkItem {
  name: string;
  price: number;
  /** Supplemento se scelta come bibita del combo. 0/assente = inclusa. */
  comboExtra?: number;
}

export interface CustomMenu {
  burgers: BurgerDef[];
  fries: FryDef[];
  drinks: DrinkItem[];
  /** Aggiunte extra (+€1) offerte nel configuratore. */
  extras: string[];
  /** Salse vendute a parte (+€0,50). */
  salse: string[];
}

// Doppio e triplo sono incrementi standard sul prezzo del singolo: l'editor
// admin fa modificare solo il singolo, questi ricreano gli altri due.
// Costo fisso taglia: +3,50 per il doppio, +6 per il triplo.
export const SIZE_ADD = { double: 3.5, triple: 6 } as const;

/** Espande un prezzo singolo nella terna taglia con gli incrementi standard. */
export function sizesFromSingle(single: number) {
  return {
    single,
    double: Math.round((single + SIZE_ADD.double) * 100) / 100,
    triple: Math.round((single + SIZE_ADD.triple) * 100) / 100,
  };
}

// Pane e proteina principale: togliendoli il burger non è più quel burger, e non
// vanno offerti come aggiunta né disattivati. Fonte unica per configuratore/admin.
export const NON_REMOVABLE = [
  'Brioche bun',
  'Bun classico',
  'Hamburger di manzo',
  'Hamburger vegetale',
  'Spalla di maiale sfilacciata',
  'Pollo panato e fritto',
];

// Bibite standalone: storicamente hardcoded nella sezione Drinks di ShowcasePage.
export const DEFAULT_DRINKS: DrinkItem[] = [
  { name: 'Coca-Cola', price: 2.5 },
  { name: 'Coca-Cola Zero', price: 2.5 },
  { name: 'Fanta', price: 2.5 },
  { name: 'Sprite', price: 2.5 },
  { name: 'Fuze Tea Limone', price: 2.5 },
  { name: 'Fuze Tea Pesca', price: 2.5 },
  { name: 'Acqua Liscia', price: 1 },
  { name: 'Acqua Frizzante', price: 1 },
  { name: 'Forst 0,33', price: 3.5, comboExtra: 1 },
];

// Salse vendute a parte: storicamente hardcoded (SALSE_LIST) in ShowcasePage.
export const DEFAULT_SALSE = [
  'Ketchup', 'Maionese', 'BBQ', 'Salsa Burger',
  'Salsa Smokey', 'Salsa Public', 'Senape', 'Salsa Piccante',
];

export function defaultMenu(): CustomMenu {
  return {
    burgers: BURGERS,
    fries: FRIES,
    drinks: DEFAULT_DRINKS,
    extras: ALL_EXTRAS,
    salse: DEFAULT_SALSE,
  };
}

/**
 * Fonde il custom_menu salvato con i default. Un gruppo assente o vuoto ricade
 * sul default: così un custom_menu parziale (o vecchio) non svuota il sito.
 */
export function normalizeMenu(custom: Partial<CustomMenu> | null | undefined): CustomMenu {
  const d = defaultMenu();
  if (!custom) return d;
  return {
    burgers: custom.burgers?.length ? custom.burgers : d.burgers,
    fries: backfillFryVariants(custom.fries?.length ? custom.fries : d.fries, d.fries),
    drinks: custom.drinks?.length ? custom.drinks : d.drinks,
    extras: custom.extras?.length ? custom.extras : d.extras,
    salse: custom.salse?.length ? custom.salse : d.salse,
  };
}

/**
 * I menu salvati prima dei "formati" hanno i contorni senza `variants`.
 * Se un contorno non ha MAI avuto formati (`variants === undefined`) ma nel menu
 * base quel nome ne ha, li recupera dal default — così Nuggets riprende i suoi
 * 6/12/20 pz senza doverli riaggiungere a mano. Un array `[]` esplicito
 * (formati rimossi apposta dall'admin) invece viene rispettato e resta senza.
 */
function backfillFryVariants(fries: FryDef[], defaults: FryDef[]): FryDef[] {
  return fries.map(f => {
    if (f.variants !== undefined) return f;
    const def = defaults.find(x => x.name === f.name);
    return def?.variants?.length ? { ...f, variants: def.variants } : f;
  });
}

export const ALLERGEN_OPTIONS: { n: number; label: string }[] = [
  { n: 1, label: 'Glutine' }, { n: 2, label: 'Crostacei' }, { n: 3, label: 'Uova' },
  { n: 4, label: 'Pesce' }, { n: 5, label: 'Arachidi' }, { n: 6, label: 'Soia' },
  { n: 7, label: 'Latte' }, { n: 8, label: 'Frutta a guscio' }, { n: 9, label: 'Sedano' },
  { n: 10, label: 'Senape' }, { n: 11, label: 'Semi di sesamo' }, { n: 12, label: 'Solfiti' },
  { n: 13, label: 'Lupini' }, { n: 14, label: 'Molluschi' },
];

/** Burger vuoto per "aggiungi nuovo" (prezzo fisso di default, no taglie). */
export function emptyBurger(): BurgerDef {
  return {
    name: '', tag: 'Classic', spicy: false,
    ingredients: [], prices: null, fixedPrice: 0, combo: 3, allergens: [],
  };
}

export function emptyFry(): FryDef {
  return { name: '', desc: '', price: 0, allergens: [] };
}
