import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Share2, ShoppingCart, Gift, Upload, Trash2, Loader2 } from 'lucide-react';
import { PriceDisplay } from './ui/PriceDisplay';
import { Product, CompanyId } from '../types';
import { themes, getTheme } from '../lib/theme';
import { formatCurrency } from '../lib/currencyUtils';
import { getAddons } from '../services/firebaseService';
import { cleanOptionName, extractPriceFromOption } from '../utils/priceUtils';
import { ImageWithFallback } from './ImageWithFallback';
import { uploadImage, compressImage } from '../services/firebaseStorageService';

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
  const theme = getTheme(companyId);
  const accentColor = theme.accentColor || '#000000';
  const isMimada = companyId === 'mimada';

  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showGiftToast, setShowGiftToast] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});

  // Custom personalization states
  const [personalizationValues, setPersonalizationValues] = useState<Record<string, string>>({});
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Addons states
  const [availableAddons, setAvailableAddons] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

  useEffect(() => {
    const fetchAddons = async () => {
      const addons = await getAddons(companyId);
      setAvailableAddons(addons.filter(a => a.active));
    };
    fetchAddons();
  }, [companyId]);

  useEffect(() => {
    if (product.variations && product.variations.length > 0) {
      const initial: Record<string, string> = {};
      product.variations.forEach(v => {
        if (v.options && v.options.length > 0) {
          initial[v.name] = v.options[0].name;
        }
      });
      setSelectedVariations(initial);
    } else {
      setSelectedVariations({});
    }
  }, [product]);

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
  
  // Base price
  let currentPrice = isWholesaleActive ? product.wholesale_price : product.retail_price;
  
  // Add variation price if selected
  Object.entries(selectedVariations).forEach(([varName, optName]) => {
    const variation = product.variations?.find(v => v.name === varName);
    const option = variation?.options.find(o => o.name === optName);
    if (option && option.price) {
      currentPrice += option.price;
    }
  });

  // Add personalization embedded prices if any
  Object.values(personalizationValues).forEach(val => {
    currentPrice += extractPriceFromOption(val);
  });

  // Add selected addons prices
  selectedAddons.forEach(addonId => {
    const addon = availableAddons.find(a => a.id === addonId);
    if (addon && addon.price) {
      currentPrice += addon.price;
    }
  });
  
  const oldPrice = product.original_price || (currentPrice * 1.25);
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
        className={`w-full max-w-screen-xl h-[100dvh] md:h-[85vh] overflow-hidden relative flex flex-col md:flex-row shadow-[0_40px_100px_rgba(0,0,0,0.6)] md:rounded-[2.5rem] z-10 ${theme.bg}`}
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
                       isThumbnail={true}
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
                              onClick={() => setSelectedVariations({ ...selectedVariations, [v.name]: opt.name })}
                              className={`px-6 py-3 text-[11px] font-bold rounded-xl border-2 transition-all duration-500 uppercase tracking-widest ${selectedVariations[v.name] === opt.name ? `scale-[1.05] shadow-lg ${theme.btnPrimary} border-transparent` : `${theme.btnSecondary}`}`}
                            >
                              {cleanOptionName(opt.name)} {opt.price > 0 ? `(+R$ ${opt.price.toFixed(2).replace('.', ',')})` : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* PERSONALIZAÇÕES AVANÇADAS */}
              {product.personalizationSettings && product.personalizationSettings.length > 0 && (
                <div className="mb-10">
                  <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-center ${theme.textMuted}`}>Detalhes da Personalização:</h3>
                  <div className="space-y-4 max-w-md mx-auto">
                    {product.personalizationSettings.map((field) => (
                      <div key={field.id} className="space-y-2">
                        {field.type !== 'image' && (
                          <label className={`text-[11px] font-bold opacity-60 ${theme.textPrimary} flex items-center justify-center md:justify-start gap-1`}>
                            {field.label} {field.isRequired && <span className="text-rose-500">*</span>}
                          </label>
                        )}
                        {field.type === 'text' && (
                          <input 
                            type="text" 
                            placeholder={field.placeholder || ''}
                            maxLength={field.charLimit}
                            value={personalizationValues[field.id] || ''}
                            onChange={(e) => setPersonalizationValues({...personalizationValues, [field.id]: e.target.value})}
                            className={`w-full p-4 rounded-xl border border-black/10 text-sm focus:ring-2 outline-none bg-transparent ${theme.textPrimary}`}
                            style={{ outlineColor: accentColor }}
                          />
                        )}
                        {field.type === 'select' && field.options && (
                          <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            {field.options.map((opt, oIdx) => (
                              <button
                                key={oIdx}
                                onClick={() => setPersonalizationValues({...personalizationValues, [field.id]: opt})}
                                className={`px-6 py-3 text-[11px] font-bold rounded-xl border-2 transition-all duration-500 uppercase tracking-widest ${
                                  personalizationValues[field.id] === opt 
                                    ? `scale-[1.05] shadow-lg ${theme.btnPrimary} border-transparent` 
                                    : `${theme.btnSecondary}`
                                }`}
                              >
                                {cleanOptionName(opt)}
                              </button>
                            ))}
                          </div>
                        )}
                        {field.type === 'image' && (
                          <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 text-left">
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                Imagens de Referência {field.isRequired && <span className="text-rose-500">*</span>}
                              </span>
                              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                                Adicione até 2 imagens que servirão apenas como inspiração para a criação da arte.
                              </p>
                            </div>

                            {/* Current Uploaded Images Preview */}
                            {((personalizationValues[field.id] || "").split(",").filter(Boolean)).length > 0 && (
                              <div className="flex flex-wrap gap-3 pt-1">
                                {(personalizationValues[field.id] || "").split(",").filter(Boolean).map((imgUrl, imgIdx) => (
                                  <div key={imgIdx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group bg-white shadow-xs">
                                    <img src={imgUrl.trim()} alt={`Referência ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentUrls = (personalizationValues[field.id] || "").split(",").filter(Boolean);
                                        const updatedUrls = currentUrls.filter((_, i) => i !== imgIdx);
                                        setPersonalizationValues({
                                          ...personalizationValues,
                                          [field.id]: updatedUrls.join(",")
                                        });
                                      }}
                                      className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-90 hover:opacity-100 shadow-sm transition-all flex items-center justify-center"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Upload Trigger */}
                            {((personalizationValues[field.id] || "").split(",").filter(Boolean)).length < 2 && (
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  id={`ref-upload-modal-${field.id}`}
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    // Validate type
                                    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
                                    if (!allowedTypes.includes(file.type)) {
                                      alert("Formato não suportado. Por favor, envie PNG, JPG ou WEBP.");
                                      return;
                                    }

                                    try {
                                      setUploadingFieldId(field.id);
                                      setUploadProgress(0);

                                      const compressedFile = await compressImage(file);
                                      const path = `sales_personalization/ref_${Date.now()}`;
                                      const { promise } = uploadImage(compressedFile, path, (progress) => {
                                        setUploadProgress(Math.round(progress));
                                      });

                                      const url = await promise;
                                      const currentUrls = (personalizationValues[field.id] || "").split(",").filter(Boolean);
                                      const updatedUrls = [...currentUrls, url];
                                      setPersonalizationValues({
                                        ...personalizationValues,
                                        [field.id]: updatedUrls.join(",")
                                      });
                                    } catch (err) {
                                      console.error(err);
                                      alert("Erro ao enviar a imagem de referência.");
                                    } finally {
                                      setUploadingFieldId(null);
                                      setUploadProgress(0);
                                    }
                                  }}
                                  disabled={uploadingFieldId !== null}
                                />
                                
                                {uploadingFieldId === field.id ? (
                                  <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 bg-white rounded-xl space-y-2">
                                    <Loader2 className="animate-spin text-indigo-500" size={20} />
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                                      Enviando... {uploadProgress}%
                                    </span>
                                  </div>
                                ) : (
                                  <label
                                    htmlFor={`ref-upload-modal-${field.id}`}
                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 bg-white rounded-xl hover:border-slate-300 transition-all cursor-pointer text-slate-500 hover:text-slate-700"
                                  >
                                    <Upload size={16} className="mb-1" />
                                    <span className="text-[10px] uppercase tracking-wider font-black">
                                      Enviar Imagem
                                    </span>
                                    <span className="text-[9px] text-slate-400 mt-1 font-semibold">
                                      Formatos aceitos: JPG, PNG, WEBP (máx. 2)
                                    </span>
                                  </label>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADDONS (Serviços Adicionais) */}
              {availableAddons.length > 0 && (
                <div className="mb-10">
                  <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-center ${theme.textMuted}`}>Serviços Adicionais:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                    {availableAddons.map(addon => (
                      <button
                        key={addon.id}
                        onClick={() => {
                          if (selectedAddons.includes(addon.id)) {
                            setSelectedAddons(selectedAddons.filter(id => id !== addon.id));
                          } else {
                            setSelectedAddons([...selectedAddons, addon.id]);
                          }
                        }}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                          selectedAddons.includes(addon.id) 
                            ? 'border-transparent shadow-md bg-black/5' 
                            : 'border-black/5 bg-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          borderColor: selectedAddons.includes(addon.id) ? accentColor : undefined
                        }}
                      >
                        {addon.image && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-black/5">
                            <ImageWithFallback src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${theme.textPrimary} truncate`}>{addon.name}</p>
                        </div>
                      </button>
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

                <div className="grid grid-cols-2 gap-4 w-full">
                  <motion.button 
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        const selectedVariationString = Object.entries(selectedVariations)
                          .map(([varName, optName]) => `${varName}: ${optName}`)
                          .join(', ');
                        const packedProduct: Product & { selectedVariation?: string, personalizationValues?: Record<string, string>, selectedAddons?: any[] } = {
                          ...product,
                          retail_price: currentPrice,
                          selectedVariation: selectedVariationString || undefined,
                          personalizationValues: Object.keys(personalizationValues).length > 0 ? personalizationValues : undefined,
                          selectedAddons: selectedAddons.length > 0 ? selectedAddons : undefined
                        };
                        onAddToCart(packedProduct, quantity);
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 2000);
                    }}
                    className={`py-5 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-black transition-all duration-500 flex items-center justify-center gap-2 border-2 ${
                      (theme.btnPrimary || '').includes('bg-white') 
                        ? theme.btnPrimary 
                        : 'bg-white border-black/5 text-slate-800 hover:border-[var(--accent-color)] hover:bg-[#fdfaf6]'
                    }`}
                    style={{ '--accent-color': accentColor } as React.CSSProperties}
                  >
                    <ShoppingCart size={16} strokeWidth={2} />
                    Adicionar ao Carrinho
                  </motion.button>
                  
                  {onAddToGiftList && (
                    <button 
                       onClick={() => {
                         onAddToGiftList(product);
                         setShowGiftToast(true);
                         setTimeout(() => setShowGiftToast(false), 2000);
                       }}
                       className={`flex items-center justify-center gap-2 py-5 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] ${theme.btnSecondary}`}
                    >
                      <Gift size={16} strokeWidth={2} />
                      Lista
                    </button>
                  )}
                </div>

                <div className="w-full">
                  <button 
                    onClick={handleShare}
                    className={`w-full py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group ${theme.btnSecondary}`}
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
