import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VitrineProduct } from '../data/products';

export interface VitrineCartItem extends VitrineProduct {
  quantity: number;
}

export interface VitrineCartContextType {
  cart: VitrineCartItem[];
  addToCart: (product: VitrineProduct, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const VitrineCartContext = createContext<VitrineCartContextType | undefined>(undefined);

export function VitrineCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<VitrineCartItem[]>(() => {
    try {
      const stored = localStorage.getItem('vitrine_v2_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vitrine_v2_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error persisting vitrine cart:', e);
    }
  }, [cart]);

  const addToCart = (product: VitrineProduct, qty: number = 1) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === product.id);
      if (existingIdx > -1) {
        const newCart = [...prev];
        newCart[existingIdx] = {
          ...newCart[existingIdx],
          quantity: newCart[existingIdx].quantity + qty,
        };
        return newCart;
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQty = (productId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.id !== productId);
      }
      return prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <VitrineCartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </VitrineCartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(VitrineCartContext);
  if (!context) {
    throw new Error('useCart must be used within a VitrineCartProvider');
  }
  return context;
}
