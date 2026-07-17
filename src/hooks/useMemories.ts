import { useState, useEffect, useMemo } from 'react';
import { memoriesMultiplexer } from '../services/firebaseService';
import { Memory } from '../types';
import { useCustomer } from './useCustomer';

export const useMemories = () => {
  const { customer } = useCustomer();
  const [allMemories, setAllMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = memoriesMultiplexer.subscribe((data) => {
      setAllMemories(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const memories = useMemo(() => {
    if (!customer || allMemories.length === 0) return [];
    return allMemories.filter(m => 
      m.customerId === customer.id ||
      (m.customerEmail && m.customerEmail.toLowerCase() === customer.email?.toLowerCase()) ||
      (m.customerName && m.customerName.toLowerCase() === customer.name?.toLowerCase())
    );
  }, [customer, allMemories]);

  return { memories, loading };
};
