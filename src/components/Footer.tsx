import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Search, User, Info, ShieldCheck, QrCode, CreditCard } from 'lucide-react';
import { AppConfig } from '../types';
import { ATELIERS } from '../constants';
import { checkIsAdminDomain } from '../lib/utils';

interface FooterProps {
  config: AppConfig;
}

export const Footer: React.FC<FooterProps> = ({ config }) => {
  const navigate = useNavigate();

  return (
    <footer className="bg-[#FDFCFA] border-t border-[#E8DFC8]/40 pt-8 pb-5 sm:pt-10 sm:pb-6 px-4 md:px-8 font-sans overflow-hidden mt-auto select-none">
      <div className="max-w-[1600px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 mb-6">
        
        {/* Col 1: Bio & Quick Icons */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex flex-col items-start text-left">
          <p className="text-[11px] text-[#6d5443]/85 mb-4 max-w-[220px] leading-relaxed font-light font-tahoma">
            Kits afetivos luxuosos e presentes exclusivos sob medida para demonstrar carinho em momentos memoráveis.
          </p>
          <div className="flex items-center gap-3.5 text-[#cca062]">
            <a href="/#ateliers" className="hover:text-[#3A312D] transition-colors" title="Nossos ateliês"><Info size={15} /></a>
            <a href={`https://wa.me/${(config.whatsapp_number || "").replace(/\D/g, '')}`} className="hover:text-[#3A312D] transition-colors" title="Fale pelo WhatsApp"><Mail size={15} /></a>
            <button onClick={() => navigate('/document')} className="hover:text-[#3A312D] transition-colors outline-none cursor-pointer" title="Verificar documentos"><Search size={15} /></button>
            <button onClick={() => {
              const isAdminDomain = checkIsAdminDomain();
              navigate(isAdminDomain ? '/' : '/admin');
            }} className="hover:text-[#3A312D] transition-colors outline-none cursor-pointer" title="Entrar no Painel"><User size={15} /></button>
          </div>
        </div>

        {/* Col 2: Contato & Horário de Atendimento (Movido para frente de Ateliês) */}
        <div>
           <h4 className="text-[9.5px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-3 font-poppins">Contato</h4>
           <ul className="space-y-1.5 text-[11px] font-light text-[#6d5443]/80 font-tahoma">
               <li>E-mail: lapallyra@gmail.com</li>
               <li>Contato: 44 9 7400 2857</li>
               <li className="pt-1.5">
                   <span className="font-bold text-[#3A312D] block mb-1">Horário de atendimento</span>
                   <span className="inline-block bg-[#e8dcc8]/40 px-2 py-0.5 rounded text-[10px] font-bold text-[#3A312D]">14:00 às 20:00</span>
                   <p className="mt-1 text-[10px] text-[#6d5443]/70">Segunda | Terça | Quinta</p>
                   <p className="text-[10px] text-[#6d5443]/70">Sexta e Domingo</p>
               </li>
           </ul>
        </div>
        
        {/* Col 3: Ateliês */}
        <div>
           <h4 className="text-[9.5px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-3 font-poppins">Ateliês</h4>
           <ul className="space-y-2 text-[11px] font-light text-[#6d5443]/80 font-tahoma">
             {ATELIERS.map((a) => (
               <li key={a.id}>
                 <button 
                   onClick={() => navigate(a.route)} 
                   className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left"
                 >
                   {a.name}
                 </button>
               </li>
             ))}
           </ul>
        </div>

        {/* Col 4: Navegação */}
        <div>
           <h4 className="text-[9.5px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-3 font-poppins">Navegação</h4>
           <ul className="space-y-2 text-[11px] font-light text-[#6d5443]/80 font-tahoma">
             <li><a href="/#kits" className="hover:text-[#cca062] transition-colors">Kits Prontos</a></li>
             <li><button onClick={() => navigate('/kit-meukit')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left">Monte seu Kit</button></li>
             <li><button onClick={() => navigate('/colecoes')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left">Coleções</button></li>
             <li><button onClick={() => navigate('/listadepresentes')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left">Lista de Presentes</button></li>
           </ul>
        </div>

        {/* Col 5: Suporte */}
        <div>
           <h4 className="text-[9.5px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-3 font-poppins">Suporte</h4>
           <ul className="space-y-2 text-[11px] font-light text-[#6d5443]/80 font-tahoma">
              <li><button onClick={() => navigate('/rastreamento')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer">Rastreamento de Pedido</button></li>
              <li><a href="#" className="hover:text-[#cca062] transition-colors">Prazos e Entregas</a></li>
              <li><a href="#" className="hover:text-[#cca062] transition-colors">Trocas e devoluções</a></li>
           </ul>
        </div>

        {/* Col 6: Pagamento */}
        <div className="flex flex-col items-start">
           <h4 className="text-[9.5px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-3 font-poppins">Pagamento</h4>
           <div className="flex flex-col gap-2 w-full max-w-[170px]">
              
              {/* PIX Instantâneo Badge */}
              <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#EAE4DC] px-3 py-2 rounded-xl shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-[#32BCAD]/10 text-[#32BCAD] flex items-center justify-center shrink-0">
                  <QrCode size={13} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-wider text-[#32BCAD] leading-none uppercase">PIX</span>
                  <span className="text-[8.5px] font-medium text-[#6d5443]/70 leading-tight">Aprovação Imediata</span>
                </div>
              </div>

              {/* Cartões de Crédito */}
              <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#EAE4DC] px-3 py-2 rounded-xl shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-[#B38F4D]/10 text-[#B38F4D] flex items-center justify-center shrink-0">
                  <CreditCard size={13} strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-wider text-[#3A312D] leading-none uppercase">Cartões</span>
                  <span className="text-[8.5px] font-medium text-[#6d5443]/70 leading-tight">Em até 12x no cartão</span>
                </div>
              </div>

              {/* Ambiente Seguro SSL */}
              <div className="flex items-center gap-1.5 pt-1 text-[9px] text-[#6d5443]/65">
                <ShieldCheck size={12} className="text-[#32BCAD] shrink-0" />
                <span>Ambiente 100% Seguro</span>
              </div>

           </div>
        </div>

      </div>

      {/* FINAL LEGAL COMPACT FOOTER */}
      <div className="max-w-[1600px] mx-auto border-t border-[#e8dcc8]/20 pt-3 mt-3 text-center select-none">
        <p className="font-sans text-[11px] text-[#6d5443]/75 tracking-normal font-normal leading-tight">
          © 2025 Presentes Personalizados by Julia Aleixo. Todos os direitos reservados. CNPJ 63.348.579/0001-06
        </p>
      </div>
    </footer>
  );
};
