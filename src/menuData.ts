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
}

export interface FryDef {
  name: string;
  desc: string;
  price: number;
  allergens: number[];
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
  },
  {
    name: 'Oklahoma',
    tag: 'Bold',
    spicy: false,
    ingredients: ['Brioche bun', 'Hamburger di manzo', 'Cipolla grigliata', 'Cheddar', 'Bacon croccante', 'Pickles', 'Salsa public'],
    prices: { single: 9, double: 13, triple: 16.5 },
    combo: 3,
    allergens: [1, 3, 7, 10, 12],
  },
  {
    name: 'Jalapeño Popper',
    tag: 'Spicy',
    spicy: true,
    ingredients: ['Brioche bun', 'Hamburger di manzo', 'Cheddar', 'Jalapeño', 'Insalata', 'Creamy spicy sauce'],
    prices: { single: 9, double: 13, triple: 16.5 },
    combo: 3,
    allergens: [1, 3, 7],
  },
  {
    name: 'Cheeseburger',
    tag: 'Classic',
    spicy: false,
    ingredients: ['Brioche bun', 'Hamburger di manzo', 'Cheddar', 'Pickles', 'Ketchup'],
    prices: { single: 8, double: 12, triple: 15.5 },
    combo: 3,
    allergens: [1, 3, 7, 12],
  },
  {
    name: 'NY Style',
    tag: 'Signature',
    spicy: false,
    ingredients: ['Brioche bun', 'Hamburger di manzo', 'Insalata', 'Pomodoro', 'Ketchup', 'Maionese'],
    prices: { single: 8, double: 12, triple: 15.5 },
    combo: 3,
    allergens: [1, 3, 7, 10, 12],
  },
  {
    name: 'Fake Burger',
    tag: 'Veggie',
    spicy: false,
    ingredients: ['Brioche bun', 'Hamburger vegetale', 'Cheddar', 'Insalata', 'Ketchup', 'Maionese'],
    prices: null,
    fixedPrice: 9.5,
    combo: 3,
    allergens: [1, 3, 7, 10, 12],
  },
  {
    name: 'Ingordo',
    tag: 'Extra',
    spicy: false,
    ingredients: ['Bun classico', 'Hamburger di manzo', 'Scamorza', 'Cipolle caramellate', 'Anelli di cipolla fritti', 'Maionese', 'Salsa BBQ'],
    prices: { single: 9, double: 13, triple: 16.5 },
    combo: 3,
    allergens: [1, 3, 7, 10, 12],
  },
  {
    name: 'American Burger',
    tag: 'American',
    spicy: false,
    ingredients: ['Bun classico', 'Hamburger di manzo', 'Cheddar', 'Bacon', 'Patatine dolci', 'Uovo fritto', 'Salsa BBQ'],
    prices: { single: 9, double: 13, triple: 16.5 },
    combo: 3,
    allergens: [1, 3, 7, 10, 12],
  },
  {
    name: 'Chicken Burger',
    tag: 'Chicken',
    spicy: false,
    ingredients: ['Bun classico', 'Cotoletta di pollo croccante', 'Insalata', 'Pomodoro', 'Maionese'],
    prices: null,
    fixedPrice: 8.5,
    combo: 3,
    allergens: [1, 3, 6, 7, 10],
  },
  {
    name: 'Chicken Wrap',
    tag: 'Wrap',
    spicy: false,
    ingredients: ['Piadina', 'Cotoletta di pollo croccante', 'Insalata', 'Pomodoro', 'Maionese'],
    prices: null,
    fixedPrice: 8.5,
    combo: 3,
    allergens: [1, 3, 6, 10],
  },
];

export const FRIES: FryDef[] = [
  { name: 'Patatine', desc: 'Classiche fritte croccanti', price: 3.5, allergens: [] },
  { name: 'Onion Rings', desc: 'Anelli di cipolla in pastella', price: 4.0, allergens: [1, 2, 4, 6, 7, 10, 14] },
  { name: 'Cheese Bacon', desc: 'Patatine con cheddar e bacon croccante', price: 4.5, allergens: [7] },
  { name: 'Sweet Potatoes', desc: 'Patatine di patata dolce', price: 4.0, allergens: [] },
  { name: 'Nuggets', desc: 'Croccanti e dorati', price: 6, allergens: [1, 3, 6, 10] },
];

// All unique toppings/sauces that can be added as extras
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
  'Ketchup': [12],
  'Maionese': [3, 10],
  'BBQ': [10, 12],
  'Salsa Burger': [],
  'Salsa Smokey': [10, 12],
  'Salsa Public': [3, 10, 12],
  'Senape': [10, 12],
  'Salsa Piccante': [12],
};
