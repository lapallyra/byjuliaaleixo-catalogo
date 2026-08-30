
import React, { useState } from 'react';
import { SidebarCliente } from './SidebarCliente';
import { ClienteAuthPage } from './ClienteAuthPage';
import { useAuth } from '../AuthProvider';
import { useCustomer } from '../../hooks/useCustomer';
import { Menu, LogOut, Sparkles, User as UserIcon, ShieldCheck, Heart, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ClienteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading: authLoading, logout } = useAuth();
  const { customer, loading: customerLoading } = useCustomer();
  const navigate = useNavigate();

  if (authLoading || customerLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCFA] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#CCA062] border-t-transparent animate-spin mb-4" />
        <span className="font-mea-culpa text-3xl text-[#2C1810]">Carregando seu portal...</span>
        <p className="text-xs text-[#6D5443] font-light mt-1">Buscando informações do Ateliê</p>
      </div>
    );
  }

  // If unauthenticated, show the dedicated luxury Auth (Login/Cadastro) page
  if (!user) {
    return <ClienteAuthPage />;
  }

  const displayName = customer?.name || user.displayName || user.email?.split('@')[0] || 'Cliente';
  const displayEmail = customer?.email || user.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#FDFCFA] text-[#2C1810] flex flex-col lg:flex-row">
      
      {/* SIDEBAR NAVIGATION */}
      <SidebarCliente isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* MOBILE HEADER BAR */}
        <header className="lg:hidden bg-white border-b border-[#E8DFC8] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg bg-[#FAF6F0] border border-[#E8DFC8] text-[#2C1810]"
              aria-label="Abrir menu"
            >
              <Menu size={20}/>
            </button>
            <span className="font-mea-culpa text-2xl text-[#2C1810]">Ateliê do Afeto</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#8C6D37] border border-[#E8DFC8] flex items-center justify-center text-xs font-bold">
              {initial}
            </div>
          </div>
        </header>

        {/* CUSTOMER PORTAL HEADER BANNER */}
        <div className="bg-gradient-to-r from-[#2C1810] via-[#3A2A20] to-[#2C1810] text-white py-5 px-3 sm:px-4 border-b border-[#8C6D37]/40">
          <div className="w-full mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#CCA062] to-[#8C6D37] text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white/20 shrink-0">
                {initial}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[#CCA062] text-[10px] font-bold uppercase tracking-[0.2em] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                    Membro Afeto VIP
                  </span>
                  <Sparkles size={13} className="text-[#CCA062]" />
                </div>
                <h2 className="font-serif text-xl sm:text-2xl text-white font-semibold mt-0.5">
                  Olá, {displayName}
                </h2>
                <p className="text-xs text-amber-100/70 font-light">
                  {displayEmail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Store size={14} />
                <span>Ir para a Loja</span>
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-full bg-[#8C6D37]/40 hover:bg-[#8C6D37]/70 text-amber-100 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-[#CCA062]/40"
              >
                <LogOut size={14} />
                <span>Sair</span>
              </button>
            </div>

          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 py-4 px-2 sm:px-3 md:px-4">
          <div className="w-full mx-auto">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
};

