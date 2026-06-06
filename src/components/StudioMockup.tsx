import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Image as ImageIcon, 
  Settings, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  CheckCircle2, 
  Loader2, 
  Archive, 
  Sparkles,
  ChevronRight,
  Download,
  Search,
  BookOpen,
  Cloud,
  Database,
  AlertTriangle,
  Check,
  ExternalLink,
  Code,
  Sliders,
  Brain
} from 'lucide-react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { subscribeToProducts } from '../services/firebaseService';
import type { Product } from '../types';
import { ImageWithFallback } from './ImageWithFallback';

import { 
  isSupabaseConfigured,
  uploadArtworkToSupabase,
  saveReferenceData,
  saveExportToSupabase,
  fetchRecentExportsFromSupabase,
  SUPABASE_SQL_SETUP
} from '../lib/supabaseClient';


type VariantId = 'frente' | 'frente-verso' | 'frente-verso-plano' | 'catalogo' | 'instagram' | 'story';

const BACKGROUNDS = {
  studio: {
    name: 'Studio Premium',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop',
    description: 'Fundo clean e iluminação softbox',
    render: () => (
      <div className="absolute inset-0 flex flex-col justify-end overflow-hidden bg-gradient-to-b from-[#f2f1ed] to-[#e6e4de]">
        {/* Soft studio shadow play overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent)] z-0" />
        <div className="absolute bottom-0 w-full h-[30%] bg-gradient-to-t from-black/[0.04] to-transparent" />
      </div>
    )
  },
  quintal: {
    name: 'Quintal Natural',
    url: 'https://images.unsplash.com/photo-1558904541-efa843a96f13?q=80&w=1080&auto=format&fit=crop',
    description: 'Grama desfocada com luz solar',
    render: () => (
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1558904541-efa843a96f13?q=80&w=1080&auto=format&fit=crop" 
          alt="Quintal Natural" 
          className="absolute inset-0 w-full h-full object-cover blur-[5px] scale-110 opacity-70" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[#d8eed4] mix-blend-color opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-300/10 via-transparent to-transparent" />
      </div>
    )
  },
  tijolo: {
    name: 'Tijolinho Boutique',
    url: 'https://images.unsplash.com/photo-1519782536836-1fd0d1fba50d?q=80&w=1080&auto=format&fit=crop',
    description: 'Parede branca + madeira escura',
    render: () => (
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?q=80&w=500&auto=format&fit=crop" 
          alt="Tijolo Branco" 
          className="absolute inset-0 w-full h-full object-cover blur-[2px] opacity-25 scale-105" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer"
        />
        {/* Wooden floor base mockup layer */}
        <div className="absolute inset-0 bg-stone-100/40 mix-blend-multiply" />
        <div className="absolute bottom-0 w-full h-[35%] bg-gradient-to-b from-[#5c4a3e] via-[#3a2d24] to-[#1c140e] border-t-4 border-[#856b5a] shadow-[0_-12px_24px_rgba(0,0,0,0.3)]">
          <div className="absolute top-0 w-full h-4 bg-black/40 blur-sm" />
        </div>
      </div>
    )
  },
  sala: {
    name: 'Sala Aconchegante',
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1080&auto=format&fit=crop',
    description: 'Ambiente interno quente e emocional',
    render: () => (
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1080&auto=format&fit=crop" 
          alt="Sala Aconchegante" 
          className="absolute inset-0 w-full h-full object-cover blur-[6px] scale-110 opacity-60" 
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[#fbf5ee] mix-blend-multiply opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/5 via-transparent to-black/30" />
      </div>
    )
  }
};

const DEFAULT_PRODUCTS: Product[] = [
  { 
    id: 'prod_caneca', 
    code: 'CAN-STU', 
    company: 'tuttymimo', 
    product_name: 'Caneca Cerâmica', 
    description: 'Caneca de cerâmica brilhante 325ml', 
    current_price: 39.9, 
    retail_price: 39.9, 
    wholesale_price: 29.9, 
    wholesale_min_qty: 10, 
    original_price: 39.9, 
    image: '☕', 
    category: 'Canecas', 
    subcategory: 'Studio', 
    isVisible: true, 
    isFeatured: true, 
    isLastUnits: false, 
    template: 'caneca' 
  } as any,
  { 
    id: 'prod_agenda', 
    code: 'AGE-STU', 
    company: 'tuttymimo', 
    product_name: 'Agenda Executiva', 
    description: 'Agenda diária capa dura premium', 
    current_price: 59.9, 
    retail_price: 59.9, 
    wholesale_price: 49.9, 
    wholesale_min_qty: 10, 
    original_price: 59.9, 
    image: '📔', 
    category: 'Agendas', 
    subcategory: 'Studio', 
    isVisible: true, 
    isFeatured: true, 
    isLastUnits: false, 
    template: 'agenda' 
  } as any,
  { 
    id: 'prod_caderno', 
    code: 'CAD-STU', 
    company: 'tuttymimo', 
    product_name: 'Caderno Wire-O', 
    description: 'Caderno espiral universitário', 
    current_price: 49.9, 
    retail_price: 49.9, 
    wholesale_price: 39.9, 
    wholesale_min_qty: 10, 
    original_price: 49.9, 
    image: '📓', 
    category: 'Cadernos', 
    subcategory: 'Studio', 
    isVisible: true, 
    isFeatured: true, 
    isLastUnits: false, 
    template: 'caderno' 
  } as any,
  { 
    id: 'prod_caixa', 
    code: 'CAI-STU', 
    company: 'tuttymimo', 
    product_name: 'Caixa Cartonada', 
    description: 'Caixa de presente rígida e elegante', 
    current_price: 29.9, 
    retail_price: 29.9, 
    wholesale_price: 19.9, 
    wholesale_min_qty: 10, 
    original_price: 29.9, 
    image: '📦', 
    category: 'Caixas', 
    subcategory: 'Studio', 
    isVisible: true, 
    isFeatured: true, 
    isLastUnits: false, 
    template: 'caixa' 
  } as any,
];

export function StudioMockup() {
  const [artwork, setArtwork] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(DEFAULT_PRODUCTS[0]);
  const [scale, setScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  // Mode and Visual Settings
  const [backgroundType, setBackgroundType] = useState<keyof typeof BACKGROUNDS>('studio');
  const [selectedTemplate, setSelectedTemplate] = useState('caneca');

  // Formatos selecionados para exportação & download
  const [selectedVariants, setSelectedVariants] = useState<Record<VariantId, boolean>>({
    'frente': true,
    'frente-verso': true,
    'frente-verso-plano': true,
    'catalogo': true,
    'instagram': true,
    'story': true,
  });

  // Previews e Abas de Exibição
  const [previewTab, setPreviewTab] = useState<'interactive' | 'generated'>('interactive');
  const [generatedPreviews, setGeneratedPreviews] = useState<Record<string, string>>({});
  const [activePreviewVariant, setActivePreviewVariant] = useState<VariantId>('catalogo');
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);

  // Supabase integration states
  const [isUploadingArtwork, setIsUploadingArtwork] = useState(false);
  const [artworkCloudId, setArtworkCloudId] = useState<string | null>(null);
  const [artworkCloudUrl, setArtworkCloudUrl] = useState<string | null>(null);
  const [artworkName, setArtworkName] = useState<string>('');
  const [recentExports, setRecentExports] = useState<any[]>([]);
  const [isFetchingRecent, setIsFetchingRecent] = useState(false);
  const [historyProductFilter, setHistoryProductFilter] = useState('');
  const [showSQLExpansion, setShowSQLExpansion] = useState(false);
  const [supabaseErrorState, setSupabaseErrorState] = useState<string | null>(null);

  // AI Autoadjustment Engine states
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [detectedRatio, setDetectedRatio] = useState<string>('');
  const [detectedDimensions, setDetectedDimensions] = useState<string>('');
  const [detectedScale, setDetectedScale] = useState<number>(0.92);
  const [aiWrapMode, setAiWrapMode] = useState<boolean>(true); // active 300%+ round curve wrap simulation
  const [aiContrastValue, setAiContrastValue] = useState<number>(1.04); // subtle dynamic contrast enhancement
  const [aiBrightnessValue, setAiBrightnessValue] = useState<number>(1.01); // printable shine correction
  const [aiEdgeSmoothing, setAiEdgeSmoothing] = useState<boolean>(true); // border-anti-aliasing rounded surfaces
  const [aiSafeAreaStatus, setAiSafeAreaStatus] = useState<string>('');
  const [aiAlignStatus, setAiAlignStatus] = useState<string>('');

  const analyzeArtworkWithAI = (imgUrl: string | null) => {
    if (!imgUrl) {
      setDetectedRatio('');
      setDetectedDimensions('');
      setDetectedScale(0.92);
      setAiSafeAreaStatus('');
      setAiAlignStatus('');
      return;
    }

    setIsAnalyzingAI(true);
    const img = new Image();
    img.src = imgUrl;
    img.onload = () => {
      setTimeout(() => {
        const w = img.width;
        const h = img.height;
        const ratio = w / h;
        setDetectedDimensions(`${w} x ${h} px`);

        let ratioDesc = '';
        let idealScale = 0.92;
        let safeStr = 'Zona Útil Segura (95%) - Sem Cortes de Borda';
        let alignStr = 'Eixo Central: Perfeito (Alinhado no Baricentro da Estampa)';

        if (ratio > 1.6) {
          ratioDesc = `${ratio.toFixed(2)}:1 (Ampla / Panorâmica)`;
          idealScale = 1.05; // cover panorama
          safeStr = 'Modo Wrap 360° Ideal (Ajustando escala horizontal ampla)';
        } else if (ratio >= 1.1) {
          ratioDesc = `${ratio.toFixed(2)}:1 (Paisagem / Retangular)`;
          idealScale = 0.95;
          safeStr = 'Escala automática ajustada para envolver o miolo lateral';
        } else if (ratio >= 0.85) {
          ratioDesc = `${ratio.toFixed(2)}:1 (Quadrada)`;
          idealScale = 0.90;
          alignStr = 'Análise AI: Centralização balanceada com margens de resppiro';
        } else {
          ratioDesc = `${ratio.toFixed(2)}:1 (Vertical / Retrato)`;
          idealScale = 1.0;
          safeStr = 'Formato Retrato: Limitado em largura para evitar cortes nas espirais';
        }

        setDetectedRatio(ratioDesc);
        setDetectedScale(idealScale);
        setAiSafeAreaStatus(safeStr);
        setAiAlignStatus(alignStr);
        setIsAnalyzingAI(false);
      }, 650); // beautiful feedback analyzer pulse delay
    };
    img.onerror = () => {
      setIsAnalyzingAI(false);
      setDetectedRatio('Proporção Personalizada');
      setDetectedDimensions('Disponível');
    };
  };

  // Background, silent PDF/PNG generation for Realtime Experience and Automated Database sync
  const handleGeneratePreviewsInBackground = async () => {
    if (!artwork || !selectedProduct) return;
    try {
      const activeVariants = (Object.keys(refs) as Array<VariantId>).filter(v => selectedVariants[v]);
      const newPreviews: Record<string, string> = {};
      
      for (const variant of activeVariants) {
        const domNode = refs[variant].current;
        if (!domNode) continue;
        const dataUrl = await toPng(domNode, {
          quality: 0.92,
          pixelRatio: 1.5,
        });
        newPreviews[variant] = dataUrl;
      }
      setGeneratedPreviews(newPreviews);

      // Save to Supabase automatically
      if (isSupabaseConfigured && activeVariants.length > 0) {
        await saveReferenceData(
          {
            id: selectedProduct.id,
            name: selectedProduct.product_name,
            category: selectedProduct.category,
            code: selectedProduct.code,
            price: selectedProduct.current_price
          },
          selectedTemplate,
          {
            id: backgroundType,
            name: BACKGROUNDS[backgroundType].name,
            url: BACKGROUNDS[backgroundType].url || ''
          }
        ).catch(() => {});

        for (const variant of activeVariants) {
          const dataUrl = newPreviews[variant];
          if (dataUrl) {
            await saveExportToSupabase({
              productId: selectedProduct.id,
              templateId: selectedTemplate,
              backgroundId: backgroundType,
              artworkId: artworkCloudId,
              type: variant,
              dataUrl: dataUrl
            }).catch(() => {});
          }
        }
        // update recent view
        const data = await fetchRecentExportsFromSupabase(historyProductFilter || undefined).catch(() => []);
        if (data && data.length > 0) {
          setRecentExports(data);
        }
      }
    } catch (err) {
      console.warn("Silent background preview generation/saving failed: ", err);
    }
  };

  // References for generating images
  const refs = {
    'frente': useRef<HTMLDivElement>(null),
    'frente-verso': useRef<HTMLDivElement>(null),
    'frente-verso-plano': useRef<HTMLDivElement>(null),
    'catalogo': useRef<HTMLDivElement>(null),
    'instagram': useRef<HTMLDivElement>(null),
    'story': useRef<HTMLDivElement>(null),
  };

  // Load recent exports history
  const loadRecentExports = async () => {
    if (!isSupabaseConfigured) return;
    setIsFetchingRecent(true);
    try {
      const data = await fetchRecentExportsFromSupabase(historyProductFilter || undefined);
      setRecentExports(data);
    } catch (err: any) {
      console.error('Erro ao buscar recentes do Supabase:', err);
    } finally {
      setIsFetchingRecent(false);
    }
  };

  useEffect(() => {
    loadRecentExports();
  }, [historyProductFilter]);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((productsData) => {
      const dbProducts = productsData.filter(p => !(p as any).isHidden).map(p => {
        let template = 'caneca';
        const nameLower = p.product_name.toLowerCase();
        const catLower = p.category.toLowerCase();
        if (nameLower.includes('caneca') || catLower.includes('caneca')) template = 'caneca';
        else if (nameLower.includes('agenda') || catLower.includes('agenda')) template = 'agenda';
        else if (nameLower.includes('caderno') || catLower.includes('caderno')) template = 'caderno';
        else if (nameLower.includes('caixa') || catLower.includes('caixa')) template = 'caixa';
        else if (nameLower.includes('livro')) template = 'agenda';
        return { ...p, template };
      });
      setProducts([...DEFAULT_PRODUCTS, ...dbProducts]);
    });
    return () => unsubscribe();
  }, []);

  // Sync selectedProduct with active template
  useEffect(() => {
    if (selectedProduct) {
      setSelectedTemplate((selectedProduct as any).template || 'caneca');
    }
  }, [selectedProduct]);

  // Clear generated preview cache if inputs change and trigger dynamic AI Analysis
  useEffect(() => {
    setGeneratedPreviews({});
    if (artwork) {
      analyzeArtworkWithAI(artwork);
    } else {
      analyzeArtworkWithAI(null);
    }
  }, [artwork]);

  // Real-time automatic render of mockups on artwork or parameters change without needing custom manual refresh buttons
  useEffect(() => {
    if (!artwork || !selectedProduct) return;
    
    const delayDebounceFn = setTimeout(() => {
      handleGeneratePreviewsInBackground();
    }, 1100); // 1.1s debounce to avoid over-rendering on fast adjustments

    return () => clearTimeout(delayDebounceFn);
  }, [artwork, selectedProduct, backgroundType, selectedTemplate, detectedScale, aiWrapMode, aiContrastValue, aiBrightnessValue, aiEdgeSmoothing]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setArtwork(url);
      setArtworkName(file.name);
      
      // Upload under-the-hood to real Supabase
      if (isSupabaseConfigured) {
        setIsUploadingArtwork(true);
        setSupabaseErrorState(null);
        try {
          const { id, url: cloudUrl } = await uploadArtworkToSupabase(file, file.name);
          setArtworkCloudId(id);
          setArtworkCloudUrl(cloudUrl);
        } catch (err: any) {
          console.error('Erro no upload para o Supabase:', err);
          setSupabaseErrorState(`Falha ao registrar no Supabase Storage: ${err.message || err}`);
        } finally {
          setIsUploadingArtwork(false);
        }
      }
    }
  };


  const handleGeneratePreviews = async () => {
    if (!artwork || !selectedProduct) {
      alert("Por favor, envie uma arte e selecione um produto!");
      return;
    }
    setIsGeneratingPreviews(true);
    setPreviewTab('generated');
    try {
      const activeVariants = (Object.keys(refs) as Array<VariantId>).filter(v => selectedVariants[v]);
      const newPreviews: Record<string, string> = {};
      
      for (const variant of activeVariants) {
        const domNode = refs[variant].current;
        if (!domNode) continue;
        await new Promise(r => setTimeout(r, 150)); // allow DOM rendering
        const dataUrl = await toPng(domNode, {
          quality: 0.95,
          pixelRatio: 1.5,
        });
        newPreviews[variant] = dataUrl;
      }
      setGeneratedPreviews(newPreviews);
      if (activeVariants.length > 0 && !activeVariants.includes(activePreviewVariant)) {
        setActivePreviewVariant(activeVariants[0]);
      }

      // Automatically sync and save to Supabase
      if (isSupabaseConfigured && activeVariants.length > 0) {
        try {
          // 1. Ensure reference tables are fully populated
          await saveReferenceData(
            {
              id: selectedProduct.id,
              name: selectedProduct.product_name,
              category: selectedProduct.category,
              code: selectedProduct.code,
              price: selectedProduct.current_price
            },
            selectedTemplate,
            {
              id: backgroundType,
              name: BACKGROUNDS[backgroundType].name,
              url: BACKGROUNDS[backgroundType].url || ''
            }
          );

          // 2. Loop through variants and upload/save them to Supabase
          for (const variant of activeVariants) {
            const dataUrl = newPreviews[variant];
            if (dataUrl) {
              await saveExportToSupabase({
                productId: selectedProduct.id,
                templateId: selectedTemplate,
                backgroundId: backgroundType,
                artworkId: artworkCloudId,
                type: variant,
                dataUrl: dataUrl
              });
            }
          }

          // 3. Reload recent history list
          await loadRecentExports();
        } catch (dbErr: any) {
          console.error("Erro ao salvar automaticamente no Supabase:", dbErr);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar previews de imagens. Recursos externos podem ser bloqueados por CORS.');
    } finally {
      setIsGeneratingPreviews(false);
    }
  };

  const handleDownloadActivePng = async () => {
    if (!artwork || !selectedProduct) {
      alert("Por favor, envie uma arte e escolha um produto primeiro!");
      return;
    }

    const variant = activePreviewVariant;
    const domNode = refs[variant]?.current;
    if (!domNode) {
      alert("Por favor, marque este formato primeiro para renderizá-lo e baixá-lo.");
      return;
    }

    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 120));
      const dataUrl = await toPng(domNode, {
        quality: 1,
        pixelRatio: 2, // High resolution
      });
      saveAs(dataUrl, `Mockup_${selectedProduct.product_name.replace(/\s+/g, '_')}_${variant}.png`);
    } catch (err) {
      console.error(err);
      alert("Erro ao exportar a imagem em alta definição.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportZip = async () => {
    if (!artwork || !selectedProduct) {
      alert("Por favor, envie uma arte e selecione um produto!");
      return;
    }
    
    const activeVariants = (Object.keys(refs) as Array<VariantId>).filter(v => selectedVariants[v]);
    if (activeVariants.length === 0) {
      alert("Sua lista de downloads está vazia. Selecione ao menos um formato.");
      return;
    }
    
    setIsExporting(true);
    const zip = new JSZip();
    const folderName = `Mockups_${selectedProduct.product_name.replace(/\s+/g, '_')}`;
    const folder = zip.folder(folderName);

    try {
      for (const variant of activeVariants) {
        const domNode = refs[variant].current;
        if (!domNode) continue;
        
        await new Promise(r => setTimeout(r, 120));
        const dataUrl = await toPng(domNode, {
          quality: 1,
          pixelRatio: 2, // Ultra HD crispness
        });
        
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        folder?.file(`mockup_${variant}.png`, base64Data, { base64: true });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${folderName}.zip`);
    } catch (err) {
      console.error(err);
      alert('Erro na geração do arquivo ZIP.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderTemplateObject = (type: string, isFlat: boolean = false, extraClasses: string = "") => {
    if (!artwork) {
      return (
        <div className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#fafafa] border-2 border-dashed border-stone-200/60 p-6 ${extraClasses}`}>
          <ImageIcon size={32} className="text-stone-300 mb-2" strokeWidth={1.5} />
          <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Sem Imagem Enviada</span>
        </div>
      );
    }

    return (
      <div className={`relative w-full h-full flex items-center justify-center overflow-hidden bg-transparent ${extraClasses}`}>
        {/* Caneca / Mug */}
        {type === 'caneca' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {isFlat ? (
              <div className="w-full h-full bg-white p-6 flex flex-col items-center justify-center rounded-xl border border-stone-100">
                <span className="text-[9px] font-bold text-stone-400 tracking-widest uppercase mb-2">Molde Plano da Caneca</span>
                <img 
                  src={artwork} 
                  alt="Caneca plana" 
                  className="max-w-[85%] max-h-[70%] object-contain" 
                  style={{
                    filter: `contrast(${aiContrastValue}) brightness(${aiBrightnessValue})`,
                  }}
                />
              </div>
            ) : (
              <div className="relative w-[210px] h-[250px] flex items-center justify-center z-10 scale-[1.1]">
                {/* Curved Porcelain handle */}
                <div className="absolute top-[20%] right-[-14px] w-[55px] h-[130px] border-[15px] border-stone-100 rounded-full border-l-0 shadow-[4px_12px_20px_-3px_rgba(0,0,0,0.18)] z-0" />
                <div className="absolute top-[18%] right-[-10px] w-[50px] h-[120px] border-[13px] border-black/5 rounded-full border-l-0 z-0 filter blur-[1px]" />
                
                {/* Porcelain Body */}
                <div className="absolute inset-x-4 inset-y-0 overflow-hidden bg-white z-10 flex items-center justify-center rounded-b-[4rem] rounded-t-[1.5rem] border border-stone-200/40 shadow-[0_20px_45px_rgba(0,0,0,0.22)]">
                  {/* Applied Artwork */}
                  {(() => {
                    const isWide = (detectedRatio.includes('Ampla') || detectedRatio.includes('Panorâmica') || detectedRatio.includes('Paisagem'));
                    const canecaW = isWide ? '100%' : '68%';
                    const canecaH = isWide ? '82%' : '68%';
                    const canecaFit = isWide ? 'cover' : 'contain';
                    return (
                      <img 
                        src={artwork} 
                        alt="Caneca mockup" 
                        className="absolute mix-blend-multiply opacity-95 transition-all duration-300" 
                        style={{
                          width: canecaW,
                          height: canecaH,
                          objectFit: canecaFit,
                          transform: `scale(${detectedScale}) ${aiWrapMode ? 'perspective(280px) rotateY(-6.5deg) rotateX(0.8deg) skewY(1.1deg)' : ''}`,
                          filter: `contrast(${aiContrastValue}) brightness(${aiBrightnessValue})`,
                          borderRadius: aiEdgeSmoothing && isWide ? '0px 0px 3.2rem 3.2rem' : '4px',
                        }}
                        crossOrigin="anonymous" 
                      />
                    );
                  })()}
                  
                  {/* 3D Reflection gradients */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-white/20 to-black/35 z-20 pointer-events-none mix-blend-overlay" />
                  <div className="absolute inset-y-0 left-[12%] w-[12%] bg-white/40 z-20 pointer-events-none blur-[1px]" />
                  <div className="absolute inset-y-0 right-[15%] w-[8%] bg-black/15 z-20 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Agenda Cover */}
        {type === 'agenda' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {isFlat ? (
              <div className="w-full h-full bg-white p-6 flex flex-col items-center justify-center rounded-xl border border-stone-100">
                <span className="text-[9px] font-bold text-stone-400 tracking-widest uppercase mb-2">Molde Capa Agenda</span>
                <img 
                  src={artwork} 
                  alt="Agenda plana" 
                  className="max-w-[70%] max-h-[75%] object-contain shadow-sm border" 
                  style={{
                    filter: `contrast(${aiContrastValue}) brightness(${aiBrightnessValue})`,
                  }}
                />
              </div>
            ) : (
              <div className="relative w-[230px] h-[310px] bg-white rounded-r-2xl rounded-l-md shadow-[0_25px_50px_rgba(0,0,0,0.25)] border-y border-r border-[#e0cb95]/50 flex items-center justify-center overflow-hidden scale-[1.05]">
                {/* Book Spine (Left leather part) */}
                <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-[#21201d] via-[#48453f] to-[#34322d] z-30" />
                <div className="absolute inset-y-0 left-4 w-[2px] bg-black/25 z-30" />
                
                {/* Golden corner guards */}
                <div className="absolute top-0 right-0 w-7 h-7 bg-gradient-to-br from-[#edd7b2] via-[#ca9e5a] to-[#926b2b] rotate-45 translate-x-3.5 -translate-y-3.5 z-35 shadow-sm" />
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-gradient-to-tr from-[#edd7b2] via-[#ca9e5a] to-[#926b2b] -rotate-45 translate-x-3.5 translate-y-3.5 z-35 shadow-sm" />
                
                {/* Double bookmark ribbon */}
                <div className="absolute bottom-0 right-[42%] w-2.5 h-16 bg-[#ca9e5a] rounded-b shadow-[2px_4px_8px_rgba(0,0,0,0.15)] z-0 transform translate-y-12" />
                
                {/* Gold gilded paper edges on active side */}
                <div className="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-r from-[#ca9e5a] via-white to-[#ca9e5a] z-20" />
                
                {/* Applied Artwork Cover Container */}
                <div className="absolute inset-y-0 left-5 right-1.5 overflow-hidden rounded-r-xl bg-white z-10 flex items-center justify-center p-3">
                  <img 
                    src={artwork} 
                    alt="Agenda mockup" 
                    className="absolute shadow-inner transition-all duration-300" 
                    style={{
                      width: '85%',
                      height: '85%',
                      objectFit: 'contain', // avoids all text cuts
                      transform: `scale(${detectedScale})`,
                      filter: `contrast(${aiContrastValue}) brightness(${aiBrightnessValue})`,
                      borderRadius: aiEdgeSmoothing ? '10px' : '0px',
                    }}
                    crossOrigin="anonymous" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/10 z-20 pointer-events-none mix-blend-overlay" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Caderno Espiral / wire-o */}
        {type === 'caderno' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {isFlat ? (
              <div className="w-full h-full bg-white p-6 flex flex-col items-center justify-center rounded-xl border border-stone-100">
                <span className="text-[9px] font-bold text-stone-400 tracking-widest uppercase mb-2">Molde Estampa Caderno</span>
                <img 
                  src={artwork} 
                  alt="Caderno plano" 
                  className="max-w-[70%] max-h-[75%] object-contain" 
                  style={{
                    filter: `contrast(${aiContrastValue}) brightness(${aiBrightnessValue})`,
                  }}
                />
              </div>
            ) : (
              <div className="relative w-[250px] h-[320px] bg-white rounded-r-xl rounded-l-sm shadow-[0_20px_45px_rgba(0,0,0,0.22)] border border-stone-100 flex items-center justify-center overflow-hidden">
                {/* Realistic Steel Wire-O coils binding left side */}
                <div className="absolute inset-y-0 left-0 w-6 bg-stone-100/90 flex flex-col justify-around py-5 z-30 shadow-inner border-r border-[#e5e4de]">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="w-[20px] h-2 bg-gradient-to-b from-stone-400 via-stone-100 to-stone-500 rounded-full border border-stone-300 ml-[1px] shadow-sm transform -rotate-12" />
                  ))}
                </div>
                
                {/* Applied texturized paperback notebook cover */}
                <div className="absolute inset-y-0 left-6 right-0 overflow-hidden bg-white z-10 flex items-center justify-center p-3">
                  <div className="w-full h-full rounded border border-gray-100 relative overflow-hidden flex items-center justify-center bg-[#faf9f6]">
                    <img 
                      src={artwork} 
                      alt="Caderno mockup cover" 
                      className="absolute pointer-events-none transition-all duration-300" 
                      style={{
                        width: '84%',
                        height: '84%',
                        objectFit: 'contain', // avoids cutouts
                        transform: `scale(${detectedScale})`,
                        filter: `contrast(${aiContrastValue}) brightness(${aiBrightnessValue})`,
                        borderRadius: aiEdgeSmoothing ? '8px' : '0px',
                      }}
                      crossOrigin="anonymous" 
                    />
                    {/* Gloss / Textured laminate shadow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/8 via-transparent to-black/5 z-20 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Caixa / Carton Box */}
        {type === 'caixa' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {isFlat ? (
              <div className="w-full h-full bg-white p-6 flex flex-col items-center justify-center rounded-xl border border-stone-100">
                <span className="text-[9px] font-bold text-stone-400 tracking-widest uppercase mb-2">Molde Caixa Planificada</span>
                <img 
                  src={artwork} 
                  alt="Caixa plana" 
                  className="max-w-[85%] max-h-[70%] object-contain" 
                  style={{
                    filter: `contrast(${aiContrastValue}) brightness(${aiBrightnessValue})`,
                  }}
                />
              </div>
            ) : (
              <div className="relative w-[300px] h-[220px] flex items-center justify-center z-10 scale-[1.05]">
                {/* 3D rigid box body */}
                <div className="relative w-full h-full bg-stone-50 rounded-2xl shadow-[0_30px_60px_-10px_rgba(0,0,0,0.28)] border border-stone-200/50 flex flex-col justify-between overflow-hidden">
                  
                  {/* Premium Box Cover with Golden ribbon line */}
                  <div className="h-[40%] bg-gradient-to-b from-stone-50 via-white to-stone-200/90 shadow-md border-b border-stone-300/60 relative flex items-center justify-center px-4 z-20">
                    {/* Horizontal Golden Strap */}
                    <div className="absolute left-[30%] w-5 h-full bg-gradient-to-r from-[#edd7b2] via-[#ca9e5a] to-[#926b2b]" />
                    <div className="absolute right-[12%] w-5 h-5 bg-gradient-to-br from-[#edd7b2] to-[#926b2b] rotate-45 border border-[#ca9e5a]/30 shadow-xs" />
                    <span className="text-[8px] font-black text-stone-800 uppercase tracking-widest z-30">PREMIUM PACK</span>
                  </div>

                  {/* Main bottom carton base with applied art */}
                  <div className="h-[60%] bg-white relative flex items-center justify-center p-3.5 z-10">
                    {/* Continuing Vertical Ribbon */}
                    <div className="absolute left-[30%] w-5 h-full bg-gradient-to-r from-[#edd7b2] via-[#ca9e5a] to-[#926b2b] top-0 bottom-0" />
                    
                    <div className="absolute inset-x-3 bottom-3 top-3 overflow-hidden rounded bg-white flex items-center justify-center p-1.5 shadow-inner border border-stone-100">
                      <img 
                        src={artwork} 
                        alt="Caixa mockup base" 
                        className="absolute transition-all duration-300" 
                        style={{
                          maxWidth: '85%',
                          maxHeight: '85%',
                          objectFit: 'contain',
                          transform: `scale(${detectedScale})`,
                          filter: `contrast(${aiContrastValue}) brightness(${aiBrightnessValue})`,
                          borderRadius: aiEdgeSmoothing ? '6px' : '0px',
                        }}
                        crossOrigin="anonymous" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15 z-20 pointer-events-none mix-blend-overlay" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(search.toLowerCase()) || 
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-[#f8f9fc] flex flex-col font-sans overflow-hidden">
      {/* 4K HD Offscreen render zone for Canvas exports */}
      <div className="absolute overflow-hidden" style={{ top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}>
        {/* 1. Frente (1080x1080) */}
        <div ref={refs['frente']} className="w-[1080px] h-[1080px] bg-white flex items-center justify-center relative overflow-hidden">
          {BACKGROUNDS[backgroundType].render()}
          <div className="w-[900px] h-[900px] flex items-center justify-center">
            {renderTemplateObject(selectedTemplate, false, "w-full h-full scale-[1.65]")}
          </div>
        </div>
        
        {/* 2. Frente + Verso (1080x1080) */}
        <div ref={refs['frente-verso']} className="w-[1080px] h-[1080px] bg-white flex items-center justify-center gap-12 relative overflow-hidden">
          {BACKGROUNDS[backgroundType].render()}
          <div className="absolute top-12 left-12 text-6xl font-black text-[#ca9e5a]/45 tracking-wider uppercase z-30 font-sans">
            EXCLUSIVO
          </div>
          <div className="w-[440px] h-[640px] flex items-center justify-center transform -rotate-6 z-10 scale-[1.3]">
            {renderTemplateObject(selectedTemplate, false, "w-full h-full")}
          </div>
          <div className="w-[440px] h-[640px] flex items-center justify-center transform rotate-6 z-20 -ml-16 mt-24 scale-[1.3]">
            {renderTemplateObject(selectedTemplate, false, "w-full h-full")}
          </div>
        </div>

        {/* 3. Frente + Verso + Arte plana (1080x1080) */}
        <div ref={refs['frente-verso-plano']} className="w-[1080px] h-[1080px] bg-white flex flex-col items-center justify-center p-14 gap-6 relative overflow-hidden">
          {BACKGROUNDS[backgroundType].render()}
          <div className="flex items-center justify-center gap-6 w-full h-[54%] z-10 scale-[1.15] mt-6">
            <div className="w-[380px] h-[480px] flex items-center justify-center transform -rotate-6">
              {renderTemplateObject(selectedTemplate, false, "w-full h-full")}
            </div>
            <div className="w-[380px] h-[480px] flex items-center justify-center transform rotate-6">
              {renderTemplateObject(selectedTemplate, false, "w-full h-full")}
            </div>
          </div>
          <div className="w-[920px] h-[36%] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 z-20 border border-[#ca9e5a]/20">
            <span className="text-stone-500 font-bold tracking-widest text-xs mb-3 uppercase">Layout de Estampa Aberta</span>
            <div className="w-full h-full flex-1 relative bg-stone-50/50 rounded-xl overflow-hidden shadow-inner border border-stone-100">
              {renderTemplateObject(selectedTemplate, true, "w-full h-full")}
            </div>
          </div>
        </div>

        {/* 4. Catálogo Limpo (800x800) */}
        <div ref={refs['catalogo']} className="w-[800px] h-[800px] bg-white flex items-center justify-center relative">
          <div className="w-[700px] h-[700px] flex items-center justify-center">
            {renderTemplateObject(selectedTemplate, false, "w-full h-full scale-[1.4]")}
          </div>
        </div>

        {/* 5. Instagram (1080x1080) */}
        <div ref={refs['instagram']} className="w-[1080px] h-[1080px] bg-white flex flex-col items-center justify-center relative overflow-hidden">
          {BACKGROUNDS[backgroundType].render()}
          <div className="text-5xl font-extrabold text-[#111] drop-shadow-sm tracking-tight absolute top-[12%] text-center w-full uppercase z-30 px-12 font-sans flex items-center justify-center gap-3">
             <span className="text-[#ca9e5a]">★</span> {selectedProduct?.product_name || "Lançamento"} <span className="text-[#ca9e5a]">★</span>
          </div>
          <div className="w-[780px] h-[780px] flex items-center justify-center mt-12 z-20 scale-[1.2]">
            {renderTemplateObject(selectedTemplate, false, "w-full h-full")}
          </div>
          <div className="absolute bottom-[10%] text-xl font-bold text-stone-900 bg-white/95 backdrop-blur-xs px-12 py-4 rounded-full shadow-xl z-30 border border-[#ca9e5a]/30">
            Adquira o Seu Personalizado
          </div>
        </div>

        {/* 6. Story Vertical (1080x1920) */}
        <div ref={refs['story']} className="w-[1080px] h-[1920px] bg-white flex flex-col items-center justify-center relative overflow-hidden">
          {BACKGROUNDS[backgroundType].render()}
          <div className="absolute top-[16%] text-center z-30 w-full px-16">
            <span className="text-xl font-bold text-[#ca9e5a] tracking-[0.4em] uppercase block mb-4">NOVIDADE</span>
            <h2 className="text-7xl font-black text-stone-900 tracking-tight uppercase leading-none drop-shadow-xs">{selectedProduct?.product_name}</h2>
            <div className="w-24 h-1 bg-[#ca9e5a] mx-auto mt-6 rounded-full" />
          </div>
          <div className="w-[850px] h-[850px] flex items-center justify-center z-20 scale-[1.35] my-10">
            {renderTemplateObject(selectedTemplate, false, "w-full h-full")}
          </div>
          <div className="absolute bottom-[16%] bg-stone-950 text-[#edd7b2] px-16 py-7 rounded-2xl text-3xl font-bold shadow-2xl z-30 border border-[#ca9e5a]/30">
            Peça agora via catálogo
          </div>
        </div>
      </div>

      {/* SaaS Premium Branding Header */}
      <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between z-20 shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-950 flex items-center justify-center shadow-md shadow-stone-950/10 text-white relative overflow-hidden">
            <Sparkles size={16} className="text-[#edd7b2] relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#926b2b]/20 to-[#edd7b2]/40 opacity-50 z-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-stone-900 uppercase tracking-widest">Mockup Studio</h1>
              <span className="text-[9px] font-bold text-[#a3793c] bg-[#faf9f6] border border-[#f3eee2] px-1.5 py-0.5 rounded uppercase">Interno</span>
            </div>
            <p className="text-[10px] text-stone-400 font-medium">Ferramenta exclusiva para gerenciar produtos personalizados</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => { 
              setArtwork(null); 
              setArtworkCloudId(null);
              setArtworkCloudUrl(null);
              setArtworkName('');
            }}
            className="text-xs font-semibold text-stone-500 hover:text-stone-900 px-3 py-1.5 rounded-lg transition-colors hover:bg-stone-50"
          >
            Limpar Canvas
          </button>
          <div className="h-5 w-px bg-stone-200" />
          {isSupabaseConfigured ? (
            <span className="text-xs text-stone-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-2 font-sans font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Supabase Ativo
            </span>
          ) : (
            <button
              onClick={() => setShowSQLExpansion(!showSQLExpansion)}
              className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-2 font-sans font-medium transition-all cursor-pointer"
            >
              <Database size={13} className="text-amber-500 animate-bounce" />
              Supabase Ausente (Guia SQL)
            </button>
          )}
        </div>
      </header>

      {/* SQL Setup expander wizard if toggled or if database unconfigured */}
      <AnimatePresence>
        {showSQLExpansion && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#faf9f6] border-b border-[#e5dfd3] overflow-hidden shrink-0"
          >
            <div className="max-w-5xl mx-auto p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-[#a3793c]">
                  <Database size={18} />
                  <h3 className="text-sm font-black uppercase tracking-wider">Como configurar seu banco Supabase</h3>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Para habilitar o salvamento automático de mockups gerados, envie suas artes diretamente para o armazenamento na nuvem e consulte históricos de forma profissional, você deve configurar as credenciais do seu projeto Supabase nas variáveis de ambiente.
                </p>
                <div className="space-y-2">
                  <div className="bg-white p-2.5 rounded-xl border border-[#ece6d9] font-mono text-[10px] text-stone-700 leading-relaxed select-all">
                    VITE_SUPABASE_URL="https://seu-projeto.supabase.co"<br />
                    VITE_SUPABASE_ANON_KEY="sua-chave-anon-publica"
                  </div>
                  <span className="text-[10px] text-stone-400 block">
                    Adicione essas variáveis no painel de configurações (Secrets) do seu projeto no AI Studio ou arquivo local <code className="bg-white px-1 py-0.5 rounded border border-[#ece6d9] text-[9px]">.env</code>.
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Script SQL de Inicialização</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
                      alert('Script copiado com sucesso! Cole no editor SQL do seu Supabase.');
                    }}
                    className="text-[9px] font-black text-[#a3793c] hover:text-[#926b2b] uppercase tracking-widest bg-white hover:bg-stone-50 px-3 py-1 rounded-lg border border-[#ece6d9] flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={10} /> Copiar SQL
                  </button>
                </div>
                <textarea
                  readOnly
                  value={SUPABASE_SQL_SETUP}
                  className="w-full h-32 bg-stone-900 text-[#edd7b2] p-3 rounded-xl font-mono text-[9px] resize-none focus:outline-none focus:ring-1 focus:ring-[#ca9e5a]"
                />
                <span className="text-[9px] text-stone-400 mt-1">
                  Abra o painel do seu Supabase, clique em SQL Editor {"->"} New Query, cole o script acima e clique em Run. Certifique-se de configurar a permissão de leitura pública nos buckets de storage!
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Responsive Area - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* COLUNA 1: UPLOAD & SELEÇÃO DE PRODUTO */}
        <div className="w-80 bg-white border-r border-gray-100 flex flex-col shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.015)]">
          <div className="p-5 border-b border-stone-100 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-3.5 bg-stone-950 rounded-full"></div>
              <h3 className="text-[11px] font-black uppercase tracking-wider text-stone-800">1. Upload da Arte</h3>
            </div>
            
            {/* File Upload Trigger Frame */}
            <button 
              type="button"
              disabled={isUploadingArtwork}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-5 px-4 bg-[#faf9f6]/40 border-2 border-dashed border-[#ca9e5a]/35 hover:border-[#ca9e5a] hover:bg-[#faf9f6]/90 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all text-left cursor-pointer group relative overflow-hidden"
            >
              {isUploadingArtwork ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 shadow-inner">
                  <Loader2 size={22} className="animate-spin" />
                </div>
              ) : artwork ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-stone-200 shadow-sm relative group-hover:scale-105 transition-transform bg-white p-1">
                  <img src={artwork} alt="Preview arte" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <RefreshCw size={14} className="animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#faf9f6] text-[#ca9e5a] shadow-inner transition-transform group-hover:scale-110">
                  <Upload size={22} />
                </div>
              )}
              <div className="text-center w-full">
                <span className="text-xs font-bold text-stone-700 group-hover:text-stone-950 block">
                  {isUploadingArtwork ? 'Enviando ao Storage...' : artwork ? 'Alterar Imagem' : 'Importar Arte'}
                </span>
                <span className="text-[9px] text-stone-400 font-medium block mt-0.5 truncate max-w-full px-2">
                  {artworkCloudUrl ? '✓ Sincronizado no Supabase' : 'Extensões PNG ou JPG'}
                </span>
              </div>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload} 
            />
          </div>

          {/* COMPONENT: AI INTELLIGENT ADJUSTMENT ENGINE HUD */}
          <div className="mx-5 mb-5 p-4 bg-stone-900 text-stone-100 rounded-2xl shadow-xl flex flex-col gap-3 relative overflow-hidden border border-stone-800">
            {/* Subtle background glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-[#ca9e5a] opacity-15 filter blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Brain size={14} className="text-[#ca9e5a] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#edd7b2]">IA Copiloto de Arte</span>
              </div>
              <span className="text-[9px] font-bold text-stone-400 border border-stone-800 bg-stone-950 px-1.5 py-0.5 rounded uppercase">
                V3.5 Ativo
              </span>
            </div>

            {isAnalyzingAI ? (
              <div className="space-y-2 py-3">
                <div className="flex items-center justify-between text-[10px] text-stone-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Loader2 size={11} className="animate-spin text-[#ca9e5a]" />
                    Processando Arte...
                  </span>
                  <span className="font-mono text-[9px] text-[#edd7b2] animate-pulse">Scanning</span>
                </div>
                {/* Scanner bar animation */}
                <div className="h-1.5 bg-stone-950 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#ca9e5a] to-transparent animate-infinite flex translate-x-12" style={{ animationDuration: '1.2s' }} />
                </div>
              </div>
            ) : artwork ? (
              <div className="space-y-3">
                {/* Detected metrics */}
                <div className="grid grid-cols-2 gap-2 bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-stone-400 block">Proporção</span>
                    <span className="text-[10px] font-bold text-[#edd7b2] truncate block">{detectedRatio || 'Analisando...'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-stone-400 block">Dimensões</span>
                    <span className="text-[10px] font-bold text-stone-200 truncate block">{detectedDimensions || 'Calculando'}</span>
                  </div>
                </div>

                {/* Micro descriptive diagnostics */}
                <div className="text-[8.5px] text-stone-300 leading-relaxed font-sans space-y-1 bg-stone-800/40 p-2 rounded-lg border border-stone-800/40">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                    <span>{aiSafeAreaStatus || 'Zona Útil Segura Calculada'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />
                    <span>{aiAlignStatus || 'Eixo Horizontal Calibrado'}</span>
                  </div>
                </div>

                {/* AI Interactive adjustments sliders/switches */}
                <div className="border-t border-stone-800/95 pt-2.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Escala Auto: {(detectedScale * 100).toFixed(0)}%</span>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="1.5" 
                      step="0.02"
                      value={detectedScale}
                      onChange={(e) => setDetectedScale(parseFloat(e.target.value))}
                      className="w-24 accent-[#ca9e5a] h-1 bg-stone-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-stone-300 flex items-center gap-1">
                      <RefreshCw size={9} /> Dobra Wrap (Canecas)
                    </span>
                    <button 
                      type="button"
                      onClick={() => setAiWrapMode(!aiWrapMode)}
                      className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${aiWrapMode ? 'bg-[#ca9e5a]' : 'bg-stone-800'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${aiWrapMode ? 'translate-x-3' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-stone-300 flex items-center gap-1">
                      <Sliders size={9} /> Filtro de Impressão Real
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        if (aiContrastValue > 1.0) {
                          setAiContrastValue(1.0);
                          setAiBrightnessValue(1.0);
                        } else {
                          setAiContrastValue(1.05);
                          setAiBrightnessValue(1.01);
                        }
                      }}
                      className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${aiContrastValue > 1.0 ? 'bg-[#ca9e5a]' : 'bg-stone-800'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${aiContrastValue > 1.0 ? 'translate-x-3' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <div className="text-[8px] text-center text-stone-500 tracking-wide font-mono select-none">
                  Controle avançado de perspectiva e brilhos
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-stone-950/40 rounded-xl border border-dashed border-stone-800/80">
                <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">Aguardando Arte...</p>
                <p className="text-[8.5px] text-stone-500 mt-1">Insira uma imagem para ativar IA</p>
              </div>
            )}
          </div>

          {/* Product selection list */}
          <div className="p-5 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 bg-stone-950 rounded-full"></div>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-stone-800">2. Selecionar Produto</h3>
              </div>
              <span className="text-[9px] font-bold text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded border">
                {products.length} itens
              </span>
            </div>

            <div className="relative mb-3 shrink-0">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="text"
                placeholder="Filtro rápido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#faf9f6] text-xs pl-8 pr-3 py-2 border border-stone-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#ca9e5a] transition-all text-stone-800"
              />
            </div>

            <div className="overflow-y-auto pr-1 flex-1 space-y-2 select-none md:max-h-full">
              {filteredProducts.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? 'bg-[#faf9f6]/90 border-[#ca9e5a] text-stone-900 shadow-[0_4px_12px_rgba(202,158,90,0.06)]' 
                        : 'bg-white border-stone-100 hover:border-stone-200 hover:bg-stone-50/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-stone-50 flex items-center justify-center overflow-hidden shrink-0 text-xl border border-stone-200/30">
                      {p.image?.startsWith('http') ? (
                        <ImageWithFallback src={p.image} alt={p.product_name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <span className="leading-none">{p.image}</span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-stone-800 truncate leading-tight flex items-center gap-1.5">
                        {p.product_name}
                      </p>
                      <p className="text-[9px] text-[#a3793c] font-black tracking-wider uppercase mt-0.5">
                        {p.code || 'S/N'} • {p.category}
                      </p>
                    </div>
                    {isSelected && <ChevronRight size={12} className="text-[#ca9e5a]" />}
                  </button>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="text-center p-8 text-[11px] text-stone-400 border border-dashed border-stone-200 rounded-2xl">
                  Nenhum produto encontrado.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUNA 2: PREVIEW GRANDE DO MOCKUP & TROCA DE FUNDO */}
        <div className="flex-1 flex flex-col relative bg-[#f9f9fb] overflow-hidden border-r border-[#f1f1f4]">
          
          {/* Top Panel tab controllers */}
          <div className="h-14 bg-white border-b border-stone-100/80 flex items-center justify-between px-6 shrink-0 z-20">
            <div className="flex bg-stone-100 p-1 rounded-xl">
              <button 
                type="button"
                onClick={() => setPreviewTab('interactive')}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${previewTab === 'interactive' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Simulador 3D Realista
              </button>
              <button 
                type="button"
                onClick={() => {
                  setPreviewTab('generated');
                  if (artwork && selectedProduct && Object.keys(generatedPreviews).length === 0) {
                    handleGeneratePreviews();
                  }
                }}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${previewTab === 'generated' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Resultados Gerados (HD)
              </button>
            </div>

            {/* Display status label */}
            {selectedProduct && artwork ? (
              <div className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Preview Pronto para exportar
              </div>
            ) : (
              <div className="bg-amber-50 text-[#a3793c] text-[10px] font-extrabold px-3 py-1.5 rounded-xl border border-amber-100/80">
                Aguardando: {!artwork ? 'Inserir Arte' : ''} {!artwork && !selectedProduct ? '+' : ''} {!selectedProduct ? 'Selecione Produto' : ''}
              </div>
            )}
          </div>

          {/* Interactive and static canvas visualization space */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto min-h-[350px]">
            {previewTab === 'interactive' ? (
              <div className="w-full max-w-[640px] aspect-[4/3] bg-white rounded-3xl border border-stone-200/40 shadow-[0_15px_40px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden relative">
                {/* Visual Header */}
                <div className="bg-stone-50/70 p-4 border-b border-stone-100 flex justify-between items-center px-6 shrink-0 z-10">
                  <div>
                    <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider">{selectedProduct?.product_name || 'Design de Produto'}</h4>
                    <p className="text-[9px] text-stone-400 font-medium">Pré-visualização 3D interativa integrada</p>
                  </div>
                  <span className="text-[9px] font-bold text-[#a3793c] bg-[#faf9f6] border border-[#f3eee2] px-2 py-0.5 rounded uppercase">
                    Ao Vivo
                  </span>
                </div>

                {/* Main Render Plate */}
                <div className="flex-1 relative bg-stone-50 flex items-center justify-center p-6">
                  {/* Applied Background */}
                  {BACKGROUNDS[backgroundType].render()}

                  {/* Rendering Model */}
                  {artwork ? (
                    <motion.div 
                      layout
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full h-full flex items-center justify-center relative z-10"
                    >
                      {renderTemplateObject(selectedTemplate, false, "w-full h-full")}
                    </motion.div>
                  ) : (
                    <div className="text-center p-6 max-w-xs z-10">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-stone-200/50 flex items-center justify-center mx-auto mb-4">
                        <ImageIcon size={28} className="text-stone-300 animate-pulse" />
                      </div>
                      <h5 className="text-xs font-bold text-stone-700">Aguardando Importações</h5>
                      <p className="text-[10px] text-stone-400 mt-1 lines-leading-relaxed">
                        Faça upload da sua arte em PNG e veja o produto renderizado nos cenários de forma instantânea.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Generated previews visualization panel */
              <div className="w-full max-w-[500px] h-[400px] bg-white border border-stone-200/60 shadow-xl rounded-2xl flex flex-col items-center justify-center p-4 overflow-hidden relative">
                {isGeneratingPreviews ? (
                  <div className="flex flex-col items-center text-center">
                    <Loader2 size={36} className="text-[#ca9e5a] animate-spin mb-3" />
                    <h4 className="text-xs font-bold text-stone-800">Renderizando Alta Definição (HD)...</h4>
                    <p className="text-[9px] text-stone-400 uppercase mt-1 tracking-wider">Montando proporções reais</p>
                  </div>
                ) : !artwork || !selectedProduct ? (
                  <div className="text-center p-6 max-w-xs">
                    <ImageIcon size={40} className="text-stone-300 mx-auto mb-3" />
                    <h5 className="text-xs font-bold text-stone-700">Selecione Ativos</h5>
                    <p className="text-[10px] text-stone-400 mt-1">Carregue um arquivo para ativar o carrossel de fotos geradas.</p>
                  </div>
                ) : (Object.keys(refs) as Array<VariantId>).filter(v => selectedVariants[v]).length === 0 ? (
                  <div className="text-center p-6 max-w-xs">
                    <Settings size={36} className="text-[#ca9e5a] mx-auto mb-3" />
                    <h5 className="text-xs font-bold text-stone-700">Selecione Formatos</h5>
                    <p className="text-[10px] text-stone-400 mt-1">Marque ao menos um formato na coluna de exportação.</p>
                  </div>
                ) : generatedPreviews[activePreviewVariant] ? (
                  <div className="w-full h-full flex flex-col items-center justify-center relative p-2">
                    <div className="absolute top-2 right-2 bg-stone-900/90 text-[#edd7b2] text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                      {activePreviewVariant}
                    </div>
                    <img 
                      src={generatedPreviews[activePreviewVariant]} 
                      alt={`Gerado ${activePreviewVariant}`} 
                      className="max-w-full max-h-[82%] object-contain rounded-lg shadow-sm border"
                    />
                    
                    {/* Select active format dropdown indicator */}
                    <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200/50">
                      Visualizar Formatos:
                      <select 
                        value={activePreviewVariant}
                        onChange={(e) => setActivePreviewVariant(e.target.value as VariantId)}
                        className="bg-white border-0 focus:ring-0 font-extrabold text-[#a3793c] py-0 cursor-pointer"
                      >
                        {(Object.keys(refs) as Array<VariantId>).filter(v => selectedVariants[v]).map(v => (
                          <option key={v} value={v}>
                            {v === 'frente' ? 'Frente Simples' :
                             v === 'frente-verso' ? 'Duplo (Frente+Verso)' :
                             v === 'frente-verso-plano' ? 'Trio (C/ Plana)' :
                             v === 'catalogo' ? 'Catálogo' :
                             v === 'instagram' ? 'Instagram' :
                             v === 'story' ? 'Story Vertical' : v}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 max-w-sm">
                    <h5 className="text-xs font-black text-stone-700 uppercase tracking-widest">Render Desatualizado</h5>
                    <p className="text-[10px] text-stone-400 mt-1.5">Algumas propriedades ou arte mudaram. Pressione o botão gerar abaixo.</p>
                    <button 
                      type="button"
                      onClick={handleGeneratePreviews}
                      className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-stone-950 text-white hover:bg-black border-b-4 border-stone-850 rounded-xl transition-all cursor-pointer font-bold uppercase text-[9px] tracking-widest"
                    >
                      <RefreshCw size={10} /> Gerar Previews
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BACKGROUND SELECTOR (Troca de Fundo) UNDER PREVIEW CONTAINER */}
          <div className="w-full shrink-0 border-t border-stone-100 bg-white p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 bg-stone-950 rounded-full"></div>
                <h4 className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">Cenário de Fundo (Fundo Fixo)</h4>
              </div>
              <span className="text-[10px] font-black text-[#a3793c] uppercase tracking-widest">
                {BACKGROUNDS[backgroundType].name}
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {(Object.entries(BACKGROUNDS) as Array<[keyof typeof BACKGROUNDS, any]>).map(([key, bg]) => (
                <button 
                  type="button"
                  key={key}
                  onClick={() => setBackgroundType(key)}
                  className={`flex flex-col items-stretch p-1.5 rounded-xl border text-left transition-all ${
                    backgroundType === key 
                      ? 'bg-[#faf9f6]/80 border-[#ca9e5a] shadow-xs' 
                      : 'bg-white border-stone-100 hover:border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="h-10 rounded-lg overflow-hidden relative shadow-inner bg-stone-100 mb-1.5">
                    <div className="absolute inset-0 scale-[0.16] origin-top-left w-[625%] h-[625%] pointer-events-none">
                      {bg.render()}
                    </div>
                  </div>
                  <div className="px-1 truncate">
                    <span className="text-[9px] font-black text-stone-700 block uppercase tracking-wide leading-none">{bg.name}</span>
                    <span className="text-[8px] text-stone-400 font-medium block mt-0.5 truncate">{bg.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* HISTÓRICO: ÚLTIMOS MOCKUPS GERADOS */}
          <div className="w-full shrink-0 border-t border-stone-100 bg-white p-5 flex flex-col gap-4 max-h-[340px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 bg-stone-950 rounded-full"></div>
                <h4 className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">Últimos Mockups Gerados ({recentExports.length})</h4>
              </div>
              {/* Product selector filter */}
              {isSupabaseConfigured && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Filtrar:</span>
                  <select
                    value={historyProductFilter}
                    onChange={(e) => setHistoryProductFilter(e.target.value)}
                    className="text-[10px] bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-stone-700 font-bold focus:ring-0 focus:outline-none cursor-pointer"
                  >
                    <option value="">Todos os Ativos</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.product_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {isFetchingRecent ? (
              <div className="flex flex-col items-center justify-center py-10 text-stone-450 gap-2">
                <Loader2 size={24} className="animate-spin text-[#ca9e5a]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Carregando Histórico...</span>
              </div>
            ) : !isSupabaseConfigured ? (
              <div className="p-4 bg-amber-50/75 border border-amber-100/75 rounded-2xl flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-[10px] font-black uppercase text-amber-850 tracking-wider">Banco de dados não conectado</h5>
                  <p className="text-[9px] text-[#a3793c] mt-1 leading-relaxed">
                    Históricos e salvamento automático requerem conexão com o Supabase. Clique no botão <strong className="font-extrabold uppercase">Guia SQL</strong> no topo para ver as instruções de setup.
                  </p>
                </div>
              </div>
            ) : recentExports.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-stone-200/60 rounded-2xl">
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Nenhum mockup gerado ainda.</p>
                <p className="text-[9px] text-stone-400 mt-1">Carregue sua arte e clique no botão Gerar Mockup.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {recentExports.map((item) => (
                  <div key={item.id} className="bg-white border border-stone-100 rounded-xl overflow-hidden shadow-xs hover:border-stone-200 transition-all flex flex-col group relative">
                    <div className="aspect-square bg-stone-50 relative flex items-center justify-center p-2.5">
                      <ImageWithFallback src={item.url} alt="Mockup" className="max-w-full max-h-full object-contain rounded" crossOrigin="anonymous" />
                      <div className="absolute top-1 left-1 bg-stone-900/90 text-[#edd7b2] text-[7px] font-black tracking-widest px-1.5 py-0.5 rounded-full uppercase">
                        {item.type}
                      </div>
                    </div>
                    <div className="p-2 flex flex-col gap-0.5 flex-1 select-none">
                      <p className="text-[10px] font-black text-stone-800 truncate leading-tight">
                        {item.products?.product_name || 'Personalizado'}
                      </p>
                      <p className="text-[8px] text-stone-400 flex items-center justify-between">
                        <span>{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                        {item.artworks?.name && (
                          <span className="truncate max-w-[45%] font-mono text-[8px] text-stone-400/80" title={item.artworks.name}>
                            {item.artworks.name}
                          </span>
                        )}
                      </p>
                    </div>
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-stone-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10 rounded-xl">
                      <button
                        onClick={() => saveAs(item.url, `Mockup_${item.type}_${Date.now()}.png`)}
                        className="p-1.5 bg-white rounded-lg text-stone-800 hover:bg-stone-50 shadow hover:scale-105 transition-all cursor-pointer"
                        title="Download PNG"
                      >
                        <Download size={13} />
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-[#ca9e5a] text-white hover:bg-[#d4af37] rounded-lg shadow hover:scale-105 transition-all cursor-pointer"
                        title="Ver em alta resolução"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* COLUNA 3: CHECKBOXES DE EXPORTAÇÃO E DOWNLOADS */}
        <div className="w-80 bg-white border-l border-gray-100 p-5 flex flex-col justify-between shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.015)] my-max-h-full">
          
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-stone-50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 bg-stone-950 rounded-full"></div>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-stone-800">3. Opções de Geração</h3>
              </div>
              
              <button 
                type="button"
                onClick={() => {
                  const allChecked = Object.values(selectedVariants).every(v => v);
                  setSelectedVariants({
                    'frente': !allChecked,
                    'frente-verso': !allChecked,
                    'frente-verso-plano': !allChecked,
                    'catalogo': !allChecked,
                    'instagram': !allChecked,
                    'story': !allChecked,
                  });
                }}
                className="text-[9px] font-black text-[#a3793c] hover:text-[#926b2b] uppercase tracking-wider"
              >
                {Object.values(selectedVariants).every(v => v) ? 'Nenhum' : 'Todos'}
              </button>
            </div>

            <div className="space-y-2">
              {[
                { id: 'frente', label: 'Frente Simples (HD)', res: '1080x1080' },
                { id: 'frente-verso', label: 'Duplo (Frente+Verso)', res: '1080x1080' },
                { id: 'frente-verso-plano', label: 'Trio (C/ Arte Plana)', res: '1080x1080' },
                { id: 'catalogo', label: 'Catálogo Limpo (Fundo Branco)', res: '800x800' },
                { id: 'instagram', label: 'Instagram Post', res: '1080x1080' },
                { id: 'story', label: 'Story Vertical', res: '1080x1920' },
              ].map((f) => {
                const isChecked = selectedVariants[f.id as VariantId];
                return (
                  <label 
                    key={f.id} 
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isChecked 
                        ? 'bg-[#faf9f6]/60 border-[#ca9e5a]/50 shadow-xs' 
                        : 'bg-transparent border-stone-100 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedVariants(prev => {
                            const updated = { ...prev, [f.id]: !prev[f.id as VariantId] };
                            if (!updated[activePreviewVariant as VariantId]) {
                              const remaining = Object.keys(updated).filter(k => updated[k as VariantId]);
                              if (remaining.length > 0) setActivePreviewVariant(remaining[0] as VariantId);
                            }
                            return updated as Record<VariantId, boolean>;
                          });
                        }}
                        className="w-4 h-4 text-stone-900 border-stone-300 rounded focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-stone-700">{f.label}</span>
                    </div>
                    <span className="text-[8px] font-black text-stone-400 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {f.res}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Trigger Tactile 3D Button Group */}
          <div className="space-y-3 mt-6">
            <button 
              type="button"
              onClick={handleGeneratePreviews}
              disabled={isGeneratingPreviews || !artwork || !selectedProduct}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#ca9e5a] hover:bg-[#d4af37] border-b-4 border-[#a3793c] active:border-b-0 active:translate-y-1 hover:translate-y-[2px] transition-all text-white font-extrabold text-[10px] tracking-widest uppercase rounded-xl disabled:opacity-50 disabled:pointer-events-none disabled:transform-none select-none"
            >
              {isGeneratingPreviews ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Renderizando...
                </>
              ) : (
                <>
                  <RefreshCw size={12} /> Gerar Previews
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={handleDownloadActivePng}
              disabled={isExporting || !artwork || !selectedProduct}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-[#faf9f6]/95 border border-stone-200 border-b-4 border-stone-300 active:border-b-0 active:translate-y-1 hover:translate-y-[2px] transition-all text-stone-800 font-extrabold text-[10px] tracking-widest uppercase rounded-xl disabled:opacity-50 disabled:pointer-events-none disabled:transform-none select-none"
            >
              {isExporting && activePreviewVariant ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Preparando PNG...
                </>
              ) : (
                <>
                  <Download size={12} /> Baixar PNG Ativo
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={handleExportZip}
              disabled={isExporting || !artwork || !selectedProduct}
              className="w-full flex items-center justify-center gap-2 py-4 bg-stone-950 hover:bg-stone-900 border-b-4 border-black active:border-b-0 active:translate-y-1 hover:translate-y-[2px] transition-all text-[#edd7b2] font-extrabold text-[10px] tracking-widest uppercase rounded-xl disabled:opacity-50 disabled:pointer-events-none disabled:transform-none select-none shadow-md"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Compactando...
                </>
              ) : (
                <>
                  <Archive size={14} className="text-[#ca9e5a]" /> Baixar Tudo (ZIP)
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
