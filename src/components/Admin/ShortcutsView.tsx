import React from 'react';
import { X, Keyboard } from 'lucide-react';

export const ShortcutsView: React.FC = () => {
  const shortcuts = [
    { key: "Ctrl + K", desc: "Abrir Pesquisa Global" },
    { key: "Ctrl + N", desc: "Abrir Novo Pedido" },
    { key: "Ctrl + P", desc: "Imprimir Cupom Não Fiscal (Pedido Aberto)" },
    { key: "Ctrl + E", desc: "Imprimir Etiqueta (Pedido Aberto)" },
    { key: "Ctrl + F", desc: "Focar Campo de Busca (Página Atual)" },
    { key: "Esc", desc: "Fechar modais/menus" },
  ];

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
      <h3 className="text-xl font-medium text-slate-900 mb-6">Atalhos de Teclado</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shortcuts.map((s, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <span className="font-mono text-xs font-bold bg-white px-3 py-2 rounded-lg border border-slate-200">{s.key}</span>
            <span className="text-xs font-medium text-slate-600">{s.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
