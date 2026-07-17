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
    if (!user?.email || customers.length === 0) return null;

    return customers.find(c => 
      c.email?.toLowerCase() === user.email?.toLowerCase() ||
      c.contacts?.some(contact => contact.email?.toLowerCase() === user.email?.toLowerCase())
    );
  }, [user, customers]);

  return {
    customer,
    loading: authLoading || loading,
  };
};
