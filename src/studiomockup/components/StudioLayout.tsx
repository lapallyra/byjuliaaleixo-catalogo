
import React from 'react';

export const StudioLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="font-parisienne text-2xl text-[#3A312D]">Acervo de Produção Inteligente</h1>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
};
