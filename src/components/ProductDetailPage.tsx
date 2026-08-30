import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Minus, 
  Plus, 
  Heart, 
  Gift, 
  ShoppingCart, 
  ChevronLeft, 
  ChevronRight,
  Check,
  ArrowLeft,
  Upload,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Product, CompanyId, Variation } from '../types';
import { getTheme } from '../lib/theme';
import { ImageWithFallback } from './ImageWithFallback';
import { getAddons } from '../services/firebaseService';
import { cleanOptionName, extractPriceFromOption } from '../utils/priceUtils';
import { uploadImage, compressImage } from '../services/firebaseStorageService';

interface ProductDetailPageProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onAddToGiftList?: (product: Product) => void;
  allProducts: Product[];
  companyId: CompanyId;
  isExclusive?: boolean;
  campaignYear?: number | string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onClose,
  onAddToCart,
  onAddToGiftList,
  companyId,
  isExclusive = false,
  campaignYear
}) => {
  const theme = getTheme(companyId);

  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [imageIndex, setImageIndex] = useState(0);
  const [isWholesaleActive, setIsWholesaleActive] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Custom personalization states
  const [personalizationValues, setPersonalizationValues] = useState<Record<string, string>>({});
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const productImages = [
    product.image || product.main_image,
    product.image_hover,
    ...(product.images || [])
  ].filter(Boolean) as string[];

  const images = productImages.filter((img, index, self) => self.indexOf(img) === index);

  const hasWholesale = product.isWholesaleEnabled && product.wholesale_min_qty && product.wholesale_min_qty > 0;

  useEffect(() => {
    // Reset states when product changes
    setQuantity(1);
    setSelectedVariations({});
    setImageIndex(0);
    setIsWholesaleActive(false);
    setIsFavorite(false);
    setPersonalizationValues({});
    setSelectedAddons([]);
    setUploadError(null);
    
    if (product.variations && product.variations.length > 0) {
      const initial: Record<string, string> = {};
      product.variations.forEach(v => {
        if (v.options && v.options.length > 0) {
          initial[v.name] = v.options[0].name;
        }
      });
      setSelectedVariations(initial);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  const handleWholesaleToggle = () => {
    if (!hasWholesale) return;
    
    const newWholesaleState = !isWholesaleActive;
    setIsWholesaleActive(newWholesaleState);
    
    if (newWholesaleState) {
      setQuantity(product.wholesale_min_qty || 1);
    } else {
      setQuantity(1);
    }
  };

  const handleQuantityChange = (val: number) => {
    const min = isWholesaleActive ? (product.wholesale_min_qty || 1) : 1;
    if (val < min) {
      setQuantity(min);
      return;
    }
    setQuantity(val);
  };

  const nextImage = () => setImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setImageIndex((prev) => (prev - 1 + images.length) % images.length);

  // Price calculations
  let currentPrice = isWholesaleActive ? (product.wholesale_price || product.retail_price) : (product.retail_price || product.current_price || 0);
  
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

  const originalPrice = product.original_price;

  return (
    <div className="w-full bg-[#FDFCFA] min-h-screen text-slate-900 pb-20 font-sans">
      
      {/* HEADER / NAVIGATION */}
      <div className="max-w-[1850px] mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
      </div>

      <div className="max-w-[1850px] mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* BLOCO 01 - LADO ESQUERDO: Carrossel (Tamanho Médio) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-[4/4] max-w-[480px] mx-auto lg:max-w-none bg-white rounded-3xl overflow-hidden relative shadow-sm border border-neutral-100 group">
            <AnimatePresence mode="wait">
              <motion.div
                key={imageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <ImageWithFallback 
                  src={images[imageIndex]} 
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                  isCritical={true}
                  fetchPriority="high"
                />
              </motion.div>
            </AnimatePresence>

            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-neutral-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-md cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-neutral-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-md cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none justify-center lg:justify-start">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    i === imageIndex ? 'border-neutral-900 scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <ImageWithFallback src={img} alt={`${product.product_name} ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BLOCO 01 - LADO DIREITO: Detalhes, Ações e Especificações reposicionadas */}
        <div className="lg:col-span-7 flex flex-col py-1">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-neutral-400">
                {product.category}
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
            
            {/* TAG ATACADO */}
            <button 
              onClick={handleWholesaleToggle}
              className={`px-4 py-1.5 rounded-full text-[9px] font-sans font-bold uppercase tracking-widest transition-all border ${
                !hasWholesale 
                  ? 'bg-neutral-100 border-neutral-100 text-neutral-300 cursor-not-allowed opacity-50' 
                  : isWholesaleActive 
                    ? 'bg-green-600 border-green-600 text-white shadow-md active:bg-green-700' 
                    : 'bg-[#3A312D] border-[#3A312D] text-white hover:bg-neutral-800'
              }`}
              disabled={!hasWholesale}
            >
              Ativar Atacado
            </button>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif text-neutral-900 mb-6 italic leading-tight">
            {product.product_name}
          </h1>

          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-3xl font-sans font-bold text-neutral-900">
              R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            {originalPrice > currentPrice && (
              <span className="text-lg font-sans text-neutral-300 line-through">
                R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            )}
            {isWholesaleActive && (
              <div className="ml-2 flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                <Check size={12} strokeWidth={3} />
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider">
                  Preço Atacado (Mín. {product.wholesale_min_qty})
                </span>
              </div>
            )}
          </div>

          <div className="prose prose-sm prose-neutral mb-10 max-w-none">
            <p className="text-neutral-500 leading-relaxed font-sans text-sm md:text-base">
              {product.description}
            </p>
          </div>

          {/* Variações */}
          {product.variations && product.variations.length > 0 && (
            <div className="space-y-6 mb-10 pt-6 border-t border-neutral-100">
              {product.variations.map((v: Variation, vIdx) => (
                <div key={`v-group-${vIdx}`} className="space-y-3">
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.textMuted}`}>{v.name}:</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {v.options.map((opt, oIdx) => (
                      <button
                        key={`var-${vIdx}-${oIdx}`}
                        onClick={() => setSelectedVariations({ ...selectedVariations, [v.name]: opt.name })}
                        className={`px-5 py-3 text-xs font-bold rounded-2xl border-2 transition-all duration-150 uppercase tracking-widest ${
                          selectedVariations[v.name] === opt.name 
                            ? `scale-[1.03] shadow-md ${theme.btnPrimary} border-transparent` 
                            : `${theme.btnSecondary}`
                        }`}
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
                        style={{ outlineColor: theme.accentColor }}
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
                              id={`ref-upload-page-${field.id}`}
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
                                htmlFor={`ref-upload-page-${field.id}`}
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
                      borderColor: selectedAddons.includes(addon.id) ? theme.accentColor : undefined
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

          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">
              {uploadError}
            </div>
          )}

          {/* AÇÕES DE COMPRA */}
          <div className="space-y-6 mt-8 pt-6 border-t border-neutral-100">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Seletor de Quantidade */}
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <div className="flex items-center bg-white rounded-2xl p-1.5 border border-neutral-100 shadow-sm">
                  <button 
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors disabled:opacity-30"
                    disabled={isWholesaleActive && quantity <= (product.wholesale_min_qty || 1)}
                  >
                    <Minus size={18} />
                  </button>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) handleQuantityChange(val);
                    }}
                    className="w-16 text-center bg-transparent border-none focus:ring-0 text-base font-sans font-bold text-neutral-900"
                    min={isWholesaleActive ? (product.wholesale_min_qty || 1) : 1}
                  />
                  <button 
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {isWholesaleActive && (
                  <p className="text-[9px] font-sans font-bold uppercase tracking-widest text-green-600 text-center">
                    Pedido mínimo: {product.wholesale_min_qty} un.
                  </p>
                )}
              </div>

              {/* Botão Adicionar */}
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

                  const packedProduct: Product & { 
                    selectedVariation?: string; 
                    personalizationValues?: Record<string, string>; 
                    selectedAddons?: any[];
                  } = {
                    ...product,
                    retail_price: currentPrice,
                    selectedVariation: selectedVariationString || undefined,
                    personalizationValues: Object.keys(personalizationValues).length > 0 ? personalizationValues : undefined,
                    selectedAddons: selectedAddons.length > 0 ? selectedAddons : undefined
                  };

                  onAddToCart(packedProduct, quantity);
                }}
                className={`flex-1 w-full flex items-center justify-center gap-3 py-5 px-8 rounded-2xl text-xs font-sans font-bold uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] ${theme.btnPrimary}`}
              >
                <ShoppingCart size={18} />
                Adicionar ao Carrinho
              </button>
            </div>

            {/* Ícones Secundários */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsFavorite(!isFavorite)}
                title="Favoritar"
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border group relative ${
                  isFavorite ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-neutral-100 text-neutral-400 hover:text-neutral-900 hover:border-neutral-200 shadow-sm'
                }`}
              >
                <Heart size={22} fill={isFavorite ? "currentColor" : "none"} />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                  Favoritar
                </span>
              </button>
              <button 
                onClick={() => onAddToGiftList?.(product)}
                title="Lista de Presentes"
                className="w-14 h-14 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:border-neutral-200 shadow-sm transition-all group relative"
              >
                <Gift size={22} />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                  Lista de Presentes
                </span>
              </button>
            </div>

            {/* ESPECIFICAÇÕES & PRAZOS (Movidos para o lado direito) */}
            <div className="mt-8 pt-6 border-t border-neutral-100 bg-white/70 rounded-2xl p-5 sm:p-6 border shadow-xs space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-serif text-neutral-900 italic font-semibold">Detalhes Técnicos</h3>
                  <ul className="space-y-2 text-xs text-neutral-500 font-sans">
                    <li className="flex justify-between border-b border-neutral-100 pb-1.5">
                      <span>Código:</span>
                      <span className="font-bold text-neutral-700">{product.code}</span>
                    </li>
                    <li className="flex justify-between border-b border-neutral-100 pb-1.5">
                      <span>Categoria:</span>
                      <span className="font-bold text-neutral-700">{product.category}</span>
                    </li>
                    {product.dimensions && (
                      <li className="flex justify-between border-b border-neutral-100 pb-1.5">
                        <span>Dimensões:</span>
                        <span className="font-bold text-neutral-700">
                          {product.dimensions.length}x{product.dimensions.width}x{product.dimensions.height} cm
                        </span>
                      </li>
                    )}
                    {product.weight && (
                      <li className="flex justify-between border-b border-neutral-100 pb-1.5">
                        <span>Peso:</span>
                        <span className="font-bold text-neutral-700">{product.weight}g</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-serif text-neutral-900 italic font-semibold">Prazos & Produção</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Produção sob demanda. Prazo médio de <strong>{product.productionTime || 5} dias úteis</strong> após a confirmação do pedido.
                  </p>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-neutral-500 shrink-0 shadow-xs">
                      <Check size={12} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-900 uppercase tracking-wider">Qualidade Garantida</p>
                      <p className="text-[9.5px] text-neutral-500 font-sans">Revisão minuciosa antes do envio.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informação de Personalização */}
              <div className="pt-3 border-t border-neutral-100 flex items-center gap-2.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                  (product.personalizationSettings && product.personalizationSettings.length > 0) ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  {(product.personalizationSettings && product.personalizationSettings.length > 0) ? <Check size={12} /> : <X size={12} />}
                </div>
                <p className="text-xs font-sans font-medium text-neutral-600">
                  {(product.personalizationSettings && product.personalizationSettings.length > 0)
                    ? 'Este produto pode ser personalizado com suas preferências.' 
                    : 'Este produto é enviado conforme o modelo padrão.'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
