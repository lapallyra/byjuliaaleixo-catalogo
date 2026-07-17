import { useState, useEffect, useMemo } from 'react';
import { salesMultiplexer } from '../services/firebaseService';
import { Order } from '../types';
import { useCustomer } from './useCustomer';

export const useOrders = () => {
  const { customer } = useCustomer();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = salesMultiplexer.subscribe((data) => {
      setAllOrders(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const orders = useMemo(() => {
    if (!customer || allOrders.length === 0) return [];
    return allOrders.filter(o => 
      o.customerId === customer.id ||
      o.customerEmail?.toLowerCase() === customer.email?.toLowerCase() ||
      o.customerName?.toLowerCase() === customer.name?.toLowerCase()
    );
  }, [customer, allOrders]);

  return { orders, loading };
};
