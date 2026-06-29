import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Info, 
  Check, 
  Sparkles, 
  ShoppingCart, 
  ArrowLeft, 
  Share2, 
  Gift, 
  Loader2, 
  FileText,
  Clock,
  Package,
  Heart,
  X
} from 'lucide-react';
import { Product, CompanyId, CartItem } from '../types';
import { themes, getTheme } from '../lib/theme';
import { formatCurrency } from '../lib/currencyUtils';
import { ImageWithFallback } from './ImageWithFallback';
import { PriceDisplay } from './ui/PriceDisplay';
import { uploadImage, compressImage } from '../services/firebaseStorageService';
import { getAddons } from '../services/firebaseService';
import { cleanOptionName, extractPriceFromOption } from '../utils/priceUtils';
import { ReviewList } from './Reviews/ReviewList';
import { ReviewForm } from './Reviews/ReviewForm';

import { validateProductStock } from '../utils/stockValidation';

interface ProductDetailPageProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onAddToGiftList?: (product: Product) => void;
  allProducts: Product[];
  companyId: CompanyId;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onClose,
  onAddToCart,
  onAddToGiftList,
  allProducts,
  companyId
}) => {
  const theme = getTheme(companyId);
  const accentColor = theme.accentColor;
  
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  
  // Custom personalization states
  const [personalizationValues, setPersonalizationValues] = useState<Record<string, string>>({});
  
  // Addons states
  const [availableAddons, setAvailableAddons] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  
  // File upload state
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Success notifications
  const [showToast, setShowToast] = useState<string | null>(null);

  // Fetch addons
  useEffect(() => {
    const fetchAddons = async () => {
      const addons = await getAddons(companyId);
      setAvailableAddons(addons.filter(a => a.active));
    };
    fetchAddons();
  }, [companyId]);

  // Set default variation on layout change
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
    // Scroll to top on load
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQuantity(1);
    setPersonalizationValues({});
    setSelectedAddons([]);
    setFileUrl(null);
    setImageIndex(0);
  }, [product]);

  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image, product.image_hover].filter(Boolean) as string[];
  
  const images = productImages.slice(0, 7); 

  // Price calculations
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

  const triggerShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?product=${product.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowToast('Link copiado para compartilhar!');
      setTimeout(() => setShowToast(null), 2500);
    });
  };

  // Click on related product
  const getProductRef = (prod: Product) => {
    onAddToCart(prod, 0); 
  };

  // Add to cart with fully packed customization details
  const handleAddToCart = async () => {
    setIsUploading(true); // Reusing as loading state for AddToCart check
    try {
      const stockCheck = await validateProductStock(product, quantity);
      if (!stockCheck.valid) {
         alert(`❌ Ops! ${stockCheck.reason}`);
         setIsUploading(false);
         return;
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
    } catch (e) {
      console.error(e);
      alert('Erro ao validar estoque.');
    } finally {
      setIsUploading(false);
    }
  };

  // Calculate relative lists
  const relatedProducts = allProducts
    .filter(p => p.company === companyId && p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const bestSellers = allProducts
    .filter(p => p.company === companyId && p.id !== product.id)
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 4);

  const sameCollection = allProducts
    .filter(p => p.company === companyId && p.id !== product.id && p.subcategory === product.subcategory)
    .slice(0, 4);

  const generateQuantityOptions = () => {
    let options = [];
    if (product.isWholesaleEnabled && wholesaleMinQty > 0) {
      for (let i = wholesaleMinQty; i <= 50; i += wholesaleMinQty) {
        options.push(i);
      }
    } else {
      for (let i = 1; i <= 20; i++) {
        options.push(i);
      }
    }
    return options.length > 0 ? options : [1, 2, 3, 4, 5];
  };

  return (
    <div className="w-full bg-[#FAFAF9] min-h-screen text-slate-900 pb-20 font-sans">
      
      {/* Dynamic Toast Feedback Overlay */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -40, x: '-50%' }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] px-8 py-4 bg-slate-900 text-stone-100 text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3"
          >
            <Sparkles size={16} className="text-amber-400 animate-pulse" />
            <span>{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BREADCRUMB & MAIN CONTAINER */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1c1c1c]/60 hover:text-black transition-colors group"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </div>

        {/* Path breadcrumbs aligned with product grid */}
        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-2 mb-8">
          <span>Início</span>
          <span>/</span>
          <span className="cursor-pointer hover:font-bold hover:text-slate-600 transition-all" onClick={onClose}>Catálogo</span>
          <span>/</span>
          <span className="text-slate-600">{product.category || 'Ateliê'}</span>
          <span>/</span>
          <span className="text-slate-900 font-extrabold">{product.product_name}</span>
        </div>

       {/* MAIN TWO-COLUMN CONTAINER */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        
        {/* LEFT COLUMN: IMAGE */}
        <div className="sticky top-24">
            <div className="aspect-[4/5] bg-white border border-slate-100 rounded-3xl overflow-hidden relative shadow-sm flex items-center justify-center p-6 sm:p-8">
              {product.isLastUnits && (
                <div className="absolute top-5 left-5 z-10 bg-rose-600 text-white font-extrabold text-[8px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg">
                  Últimas Unidades!
                </div>
              )}
              {discountPercent > 0 && (
                <div 
                  className="absolute top-5 right-5 z-10 text-white font-extrabold text-[8px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg"
                  style={{ backgroundColor: accentColor }}
                >
                  -{discountPercent}% OFF
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={imageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <ImageWithFallback 
                    src={images[imageIndex]} 
                    alt={product.product_name}
                    className="w-full h-full object-contain max-h-[500px]"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
        </div>

        {/* RIGHT COLUMN: INFO, PRODUCT, BUTTONS */}
        <div className="space-y-8">
          
          <div className="space-y-3">
            <span 
              className="text-[10px] font-black uppercase tracking-[0.4em] inline-block px-3 py-1 rounded-md mb-1 bg-amber-500/5 text-amber-800"
              style={{ color: accentColor, backgroundColor: `${accentColor}0a` }}
            >
              {product.category || 'Peça Exclusiva'}
            </span>
            <h1 className="text-4xl font-serif font-black tracking-tighter leading-tight text-neutral-950">
              {product.product_name}
            </h1>
          </div>

          {/* PRICING */}
          <div className="flex items-baseline gap-3">
              <PriceDisplay 
                price={currentPrice}
                originalPrice={oldPrice}
                installments={2}
                accentColor={accentColor}
              />
          </div>
          
          {/* Production Time */}
          <div className="flex items-center gap-2 text-sky-700 text-[10px] font-extrabold uppercase tracking-widest pl-1">
              <Clock size={14} strokeWidth={2.5} />
              <span>Produção: {product.productionTime || 5} { (product.productionTime || 5) === 1 ? 'dia útil' : 'dias úteis' }</span>
          </div>
          
          {/* ADICIONAIS / VARIAÇÕES (Condicional) */}
          {product.variations && product.variations.length > 0 && (
            <div className="mb-4">
              <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-slate-500`}>Personalização & Opções:</h3>
              <div className="flex flex-wrap gap-4">
                {product.variations.map((v, vIdx) => (
                  <div key={`v-group-${vIdx}`} className="w-full">
                    <p className={`text-[11px] font-bold mb-2 opacity-60 text-slate-800`}>{v.name}:</p>
                    <div className="flex flex-wrap gap-2">
                      {v.options.map((opt, oIdx) => (
                        <button
                          key={`var-${vIdx}-${oIdx}`}
                          onClick={() => setSelectedVariations({ ...selectedVariations, [v.name]: opt.name })}
                          className={`px-6 py-3 text-[11px] font-bold rounded-xl border-2 transition-all duration-500 uppercase tracking-widest ${
                            selectedVariations[v.name] === opt.name 
                              ? 'scale-[1.05] shadow-lg border-transparent text-white' 
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                          }`}
                          style={{
                            backgroundColor: selectedVariations[v.name] === opt.name ? accentColor : undefined,
                          }}
                        >
                          {opt.name} {opt.price > 0 ? `(+R$ ${opt.price.toFixed(2).replace('.', ',')})` : ''}
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
            <div className="mb-4 space-y-4">
              <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-slate-500`}>Detalhes da Personalização:</h3>
              {product.personalizationSettings.map((field) => (
                <div key={field.id} className="space-y-2">
                  {field.type !== 'image' && (
                    <label className="text-[11px] font-bold opacity-60 text-slate-800 flex items-center gap-1">
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
                      className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:ring-2 outline-none"
                      style={{ outlineColor: accentColor }}
                    />
                  )}
                  {field.type === 'select' && field.options && (
                    <div className="flex flex-wrap gap-2">
                      {field.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => setPersonalizationValues({...personalizationValues, [field.id]: opt})}
                          className={`px-6 py-3 text-[11px] font-bold rounded-xl border-2 transition-all duration-500 uppercase tracking-widest ${
                            personalizationValues[field.id] === opt 
                              ? 'scale-[1.05] shadow-lg border-transparent text-white' 
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                          }`}
                          style={{
                            backgroundColor: personalizationValues[field.id] === opt ? accentColor : undefined,
                          }}
                        >
                          {cleanOptionName(opt)}
                        </button>
                      ))}
                    </div>
                  )}
                  {field.type === 'image' && (
                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
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
                            id={`ref-upload-${field.id}`}
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
                              htmlFor={`ref-upload-${field.id}`}
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
          )}

          {/* ADDONS (Serviços Adicionais) */}
          {availableAddons.length > 0 && (
            <div className="mb-4 space-y-4">
              <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-slate-500`}>Serviços Adicionais:</h3>
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
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      selectedAddons.includes(addon.id) 
                        ? 'border-transparent shadow-md bg-white' 
                        : 'border-slate-100 bg-slate-50 opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: selectedAddons.includes(addon.id) ? accentColor : undefined
                    }}
                  >
                    {addon.image ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                        <ImageWithFallback src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0 flex items-center justify-center">
                        <Sparkles size={16} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{addon.name}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      selectedAddons.includes(addon.id) ? 'border-transparent text-white' : 'border-slate-300 text-transparent'
                    }`} style={{ backgroundColor: selectedAddons.includes(addon.id) ? accentColor : 'transparent' }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
               {product.description || "Nenhuma descrição informada pelo ateliê."}
          </div>

          {/* BUTTONS: Crystal/Glassmorphism */}
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={handleAddToCart}
                disabled={isUploading}
                className="py-5 rounded-2xl text-[11px] uppercase tracking-[0.2em] font-black transition-all duration-300 flex items-center justify-center gap-2 border-2 bg-white text-slate-800 hover:bg-[#fdfaf6] disabled:opacity-50"
                style={{
                  borderColor: `${accentColor}44`,
                }}
              >
                <ShoppingCart size={16} style={{ color: accentColor }} />
                <span>Adicionar ao Carrinho</span>
              </button>

              {onAddToGiftList && (
                <button 
                  type="button"
                  onClick={() => onAddToGiftList(product)}
                  className="py-5 rounded-2xl text-[11px] uppercase tracking-[0.2em] font-black transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                >
                  <Gift size={16} />
                  <span>Lista</span>
                </button>
              )}
            </div>
            
            <p className="text-[9px] text-center text-slate-400 uppercase tracking-widest font-bold">
              Personalizado à mão com exclusividade para você.
            </p>
          </div>

          <div className="pt-8 border-t border-slate-100">
             <ReviewList productId={product.id} />
             <ReviewForm productId={product.id} />
          </div>
        </div>
       </div>
      </div>



      {/* FOOTER SECTION: RELEVANT PRODUCTS SHELVES AND BENTO GRID */}
      <div className="max-w-7xl mx-auto px-6 mt-24 pt-16 border-t border-slate-200/80 space-y-20">
        
        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-baseline">
              <h2 className="text-xl font-serif font-black italic tracking-tight text-slate-900 border-l-4 pl-3" style={{ borderLeftColor: accentColor }}>
                Produtos Relacionados
              </h2>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#1c1c1c]/40 font-mono">Mesma Categoria</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((p, idx) => (
                <div 
                  key={`rel-${p.id}`}
                  onClick={() => {
                    getProductRef(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group bg-white border border-slate-100 p-3 rounded-2xl shadow-xs hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="aspect-square bg-slate-50/50 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center p-3">
                    <ImageWithFallback src={p.image} alt={p.product_name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" isThumbnail={true} />
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="font-serif font-bold text-xs sm:text-sm text-slate-800 group-hover:text-black line-clamp-1">{p.product_name}</h3>
                    <p className="text-[11px] font-black font-mono text-slate-900">{formatCurrency(p.retail_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SAME COLLECTION */}
        {sameCollection.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-baseline">
              <h2 className="text-xl font-serif font-black italic tracking-tight text-slate-900 border-l-4 pl-3" style={{ borderLeftColor: accentColor }}>
                Da Mesma Coleção
              </h2>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#1c1c1c]/40 font-mono">Subcoleção</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {sameCollection.map((p, idx) => (
                <div 
                  key={`same-${p.id}`}
                  onClick={() => {
                    getProductRef(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group bg-white border border-slate-100 p-3 rounded-2xl shadow-xs hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="aspect-square bg-slate-50/50 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center p-3">
                    <ImageWithFallback src={p.image} alt={p.product_name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" isThumbnail={true} />
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="font-serif font-bold text-xs sm:text-sm text-slate-800 group-hover:text-black line-clamp-1">{p.product_name}</h3>
                    <p className="text-[11px] font-black font-mono text-slate-900">{formatCurrency(p.retail_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BEST SELLERS */}
        {bestSellers.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-baseline">
              <h2 className="text-xl font-serif font-black italic tracking-tight text-slate-900 border-l-4 pl-3" style={{ borderLeftColor: accentColor }}>
                Os Mais Vendidos
              </h2>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#1c1c1c]/40 font-mono">Destaques</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {bestSellers.map((p, idx) => (
                <div 
                  key={`best-${p.id}`}
                  onClick={() => {
                    getProductRef(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group bg-white border border-slate-100 p-3 rounded-2xl shadow-xs hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="aspect-square bg-slate-50/50 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center p-3">
                    <ImageWithFallback src={p.image} alt={p.product_name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" isThumbnail={true} />
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="font-serif font-bold text-xs sm:text-sm text-slate-800 group-hover:text-black line-clamp-1">{p.product_name}</h3>
                    <p className="text-[11px] font-black font-mono text-slate-900">{formatCurrency(p.retail_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
