import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ArrowRight } from 'lucide-react';
import { subscribeToAllSettings } from '../services/firebaseService';
import { ImageWithFallback } from './ImageWithFallback';

export const AteliersPresentationView: React.FC = () => {
  const navigate = useNavigate();
  const [customSettings, setCustomSettings] = useState<any>({});

  useEffect(() => {
    return subscribeToAllSettings((results) => {
      setCustomSettings(results);
    });
  }, []);

  const getAtelierLogo = (id: string) => {
    const customIsotipo = customSettings[id]?.store_isotipo;
    if (customIsotipo) return customIsotipo;
    const customLogo = customSettings[id]?.store_logo;
    if (customLogo) return customLogo;
    
    if (id === 'pallyra') return '📓';
    if (id === 'guennita') return '👑';
    if (id === 'tuttymimo') return '🍼';
    return '💅';
  };

  const ateliers = [
    {
      id: 'pallyra',
      name: 'La Pallyra',
      title: 'Papelaria Artesanal, Afetiva & Blocagem',
      description: 'Organização e rotina de forma única e afetiva. Agendas, blocos de notas, planners e mimos de papelaria confeccionados inteiramente de forma artesanal para acolher sua história e acompanhar seus melhores momentos diários. Cada peça conta com acabamentos selecionados e estruturação impecável de cartonagem, projetados para valorizar suas anotações e proteger suas ideias.',
      details: 'Encadernações variadas com técnicas modernas, blocagem especializada, papéis especiais de alta gramatura e capas duras de cartonagem de alta durabilidade.',
      tagline: 'Onde seus sonhos viram papel.',
      route: '/lapallyra',
      accentColor: '#cca062',
      bgGradient: 'from-[#fffaf0] to-white',
    },
    {
      id: 'guennita',
      name: 'com amor, Guennita',
      title: 'Romantismo & Flores de Cetim',
      description: 'Elegância, sofisticação e eterno afeto em forma de buquês artesanais. Cada flor e folhagem é tecida pétala por pétala, à mão, em cetim premium da mais fina qualidade. Pensado para noivas, formandas e presentes que durarão para sempre, conservando a doçura dos dias felizes.',
      details: 'Rosas de cetim feitas individualmente, laços nobres de organza, broches finos e embalagens dignas de realeza.',
      tagline: 'Flores eternas tecidas com o coração.',
      route: '/comamorguennita',
      accentColor: '#5b2122',
      bgGradient: 'from-[#fdf5f5] to-white',
    },
    {
      id: 'mimada',
      name: 'Mimada Sim',
      title: 'Lembranças & Brindes com Alma',
      description: 'O ateliê onde a festa ganha cor e vida! Lembranças afetivas e mimos de celebração personalizados para casamentos, maternidades, aniversários e eventos corporativos. Transformamos o ato de mimar quem você ama com criatividade, sorrisos e muito brilho manual.',
      details: 'Design personalizado para cada tema, tags interativas, acabamento delicado e guloseimas perfumadas.',
      tagline: 'O mimo que seu convidado nunca vai esquecer.',
      route: '/mimadasim',
      accentColor: '#c96b71',
      bgGradient: 'from-[#fff5f6] to-white',
    },
    {
      id: 'tuttymimo',
      name: 'Tutty Mimo',
      title: 'Maternidade e Primeira Infância',
      description: 'Para o nicho de bebês, maternidade e primeira infância. Estilo acolhedor, afetivo e premium.',
      details: 'Produtos delicados, materiais confortáveis e acabamento impecável.',
      tagline: 'O cuidado que seu bebê merece.',
      route: '/tuttymimo',
      accentColor: '#d4bda1',
      bgGradient: 'from-[#fcfaf7] to-white',
    }
  ];

  return (
    <div className="bg-[#fffdfa] min-h-screen text-[#6d5443] font-sans selection:bg-[#e8dcc8] selection:text-[#3A312D] py-12 px-6 md:px-12 select-none overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        
        {/* VOLTAR & HERO */}
        <div className="mb-12 flex flex-col items-center md:items-start">
          <button 
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#cca062] hover:text-[#c36266] transition-colors mb-8 outline-none cursor-pointer"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Voltar ao Início
          </button>
          
          <div className="text-center w-full">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.2em] text-[#6d5443] mb-4">
              Nossos Ateliês
            </h1>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-[#cca062] max-w-xl mx-auto mb-1 flex items-center justify-center gap-3">
              <span className="h-[1px] w-8 bg-[#cca062]/40" />
              Artesanato por Trás de Cada Detalhe
              <span className="h-[1px] w-8 bg-[#cca062]/40" />
            </p>
          </div>
        </div>

        {/* ATELIERS LIST */}
        <div className="space-y-12">
          {ateliers.map((atelier, index) => {
            const logo = getAtelierLogo(atelier.id);
            const isImageLogo = logo.startsWith('http') || logo.startsWith('data:') || logo.includes('/');

            return (
              <motion.div
                key={atelier.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white border border-[#e8dcc8]/60 rounded-3xl p-8 md:p-12 shadow-sm relative overflow-hidden flex flex-col lg:flex-row gap-8 items-center lg:items-stretch"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#cca062]/5 rounded-bl-full blur-xl pointer-events-none" />
                
                {/* Visual Logo / Design Image */}
                <div className="flex flex-col justify-center items-center p-6 bg-gradient-to-br from-white to-[#faf8f5] rounded-3xl border border-[#e8dcc8]/40 w-48 h-48 shrink-0 shadow-inner">
                  {isImageLogo ? (
                    <div className="w-28 h-28 rounded-full border border-[#e8dcc8]/40 bg-white flex items-center justify-center overflow-hidden p-1 shadow-xs">
                      <ImageWithFallback src={logo} alt={atelier.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-full border border-[#e8dcc8]/40 bg-white flex items-center justify-center text-4xl shadow-xs">
                      {logo}
                    </div>
                  )}
                  <span className="font-serif text-[10px] font-black uppercase tracking-widest mt-3 text-[#cca062]/80">
                    {atelier.id === 'guennita' ? 'Guennita' : atelier.id === 'pallyra' ? 'La Pallyra' : atelier.id === 'mimada' ? 'Mimada Sim' : 'Tutty Mimo'}
                  </span>
                </div>

                {/* Text Info */}
                <div className="flex flex-col justify-between flex-1 text-center lg:text-left">
                  <div>
                    <h2 className="font-beauty text-2xl sm:text-3xl font-normal leading-tight mb-1" style={{ color: atelier.accentColor }}>
                      {atelier.name}
                    </h2>
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 mb-6">
                      {atelier.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mb-6">
                      {atelier.description}
                    </p>
                    
                    <div className="bg-[#faf8f5] border border-[#e8dcc8]/40 rounded-xl p-4 mb-8 text-xs max-w-2xl">
                      <span className="font-bold text-[#cca062] block mb-1 uppercase tracking-wider">Acabamentos e Diferenciais:</span>
                      <span className="text-[#6d5443]/80 leading-relaxed">{atelier.details}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                    <p className="font-cursive text-2xl leading-none" style={{ color: atelier.accentColor }}>
                      &ldquo;{atelier.tagline}&rdquo;
                    </p>
                    
                    <button
                      onClick={() => navigate(atelier.route)}
                      className="flex items-center gap-3 text-white font-bold tracking-widest text-xs uppercase px-8 py-3.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                      style={{ 
                        backgroundColor: atelier.accentColor,
                        boxShadow: `0 4px 14px ${atelier.accentColor}25`
                      }}
                    >
                      Ver Catálogo
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* REASSURING BOTTOM INFO */}
        <div className="mt-16 text-center select-none">
          <div className="flex items-center justify-center w-full max-w-sm mx-auto mb-6 gap-3">
            <div className="h-[1px] flex-1 border-t border-dashed border-[#cca062]/30"></div>
            <Heart size={14} fill="currentColor" strokeWidth={1.5} className="text-[#c36266]" />
            <div className="h-[1px] flex-1 border-t border-dashed border-[#cca062]/30"></div>
          </div>
          <p className="font-cursive text-3xl text-[#6d5443] mb-2">
            Cada pedido carrega o capricho de mãos que amam criar.
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Produção sustentável • Acabamento impecável • Envio seguro
          </p>
        </div>

      </div>
    </div>
  );
};
