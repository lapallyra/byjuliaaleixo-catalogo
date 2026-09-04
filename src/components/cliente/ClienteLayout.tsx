
import React, { useState } from 'react';
import { SidebarCliente } from './SidebarCliente';
import { ClienteAuthPage } from './ClienteAuthPage';
import { useAuth } from '../AuthProvider';
import { useCustomer } from '../../hooks/useCustomer';
import { Menu, LogOut, Search, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ClienteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, loading: authLoading, logout } = useAuth();
  const { customer, loading: customerLoading } = useCustomer();
  const navigate = useNavigate();

  if (authLoading || customerLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#8C6D37] border-t-transparent animate-spin mb-4" />
        <span className="font-bold text-2xl text-[#2A2421]">Ateliê VIP</span>
        <p className="text-xs text-[#6E645E] font-medium mt-1">Carregando suas preferências...</p>
      </div>
    );
  }

  // If unauthenticated, show the dedicated Auth (Login/Cadastro) page
  if (!user) {
    return <ClienteAuthPage />;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/minha-experiencia/pedidos?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2A2421] flex flex-col lg:flex-row font-sans p-1 sm:p-2">
      
      {/* SIDEBAR NAVIGATION */}
      <SidebarCliente isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 p-1 sm:p-2 md:p-3">
        
        {/* TOP HEADER BAR */}
        <header className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 mb-3 border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#F5F1EB] text-[#2A2421] hover:bg-[#2A2421] hover:text-white transition-all cursor-pointer"
              aria-label="Abrir menu"
            >
              <Menu size={20}/>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-[#2A2421] tracking-tight">
              Perfil
            </h1>
          </div>

          {/* RIGHT TOP ACTIONS & SEARCH */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            
            {/* Search Pill Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64 max-w-xs">
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar no portal..."
                className="w-full bg-[#F5F1EB] text-xs text-[#2A2421] placeholder-stone-400 rounded-full pl-4 pr-10 py-2.5 border border-stone-200/80 focus:outline-none focus:border-[#8C6D37] transition-all"
              />
              <button 
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#2A2421] hover:bg-[#8C6D37] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                title="Pesquisar"
              >
                <Search size={14} />
              </button>
            </form>

            {/* Store Link */}
            <button
              onClick={() => navigate('/')}
              className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-[#F5F1EB] text-[#2A2421] border border-stone-200/80 shadow-2xs text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Voltar para a Loja"
            >
              <Store size={15} />
              <span className="hidden md:inline">Loja</span>
            </button>

            {/* Logout Icon Button */}
            <button
              onClick={logout}
              className="p-2.5 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-stone-200/80 shadow-2xs transition-all flex items-center justify-center cursor-pointer shrink-0"
              title="Sair da Conta"
            >
              <LogOut size={16} />
            </button>

          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 w-full mx-auto">
          {children}
        </main>
        
      </div>
    </div>
  );
};


