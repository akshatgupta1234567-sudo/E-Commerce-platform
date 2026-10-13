import { useCallback, useEffect, useMemo, useState } from "react";
import type { CartItem, Product, User } from "./api";
import { StoreContext } from "./store-context";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem("ironsteel-cart");
      return savedCart ? JSON.parse(savedCart) as CartItem[] : [];
    } catch {
      localStorage.removeItem("ironsteel-cart");
      return [];
    }
  });
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem("ironsteel-user");
      return savedUser ? JSON.parse(savedUser) as User : null;
    } catch {
      localStorage.removeItem("ironsteel-user");
      return null;
    }
  });

  useEffect(() => localStorage.setItem("ironsteel-cart", JSON.stringify(cart)), [cart]);

  const addToCart = useCallback((product: Product) => {
    setCart((items) => {
      const existing = items.find((item) => item.product._id === product._id);
      if (existing) {
        return items.map((item) => item.product._id === product._id
          ? { ...item, product, quantity: Math.min(product.stock, item.quantity + 1) }
          : item);
      }
      return product.stock > 0 ? [...items, { product, quantity: 1 }] : items;
    });
  }, []);
  const setQuantity = useCallback((id: string, quantity: number) => setCart((items) =>
    items.map((item) => item.product._id === id
      ? { ...item, quantity: Math.min(item.product.stock, Math.max(0, quantity)) }
      : item).filter((item) => item.quantity > 0)), []);
  const clearCart = useCallback(() => setCart([]), []);
  const signIn = useCallback((nextUser: User) => {
    setUser(nextUser);
    localStorage.setItem("ironsteel-user", JSON.stringify(nextUser));
  }, []);
  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem("ironsteel-user");
  }, []);

  const value = useMemo(() => ({ cart, user, addToCart, setQuantity, clearCart, signIn, signOut }),
    [cart, user, addToCart, setQuantity, clearCart, signIn, signOut]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
