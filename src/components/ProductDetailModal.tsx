import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Share2, ShoppingCart, Gift, Upload, Trash2, Loader2, Check, Sparkles } from 'lucide-react';
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
  onBuyNow?: (product: Product, quantity: number) => void;
  onAddToGiftList?: (product: Product) => void;
  companyId: CompanyId;
  isReadOnly?: boolean;
  isKitConstructor?: boolean;
  allProducts?: Product[];
  isExclusive?: boolean;
  campaignYear?: number | string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onAddToGiftList,
  companyId,
  isKitConstructor = false,
  allProducts = [],
  isExclusive = false,
  campaignYear
}) => {
  const theme = getTheme(companyId);
  const accentColor = theme.accentColor || '#000000';

  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showGiftToast, setShowGiftToast] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (uploadError) {
      const timer = setTimeout(() => setUploadError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadError]);

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

  const productImages = [
    product.image || product.main_image,
    product.image_hover,
    ...(product.images || [])
  ].filter(Boolean) as string[];
  
  const images = productImages.filter((img, index, self) => self.indexOf(img) === index).slice(0, 5); 
  
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

  return (
    <div className="fixed inset-0 z-[2000] flex justify-end overflow-hidden">
      {/* Backdrop overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#0a0a0a]/40 backdrop-blur-xs cursor-pointer"
      />
      
      {/* Drawer content sliding from right */}
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full sm:max-w-md md:max-w-lg lg:max-w-xl h-full shadow-2xl relative flex flex-col z-10 ${theme.bg} overflow-hidden`}
      >
        {/* Header do Drawer */}
        <div className={`p-5 md:p-6 border-b ${theme.borderLine} flex justify-between items-center bg-white/95 backdrop-blur-md sticky top-0 z-50`}>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: accentColor }}>
              {product.isKit ? 'Kit Pronto' : (product.category || 'Premium Collection')}
            </span>
            <h3 className={`text-base font-serif italic ${theme.textPrimary} line-clamp-1`}>
              {product.product_name}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-neutral-50 transition-colors text-neutral-400 hover:text-neutral-900 border ${theme.borderLine} bg-white shadow-xs`}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar pb-36">
          {/* Main image carousel */}
          <div className="space-y-4">
            <div className="aspect-square bg-[#fdfaf6] rounded-[2rem] overflow-hidden relative border border-neutral-100/50 shadow-xs flex items-center justify-center p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={imageIndex}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  <ImageWithFallback 
                    src={images[imageIndex] || ''} 
                    alt={product.product_name}
                    className="w-full h-full object-contain"
                    isCritical={true}
                    fetchPriority="high"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none justify-center">
                {images.map((img, i) => (
                  <button 
                    key={`thumb-${i}`}
                    onClick={() => setImageIndex(i)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      i === imageIndex ? 'scale-105 shadow-md border-neutral-900' : 'opacity-40 hover:opacity-100 border-transparent'
                    }`}
                  >
                    <ImageWithFallback src={img || ''} alt="Thumbnail" className="w-full h-full object-cover" isThumbnail={true} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product details */}
          <div className="space-y-3">
            {/* Badges / Selos: Exclusivo e Edição AAAA */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#8C7864]/70">
                {product.category || 'Ateliê'}
              </span>
              {(isExclusive || product.isExclusive) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                  <Sparkles size={11} className="animate-pulse" />
                  Exclusivo
                </span>
              )}
              {(campaignYear || product.edition_year) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#3A312D] text-white shadow-xs">
                  Edição {campaignYear || product.edition_year}
                </span>
              )}
            </div>

            <h2 className={`text-2xl font-serif italic ${theme.textPrimary}`}>
              {product.product_name}
            </h2>
            
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-bold text-neutral-900">
                R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              {oldPrice > currentPrice && (
                <span className="text-sm text-neutral-300 line-through">
                  R$ {oldPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>

            <p className="text-neutral-500 text-sm leading-relaxed whitespace-pre-line italic">
              "{product.description || "Uma criação exclusiva que combina sofisticação e qualidade incomparável."}"
            </p>
          </div>

          {/* Kit Items */}
          {product.isKit && product.kitItems && product.kitItems.length > 0 && (
            <div className="border-t border-neutral-100 pt-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4 pb-2 border-b border-neutral-50">
                Itens Inclusos no Kit
              </h4>
              <div className="space-y-3">
                {product.kitItems.map((item: any, i: number) => {
                  const matchedProd = allProducts?.find(p => p.id === item.id);
                  return (
                    <div key={i} className="flex items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-neutral-200 bg-white">
                        <ImageWithFallback src={matchedProd?.image || product.image} alt={matchedProd?.product_name || "Item"} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-neutral-800 truncate">
                          {matchedProd?.product_name || "Produto do Kit"}
                        </p>
                        <p className="text-[10px] text-neutral-400 uppercase font-semibold">
                          Quantidade: {item.quantity}x
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variations */}
          {product.variations && product.variations.length > 0 && (
            <div className="border-t border-neutral-100 pt-6 space-y-6">
              {product.variations.map((v, vIdx) => (
                <div key={`v-group-${vIdx}`} className="space-y-3">
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.textMuted}`}>{v.name}:</h4>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt, oIdx) => (
                      <button
                        key={`var-${vIdx}-${oIdx}`}
                        onClick={() => setSelectedVariations({ ...selectedVariations, [v.name]: opt.name })}
                        className={`px-4 py-2.5 text-[11px] font-bold rounded-xl border-2 transition-all duration-150 uppercase tracking-widest ${selectedVariations[v.name] === opt.name ? `scale-[1.03] shadow-md ${theme.btnPrimary} border-transparent` : `${theme.btnSecondary}`}`}
                      >
                        {cleanOptionName(opt.name)} {opt.price > 0 ? `(+R$ ${opt.price.toFixed(2).replace('.', ',')})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Advanced Personalizations */}
          {product.personalizationSettings && product.personalizationSettings.length > 0 && (
            <div className="border-t border-neutral-100 pt-6 space-y-6">
              <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.textMuted}`}>Personalização:</h4>
              <div className="space-y-4">
                {product.personalizationSettings.map((field) => (
                  <div key={field.id} className="space-y-2">
                    {field.type !== 'image' && (
                      <label className={`text-[11px] font-bold opacity-60 ${theme.textPrimary} flex items-center gap-1`}>
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
                      <div className="flex flex-wrap gap-2">
                        {field.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => setPersonalizationValues({...personalizationValues, [field.id]: opt})}
                            className={`px-4 py-2.5 text-[11px] font-bold rounded-xl border-2 transition-all duration-150 uppercase tracking-widest ${
                              personalizationValues[field.id] === opt 
                                ? `scale-[1.03] shadow-md ${theme.btnPrimary} border-transparent` 
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
                            Adicione até 2 imagens que servirão de inspiração.
                          </p>
                        </div>

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

                                const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
                                if (!allowedTypes.includes(file.type)) {
                                  setUploadError("Formato não suportado. PNG, JPG ou WEBP.");
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
                                  setUploadError("Erro ao enviar a imagem de referência.");
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

          {/* Addons */}
          {availableAddons.length > 0 && (
            <div className="border-t border-neutral-100 pt-6 space-y-4">
              <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.textMuted}`}>Serviços Adicionais:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      selectedAddons.includes(addon.id) 
                        ? 'border-transparent shadow-md bg-black/5' 
                        : 'border-black/5 bg-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: selectedAddons.includes(addon.id) ? accentColor : undefined
                    }}
                  >
                    {addon.image && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-black/5 bg-white">
                        <ImageWithFallback src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${theme.textPrimary} truncate`}>{addon.name}</p>
                      {addon.price > 0 && <p className="text-[10px] text-neutral-400 font-semibold">+ R$ {addon.price.toFixed(2)}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom actions */}
        <div className={`p-5 md:p-6 border-t ${theme.borderLine} bg-white/95 backdrop-blur-md absolute bottom-0 left-0 right-0 z-50 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]`}>
          {product.isWholesaleEnabled && product.wholesale_price > 0 && (
            <div className="text-[10px] uppercase font-black tracking-wider text-amber-600 flex items-center gap-1.5 bg-amber-50/50 p-2 rounded-xl border border-amber-500/10 justify-center">
              {isWholesaleActive 
                ? 'Atacado Ativado! Desconto Aplicado' 
                : `Adicione ${wholesaleMinQty} un. para Preço de Atacado`}
            </div>
          )}

          {!product.isKit && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Quantidade</span>
              <div className="flex items-center bg-neutral-50 rounded-xl p-1 border border-neutral-100">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center font-bold text-sm text-neutral-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold mb-2">
              {uploadError}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-1">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Valor Total</p>
              <p className="text-xl font-bold text-neutral-900">
                R$ {(currentPrice * quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <button
              onClick={() => {
                // Validate required personalization fields
                if (product.personalizationSettings) {
                  for (const field of product.personalizationSettings) {
                    if (field.isRequired && !personalizationValues[field.id]?.trim()) {
                      setUploadError(`Por favor, preencha o campo obrigatório "${field.label}"`);
                      return;
                    }
                  }
                }

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
                onClose();
              }}
              className={`flex-grow px-6 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${theme.btnPrimary}`}
            >
              <ShoppingCart size={14} />
              {isKitConstructor ? 'Adicionar ao Kit' : 'Adicionar à Sacola'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showShareToast && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 px-6 py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-black rounded-xl shadow-lg z-[100] border border-white/10"
            >
              Link copiado!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
