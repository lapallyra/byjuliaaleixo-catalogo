import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ArrowRight } from 'lucide-react';
import { subscribeToAllSettings } from '../services/firebaseService';
import { ImageWithFallback } from './ImageWithFallback';
import { AtelierCard } from './ui/AtelierCard';

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
        
        {/* BREADCRUMB STRIP */}
        <div className="mb-12 inline-flex items-center gap-3 px-6 py-2.5 bg-white border border-[#e8dcc8]/40 rounded-full shadow-sm text-[9px] font-bold tracking-[0.2em] uppercase">
          <button 
            onClick={() => navigate('/')}
            className="text-[#8e8e93] hover:text-[#cca062] transition-colors cursor-pointer"
          >
            HOME
          </button>
          <span className="text-[#cca062] opacity-30 select-none">/</span>
          <span className="text-[#cca062]">atelies</span>
        </div>

        {/* HERO */}
        <div className="mb-16 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.2em] text-[#6d5443] mb-4">
            Nossos Ateliês
          </h1>
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-[#cca062] max-w-xl mx-auto mb-1 flex items-center justify-center gap-3">
            <span className="h-[1px] w-8 bg-[#cca062]/40" />
            Artesanato por Trás de Cada Detalhe
            <span className="h-[1px] w-8 bg-[#cca062]/40" />
          </p>
        </div>

        {/* ATELIERS LIST */}
        <div className="space-y-12">
          {ateliers.map((atelier, index) => {
            const logo = getAtelierLogo(atelier.id);
            const isImageLogo = logo.startsWith('http') || logo.startsWith('data:') || logo.includes('/');

            return (
              <AtelierCard
                key={atelier.id}
                atelier={{ ...atelier, logo }}
                index={index}
                onClick={() => navigate(atelier.route)}
              />
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
