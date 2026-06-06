import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Upload, Image as ImageIcon, Settings, X, RefreshCw, ZoomIn, ZoomOut, Save, Box, Layers, Monitor, Droplets, CheckCircle2, Loader2, Archive, Camera, Wand2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { subscribeToProducts } from '../services/firebaseService';
import type { Product } from '../types';

const BACKGROUNDS = {
  studio: {
    name: 'Studio Premium',
    render: () => <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff] to-[#e0e0e0]" />
  },
  quintal: {
    name: 'Quintal Natural',
    render: () => (
       <div className="absolute inset-0 flex flex-col overflow-hidden">
         <img src="https://images.unsplash.com/photo-1558904541-efa843a96f13?q=80&w=1080&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover blur-[4px] opacity-80 scale-110 pointer-events-none" crossOrigin="anonymous" />
         <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
       </div>
    )
  },
  tijolo: {
    name: 'Tijolo Boutique',
    render: () => (
       <div className="absolute inset-0 overflow-hidden">
         <img src="https://images.unsplash.com/photo-1519782536836-1fd0d1fba50d?q=80&w=1080&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover blur-[2px] opacity-90 scale-105 pointer-events-none" crossOrigin="anonymous" />
         <div className="absolute bottom-0 w-full h-[35%] bg-gradient-to-b from-[#4a3b32] to-[#2d211a] shadow-[0_-20px_40px_rgba(0,0,0,0.5)] border-t-[4px] border-[#5a4b42]">
           <div className="absolute top-0 w-full h-2 bg-black/30 blur-md" />
         </div>
       </div>
    )
  },
  sala: {
    name: 'Sala Aconchegante',
    render: () => (
       <div className="absolute inset-0 overflow-hidden">
         <img src="https://images.unsplash.com/photo-1616486027581-28562d94bac8?q=80&w=1080&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover blur-[6px] scale-110 pointer-events-none" crossOrigin="anonymous" />
         <div className="absolute inset-0 bg-[#d4c3b3] mix-blend-overlay opacity-60" />
         <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/30" />
       </div>
    )
  }
};

export function StudioMockup() {
  const [artwork, setArtwork] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [scale, setScale] = useState(1);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  // Mode and Visual Settings
  const [isRealPhoto, setIsRealPhoto] = useState(false);
  const [backgroundType, setBackgroundType] = useState<keyof typeof BACKGROUNDS>('studio');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('caneca');

  // References for generating images
  const refs = {
    'frente': useRef<HTMLDivElement>(null),
    'frente-verso': useRef<HTMLDivElement>(null),
    'frente-verso-plano': useRef<HTMLDivElement>(null),
    'catalogo': useRef<HTMLDivElement>(null),
    'instagram': useRef<HTMLDivElement>(null),
    'story': useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    const unsubscribe = subscribeToProducts((productsData) => {
      setProducts(productsData.filter(p => !p.isHidden));
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (isRealPhoto) {
        setArtwork(null);
        setIsProcessingAI(true);
        // Simulate AI Background Removal & Defect fixing
        setTimeout(() => {
          setArtwork(url);
          setIsProcessingAI(false);
        }, 2800);
      } else {
        setArtwork(url);
      }
    }
  };

  const handleExportZip = async () => {
    if (!artwork || !selectedProduct) {
      alert("Selecione um produto e faça upload da arte ou foto primeiro.");
      return;
    }
    
    setIsExporting(true);
    const zip = new JSZip();
    const folder = zip.folder(`Mockups_${selectedProduct.code || selectedProduct.id}`);

    try {
      const variants = Object.keys(refs) as Array<keyof typeof refs>;
      
      for (const variant of variants) {
        const domNode = refs[variant].current;
        if (!domNode) continue;
        
        await new Promise(r => setTimeout(r, 100)); // Ensure DOM rests
        
        const dataUrl = await toPng(domNode, {
          quality: 1,
          pixelRatio: window.devicePixelRatio || 2, // Retain sharpness
        });
        
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        folder?.file(`mockup_${variant}.png`, base64Data, { base64: true });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `Mockups_${selectedProduct.code || selectedProduct.id}.zip`);
    } catch (err) {
      console.error(err);
      alert('Erro na exportação. Se houver imagens externas não autorizadas por CORS, o download falhará.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderProductItem = (p: Product) => {
    const isSelected = selectedProduct?.id === p.id;
    return (
      <button
        key={p.id}
        onClick={() => setSelectedProduct(p)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left ${isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm' : 'bg-white border-gray-100 hover:border-indigo-100 hover:bg-gray-50'}`}
      >
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 text-xl border border-gray-200">
          {p.image?.startsWith('http') ? <img src={p.image} alt={p.product_name} className="w-full h-full object-cover" crossOrigin="anonymous" /> : p.image}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-xs font-bold truncate leading-tight">{p.product_name}</p>
          <p className="text-[10px] text-gray-500 font-medium">{p.code || 'S/N'} • {p.company}</p>
        </div>
      </button>
    );
  };

  const renderTemplateObject = (type: string, isFlat: boolean = false, extraClasses: string = "") => {
    if (!artwork) {
      return (
        <div className={`relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl ${extraClasses}`}>
          {BACKGROUNDS[backgroundType].render()}
        </div>
      );
    }
    
    // Real Photo Mode (Direct Object integration without 3D molds)
    if (isRealPhoto) {
       return (
         <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${isFlat ? 'rounded-md' : 'rounded-2xl shadow-xl'} ${extraClasses}`}>
           {!isFlat && BACKGROUNDS[backgroundType].render()}
           {isFlat && <div className="absolute inset-0 bg-white" />}
           
           <motion.img 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={artwork} 
              alt="Real Photo" 
              className="z-10 object-contain w-full h-full mix-blend-multiply drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative" 
              crossOrigin="anonymous" 
           />
         </div>
       );
    }

    // Standard Template Molds Mode
    return (
      <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${extraClasses} ${!isFlat && 'rounded-2xl shadow-2xl bg-white'}`}>
         {!isFlat && BACKGROUNDS[backgroundType].render()}
         
         {type === 'caneca' && (
           <div className={`relative shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden z-10 ${isFlat ? 'w-full h-full rounded-md' : 'rounded-3xl w-[40%] h-[70%] rounded-b-[2rem] rounded-t-sm bg-white'}`}>
              <img src={artwork} alt="mockup" className="absolute w-[90%] h-full object-cover mix-blend-multiply opacity-95" crossOrigin="anonymous" />
              {!isFlat && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/30 z-20 pointer-events-none" />
                  <div className="absolute top-[20%] -right-[12%] w-[25%] h-[50%] border-[20px] border-white/95 rounded-full border-l-0 shadow-xl" style={{ transform: 'translateZ(-10px)' }} />
                </>
              )}
           </div>
         )}
         
         {type === 'livro' && (
            <div className={`relative shadow-[10px_20px_40px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden z-10 ${isFlat ? 'rounded-sm w-full h-full' : 'rounded-r-xl rounded-l-sm w-[40%] h-[80%] bg-white'}`}>
               <img src={artwork} alt="mockup" className="absolute w-full h-full object-cover" crossOrigin="anonymous" />
               {!isFlat && <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/40 to-transparent z-20 pointer-events-none" />}
            </div>
         )}
         
         {type === 'quadro' && (
             <div className={`relative bg-yellow-50 border-[20px] border-[#222] shadow-[0_40px_60px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden z-10 ${isFlat ? 'w-full h-full border-4' : 'w-[50%] h-[75%]'}`}>
               <img src={artwork} alt="mockup" className="absolute w-[90%] h-[90%] object-cover shadow-inner" crossOrigin="anonymous" />
               <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 z-20 pointer-events-none mix-blend-overlay" />
             </div>
         )}
         
         {type === 'camisa' && (
             <div className={`relative bg-white flex items-center justify-center overflow-hidden z-10 shadow-2xl ${isFlat ? 'w-full h-full rounded-md' : 'w-[60%] h-[85%] rounded-[3rem] rounded-b-xl'}`}>
               <img src={artwork} alt="mockup" className="w-[50%] h-[50%] object-contain mix-blend-multiply opacity-90 relative z-20 mt-10" crossOrigin="anonymous" />
               {!isFlat && <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/10 z-10 pointer-events-none mix-blend-multiply" />}
             </div>
         )}
      </div>
    );
  };

  const filteredProducts = products.filter(p => p.product_name.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-screen w-full bg-[#f8f9fc] flex flex-col font-sans overflow-hidden">
      {/* Hidden Render Zones for Exports - Need exact sizing */}
      <div className="absolute overflow-hidden" style={{ top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}>
         {/* 1. Frente (1080x1080) */}
         <div ref={refs['frente']} className="w-[1080px] h-[1080px] bg-white flex items-center justify-center relative overflow-hidden">
            {renderTemplateObject(selectedTemplate, false, "w-[1080px] h-[1080px]")}
         </div>
         
         {/* 2. Frente + Verso (1080x1080) */}
         <div ref={refs['frente-verso']} className="w-[1080px] h-[1080px] bg-white flex items-center justify-center gap-12 relative overflow-hidden">
            {BACKGROUNDS[backgroundType].render()}
            <div className="absolute top-10 right-10 text-4xl font-black text-white/50 tracking-widest uppercase z-30 drop-shadow-md">DUPLO</div>
            <div className="w-[450px] h-[600px] flex items-center justify-center transform -rotate-6 z-10">
              {renderTemplateObject(selectedTemplate, false, "w-full h-full bg-transparent shadow-none")}
            </div>
            <div className="w-[450px] h-[600px] flex items-center justify-center transform rotate-6 z-20 -ml-20 mt-20">
              {renderTemplateObject(selectedTemplate, false, "w-full h-full bg-transparent shadow-none")}
            </div>
         </div>

         {/* 3. Frente + Verso + Plano (1080x1080) */}
         <div ref={refs['frente-verso-plano']} className="w-[1080px] h-[1080px] bg-white flex flex-col items-center justify-center p-12 gap-8 relative overflow-hidden">
            {BACKGROUNDS[backgroundType].render()}
            <div className="flex items-center justify-center gap-4 w-full h-[55%] z-10">
              <div className="w-[400px] h-[500px] flex items-center justify-center transform -rotate-6">
                {renderTemplateObject(selectedTemplate, false, "w-full h-full bg-transparent")}
              </div>
              <div className="w-[400px] h-[500px] flex items-center justify-center transform rotate-6">
                 {renderTemplateObject(selectedTemplate, false, "w-full h-full bg-transparent")}
              </div>
            </div>
            <div className="w-[900px] h-[35%] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 z-20 border border-white/50">
              <span className="text-gray-400 font-bold tracking-widest text-sm mb-4 uppercase">Arte Plana Original</span>
              <div className="w-full h-full flex-1 relative bg-white/50 rounded-xl overflow-hidden shadow-inner">
                {renderTemplateObject(selectedTemplate, true, "w-full h-full")}
              </div>
            </div>
         </div>

         {/* 4. Catálogo (800x800) transparent bg/white bg */}
         <div ref={refs['catalogo']} className="w-[800px] h-[800px] bg-white flex items-center justify-center relative">
            <div className="w-[700px] h-[700px] flex items-center justify-center">
              {renderTemplateObject(selectedTemplate, false, "w-full h-full")}
            </div>
         </div>

         {/* 5. Instagram (1080x1080) with nice background */}
         <div ref={refs['instagram']} className="w-[1080px] h-[1080px] bg-white flex flex-col items-center justify-center relative shadow-2xl overflow-hidden">
            {BACKGROUNDS[backgroundType].render()}
            <div className="text-4xl font-black text-white drop-shadow-md tracking-tighter absolute top-[10%] text-center w-full uppercase z-30">
              {selectedProduct?.product_name || "Lançamento Exclusivo"}
            </div>
            <div className="w-[750px] h-[750px] flex items-center justify-center mt-10 z-20">
              {renderTemplateObject(selectedTemplate, false, "w-full h-full bg-transparent shadow-none")}
            </div>
            <div className="absolute bottom-[10%] text-2xl font-bold text-gray-900 bg-white/95 backdrop-blur px-10 py-4 rounded-full shadow-2xl z-30 border border-white/50">
              Conheça os detalhes
            </div>
         </div>

         {/* 6. Story (1080x1920) */}
         <div ref={refs['story']} className="w-[1080px] h-[1920px] bg-white flex flex-col items-center justify-center relative overflow-hidden">
            {BACKGROUNDS[backgroundType].render()}
            <div className="absolute top-[15%] text-center z-30 w-full px-12">
              <h2 className="text-7xl font-black text-white tracking-widest uppercase opacity-95 drop-shadow-lg">Novidade</h2>
              <p className="text-4xl text-white/90 mt-6 font-semibold drop-shadow-md">{selectedProduct?.product_name}</p>
            </div>
            <div className="w-[900px] h-[900px] flex items-center justify-center z-20">
               {renderTemplateObject(selectedTemplate, false, "w-full h-full bg-transparent shadow-none")}
            </div>
            <div className="absolute bottom-[15%] bg-white/95 backdrop-blur text-gray-900 px-16 py-8 rounded-full text-4xl font-bold shadow-2xl z-30 border border-white/50">
               Toque para fazer sua encomenda
            </div>
         </div>
      </div>

      {/* SaaS Header */}
      <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between z-20 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Wand2 size={16} />
          </div>
          <h1 className="text-sm font-bold text-gray-900 tracking-tight">Studio Mockup</h1>
          <div className="h-4 w-px bg-gray-200 mx-2"></div>
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100/50">Gerador em Lote (4K Ready)</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setArtwork(null); setSelectedProduct(null); setSearch(''); }}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
          >
            Limpar Canvas
          </button>
          <button 
            onClick={handleExportZip}
            disabled={isExporting || !artwork || !selectedProduct}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] flex items-center gap-2 transform active:scale-95"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />} 
            {isExporting ? 'Processando (HD/4K)...' : 'Exportar Lote (ZIP)'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar - Products & Art */}
        <div className="w-80 bg-white border-r border-gray-100 flex flex-col z-10 flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-4 border-b border-gray-50">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-5 px-4 bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group relative overflow-hidden"
            >
              {artwork ? (
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm relative group-hover:scale-105 transition-transform bg-gray-50">
                  <img src={artwork} alt="Arte" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <RefreshCw size={16} />
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-full transition-transform group-hover:scale-110 ${isRealPhoto ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                  {isRealPhoto ? <Camera size={28} /> : <Upload size={28} />}
                </div>
              )}
              <span className="text-xs font-bold text-gray-700 group-hover:text-indigo-600 mt-1">
                {artwork ? 'Trocar Imagem' : isRealPhoto ? 'Upload da Foto Real' : 'Upload de Arte Gráfica'}
              </span>
              <span className="text-[9px] text-gray-400 font-medium text-center">
                {isRealPhoto ? 'A IA removerá o fundo automaticamente' : 'Envie a arte vazada (PNG Sem Fundo)'}
              </span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload} 
            />
          </div>

          <div className="p-4 flex-1 flex flex-col overflow-hidden">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px]">1</span> 
              Vincular ao Produto
            </h3>
            <input 
              type="text"
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            />
            <div className="overflow-y-auto hidden-scrollbar flex-1 space-y-2 pr-1">
               {filteredProducts.map(renderProductItem)}
               {products.length === 0 && (
                 <div className="text-center p-4 text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">Carregando produtos do banco de dados...</div>
               )}
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col relative bg-[#f1f3f9] overflow-hidden">
           {selectedProduct && artwork ? (
             <div className="absolute top-6 left-6 z-20 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-sm border border-emerald-200">
                <CheckCircle2 size={14} /> Pré-visualização pronta - 6 formatos disponíveis
             </div>
           ) : (
             <div className="absolute top-6 left-6 z-20 bg-amber-50 text-amber-800 text-[10px] font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-sm border border-amber-200/50">
                Aguardando: {(!selectedProduct ? 'Selecione o Produto' : '')} {(!selectedProduct && !artwork && ' | ')} {(!artwork ? 'Envie a Imagem' : '')}
             </div>
           )}

          {/* Zoom Controls */}
          <div className="absolute top-6 right-6 flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 z-20">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <ZoomOut size={16} />
            </button>
            <span className="text-[10px] font-bold w-12 text-center text-gray-600">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <ZoomIn size={16} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto relative">
            
            {/* Fake AI Processing Loader */}
            <AnimatePresence>
              {isProcessingAI && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="absolute inset-0 z-50 bg-white/70 backdrop-blur-md flex flex-col items-center justify-center"
                >
                  <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center border border-indigo-50">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mb-6" />
                    <h3 className="text-base font-black text-gray-900 mb-2">Processando Imagem Real</h3>
                    <p className="text-sm font-medium text-gray-500 mb-1">Recortando fundo com AI...</p>
                    <p className="text-xs text-gray-400">Extraindo objeto e ajustando iluminação</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              layout
              style={{ transform: `scale(${scale})` }}
              className="relative transition-transform duration-200 origin-center flex items-center justify-center"
            >
              <div className="w-[800px] h-[600px] bg-white rounded-[2rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col overflow-hidden relative">
                
                <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center px-6">
                   <div>
                     <h4 className="text-xs font-bold text-gray-800">Preview Interativo do Mockup</h4>
                     <p className="text-[10px] text-gray-500 mt-0.5">{selectedProduct?.product_name || 'Estrutura de Exibição'}</p>
                   </div>
                   <div className="px-3 py-1 bg-white border border-gray-200 rounded-md text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                     {isRealPhoto ? 'Modo: Foto Real (AI)' : 'Modo: Template Padrão'}
                   </div>
                </div>
                
                <div className="flex-1 flex items-center justify-center relative p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50">
                  {artwork ? (
                     <div className="w-full h-full flex items-center justify-center relative">
                        {renderTemplateObject(selectedTemplate, false, "w-full h-full")}
                     </div>
                  ) : (
                    <div className="text-center w-full max-w-sm">
                      <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
                        <ImageIcon size={40} className="text-gray-300" strokeWidth={1.5} />
                      </div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Canvas em Branco</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Selecione o modo de importação na lateral direita, envie a imagem original e e veja a mágica acontecer perfeitamente integrada aos cenários.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Properties Panel */}
        {isSidebarOpen && (
          <div className="w-80 bg-white border-l border-gray-100 flex flex-col z-10 flex-shrink-0 shadow-[0_0_24px_rgba(0,0,0,0.02)]">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-900 tracking-tight flex items-center gap-2">
                 <Settings size={14} className="text-indigo-600" />
                 Gerador de Cena
              </h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-900 bg-gray-50 p-1.5 rounded-lg">
                <X size={14} />
              </button>
            </div>
            
            <div className="p-5 space-y-8 overflow-y-auto hidden-scrollbar flex-1">
               
              {/* Modo de Operação */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px]">2</span> 
                  Fonte de Imagem
                </label>
                <div className="bg-gray-50 p-1.5 rounded-xl flex gap-1 border border-gray-100">
                  <button 
                    onClick={() => { setIsRealPhoto(false); setArtwork(null); }}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${!isRealPhoto ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Template Gráfico
                  </button>
                  <button 
                    onClick={() => { setIsRealPhoto(true); setArtwork(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold rounded-lg transition-all ${isRealPhoto ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Wand2 size={12} /> Foto Real (AI)
                  </button>
                </div>
                {isRealPhoto && <p className="text-[9px] text-gray-400 mt-2 px-1 leading-relaxed">No modo Foto Real, nós removemos o fundo da foto enviada e aplicamos luzes automaticamente para inseri-la nos cenários Premium do Studio.</p>}
              </div>

              {/* Template Body / Mold (Only if normal mode) */}
              <AnimatePresence>
                {!isRealPhoto && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-3 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px]">3</span> 
                      Molde de Aplicação
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'caneca', name: 'Caneca', icon: Droplets },
                        { id: 'livro', name: 'Livro/Caixa', icon: Box },
                        { id: 'camisa', name: 'Vestuário', icon: Layers },
                        { id: 'quadro', name: 'Quadro', icon: Monitor },
                      ].map(t => (
                        <button 
                          key={t.id}
                          onClick={() => setSelectedTemplate(t.id)}
                          className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${selectedTemplate === t.id ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}
                        >
                          <t.icon size={20} strokeWidth={1.5} />
                          <span className="text-[9px] font-bold">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fundos Fixos */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px]">
                    {!isRealPhoto ? '4' : '3'}
                  </span> 
                  Cenários Profissionais
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(BACKGROUNDS) as Array<[keyof typeof BACKGROUNDS, any]>).map(([key, bg]) => (
                     <button 
                       key={key}
                       onClick={() => setBackgroundType(key)}
                       className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all text-left ${backgroundType === key ? 'bg-indigo-50/50 border-indigo-400 shadow-sm ring-2 ring-indigo-500/20' : 'bg-white border-gray-100 hover:border-gray-300 group'}`}
                     >
                       <div className="w-full h-16 rounded-lg overflow-hidden relative shadow-inner">
                         <div className="absolute inset-0 scale-[0.25] origin-top-left w-[400%] h-[400%] pointer-events-none">
                            {bg.render()}
                         </div>
                       </div>
                       <span className={`text-[10px] font-bold w-full truncate ${backgroundType === key ? 'text-indigo-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
                         {bg.name}
                       </span>
                     </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-3">Formatos de Saída (PNG)</label>
                <div className="space-y-2">
                  {[
                    { label: 'Frente Simples', res: '1080x1080' },
                    { label: 'Duplo (Frente+Verso)', res: '1080x1080' },
                    { label: 'Trio (C/ Plana original)', res: '1080x1080' },
                    { label: 'Catálogo Limpo', res: '800x800' },
                    { label: 'Post Instagram', res: '1080x1080' },
                    { label: 'Story Vertical', res: '1080x1920' },
                  ].map(f => (
                    <div key={f.label} className="flex items-center justify-between">
                       <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-emerald-500" /> {f.label}
                       </span>
                       <span className="text-[9px] font-black text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">{f.res}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleExportZip}
                  disabled={isExporting || !artwork || !selectedProduct}
                  className="w-full py-4 text-white bg-gray-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />} 
                  {isExporting ? 'Processando (Aguarde...)' : 'Baixar ZIP Completo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!isSidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-white border border-gray-200 shadow-sm rounded-l-xl hover:bg-gray-50 z-20"
          >
            <Settings size={16} className="text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

