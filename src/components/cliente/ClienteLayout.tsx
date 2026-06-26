
import React, { useState } from 'react';
import { SidebarCliente } from './SidebarCliente';
import { Menu } from 'lucide-react';

export const ClienteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarCliente isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col">
        <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center">
            <button onClick={() => setIsSidebarOpen(true)}><Menu size={20}/></button>
            <span className="ml-4 font-parisienne text-xl">Ateliê</span>
        </header>
        <main className="flex-1 p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
