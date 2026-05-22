import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Trash2, Share2, Copy, Save, Loader2 } from 'lucide-react';
import { SafeImage } from './ui/SafeImage';
import { Product } from '../types';
import { saveGiftList } from '../services/firebaseService';
import { ImageWithFallback } from './ImageWithFallback';

export const GiftListSidebar: React.FC<{
  giftList: Product[];
  onClose: () => void;
  onRemove: (id: string) => void;
  theme: any;
  companyId: string;
}> = ({ giftList, onClose, onRemove, theme, companyId }) => {
  const [listName, setListName] = useState('Minha Lista de Presentes');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [listCode, setListCode] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    // Generate code once when list has items and we don't have a code
    if (giftList.length > 0 && !listCode) {
      const random = crypto.randomUUID().slice(0, 5).toUpperCase();
      setListCode(`L${random}P`);
    }
  }, [giftList, listCode]);

  const handleSave = async () => {
    if (!listCode || giftList.length === 0) return;
    setIsSaving(true);
    const success = await saveGiftList({
      code: listCode,
      items: giftList,
      companyId: companyId
    });
    setIsSaving(false);
    if (success) {
      setShowSuccessPopup(true);
    }
  };

  const generateShareMessage = (isWhatsApp: boolean = false) => {
    const link = window.location.origin;
    let msg = `Esse é o código da minha lista de presentes exclusiva:\n${listCode}\n\nClique no link e veja com detalhes:\n${link}`;
    return isWhatsApp ? encodeURIComponent(msg) : msg;
  };

  const handleWhatsAppShare = () => {
    handleSave(); // Auto save when sharing
    window.open(`https://wa.me/?text=${generateShareMessage(true)}`, '_blank');
  };

  const handleCopy = () => {
    handleSave();
    if (listCode) {
      navigator.clipboard.writeText(listCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1900]"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0, width: window.innerWidth < 640 ? '100%' : '380px' }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed right-0 top-0 h-full ${theme.bg} backdrop-blur-2xl border-l z-[2000] shadow-2xl flex flex-col overflow-hidden`}
        style={{ borderColor: `${theme.accentColor}33`, width: window.innerWidth < 640 ? '100%' : '420px' }}
      >
        <div className={`p-4 md:p-6 border-b flex flex-col gap-3 bg-white`} style={{ borderColor: `${theme.accentColor}11` }}>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-fancy flex items-center gap-2" style={{ color: theme.accentColor }}>
              <Gift size={20} className="opacity-70" />
              Lista de Presentes
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-full transition-all hover:bg-black/5" style={{ color: theme.accentColor }}>
              <X size={20} />
            </button>
          </div>
          
          <div className="bg-[#FAF9F6] p-3 rounded-lg border border-black/5 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-50" style={{ color: theme.textPrimary }}>Código</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider" style={{ color: theme.accentColor }}>{listCode || '...'}</span>
              <button onClick={handleCopy} className="p-1.5 rounded-lg bg-white border border-black/5 hover:bg-white/50 transition-all">
                <Copy size={12} className="opacity-60" />
              </button>
            </div>
          </div>
          
          <input 
              type="text" 
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className={`w-full bg-transparent border-b border-black/10 py-1 text-xs font-bold outline-none focus:border-black/30 transition-all`}
              style={{ color: theme.textPrimary }}
              placeholder="Nome da Sua Lista"
            />
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 scrollbar-hide">
          {giftList.length > 0 ? (
            giftList.map((item, index) => (
              <motion.div 
                key={`${item.id}-${index}`}
                layout
                className={`bg-white rounded-xl p-3 border flex items-center gap-3 shadow-sm group`}
                style={{ borderColor: `${theme.accentColor}08` }}
              >
                <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 border border-black/5 relative">
                   <ImageWithFallback src={item.image || ''} alt={item.product_name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-bold leading-tight truncate mb-0.5`} style={{ color: theme.textPrimary }}>
                    {item.product_name}
                  </div>
                  <div className="text-[10px] font-bold opacity-70" style={{ color: theme.accentColor }}>
                    R$ {item.retail_price?.toFixed(2)}
                  </div>
                </div>
                <button 
                  onClick={() => onRemove(item.id)}
                  className="text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-4 p-8">
                <Gift size={32} className="opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">Sua lista está vazia</p>
            </div>
          )}
        </div>

        {giftList.length > 0 && (
          <div className="p-4 md:p-6 border-t bg-[#FAF9F6] space-y-2" style={{ borderColor: `${theme.accentColor}11` }}>
            <button 
              onClick={handleSave}
              disabled={isSaving || !listCode}
              className={`w-full py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95`}
              style={{ 
                backgroundColor: theme.accentColor, 
                color: 'white'
              }}
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar Lista
            </button>
            <button 
              onClick={handleWhatsAppShare}
              className={`w-full py-3 bg-[#25D366] text-white font-bold text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all`}
            >
              <Share2 size={14} />
              WhatsApp
            </button>
          </div>
        )}
      </motion.aside>

      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center border-2"
              style={{ borderColor: theme.accentColor }}
            >
              <button 
                onClick={() => setShowSuccessPopup(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-all text-gray-400 hover:text-black"
              >
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-pink-50" style={{ color: theme.accentColor }}>
                <Gift size={32} />
              </div>
              
              <h3 className="text-xl font-black uppercase tracking-wider mb-4" style={{ color: theme.accentColor }}>
                Salvamos sua Lista de Presentes.
              </h3>
              
              <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">
                Quando precisar pesquise na página inicial utilizando o código que foi gerado exclusivamente para você. A lista ficará ativa por 60 dias.
              </p>
              
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200 mb-6">
                <span className="text-2xl font-black tracking-[0.2em] text-gray-800">
                  {listCode}
                </span>
              </div>
              
              <button 
                onClick={() => setShowSuccessPopup(false)}
                className="w-full py-4 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-lg shadow-black/10 active:scale-95"
                style={{ backgroundColor: theme.accentColor }}
              >
                Entendi, Obrigado!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
