import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Share2, ShoppingCart, Gift } from 'lucide-react';
import { PriceDisplay } from './ui/PriceDisplay';
import { Product, CompanyId } from '../types';
import { themes } from '../lib/theme';
import { formatCurrency } from '../lib/currencyUtils';
import { ImageWithFallback } from './ImageWithFallback';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
  onAddToGiftList?: (product: Product) => void;
  companyId: CompanyId;
  isReadOnly?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onAddToGiftList,
  companyId
}) => {
  const theme = themes[companyId] || themes.pallyra;
  const accentColor = theme.accentColor;
  const isMimada = companyId === 'mimada';

  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showGiftToast, setShowGiftToast] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);

  const handleShare = () => {
    const url = `${window.location.origin}/?product=${product.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    });
  };

  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image, product.image_hover].filter(Boolean) as string[];
  
  const images = productImages.slice(0, 5); 
  
  const wholesaleMinQty = product.wholesale_min_qty || 5;
  const isWholesaleActive = product.isWholesaleEnabled && quantity >= wholesaleMinQty && product.wholesale_price > 0;
  const currentPrice = isWholesaleActive ? product.wholesale_price : product.retail_price;
  
  const oldPrice = product.original_price || (product.retail_price * 1.25);
  const discountPercent = Math.round(((oldPrice - currentPrice) / oldPrice) * 100);

  const renderProductImage = (image: string | undefined | null) => {
    return (
      <ImageWithFallback 
        src={image || ''} 
        alt="Product"
        className="drop-shadow-2xl transition-all duration-700 w-full h-full object-contain"
      />
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[2000] p-0 md:p-6 lg:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-[1240px] h-[100dvh] md:h-[85vh] overflow-hidden relative flex flex-col md:flex-row shadow-[0_40px_100px_rgba(0,0,0,0.6)] md:rounded-[2.5rem] z-10 ${theme.bg}`}
      >
        <button 
          onClick={onClose}
          className={`absolute top-6 right-6 z-[60] w-12 h-12 flex items-center justify-center rounded-full ${theme.cardBg} backdrop-blur-md shadow-xl border ${theme.borderLine} transition-all hover:scale-110 active:scale-95 ${theme.textPrimary}`}
        >
          <X size={22} strokeWidth={1.5} />
        </button>

        <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
          
          {/* GALERIA DE IMAGENS Premium */}
          <div className={`flex flex-col md:flex-row w-full md:w-[60%] h-[450px] md:h-full ${theme.cardBg || 'bg-[#fcfcfc]'} border-r ${theme.borderLine || 'border-black/5'} shrink-0 overflow-hidden`}>
            
            {/* MINIATURAS VERTICAIS (ESQUERDA EM DESKTOP) */}
            {images.length > 1 && (
              <div className={`order-2 md:order-1 w-full md:w-24 p-4 md:p-6 md:border-r border-black/[0.03] flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto scrollbar-hide ${theme.cardBg} backdrop-blur-sm`}>
                {images.map((img, i) => (
                  <button 
                    key={`thumb-${i}`} 
                    onMouseEnter={() => setImageIndex(i)}
                    onClick={() => setImageIndex(i)}
                    className={`relative min-w-[70px] md:min-w-0 aspect-square rounded-2xl overflow-hidden transition-all duration-500 border-2 shrink-0 group ${i === imageIndex ? 'scale-105 shadow-xl' : 'opacity-40 hover:opacity-100 hover:scale-[1.02] grayscale hover:grayscale-0'}`}
                    style={{ 
                      borderColor: i === imageIndex ? accentColor : 'transparent',
                      boxShadow: i === imageIndex ? `0 0 20px ${accentColor}33` : 'none'
                    }}
                  >
                     <ImageWithFallback 
                       src={img || ''} 
                       alt="Thumbnail"
                       className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" 
                     />
                  </button>
                ))}
              </div>
            )}

            {/* FOTO PRINCIPAL */}
            <div className={`order-1 md:order-2 flex-1 flex items-center justify-center p-8 md:p-12 relative overflow-hidden ${companyId === 'guennita' ? 'bg-[#56070c]' : 'bg-gradient-to-br from-white/40 to-white/10'} h-full`}>
              {/* Brand Background Elements */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[1px] border-black rounded-full animate-[spin_60s_linear_infinite]" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-[1px] border-black rounded-full animate-[spin_40s_linear_infinite_reverse]" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={imageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full flex items-center justify-center relative z-10"
                >
                  {renderProductImage(images[imageIndex])}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* INFORMAÇÕES DO PRODUTO */}
          <div className="flex-1 flex flex-col h-full relative z-10">
            {/* Scrollable Side */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-12 lg:p-14 pb-40">
              {/* Header */}
              <div className="mb-10 text-center md:text-left">
                 <motion.span 
                   initial={{ opacity:0, y:10 }}
                   animate={{ opacity:1, y:0 }}
                   className="text-[10px] font-black uppercase tracking-[0.5em] inline-block mb-3" 
                   style={{ color: accentColor }}
                 >
                   {product.category || 'Premium Collection'}
                 </motion.span>
                 <h2 className={`text-3xl md:text-4xl font-display font-light leading-[0.9] tracking-tighter mb-4 italic ${theme.textPrimary}`}>
                   {product.product_name}
                 </h2>
                 <div className="w-12 h-1 bg-black/5 mx-auto md:mx-0 rounded-full mb-6" />
              </div>

              {/* ADICIONAIS / VARIAÇÕES (Condicional) */}
              {product.variations && product.variations.length > 0 && (
                <div className="mb-10">
                  <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-center ${theme.textMuted}`}>Personalização & Opções:</h3>
                  <div className="flex flex-wrap justify-center gap-4">
                    {product.variations.map((v, vIdx) => (
                      <div key={`v-group-${vIdx}`} className="w-full">
                        <p className={`text-[11px] font-bold mb-2 text-center opacity-60 ${theme.textPrimary}`}>{v.name}:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {v.options.map((opt, oIdx) => (
                            <button
                              key={`var-${vIdx}-${oIdx}`}
                              onClick={() => setSelectedVariation(`${v.name}: ${opt.name}`)}
                              className={`px-6 py-3 text-[11px] font-bold rounded-xl border-2 transition-all duration-500 uppercase tracking-widest ${selectedVariation === `${v.name}: ${opt.name}` ? `scale-[1.05] shadow-lg ${theme.btnPrimary} border-transparent` : `${theme.btnSecondary}`}`}
                            >
                              {opt.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Description */}
              <div className="mb-10 text-center md:text-left">
                <p className={`text-[13px] leading-relaxed font-sans opacity-90 whitespace-pre-line ${theme.textSecondary}`}>
                    {product.description}
                </p>
              </div>

              {/* VALORES Premium (Tahoma nos números) */}
              <div className="mb-10 text-center md:text-left border-y border-black/5 py-8">
                 <PriceDisplay 
                    price={currentPrice}
                    originalPrice={oldPrice}
                    installments={2}
                    className="items-center md:items-start scale-110 md:scale-125 origin-center md:origin-left"
                    priceClassName={companyId === 'guennita' ? 'text-[#D4AF37]' : theme.textPrimary}
                    accentColor={accentColor}
                  />
              </div>

              {/* QUANTIDADE com Aviso Dinâmico */}
              <div className="mb-12 text-center md:text-left">
                 <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${theme.textMuted}`}>Quantidade:</h3>
                 <div className="inline-flex flex-col gap-4 w-full md:w-auto">
                   <div className={`flex items-center justify-center md:justify-start gap-8 border ${theme.borderLine} rounded-xl p-1.5 ${theme.cardBg} transition-all`}>
                     <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90 ${theme.btnSecondary}`}><Minus size={14} strokeWidth={2} /></button>
                     <span className={`text-sm font-number font-black w-6 text-center ${theme.textPrimary}`}>{quantity}</span>
                     <button onClick={() => setQuantity(q => q + 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90 ${theme.btnSecondary}`}><Plus size={14} strokeWidth={2} /></button>
                   </div>
                 </div>
              </div>

              {/* ACTIONS (Moved inside scrollable area to not be fixed) */}
              <div className="max-w-[500px] mx-auto md:mx-0 space-y-4">
                {/* Wholesale Info - Visible even when not active to encourage buying more */}
                {product.isWholesaleEnabled && product.wholesale_price > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl flex items-start gap-4 mb-2 shadow-sm border ${isWholesaleActive ? 'bg-amber-50 border-amber-500/30' : 'bg-gray-50 border-gray-100'}`}
                  >
                    <div className={`${isWholesaleActive ? 'text-amber-600' : 'text-gray-400'} font-black text-xs`}>
                      {isWholesaleActive ? '⚠️ ATACADO ATIVADO' : '💡 DICA'}
                    </div>
                    <div>
                      <p className={`text-[10px] ${isWholesaleActive ? 'text-amber-700' : 'text-gray-500'} leading-tight font-black uppercase tracking-tight`}>
                        {isWholesaleActive 
                          ? 'Aproveite os preços de atacado!' 
                          : `Preços de Atacado Disponíveis (Min. ${wholesaleMinQty} un)`}
                      </p>
                      {!isWholesaleActive && (
                        <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">
                          Adicione mais {wholesaleMinQty - quantity} unidade{wholesaleMinQty - quantity > 1 ? 's' : ''} para liberar o desconto.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                <motion.button 
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                      onAddToCart(product, quantity);
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 2000);
                  }}
                  className={`w-full py-6 rounded-2xl text-[10px] uppercase tracking-normal font-black transition-all duration-700 flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] ${theme.btnPrimary} hover:shadow-[0_25px_60px_rgba(0,0,0,0.25)]`}
                >
                  <ShoppingCart size={20} strokeWidth={2} />
                  Adicionar ao Carrinho
                </motion.button>

                <div className="flex gap-4 w-full">
                  {onAddToGiftList && (
                    <button 
                       onClick={() => {
                         onAddToGiftList(product);
                         setShowGiftToast(true);
                         setTimeout(() => setShowGiftToast(false), 2000);
                       }}
                       className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group ${theme.btnSecondary}`}
                    >
                      <Gift size={16} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                      Lista
                    </button>
                  )}
                  <button 
                    onClick={handleShare}
                    className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group ${theme.btnSecondary}`}
                  >
                    <Share2 size={16} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                    Partilhar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {showToast && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-black rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] border border-white/10"
            >
              Adicionado ao Carrinho
            </motion.div>
          )}
          {showGiftToast && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-black rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] border border-white/10 flex items-center gap-2"
            >
              <Gift size={14} className="text-pink-400" />
              Adicionado à sua lista!
            </motion.div>
          )}
          {showShareToast && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-black rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] border border-white/10"
            >
              Link copiado para partilhar!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
