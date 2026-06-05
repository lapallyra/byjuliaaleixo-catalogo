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
  Heart
} from 'lucide-react';
import { Product, CompanyId, CartItem } from '../types';
import { themes } from '../lib/theme';
import { formatCurrency } from '../lib/currencyUtils';
import { ImageWithFallback } from './ImageWithFallback';
import { PriceDisplay } from './ui/PriceDisplay';
import { uploadImage, compressImage } from '../services/firebaseStorageService';

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
  const theme = themes[companyId] || themes.pallyra;
  const accentColor = theme.accentColor;
  
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  
  // Custom personalization states
  const [customName, setCustomName] = useState('');
  const [customPhrase, setCustomPhrase] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  
  // File upload state
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Success notifications
  const [showToast, setShowToast] = useState<string | null>(null);

  // Set default variation on layout change
  useEffect(() => {
    if (product.variations && product.variations.length > 0) {
      const firstVar = product.variations[0];
      if (firstVar.options && firstVar.options.length > 0) {
        setSelectedVariation(`${firstVar.name}: ${firstVar.options[0].name}`);
      }
    } else {
      setSelectedVariation(null);
    }
    // Scroll to top on load
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQuantity(1);
    setCustomName('');
    setCustomPhrase('');
    setCustomNotes('');
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
  const currentPrice = isWholesaleActive ? product.wholesale_price : product.retail_price;
  const oldPrice = product.original_price || (product.retail_price * 1.25);
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
  const handleAddToCart = () => {
    const packedProduct: Product = {
      ...product,
      retail_price: currentPrice,
    };

    onAddToCart(packedProduct, quantity);
    // ANIMAÇÃO DE ADIÇÃO AO CARRINHO TEMPORARIAMENTE DESABILITADA. NOVA IMPLEMENTAÇÃO SERÁ CRIADA POSTERIORMENTE.
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
              <span>Produção: 03 a 20 dias úteis</span>
          </div>
          
          {/* Description */}
          <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
               {product.description || "Nenhuma descrição informada pelo ateliê."}
          </div>

          {/* BUTTONS: Crystal/Glassmorphism */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4">
                 <button 
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-5 rounded-2xl text-[11px] uppercase tracking-[0.2em] font-black relative flex items-center justify-center gap-3 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor}ff)`,
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <ShoppingCart size={16} />
                  <span>Carrinho</span>
                  <div className="ml-2 w-px h-4 bg-white/30" />
                  <Gift size={16} />
                </button>
            </div>
            
            <p className="text-[9px] text-center text-slate-400 uppercase tracking-widest font-bold">
              Personalizado à mão com exclusividade para você.
            </p>
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
