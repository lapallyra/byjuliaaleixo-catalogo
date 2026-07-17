import { useState, useEffect } from 'react';
import { productsMultiplexer } from '../services/firebaseService';
import { Product } from '../types';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = productsMultiplexer.subscribe((data) => {
      setProducts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { products, loading };
};
