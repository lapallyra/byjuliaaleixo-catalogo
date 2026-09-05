import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Box, ShoppingBag, User, Gift, Package } from 'lucide-react';
import { Order, Product, Insumo, Customer, CompanyId } from '../../types';
import { AtelierBadge } from './AtelierBadge';

interface GlobalSearchProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  insumos: Insumo[];
  onResultClick: (type: string, id: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ 
  orders, products, customers, insumos, onResultClick 
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalSearch = () => setIsOpen(true);
    const handleFocus = () => {
      setIsOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    };
    const handleClose = () => setIsOpen(false);
    window.addEventListener('trigger-global-search', handleGlobalSearch);
    window.addEventListener('trigger-focus-search', handleFocus);
    window.addEventListener('trigger-close-modals', handleClose);
    return () => {
        window.removeEventListener('trigger-global-search', handleGlobalSearch);
        window.removeEventListener('trigger-focus-search', handleFocus);
        window.removeEventListener('trigger-close-modals', handleClose);
    };
  }, []);

  const results = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    
    const filteredOrders = orders.filter(o => o.code?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q));
    const filteredCustomers = customers.filter(c => c.name?.toLowerCase().includes(q) || c.contact?.toLowerCase().includes(q));
    const filteredProducts = products.filter(p => p.product_name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q));
    const filteredInsumos = insumos.filter(i => i.name?.toLowerCase().includes(q));
    
    const orderResults = filteredOrders.map(o => ({ type: 'Pedido', id: o.id!, title: `Pedido ${o.code}`, info: o.customerName || 'Sem cliente', origin: o.companyId, icon: ShoppingBag }));
    const customerResults = filteredCustomers.map(c => ({ type: 'Cliente', id: c.id!, title: c.name || 'Sem nome', info: c.contact || 'Sem telefone', origin: (c as any).companyId, icon: User }));
    const productResults = filteredProducts.map(p => ({ type: 'Produto', id: p.id!, title: p.product_name || 'Sem nome', info: p.code || 'Sem código', origin: p.companyId || (p as any).company, icon: Box }));
    const insumoResults = filteredInsumos.map(i => ({ type: 'Componente', id: i.id!, title: i.name || 'Sem nome', info: 'Insumo compartilhado', origin: i.companyId, icon: Package }));

    return [...orderResults, ...customerResults, ...productResults, ...insumoResults].slice(0, 6);
  }, [query, orders, customers, products, insumos]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
        <Search size={16} className="text-slate-400" />
        <input 
          ref={searchInputRef}
          type="text" 
          placeholder="Pesquisar..." 
          className="bg-transparent text-xs w-48 outline-none"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        />
      </div>
      
      {isOpen && query && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-white shadow-xl rounded-2xl border border-slate-100 z-50 p-2">
            {results.length === 0 ? (
                <div className="text-xs text-slate-400 p-3 text-center">Nenhum resultado encontrado.</div>
            ) : (
                results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors" onClick={() => { onResultClick(r.type, r.id); setIsOpen(false); setQuery(""); }}>
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <r.icon size={14} className="text-slate-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-slate-800 truncate">{r.title}</div>
                                <div className="text-[10px] text-slate-500 truncate">{r.info}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {r.origin && <AtelierBadge companyId={r.origin} size="xs" />}
                            <button className="text-[10px] text-indigo-600 font-bold hover:underline">Abrir</button>
                        </div>
                    </div>
                ))
            )}
        </div>
      )}
      {isOpen && query && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
};
