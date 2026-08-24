import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Award, Smile, Camera } from 'lucide-react';
import { getSiteSettings } from '../services/firebaseService';
import { ImageWithFallback } from './ImageWithFallback';
import { LoadingScreen } from './LoadingScreen';

export const AboutMeView: React.FC = () => {
  const navigate = useNavigate();
  const [aboutSettings, setAboutSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteSettings('pallyra').then((data) => {
      if (data) {
        setAboutSettings(data);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const title = aboutSettings?.about_me_title || "Olá, sou a Julia Aleixo!";
  
  const bio = aboutSettings?.about_me_bio || 
    "Sempre fui apaixonada pelo poder que mimos feitos à mão possuem de tocar corações e selar laços. Para mim, o verdadeiro artesanato não se resume à beleza externa do produto; ele consiste no afeto, no tempo depositado e na lembrança afetiva que aquela peça trará toda vez que for admirada.\n\nFoi guiada por essa paixão que criei este espaço singular que reúne três marcas queridas, cada uma com foco em preencher diferentes momentos mágicos da sua jornada diária:";

  const purpose = aboutSettings?.about_me_purpose || 
    "Queremos resgatar a proximidade, o diálogo e a satisfação de dar ou receber algo pensado especificamente para você. Por isso, oferecemos uma consultoria contínua: sua arte passa por um meticuloso ciclo de aprovação com até 3 alterações totalmente grátis para garantir que cada centímetro expresse perfeitamente o seu desejo.\n\nCada pedido produzido de forma individual entra em nossa esteira exclusiva e é cuidadosamente verificado antes de seguir viagem diretamente para as suas mãos.";

  const photo = aboutSettings?.about_me_photo || "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?q=80&w=800&auto=format&fit=crop";

  return (
    <div className="bg-[#FDFCFA] min-h-screen text-[#4A332A] font-sans selection:bg-[#E8DFC8] selection:text-[#2C1810] py-12 px-6 select-none overflow-x-hidden relative">
      {/* BACKGROUND GRAPHICS */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#F8F5EE]/50 to-transparent pointer-events-none -z-10" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* HEADER */}
        <div className="text-center mb-16">
          <h1 id="about-us-title" className="font-serif text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.25em] text-[#6d5443] mb-3">
            Quem Faz Acontecer
          </h1>
          <p id="about-us-subtitle" className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-[#cca062] flex items-center justify-center gap-2">
            A história por trás da marca e de nossos três ateliês
          </p>
        </div>

        {loading ? (
          <LoadingScreen fullScreen={false} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start mb-16">
            
            {/* LEFT: PERSONAL PHOTO */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="md:col-span-5 flex flex-col items-center"
            >
              <div id="author-photo-container" className="relative group p-2.5 bg-white border border-[#e8dcc8] rounded-[2rem] shadow-xl overflow-hidden aspect-[4/5] w-full max-w-sm">
                <div className="absolute inset-0 bg-[#e8dcc8]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 rounded-[1.75rem]" />
                <ImageWithFallback 
                  src={photo} 
                  alt="Julia Aleixo" 
                  className="w-full h-full object-cover rounded-[1.75rem] shadow-inner filter brightness-[0.98] contrast-[1.01]" 
                />
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-[#cca062] text-[10px] uppercase font-bold tracking-widest">
                <Camera size={12} /> Artesã & Criadora
              </div>
            </motion.div>

            {/* RIGHT: TEXT PROFILE */}
            <div className="md:col-span-7 space-y-8 text-[#6d5443] leading-relaxed text-sm">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-[#cca062]">
                  <Smile size={24} />
                  <h2 id="about-me-greeting" className="font-serif text-xl sm:text-2xl text-[#6d5443] tracking-wide font-normal">
                    {title}
                  </h2>
                </div>
                
                <p className="whitespace-pre-line text-gray-700 font-medium text-sm leading-relaxed">
                  {bio}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="border border-[#e8dcc8]/40 rounded-2xl p-4 bg-white/60 shadow-xs">
                    <h4 className="font-bold text-[#cca062] text-[10px] uppercase tracking-wider mb-1">La Pallyra</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">Encadernações e papelaria afetiva para organizar e guardar ideias.</p>
                  </div>
                  <div className="border border-[#e8dcc8]/40 rounded-2xl p-4 bg-white/60 shadow-xs">
                    <h4 className="font-bold text-[#5b2122] text-[10px] uppercase tracking-wider mb-1">Guennita</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">Romantismo infinito em delicados buquês de cetim exclusivos.</p>
                  </div>
                  <div className="border border-[#e8dcc8]/40 rounded-2xl p-4 bg-white/60 shadow-xs">
                    <h4 className="font-bold text-[#c96b71] text-[10px] uppercase tracking-wider mb-1">Mimada Sim</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">Lembranças criativas e alegres para decorar suas festas de alma.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-4 pl-4 border-l-2 border-[#cca062]/30"
              >
                <h3 className="font-serif text-lg tracking-wider text-[#6d5443] flex items-center gap-2">
                  <Award size={18} className="text-[#cca062]" /> Nosso Propósito
                </h3>
                <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-line text-sm">
                  {purpose}
                </p>
              </motion.div>
            </div>

          </div>
        )}

        {/* CUTE SIGNATURE FOOT */}
        <div className="text-center">
          <div className="flex items-center justify-center w-full max-w-sm mx-auto mb-6 gap-3">
            <div className="h-[1px] flex-1 border-t border-dashed border-[#cca062]/30"></div>
            <Heart size={14} fill="currentColor" strokeWidth={1.5} className="text-[#c36266]" />
            <div className="h-[1px] flex-1 border-t border-dashed border-[#cca062]/30"></div>
          </div>
          <p id="about-us-signature" className="font-cursive text-5xl text-[#6d5443] mb-2 leading-none">
            Julia Aleixo
          </p>
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#cca062] font-black">
            Artesã • Idealizadora • Apaixonada por Detalhes
          </span>
        </div>

      </div>
    </div>
  );
};
