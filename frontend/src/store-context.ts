import { createContext } from "react";
import type { CartItem, Product, User } from "./api";

export type StoreValue = {
  cart: CartItem[];
  user: User | null;
  addToCart: (product: Product) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  signIn: (user: User) => void;
  signOut: () => void;
};

export const StoreContext = createContext<StoreValue | null>(null);
