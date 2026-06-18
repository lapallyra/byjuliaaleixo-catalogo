import React from 'react';
import { motion } from 'motion/react';
import { X, Search, Loader2 } from 'lucide-react';

interface CatalogListSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  theme: any;
  listSearchCode: string;
  setListSearchCode: (code: string) => void;
  handleListSearch: () => void;
  isSearchingLoading: boolean;
}

export const CatalogListSearchOverlay: React.FC<CatalogListSearchOverlayProps> = ({
  isOpen,
  onClose,
  theme,
  listSearchCode,
  setListSearchCode,
  handleListSearch,
  isSearchingLoading
}) => {
  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm ${theme.cardBg} p-8 rounded-3xl z-[1101] shadow-2xl overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 pointer-events-none rounded-full" style={{ backgroundColor: theme.accentColor }} />
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black uppercase tracking-widest text-[#161616]">Buscar Lista</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4 relative z-10">
          <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-2">Código da Lista</label>
              <input 
                type="text"
                placeholder="Ex: L12345P"
                value={listSearchCode}
                onChange={(e) => setListSearchCode(e.target.value.toUpperCase())}
                className={`w-full ${theme.searchBg} border ${theme.borderLine} rounded-2xl px-5 py-4 text-sm font-bold uppercase tracking-widest focus:ring-4 transition-all focus:bg-white ${theme.textPrimary}`}
                style={{ '--tw-ring-color': `${theme.accentColor}22` } as any}
                onKeyDown={(e) => e.key === 'Enter' && handleListSearch()}
              />
          </div>
          
          <button 
            onClick={handleListSearch}
            disabled={isSearchingLoading || !listSearchCode}
            className="w-full py-5 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl disabled:opacity-50"
            style={{ backgroundColor: theme.accentColor, boxShadow: `0 10px 30px -10px ${theme.accentColor}` }}
          >
            {isSearchingLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} strokeWidth={2.5} />}
            Buscar Agora
          </button>
          
          <p className="text-[9px] text-center font-bold text-black/40 uppercase tracking-tight px-4">
            Insira o código gerado pelo criador da lista para visualizar os produtos.
          </p>
        </div>
      </motion.div>
    </>
  );
};
