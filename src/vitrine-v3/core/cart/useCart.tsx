import React, { createContext, useContext, useState, useEffect } from 'react';
import { VitrineV3Product } from '../../data/products';

export interface CartItemV3 {
  uniqueId: string; // combination of product ID + variants + text to allow multiple variations of the same product in the cart
  product: VitrineV3Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  customizationText?: string;
}

interface VitrineCartContextV3Type {
  cart: CartItemV3[];
  addToCart: (
    product: VitrineV3Product,
    quantity: number,
    color?: string,
    size?: string,
    customization?: string
  ) => void;
  updateQty: (uniqueId: string, quantity: number) => void;
  removeFromCart: (uniqueId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemsCount: number;
}

const VitrineCartContextV3 = createContext<VitrineCartContextV3Type | undefined>(undefined);

export const VitrineCartV3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItemV3[]>(() => {
    const saved = localStorage.getItem('vitrine_v3_cart_items');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('vitrine_v3_cart_items', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (
    product: VitrineV3Product,
    quantity: number,
    color?: string,
    size?: string,
    customization?: string
  ) => {
    setCart((prev) => {
      // Build a reliable compound token
      const token = `${product.id}-${color || ''}-${size || ''}-${customization || ''}`;
      const existingIndex = prev.findIndex((item) => item.uniqueId === token);

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity
        };
        return next;
      }

      return [
        ...prev,
        {
          uniqueId: token,
          product,
          quantity,
          selectedColor: color,
          selectedSize: size,
          customizationText: customization
        }
      ];
    });
  };

  const updateQty = (uniqueId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(uniqueId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.uniqueId === uniqueId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (uniqueId: string) => {
    setCart((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <VitrineCartContextV3.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        cartTotal,
        cartItemsCount
      }}
    >
      {children}
    </VitrineCartContextV3.Provider>
  );
};

export const useCartV3 = () => {
  const ctx = useContext(VitrineCartContextV3);
  if (!ctx) {
    throw new Error('useCartV3 must be used within a VitrineCartV3Provider');
  }
  return ctx;
};
