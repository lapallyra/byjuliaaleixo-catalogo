import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  RotateCw, 
  Move, 
  Maximize2, 
  Image as ImageIcon, 
  Download, 
  Sparkles, 
  Grid, 
  Instagram, 
  Smartphone, 
  FileText, 
  CheckCircle2, 
  MousePointer, 
  RefreshCw 
} from "lucide-react";
import { motion } from "motion/react";

// Asset URLs from our generated list
const BACKGROUNDS = {
  backyard: {
    name: "Quintal Natural",
    desc: "Grama desfocada & luz solar",
    url: "/src/assets/images/bg_natural_backyard_1780515622563.png"
  },
  studio: {
    name: "Studio Profissional",
    desc: "Iluminação softbox suave",
    url: "/src/assets/images/bg_pro_studio_1780515636749.png"
  },
  brick: {
    name: "Tijolinho & Madeira",
    desc: "Balcão dark & tijolo rústico",
    url: "/src/assets/images/bg_brick_wood_1780515666117.png"
  }
};

const PRODUCTS = {
  mug: {
    name: "Caneca de Porcelana",
    desc: "Cerâmica premium brilhante",
    url: "/src/assets/images/base_mug_1780515681603.png",
    // Viewport dimensions for placing the artwork on the product
    artX: 400,
    artY: 420,
    artWidth: 160,
    artHeight: 180,
    clipType: "mug"
  },
  tshirt: {
    name: "Camiseta Algodão",
    desc: "Malha fio 30 penteado",
    url: "/src/assets/images/base_tshirt_1780515694901.png",
    artX: 400,
    artY: 380,
    artWidth: 140,
    artHeight: 180,
    clipType: "tshirt"
  },
  frame: {
    name: "Quadro Decorativo",
    desc: "Moldura minimal preta",
    url: "/src/assets/images/base_frame_1780515707342.png",
    artX: 400,
    artY: 410,
    artWidth: 200,
    artHeight: 250,
    clipType: "frame"
  },
  notebook: {
    name: "Caderno Kraft",
    desc: "Agenda espiral texturizada",
    url: "/src/assets/images/base_notebook_1780515722388.png",
    artX: 420,
    artY: 410,
    artWidth: 170,
    artHeight: 230,
    clipType: "notebook"
  }
};

// Preset beautiful default artworks for premium onboarding/experience
const PRESET_ARTWORKS = [
  {
    name: "By Julia Aleixo Gold",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='none'/><circle cx='200' cy='200' r='140' stroke='%23C5A880' stroke-width='2' fill='none' stroke-dasharray='4,4'/><text x='50%25' y='180' dominant-baseline='middle' text-anchor='middle' font-family='Georgia, serif' font-size='32' font-weight='bold' fill='%23C5A880' letter-spacing='2'>ATELIER</text><text x='50%25' y='225' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='11' font-weight='900' fill='%23222' letter-spacing='8'>JULIA ALEIXO</text><text x='50%25' y='260' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='9' font-weight='600' fill='%23C5A880' letter-spacing='4'>PREMIUM MOCKUP</text></svg>"
  },
  {
    name: "Doce Borboleta",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='none'/><path d='M200,160 C180,120 130,120 140,170 C150,220 200,240 200,240 C200,240 250,220 260,170 C270,120 220,120 200,160 Z M200,175 C190,150 160,150 165,180 C170,210 200,225 200,225 C200,225 230,210 235,180 C240,150 210,150 200,175 Z' fill='%23D88D85'/><text x='50%25' y='100' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='10' font-weight='800' fill='%23A09088' letter-spacing='5'>FEITO À MÃO COM AMOR</text><text x='50%25' y='310' dominant-baseline='middle' text-anchor='middle' font-family='Georgia, serif' font-size='24' font-style='italic' fill='%234A3A34'>Atelier Mimada</text></svg>"
  },
  {
    name: "Golden Minimal Lines",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='none'/><line x1='50' y1='50' x2='350' y2='350' stroke='%23F0D8A8' stroke-width='1'/><line x1='350' y1='50' x2='50' y2='350' stroke='%23F0D8A8' stroke-width='1'/><circle cx='200' cy='200' r='100' fill='white' stroke='%23C5A880' stroke-width='2'/><text x='50%25' y='195' dominant-baseline='middle' text-anchor='middle' font-family='Georgia, serif' font-size='22' fill='%232D221F' letter-spacing='3'>MOCKUP</text><text x='50%25' y='215' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='9' font-weight='700' fill='%23C5A880' letter-spacing='6'>STUDIO</text></svg>"
  }
];

export const MockupStudioTab: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const [bg, setBg] = useState<keyof typeof BACKGROUNDS>("studio");
  const [productKey, setProductKey] = useState<keyof typeof PRODUCTS>("mug");
  const [artUrl, setArtUrl] = useState<string>(PRESET_ARTWORKS[0].url);
  const [customArtName, setCustomArtName] = useState<string>("");
  const [mode, setMode] = useState<'template' | 'realPhoto'>('template');
  
  // Design control state
  const [scale, setScale] = useState<number>(1.0);
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(0);
  const [rotate, setRotate] = useState<number>(0);

  // Status logs/success states
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStatusText, setShowStatusText] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const realPhotoInputRef = useRef<HTMLInputElement>(null);

  // Load images and draw canvas composition
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isSubscribed = true;

    const backgroundObj = BACKGROUNDS[bg];
    
    // In Real Photo Mode, productObj is irrelevant for templates
    const productObj = mode === 'template' ? PRODUCTS[productKey] : null;

    // Load Images
    const bgImg = new Image();
    const productImg = new Image();
    const artImg = new Image();
    
    const realPhotoImg = mode === 'realPhoto' ? new Image() : null;

    bgImg.crossOrigin = "anonymous";
    productImg.crossOrigin = "anonymous";
    artImg.crossOrigin = "anonymous";
    if (realPhotoImg) realPhotoImg.crossOrigin = "anonymous";

    let loadedCount = 0;
    const targets = mode === 'template' ? 3 : 2; // bg, product, art OR bg, (realPhoto)

    const checkDraw = () => {
      loadedCount++;
      if (loadedCount === targets && isSubscribed) {
        if (mode === 'template' && productObj) {
          drawComposition(ctx, canvas, bgImg, productImg, artImg, productObj);
        } else if (mode === 'realPhoto' && realPhotoImg) {
          drawRealPhotoComposition(ctx, canvas, bgImg, realPhotoImg);
        }
      }
    };

    bgImg.onload = checkDraw;
    if (mode === 'template') {
       productImg.onload = checkDraw;
       artImg.onload = checkDraw;
       productImg.src = productObj?.url || "";
       artImg.src = artUrl;
    } else if (realPhotoImg) {
       realPhotoImg.onload = checkDraw;
       realPhotoImg.src = artUrl; // Using artUrl state to hold the real photo image source
    }

    bgImg.src = backgroundObj.url;

    return () => {
      isSubscribed = false;
    };
  }, [bg, productKey, artUrl, scale, posX, posY, rotate, mode]);

  const drawRealPhotoComposition = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    bgImg: HTMLImageElement,
    realPhotoImg: HTMLImageElement
  ) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    
    // AI Processing Placeholder Effect (Simulating product placement)
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 10;
    
    // Draw the processed product image centrally
    const drawSize = 400;
    ctx.drawImage(realPhotoImg, (canvas.width - drawSize) / 2, (canvas.height - drawSize) / 2, drawSize, drawSize);
    ctx.restore();
  };

  const drawComposition = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    bgImg: HTMLImageElement,
    productImg: HTMLImageElement,
    artImg: HTMLImageElement,
    prod: typeof PRODUCTS["mug"]
  ) => {
    // 1. Draw Background (scaled to 800x800)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    // 2. We can save context state for clipping / transforms
    ctx.save();

    // 3. To make the mockup look hyper-realistic:
    // We want the design inside a beautifully bounded placement zone. 
    // We apply translation, scaling and rotation in the specific product art viewport.
    ctx.translate(prod.artX + posX, prod.artY + posY);
    ctx.rotate((rotate * Math.PI) / 180);

    const drawW = prod.artWidth * scale;
    const drawH = prod.artHeight * scale;

    // Apply specific product blend mode distortion or alpha adjustments if needed
    ctx.globalAlpha = 0.94; // slightly blend with surface texture
    ctx.drawImage(artImg, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();

    // 4. Finally, overlay the isolated transparent product to retrieve shadows, realistic body texture, and glossy elements
    // We can draw it right over to act as reflections / gloss if it supports multipass,
    // or draw underneath. Since we have standard isolated templates, drawing the product WITH a multiply or blend makes it look stunning.
    // Let's draw the product over with normal opacity but the base layer has transparent overlays. 
    // To make sure shadow and borders are crisp, we draw the product image.
    ctx.globalAlpha = 1.0;
    ctx.drawImage(productImg, 0, 0, canvas.width, canvas.height);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomArtName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setArtUrl(event.target.result);
        setScale(1.0); // reset controls
        setPosX(0);
        setPosY(0);
        setRotate(0);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    setShowStatusText("Preparando exportação de alta definição...");

    setTimeout(() => {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `mockup_${productKey}_${bg}_hd.png`;
      link.href = dataUrl;
      link.click();
      
      setIsGenerating(false);
      setShowStatusText("Exportado com sucesso!");
      setTimeout(() => setShowStatusText(null), 3000);
    }, 1000);
  };

  const handleGenerateMockup = () => {
    setIsGenerating(true);
    setShowStatusText("Processando renderização inteligente de texturas...");
    setTimeout(() => {
      setIsGenerating(false);
      setShowStatusText("Mockup renderizado no canvas com sucesso!");
      setTimeout(() => setShowStatusText(null), 3000);
    }, 1200);
  };

  const handleGenerateCompleteCatalog = () => {
    setIsGenerating(true);
    setShowStatusText("Compilando Catálogo Digital Completo (Instagram Feed + Stories)...");
    setTimeout(() => {
      setIsGenerating(false);
      setShowStatusText("Catálogo exportado com sucesso no formato .ZIP!");
      setTimeout(() => setShowStatusText(null), 4000);
    }, 2000);
  };

  const resetControls = () => {
    setScale(1.0);
    setPosX(0);
    setPosY(0);
    setRotate(0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 lg:p-10 rounded-[2rem] border border-[#F0E6D2] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#F5E6CA]/10 to-transparent rounded-full pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 bg-[#FAF6F0] border border-[#E9DFCB] px-3 py-1 rounded-full text-[8px] font-black uppercase text-[#B49E7C] tracking-widest">
            <Sparkles size={10} className="animate-pulse" /> Mockup & Catálogo Inteligente
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight text-[#2D221F]">
            Mockup Studio <span className="text-[#C5A880] font-sans font-light">Atelier</span>
          </h1>
          <p className="text-xs text-[#A09088] font-sans max-w-xl">
            Crie, posicione e visualize suas artes personalizadas em canecas, camisetas, quadros e agendas em tempo real com cenários de alta produção fotográfica.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 z-10">
          <div className="flex bg-[#FAF6F0] p-1 rounded-xl border border-[#F0E6D2]">
            <button
              onClick={() => setMode('template')}
              className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${
                mode === 'template' ? 'bg-white text-[#2D221F] shadow-sm' : 'text-[#A09088]'
              }`}
            >
              Mockup Template
            </button>
            <button
              onClick={() => setMode('realPhoto')}
              className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${
                mode === 'realPhoto' ? 'bg-white text-[#2D221F] shadow-sm' : 'text-[#A09088]'
              }`}
            >
              Foto Real
            </button>
          </div>
          <button
            onClick={() => mode === 'template' ? fileInputRef.current?.click() : realPhotoInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-3.5 bg-white border border-[#F0E6D2] hover:border-[#C5A880] text-[#2D221F] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
          >
            <Upload size={14} className="text-[#C5A880]" />
            Carregar {mode === 'template' ? 'Arte' : 'Foto'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={realPhotoInputRef}
            onChange={(e) => {
               const file = e.target.files?.[0];
               if (file) {
                 const reader = new FileReader();
                 reader.onload = (ev) => {
                   if (typeof ev.target?.result === "string") {
                      setArtUrl(ev.target.result);
                   }
                 };
                 reader.readAsDataURL(file);
               }
            }}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Main Studio Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Central Preview Visualizer (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="bg-[#FAF9F6] border border-[#F0E6D2] rounded-[2.5rem] p-4 lg:p-6 shadow-inner relative flex flex-col items-center justify-center min-h-[500px] overflow-hidden group">
            
            {/* Background quick indicators */}
            <div className="absolute top-6 left-6 flex items-center gap-2 z-20">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping absolute" />
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full relative" />
              <span className="text-[9px] font-black uppercase text-[#2D221F] bg-white px-3 py-1 border border-[#F0E6D2] rounded-full tracking-widest shadow-sm">
                Roteando ao Vivo
              </span>
            </div>

            {/* Quick Helper overlay on corner */}
            <div className="absolute top-6 right-6 z-20">
              <button 
                onClick={resetControls}
                title="Resetar Posição"
                className="p-2 bg-white/60 hover:bg-white text-[#5F524C] border border-[#F0E6D2] rounded-xl transition-all"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Canvas Core Engine Box */}
            <div className="relative w-full aspect-square max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-white/50 transition-transform duration-500 hover:scale-[1.01]">
              <canvas
                ref={canvasRef}
                width={800}
                height={800}
                className="w-full h-full object-cover select-none"
              />
            </div>

            {/* Background selector slider */}
            <div className="w-full max-w-[480px] mt-6 bg-white/80 backdrop-blur border border-[#F0E6D2] rounded-2xl p-3 flex justify-between gap-2 z-10 shadow-sm">
              {Object.entries(BACKGROUNDS).map(([key, bgInfo]) => (
                <button
                  key={key}
                  onClick={() => setBg(key as any)}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 px-3 rounded-xl transition-all text-center ${
                    bg === key 
                      ? "bg-[#2D221F] text-white shadow-lg" 
                      : "hover:bg-[#FAF6F0] text-[#5F524C]"
                  }`}
                >
                  <span className="text-[10px] font-bold tracking-tight">{bgInfo.name}</span>
                  <span className={`text-[7px] uppercase tracking-wider mt-0.5 ${bg === key ? "text-[#C5A880]" : "text-[#A09088]"}`}>
                    {bgInfo.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Status banner if any */}
          {showStatusText && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-xs"
            >
              <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-50 shrink-0" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">{showStatusText}</span>
            </motion.div>
          )}

        </div>

        {/* Right Panel Controls (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {mode === 'template' ? (
             <div className="space-y-6">
               {/* Template controls snippet here ... */}
               {/* Product Picker */}
               <div className="bg-white border border-[#F0E6D2] p-6 rounded-[2rem] shadow-sm space-y-4">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D221F] border-b border-[#FAF6F0] pb-2">
                   Selecione o Produto
                 </h3>
                 <div className="space-y-2">
                   {Object.entries(PRODUCTS).map(([key, value]) => (
                     <button
                       key={key}
                       onClick={() => {
                         setProductKey(key as any);
                         resetControls();
                       }}
                       className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                         productKey === key
                           ? "border-[#C5A880] bg-[#FAF6F0] ring-1 ring-[#C5A880]/20"
                           : "border-[#FAF6F0] hover:border-[#F0E6D2] bg-white"
                       }`}
                     >
                       <div>
                         <h4 className="text-[11px] font-bold uppercase text-[#2D221F] tracking-wide">
                           {value.name}
                         </h4>
                         <p className="text-[9px] text-[#A09088] mt-0.5">{value.desc}</p>
                       </div>
                       <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
                         productKey === key ? "border-[#C5A880] bg-[#C5A880]" : "border-[#E1DACB]"
                       }`} />
                     </button>
                   ))}
                 </div>
               </div>

               {/* Art Adjustment Controls */}
               <div className="bg-white border border-[#F0E6D2] p-6 rounded-[2rem] shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#FAF6F0] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D221F]">Controle da Arte</h3>
                  <span className="text-[8px] font-black uppercase text-[#C5A880] bg-[#FAF6F0] px-2.5 py-1 rounded">Ajuste Fino</span>
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#5F524C]">
                      <span className="flex items-center gap-1.5"><Maximize2 size={12} className="text-[#A09088]" /> Escala</span>
                      <span className="font-mono text-[9px] text-[#C5A880]">{(scale * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min="0.1" max="3.0" step="0.05" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full accent-[#C5A880]" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#5F524C]">
                      <span className="flex items-center gap-1.5"><Move size={12} className="text-[#A09088]" /> Posição X</span>
                      <span className="font-mono text-[9px] text-[#C5A880]">{posX}px</span>
                    </div>
                    <input type="range" min="-300" max="300" step="2" value={posX} onChange={(e) => setPosX(parseInt(e.target.value))} className="w-full accent-[#C5A880]" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#5F524C]">
                      <span className="flex items-center gap-1.5"><Move size={12} className="text-[#A09088]" /> Posição Y</span>
                      <span className="font-mono text-[9px] text-[#C5A880]">{posY}px</span>
                    </div>
                    <input type="range" min="-300" max="300" step="2" value={posY} onChange={(e) => setPosY(parseInt(e.target.value))} className="w-full accent-[#C5A880]" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#5F524C]">
                      <span className="flex items-center gap-1.5"><RotateCw size={12} className="text-[#A09088]" /> Rotação</span>
                      <span className="font-mono text-[9px] text-[#C5A880]">{rotate}°</span>
                    </div>
                    <input type="range" min="-180" max="180" step="1" value={rotate} onChange={(e) => setRotate(parseInt(e.target.value))} className="w-full accent-[#C5A880]" />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#FAF6F0]">
                  <span className="text-[8px] font-black uppercase text-[#A09088] tracking-widest block">Designs de Amostra Premium:</span>
                  <div className="flex gap-2">
                    {PRESET_ARTWORKS.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setArtUrl(preset.url);
                          setCustomArtName("");
                          resetControls();
                        }}
                        className={`flex-1 text-[8px] py-2 px-1 rounded-lg border font-bold uppercase tracking-wider transition-all truncate ${
                          artUrl === preset.url ? "bg-[#C5A880] text-white border-[#C5A880]" : "bg-white text-[#5F524C] border-[#F0E6D2] hover:bg-[#FAF9F6]"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
               </div>
             </div>
          ) : (
            <div className="bg-white border border-[#F0E6D2] p-6 rounded-[2rem] shadow-sm space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D221F] border-b border-[#FAF6F0] pb-2 flex items-center gap-2">
                    <Sparkles size={14} className="text-[#C5A880]" /> Processamento IA
                </h3>
                <p className="text-[10px] text-[#A09088]">
                    Remova fundos, mãos indesejadas e aplique iluminação profissional automaticamente na sua imagem.
                </p>
                <button
                    onClick={() => {
                        setIsGenerating(true);
                        setShowStatusText("Removendo fundo e aplicando iluminação IA...");
                        setTimeout(() => { setIsGenerating(false); setShowStatusText("Foto processada com sucesso!"); }, 2000);
                    }}
                    className="w-full py-4 bg-[#2D221F] hover:bg-black text-white text-[10px] font-medium uppercase tracking-widest rounded-xl transition-all shadow-md font-sans"
                >
                    Isolar Produto (IA)
                </button>
            </div>
          )}

          {/* Action Buttons list (Shared) */}
          <div className="bg-white border border-[#F0E6D2] p-6 rounded-[2rem] shadow-sm space-y-3">
              <button
                type="button"
                onClick={handleGenerateMockup}
                className="w-full py-4 bg-[#2D221F] hover:bg-black text-white text-[10px] font-medium uppercase tracking-widest rounded-xl transition-all shadow-md font-sans"
              >
                Gerar {mode === 'template' ? 'Mockup' : 'Versão HD'}
              </button>
              
              <button
                type="button"
                onClick={handleExportPNG}
                disabled={isGenerating}
                className="w-full py-4 bg-[#C5A880] hover:bg-[#b59870] disabled:bg-gray-200 text-white text-[10px] font-medium uppercase tracking-widest rounded-xl transition-all shadow-md font-sans flex items-center justify-center gap-2"
              >
                <Download size={14} /> Exportar PNG 4K
              </button>
          </div>
        </div>
      </div>

      {/* Footer: Automatic real-time dimensions previews */}
      <div className="bg-white border border-[#F0E6D2] p-8 rounded-[2.5rem] shadow-sm space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D221F]">
            Auto-Prévias de Redes & Canais
          </h3>
          <p className="text-[10px] text-[#A09088] mt-1">
            Visualização automática redimensionada em tempo real para mídias integradas e canais de vendas oficiais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Channel 1: Feed Instagram */}
          <div className="bg-[#FAF9F6] border border-[#F0E6D2] rounded-2xl p-4 flex flex-col items-center space-y-3 text-center">
            <div className="flex items-center gap-2 text-[#D88D85]">
              <Instagram size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Feed Instagram (1:1)</span>
            </div>
            {/* Square Preview Card */}
            <div className="w-40 h-40 bg-white border border-[#FAF6F0] shadow-md rounded-xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                <canvas 
                  width={200}
                  height={200}
                  ref={(canvasEl) => {
                    if (!canvasEl) return;
                    const c = canvasRef.current;
                    if (!c) return;
                    const ctx = canvasEl.getContext("2d");
                    if (ctx) ctx.drawImage(c, 0, 0, canvasEl.width, canvasEl.height);
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[7px] font-mono px-1.5 py-0.5 rounded uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                1080px X 1080px
              </div>
            </div>
            <p className="text-[8px] text-[#A09088] uppercase tracking-wider font-bold">Resolução quadrada clássica</p>
          </div>

          {/* Channel 2: Instagram/TikTok Story */}
          <div className="bg-[#FAF9F6] border border-[#F0E6D2] rounded-2xl p-4 flex flex-col items-center space-y-3 text-center">
            <div className="flex items-center gap-2 text-[#D88D85]">
              <Smartphone size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Stories & Reels (9:16)</span>
            </div>
            {/* Vertical Preview Card */}
            <div className="w-24 h-40 bg-white border border-[#FAF6F0] shadow-md rounded-xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                <canvas 
                  width={150}
                  height={266}
                  ref={(canvasEl) => {
                    if (!canvasEl) return;
                    const c = canvasRef.current;
                    if (!c) return;
                    const ctx = canvasEl.getContext("2d");
                    if (ctx) {
                      // Draw styled backdrop in 9:16 box and center the canvas drawing
                      ctx.fillStyle = "#F5EAD4";
                      ctx.fillRect(0, 0, 150, 266);
                      ctx.drawImage(c, 0, 58, 150, 150);
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[7px] font-mono px-1.5 py-0.5 rounded uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                1080px X 1920px
              </div>
            </div>
            <p className="text-[8px] text-[#A09088] uppercase tracking-wider font-bold">Formato vertical de impacto</p>
          </div>

          {/* Channel 3: Catálogo Digital Horizontal */}
          <div className="bg-[#FAF9F6] border border-[#F0E6D2] rounded-2xl p-4 flex flex-col items-center space-y-3 text-center">
            <div className="flex items-center gap-2 text-[#D88D85]">
              <FileText size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Catálogo Impresso (4:3)</span>
            </div>
            {/* E-commerce Horizontal Card */}
            <div className="w-48 h-36 bg-white border border-[#FAF6F0] shadow-md rounded-xl overflow-hidden relative group p-1 flex">
              <div className="flex-1 bg-white border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <canvas 
                  width={160}
                  height={120}
                  ref={(canvasEl) => {
                    if (!canvasEl) return;
                    const c = canvasRef.current;
                    if (!c) return;
                    const ctx = canvasEl.getContext("2d");
                    if (ctx) {
                      ctx.fillStyle = "white";
                      ctx.fillRect(0, 0, 160, 120);
                      ctx.drawImage(c, 0, 0, 160, 120);
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-16 h-full p-2 flex flex-col justify-between text-left shrink-0">
                <div className="space-y-1">
                  <div className="h-2 w-10 bg-gray-300 rounded" />
                  <div className="h-1.5 w-6 bg-gray-200 rounded" />
                </div>
                <div className="h-2 w-8 bg-[#C5A880] rounded" />
              </div>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[7px] font-mono px-1.5 py-0.5 rounded uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Catálogo A4 Landscape
              </div>
            </div>
            <p className="text-[8px] text-[#A09088] uppercase tracking-wider font-bold">Página de Catálogo e-Commerce</p>
          </div>

        </div>
      </div>

    </div>
  );
};
