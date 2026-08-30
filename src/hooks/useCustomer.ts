import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../components/AuthProvider';
import { customersMultiplexer } from '../services/firebaseService';
import { Customer } from '../types';

export const useCustomer = () => {
  const { user, loading: authLoading } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = customersMultiplexer.subscribe((data) => {
      setCustomers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const customer = useMemo(() => {
    if (!user || customers.length === 0) return null;

    const userEmail = user.email?.toLowerCase();
    const isSpecial = user.isAnonymous || user.displayName === 'Júlia Aleixo' || userEmail?.includes('byjuliaaleixo');

    return customers.find(c => {
      const cEmail = c.email?.toLowerCase();
      if (userEmail && (cEmail === userEmail || c.contacts?.some(cnt => cnt.email?.toLowerCase() === userEmail))) {
        return true;
      }
      if (isSpecial && (cEmail === 'byjuliaaleixo@gmail.com' || cEmail === 'byjuliaaleixo@atelie.com')) {
        return true;
      }
      return false;
    });
  }, [user, customers]);

  return {
    customer,
    loading: authLoading || loading,
  };
};
