import type { BurgerSize, BurgerDef, FryDef } from './menuData';

export interface CartBurger {
  id: string;
  type: 'burger';
  burger: BurgerDef;
  size: BurgerSize | null;
  combo: boolean;
  removed: string[];
  extras: string[];
  drink: string | null;
  drinkExtra: number;
  totalPrice: number;
}

export interface CartFry {
  id: string;
  type: 'fry';
  fry: FryDef;
  qty: number;
  totalPrice: number;
}

export interface CartExtra {
  id: string;
  type: 'extra';
  name: string;
  category: 'salsa' | 'bibita';
  qty: number;
  totalPrice: number;
}

export type CartItem = CartBurger | CartFry | CartExtra;
