import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Box, ShoppingBag, User, Gift, Package } from 'lucide-react';
import { Order, Product, Insumo, Componente, Customer } from '../../types';

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
    
    const orderResults = orders.filter(o => o.code?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q)).map(o => ({ type: 'Pedido', id: o.id!, title: `Pedido ${o.code}`, info: o.customerName || 'Sem cliente', icon: ShoppingBag }));
    const customerResults = customers.filter(c => c.name?.toLowerCase().includes(q) || c.contact?.toLowerCase().includes(q)).map(c => ({ type: 'Cliente', id: c.id!, title: c.name || 'Sem nome', info: c.contact || 'Sem telefone', icon: User }));
    const productResults = products.filter(p => p.product_name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)).map(p => ({ type: 'Produto', id: p.id!, title: p.product_name || 'Sem nome', info: p.code || 'Sem código', icon: Box }));
    const insumoResults = insumos.filter(i => i.name?.toLowerCase().includes(q)).map(i => ({ type: 'Componente', id: i.id!, title: i.name || 'Sem nome', info: 'Componente', icon: Package }));

    return [...orderResults, ...customerResults, ...productResults, ...insumoResults].slice(0, 5);
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
        <div className="absolute top-full mt-2 left-0 w-full bg-white shadow-lg rounded-2xl border border-slate-100 z-50 p-2">
            {results.length === 0 ? (
                <div className="text-xs text-slate-400 p-2 text-center">Nenhum resultado encontrado.</div>
            ) : (
                results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer" onClick={() => { onResultClick(r.type, r.id); setIsOpen(false); setQuery(""); }}>
                        <div className="flex items-center gap-2">
                            <r.icon size={14} className="text-slate-500" />
                            <div>
                                <div className="text-xs font-bold text-slate-800">{r.title}</div>
                                <div className="text-[10px] text-slate-500">{r.info}</div>
                            </div>
                        </div>
                        <button className="text-[10px] text-indigo-600 font-bold underline">Abrir</button>
                    </div>
                ))
            )}
        </div>
      )}
      {isOpen && query && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
};
