
import React from 'react';
import { 
  Pencil, 
  Instagram, 
  Phone, 
  Mail, 
  MessageCircle, 
  Send, 
  ArrowUpRight, 
  CreditCard,
  Sparkles,
  CheckCircle2,
  Clock,
  Package,
  ShieldCheck,
  Bell,
  Calendar,
  AlertCircle,
  Gift,
  Heart,
  ChevronRight,
  FileCheck,
  Award
} from 'lucide-react';
import { useCustomer } from '../../hooks/useCustomer';
import { useOrders } from '../../hooks/useOrders';
import { useMemories } from '../../hooks/useMemories';
import { useAuth } from '../AuthProvider';
import { useNavigate } from 'react-router-dom';

export const DashboardCliente: React.FC = () => {
  const { customer, loading: customerLoading } = useCustomer();
  const { orders, loading: ordersLoading } = useOrders();
  const { memories, loading: memoriesLoading } = useMemories();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (customerLoading || ordersLoading || memoriesLoading) {
    return (
      <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#8C6D37] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#2A2421]">Carregando seu painel de resumos...</p>
      </div>
    );
  }

  const name = customer?.name || user?.displayName || 'Júlia Aleixo';
  const email = customer?.email || user?.email || 'byjuliaaleixo@gmail.com';
  const initial = name.charAt(0).toUpperCase();

  // Calculated stats for summary
  const activeOrdersCount = orders.filter(o => 
    !['entregue', 'concluded', 'concluido', 'cancelado'].includes((o.status || '').toLowerCase())
  ).length || 2;

  const memoriesCount = memories.length || 3;
  const favoritesCount = customer?.favoriteProductIds?.length || 4;

  return (
    <div className="space-y-4 pb-4 px-1 sm:px-2">
      
      {/* ========================================== */}
      {/* ROW 1: PROFILE SUMMARY & PAYMENT DATA      */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        
        {/* CARD 1: PROFILE SUMMARY (Col 1-8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 shadow-2xs border border-stone-200/80 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            
            {/* User Avatar Circle */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#3D3531] via-[#2A2421] to-[#1E1917] text-white flex items-center justify-center font-extrabold text-3xl sm:text-4xl shadow-md border-4 border-[#8C6D37]/30">
                {initial}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#8C6D37] border-2 border-white flex items-center justify-center text-white text-[10px] shadow-2xs" title="Conta Verificada">
                ✓
              </div>
            </div>

            {/* User Profile Details */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-[#2A2421] tracking-tight truncate">
                  {name}
                </h2>
                <button 
                  onClick={() => navigate('/minha-experiencia/minha-conta')}
                  className="p-2 rounded-xl bg-[#F5F1EB] hover:bg-[#2A2421] text-[#2A2421] hover:text-white transition-colors cursor-pointer shrink-0"
                  title="Editar Perfil"
                >
                  <Pencil size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-xs text-[#6E645E]">
                <p><span className="text-stone-400">Data de registro:</span> <strong className="text-[#2A2421] font-semibold">24 de novembro de 2023</strong></p>
                <p><span className="text-stone-400">País, Cidade:</span> <strong className="text-[#2A2421] font-semibold">Brasil, São Paulo</strong></p>
                <p><span className="text-stone-400">Data de nascimento:</span> <strong className="text-[#2A2421] font-semibold">08.04.1993</strong></p>
                <p className="truncate"><span className="text-stone-400">E-mail:</span> <strong className="text-[#2A2421] font-semibold">{email}</strong></p>
                <p><span className="text-stone-400">Telefone:</span> <strong className="text-[#2A2421] font-semibold">+55 (11) 98888-7777</strong></p>
              </div>

              {/* Social & Contact Pill Buttons Row */}
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#F5F1EB] hover:bg-[#8C6D37] text-[#3D3531] hover:text-white flex items-center justify-center transition-all border border-stone-200/80 shadow-2xs">
                  <Instagram size={14} />
                </a>
                <a href="https://wa.me/5511988887777" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#F5F1EB] hover:bg-[#8C6D37] text-[#3D3531] hover:text-white flex items-center justify-center transition-all border border-stone-200/80 shadow-2xs">
                  <Phone size={14} />
                </a>
                <a href={`mailto:${email}`} className="w-8 h-8 rounded-full bg-[#F5F1EB] hover:bg-[#8C6D37] text-[#3D3531] hover:text-white flex items-center justify-center transition-all border border-stone-200/80 shadow-2xs">
                  <Mail size={14} />
                </a>
                <a href="https://telegram.org" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#F5F1EB] hover:bg-[#8C6D37] text-[#3D3531] hover:text-white flex items-center justify-center transition-all border border-stone-200/80 shadow-2xs">
                  <Send size={14} />
                </a>
                <a href="https://pinterest.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#F5F1EB] hover:bg-[#8C6D37] text-[#3D3531] hover:text-white flex items-center justify-center transition-all border border-stone-200/80 shadow-2xs">
                  <MessageCircle size={14} />
                </a>
              </div>

            </div>

          </div>
        </div>

        {/* CARD 2: PAYMENT DATA & WALLET (Col 9-12) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 shadow-2xs border border-stone-200/80 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-[#2A2421]">Dados de Pagamento</h3>
            <p className="text-xs text-[#6E645E] mt-1">Número do cartão / Chave Pix:</p>

            <div className="my-3 py-2.5 px-4 rounded-2xl bg-[#F5F1EB] border border-stone-200/80 text-center font-mono text-xs text-[#2A2421] font-bold tracking-widest shadow-2xs">
              236 *** *** 265
            </div>
          </div>

          {/* Accepted Payment Logos */}
          <div className="pt-2">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-[#2A2421] text-amber-300 text-[10px] font-bold tracking-wider py-2 px-3 rounded-xl border border-stone-800 flex items-center justify-center gap-1">
                <span>WESTERN UNION</span>
              </div>
              <div className="bg-stone-50 text-stone-700 text-[10px] font-bold py-2 px-3 rounded-xl border border-stone-200 flex items-center justify-center gap-1">
                <span className="text-blue-600 font-extrabold">G</span> Pay
              </div>
              <div className="bg-stone-50 text-rose-700 text-[10px] font-bold py-2 px-3 rounded-xl border border-stone-200 flex items-center justify-center gap-1">
                <span>MasterCard</span>
              </div>
              <div className="bg-stone-50 text-blue-900 text-[10px] font-black italic py-2 px-3 rounded-xl border border-stone-200 flex items-center justify-center gap-1">
                <span>VISA</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* ROW 2: RESUMO RÁPIDO DO CLIENTE (KPI CARDS) */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* KPI 1: Pedidos em Andamento */}
        <div 
          onClick={() => navigate('/minha-experiencia/pedidos')}
          className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#F5F1EB] text-[#8C6D37] group-hover:bg-[#2A2421] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
            <Package size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#6E645E] uppercase tracking-wider block">Projetos Ativos</span>
            <span className="text-lg font-extrabold text-[#2A2421]">{activeOrdersCount} {activeOrdersCount === 1 ? 'pedido' : 'pedidos'}</span>
          </div>
        </div>

        {/* KPI 2: Memórias Agendadas */}
        <div 
          onClick={() => navigate('/minha-experiencia/memorias')}
          className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#F5F1EB] text-[#8C6D37] group-hover:bg-[#2A2421] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#6E645E] uppercase tracking-wider block">Memórias Agendadas</span>
            <span className="text-lg font-extrabold text-[#2A2421]">{memoriesCount} datas</span>
          </div>
        </div>

        {/* KPI 3: Favoritos Salvos */}
        <div 
          onClick={() => navigate('/minha-experiencia/favoritos')}
          className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#F5F1EB] text-[#8C6D37] group-hover:bg-[#2A2421] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
            <Heart size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#6E645E] uppercase tracking-wider block">Favoritos Salvos</span>
            <span className="text-lg font-extrabold text-[#2A2421]">{favoritesCount} itens</span>
          </div>
        </div>

        {/* KPI 4: Selo do Cliente */}
        <div 
          onClick={() => navigate('/minha-experiencia/minha-conta')}
          className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#F5F1EB] text-[#8C6D37] group-hover:bg-[#2A2421] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#6E645E] uppercase tracking-wider block">Nível do Ateliê</span>
            <span className="text-sm font-extrabold text-[#2A2421]">Cliente VIP Ateliê</span>
          </div>
        </div>

      </div>

      {/* =================================================== */}
      {/* ROW 3: LEMBRETES IMPORTANTES & AVISOS DO CLIENTE    */}
      {/* =================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xs border border-stone-200/80">
        
        <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F5F1EB] text-[#8C6D37] flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#2A2421]">Lembretes Importantes & Avisos</h3>
              <p className="text-xs text-[#6E645E]">Acompanhe notificações de produção, datas afetuosas e aprovações</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-[#F5F1EB] text-[#8C6D37] px-3 py-1 rounded-full border border-stone-200/80 uppercase tracking-wider">
            3 Ativos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Lembrete 1: Produção / Status */}
          <div className="bg-[#FBF9F5] p-4 rounded-2xl border border-stone-200/80 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#2A2421] text-white px-2.5 py-0.5 rounded-full">
                  Produção em Andamento
                </span>
                <Clock size={14} className="text-[#8C6D37]" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#2A2421]">
                Caixa Memória Afeto (Madeira Nobre)
              </h4>
              <p className="text-xs text-[#6E645E] leading-relaxed">
                Seu kit está na etapa de <strong>gravação a laser e montagem de cetim</strong>. Previsão de postagem nos próximos 3 dias úteis.
              </p>
            </div>
            <button 
              onClick={() => navigate('/minha-experiencia/pedidos')}
              className="text-xs font-bold text-[#8C6D37] hover:text-[#2A2421] flex items-center gap-1 pt-1 transition-colors cursor-pointer"
            >
              <span>Acompanhar Produção</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Lembrete 2: Data Comemorativa Próxima */}
          <div className="bg-[#FBF9F5] p-4 rounded-2xl border border-stone-200/80 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#8C6D37] text-white px-2.5 py-0.5 rounded-full">
                  Lembrete de Data Especial
                </span>
                <Calendar size={14} className="text-[#8C6D37]" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#2A2421]">
                Aniversário da Mamãe (15/09)
              </h4>
              <p className="text-xs text-[#6E645E] leading-relaxed">
                Faltam <strong>15 dias</strong>! Monte o presente artesanal com antecedência para garantir a entrega a tempo.
              </p>
            </div>
            <button 
              onClick={() => navigate('/minha-experiencia/memorias')}
              className="text-xs font-bold text-[#8C6D37] hover:text-[#2A2421] flex items-center gap-1 pt-1 transition-colors cursor-pointer"
            >
              <span>Ver Minhas Memórias</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Lembrete 3: Pendência / Aprovação de Layout */}
          <div className="bg-[#FBF9F5] p-4 rounded-2xl border border-stone-200/80 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-700 text-white px-2.5 py-0.5 rounded-full">
                  Aprovação Solicitada
                </span>
                <FileCheck size={14} className="text-amber-700" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#2A2421]">
                Aprovação da Tipografia Bordada
              </h4>
              <p className="text-xs text-[#6E645E] leading-relaxed">
                Enviamos o modelo de bordado para o seu WhatsApp para confirmação dos nomes antes da costura.
              </p>
            </div>
            <a 
              href="https://wa.me/5511988887777" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-bold text-[#8C6D37] hover:text-[#2A2421] flex items-center gap-1 pt-1 transition-colors cursor-pointer"
            >
              <span>Confirmar no WhatsApp</span>
              <ChevronRight size={14} />
            </a>
          </div>

        </div>

      </div>

      {/* ============================================== */}
      {/* ROW 4: CARD (TIMELINE ORDERS)                  */}
      {/* ============================================== */}

      {/* ORDERS & ATELIÊ TIMELINE */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xs border border-stone-200/80">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-[#2A2421]">Meus Pedidos & Ateliês</h3>
          <button 
            onClick={() => navigate('/minha-experiencia/pedidos')}
            className="text-xs font-bold text-[#8C6D37] hover:underline cursor-pointer"
          >
            Ver todos →
          </button>
        </div>

        {/* Timeline Container */}
        <div className="relative pl-7 space-y-4">
          
          {/* Vertical Connecting Line */}
          <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-[#8C6D37]/30" />

          {/* Timeline Item 1 */}
          <div className="relative group">
            <div className="absolute -left-7 top-4 w-5 h-5 rounded-full bg-[#8C6D37] border-4 border-white shadow-xs z-10" />
            <div className="bg-[#F9F6F1] rounded-2xl p-4 border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:shadow-2xs transition-all">
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-[#2A2421]">
                  Kit Caixa Ateliê Personalizada (Bordados & Linho)
                </h4>
                <p className="text-[11px] text-[#6E645E] font-normal">
                  Composição artesanal, tipografia gravada, linho nobre importado...
                </p>
                <span className="inline-block text-[10px] text-stone-400 font-medium pt-1">
                  68 etapas de produção / 6 itens artesanais
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <span className="bg-[#2A2421] text-white font-bold text-[11px] px-3 py-1 rounded-xl shadow-2xs">
                  Concluído
                </span>
                <button 
                  onClick={() => navigate('/minha-experiencia/pedidos')}
                  className="w-8 h-8 rounded-xl bg-[#F5F1EB] hover:bg-[#2A2421] text-[#2A2421] hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Item 2 */}
          <div className="relative group">
            <div className="absolute -left-7 top-4 w-5 h-5 rounded-full bg-[#5A483E] border-4 border-white shadow-xs z-10" />
            <div className="bg-[#F9F6F1] rounded-2xl p-4 border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:shadow-2xs transition-all">
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-[#2A2421]">
                  Caixa Memória Afeto (Madeira Nobre & Cetim)
                </h4>
                <p className="text-[11px] text-[#6E645E] font-normal">
                  Design de acabamento exclusivo em cetim e gravação a laser...
                </p>
                <span className="inline-block text-[10px] text-stone-400 font-medium pt-1">
                  12 detalhes customizados / 12 itens
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <span className="bg-[#8C6D37] text-white font-bold text-[11px] px-3 py-1 rounded-xl shadow-2xs">
                  Em Produção
                </span>
                <button 
                  onClick={() => navigate('/minha-experiencia/pedidos')}
                  className="w-8 h-8 rounded-xl bg-[#F5F1EB] hover:bg-[#8C6D37] text-[#2A2421] hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Item 3 */}
          <div className="relative group">
            <div className="absolute -left-7 top-4 w-5 h-5 rounded-full bg-stone-300 border-4 border-white shadow-xs z-10" />
            <div className="bg-[#F9F6F1] rounded-2xl p-4 border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:shadow-2xs transition-all">
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-[#2A2421]">
                  Lembranças Mimo VIP (Cartão Bordado à Mão)
                </h4>
                <p className="text-[11px] text-[#6E645E] font-normal">
                  Criação e animação de mimos personalizados em papel nobre...
                </p>
                <span className="inline-block text-[10px] text-stone-400 font-medium pt-1">
                  12 etapas agendadas / 12 itens
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <span className="bg-stone-600 text-white font-bold text-[11px] px-3 py-1 rounded-xl shadow-2xs">
                  Previsão: 13.09.2026
                </span>
                <button 
                  onClick={() => navigate('/minha-experiencia/pedidos')}
                  className="w-8 h-8 rounded-xl bg-[#F5F1EB] hover:bg-stone-700 text-[#2A2421] hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};



