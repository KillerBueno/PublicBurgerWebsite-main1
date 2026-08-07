export type BurgerSize = 'single' | 'double' | 'triple';

export interface BurgerDef {
  name: string;
  tag: string;
  spicy: boolean;
  ingredients: string[];
  prices: { single: number; double: number; triple: number } | null;
  fixedPrice?: number;
  combo: number;
  allergens: number[];
  popular?: boolean;
}

export interface FryDef {
  name: string;
  desc: string;
  price: number;
  allergens: number[];
  /** Formati multipli (es. Nuggets 6/12/20 pz). Se presenti, il prezzo si
   *  sceglie dal formato; `price` resta come minimo mostrato in lista. */
  variants?: { label: string; price: number }[];
}

export const BURGERS: BurgerDef[] = [
  {
    name: 'Pulled Pork',
    tag: 'Slow',
    spicy: false,
    ingredients: ['Brioche bun', 'Spalla di maiale sfilacciata', 'Coleslaw', 'Salsa BBQ'],
    prices: null,
    fixedPrice: 11,
    combo: 3,
    allergens: [1, 3, 7, 10, 12],
    popular: true,
  },
  {
    name: 'Oklahoma',
    tag: 'Bold',
    spicy: false,
    ingredients: ['Brioche bun', 'Hamburger di manzo', 'Cipolla grigliata', 'Cheddar', 'Bacon croccante', 'Pickles', 'Salsa public'],
    prices: { single: 10.5, double: 14, triple: 16.5 },
    combo: 3,
    allergens: [1, 3, 7, 10, 12],
    popular: true,
  },
  {
    name: 'Jalapeño Popper',
    tag: 'Spicy',
    spicy: true,
    ingredients: ['Brioche bun', 'Hamburger di manzo', 'Cheddar', 'Jalapeño', 'Insalata', 'Creamy spicy sauce'],
    prices: { single: 11, double: 14.5, triple: 17 },
    combo: 3,
    allergens: [1, 3, 7],
  },
  {
    name: 'Cheeseburger',
    tag: 'Classic',
    spicy: false,
    ingredients: ['Brioche bun', 'Hamburger di manzo', 'Cheddar', 'Pickles', 'Ketchup'],
    prices: { single: 8, double: 11.5, triple: 14 },
    combo: 3,
    allergens: [1, 3, 7, 12],
  },
  {
    name: 'NY Style',
    tag: 'Signature',
    spicy: false,
    ingredients: ['Brioche bun', 'Hamburger di manzo', 'Insalata', 'Pomodoro', 'Ketchup', 'Maionese'],
    prices: { single: 9, double: 12.5, triple: 15 },
    combo: 3,
    allergens: [1, 3, 7, 10, 12],
  },
  {
    name: 'Fake Burger',
    tag: 'Veggie',
    spicy: false,
    ingredients: ['Brioche bun', 'Hamburger vegetale', 'Cheddar', 'Insalata', 'Ketchup', 'Maionese'],
    prices: null,
    fixedPrice: 13,
    combo: 3,
    allergens: [1, 3, 7, 10, 12],
  },
  {
    name: 'Ingordo',
    tag: 'Extra',
    spicy: false,
    ingredients: ['Bun classico', 'Hamburger di manzo', 'Scamorza', 'Cipolle caramellate', 'Anelli di cipolla fritti', 'Maionese', 'Salsa BBQ'],
    prices: { single: 10.5, double: 14, triple: 16.5 },
    combo: 3,
    allergens: [1, 3, 7, 10, 12],
  },
  {
    name: 'American Burger',
    tag: 'American',
    spicy: false,
    ingredients: ['Bun classico', 'Hamburger di manzo', 'Cheddar', 'Bacon', 'Patatine dolci', 'Uovo fritto', 'Salsa BBQ'],
    prices: { single: 12.5, double: 16, triple: 18.5 },
    combo: 3,
    allergens: [1, 3, 7, 10, 12],
  },
  {
    name: 'Hot Chicken Sandwich',
    tag: 'Chicken',
    spicy: true,
    ingredients: ['Brioche bun', 'Filetto di pollo panato', 'Coleslaw', 'Pickles', 'Spicy secret sauce'],
    prices: null,
    fixedPrice: 12,
    combo: 3,
    allergens: [1, 3, 6, 10, 12],
  },
  {
    name: '1991',
    tag: 'Chicken',
    spicy: false,
    ingredients: ['Brioche bun', 'Filetto di pollo panato', 'Insalata iceberg', 'Maionese al lime'],
    prices: null,
    fixedPrice: 12,
    combo: 3,
    allergens: [1, 3, 6, 10],
  },
];

export const FRIES: FryDef[] = [
  { name: 'Patatine',         desc: 'Classiche fritte croccanti',              price: 3.5, allergens: [] },
  { name: 'Onion Rings',      desc: 'Anelli di cipolla in pastella',           price: 4.5, allergens: [1] },
  { name: 'Cheese Bacon Fries', desc: 'Patatine con cheddar e bacon croccante', price: 5,   allergens: [7] },
  { name: 'Sweet Potatoes',   desc: 'Patatine di patata dolce',                price: 4,   allergens: [] },
  { name: 'Chicken Tenders',  desc: '2 pezzi di pollo croccante',              price: 5,   allergens: [1, 3, 6, 10] },
  { name: 'Nuggets',          desc: 'Croccanti e dorati',                      price: 5.5, allergens: [1, 3, 6, 7, 9, 10, 11],
    variants: [{ label: '6 pezzi', price: 5.5 }, { label: '12 pezzi', price: 10 }, { label: '20 pezzi', price: 16 }] },
];

export const ALL_EXTRAS: string[] = [
  'Cheddar', 'Pickles', 'Ketchup', 'Insalata', 'Pomodoro', 'Maionese',
  'Cipolla grigliata', 'Bacon croccante', 'Salsa public', 'Jalapeño',
  'Creamy spicy sauce', 'Coleslaw', 'Salsa BBQ',
];

export const DRINKS = [
  { name: 'Coca-Cola', extra: 0 },
  { name: 'Coca-Cola Zero', extra: 0 },
  { name: 'Sprite', extra: 0 },
  { name: 'Fanta', extra: 0 },
  { name: 'Birra', extra: 1 },
];

export const ALLERGEN_LABELS: Record<number, string> = {
  1: 'Glutine',
  2: 'Crostacei',
  3: 'Uova',
  4: 'Pesce',
  5: 'Arachidi',
  6: 'Soia',
  7: 'Latte',
  8: 'Frutta a guscio',
  9: 'Sedano',
  10: 'Senape',
  11: 'Semi di sesamo',
  12: 'Solfiti',
  13: 'Lupini',
  14: 'Molluschi',
};

export const SALSE_ALLERGENS: Record<string, number[]> = {
  'Ketchup':        [12],
  'Maionese':       [3, 10],
  'BBQ':            [10, 12],
  'Salsa Smokey':   [10, 12],
  'Salsa Public':   [3, 10, 12],
  'Senape':         [10, 12],
  'Salsa Piccante': [12],
};
