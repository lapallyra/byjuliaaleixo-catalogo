import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Search, PlusCircle, CheckCircle, Clock, Heart, Share2 } from 'lucide-react';

export const GiftListInfoView: React.FC = () => {
  const navigate = useNavigate();
  const [listCodeInput, setListCodeInput] = useState('');

  const handleSearchCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (listCodeInput.trim()) {
      navigate(`/document?code=${listCodeInput.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="bg-[#fffdfa] min-h-screen text-[#6d5443] font-sans selection:bg-[#e8dcc8] selection:text-[#3A312D] py-12 px-6 md:px-12 select-none overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        
        {/* VOLTAR ACTION */}
        <button 
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#cca062] hover:text-[#c36266] transition-colors mb-12 outline-none"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Voltar ao Início
        </button>

        {/* HERO TITLE */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 rounded-full bg-[#cca062]/10 text-[#cca062] flex items-center justify-center mx-auto mb-4 border border-[#cca062]/20 shadow-sm animate-bounce">
            <Gift size={28} strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.2em] text-[#6d5443] mb-3">
            Lista de Presentes
          </h1>
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-[#cca062] max-w-xl mx-auto leading-relaxed">
            Mimos especiais selecionados com amor para marcar datas inesquecíveis.
          </p>
        </div>

        {/* STEP-BY-STEP EXPLANATION */}
        <div className="bg-white border border-[#e8dcc8]/60 rounded-3xl p-8 md:p-12 shadow-sm mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#cca062]/5 rounded-bl-full blur-lg pointer-events-none" />
          
          <h2 className="font-serif text-2xl text-[#6d5443] mb-8 text-center md:text-left">Como funciona?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#faf8f5] border border-[#e8dcc8]/60 flex items-center justify-center text-xs font-bold text-[#cca062]">
                1
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#6d5443]">Monte sua Lista</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Navegue por qualquer um de nossos três catálogos (La Pallyra, Guennita ou Mimada Sim), clique no ícone de presente nos produtos desejados e adicione à sua lista.
              </p>
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#faf8f5] border border-[#e8dcc8]/60 flex items-center justify-center text-xs font-bold text-[#cca062]">
                2
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#6d5443]">Gere seu Código</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Abra sua lista de presentes no rodapé ou no painel de compras, preencha as informações básicas e salve para gerar um <strong>código único</strong> de acesso (válido por 60 dias).
              </p>
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#faf8f5] border border-[#e8dcc8]/60 flex items-center justify-center text-xs font-bold text-[#cca062]">
                3
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#6d5443]">Compartilhe & Ganhe</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Envie o código para seus convidados ou amigos. Eles buscam o código em nossa barra de busca rápida e compram diretamente os itens salvos por você para presentear!
              </p>
            </div>
          </div>
        </div>

        {/* INTERACTIVE ACTIONS BOX */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* SEARCH BOX */}
          <div className="bg-gradient-to-br from-[#faf8f5] to-white border border-[#e8dcc8]/80 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#cca062] mb-3">
                <Search size={16} />
                <h4 className="font-bold text-xs uppercase tracking-wider">Buscar lista existente</h4>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-6">
                Digite o código da lista que lhe enviaram para visualizar as preferências e comprar mimos.
              </p>
            </div>
            
            <form onSubmit={handleSearchCode} className="flex gap-2 bg-white border border-[#e8dcc8]/80 rounded-full px-3.5 py-1.5 shadow-xs">
              <input 
                type="text"
                value={listCodeInput}
                onChange={(e) => setListCodeInput(e.target.value)}
                placeholder="Ex: GL1234..." 
                className="bg-transparent focus:outline-none w-full text-xs text-[#6d5443] font-bold tracking-widest uppercase placeholder:opacity-50"
              />
              <button 
                type="submit"
                className="bg-[#cca062] text-white hover:bg-[#c36266] transition-colors text-[9px] font-bold tracking-widest uppercase px-4 py-2 rounded-full leading-none shrink-0"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* CREATE BOX */}
          <div className="bg-gradient-to-br from-[#faf8f5] to-white border border-[#e8dcc8]/80 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#c36266] mb-3">
                <PlusCircle size={16} />
                <h4 className="font-bold text-xs uppercase tracking-wider">Criar nova lista</h4>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-6">
                Comece agora adicionando mimos ao seu carrinho de presentes navegando por nossos ateliês.
              </p>
            </div>
            
            <button
              onClick={() => navigate('/')}
              className="w-full bg-[#cca062] hover:bg-[#c36266] text-white transition-all text-[10px] font-black uppercase tracking-widest px-6 py-3.5 rounded-full shadow-sm text-center"
            >
              Ir aos Catálogos
            </button>
          </div>

        </div>

        {/* ADVANTAGES LIST */}
        <div className="text-center pt-8 border-t border-[#e8dcc8]/45">
          <div className="flex items-center justify-center w-full max-w-sm mx-auto mb-6 gap-3">
            <div className="h-[1px] flex-1 border-t border-dashed border-[#cca062]/30"></div>
            <Heart size={14} fill="currentColor" strokeWidth={1.5} className="text-[#c36266]" />
            <div className="h-[1px] flex-1 border-t border-dashed border-[#cca062]/30"></div>
          </div>
          <p className="font-cursive text-3.5xl text-[#6d5443] mb-2 leading-none">
            Feito para celebrar a união de momentos felizes.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-4 text-[9px] font-bold uppercase tracking-widest text-[#cca062]">
            <span className="flex items-center gap-1.5"><Clock size={12} /> Expiração em 60 dias</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={12} /> Arte 100% Personalizada</span>
            <span className="flex items-center gap-1.5"><Share2 size={12} /> Fácil Compartilhamento</span>
          </div>
        </div>

      </div>
    </div>
  );
};
