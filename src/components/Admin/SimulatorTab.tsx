import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  DollarSign, 
  PackageSearch, 
  Factory, 
  Save, 
  GitCompare, 
  Settings2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CompanyId, Product, Insumo, Order } from '../../types';
import { formatCurrency } from '../../lib/currencyUtils';

interface SimulatorTabProps {
  companyId: CompanyId;
  products: Product[];
  insumos: Insumo[];
  orders: Order[];
}

type SimulatorSection = 'vendas' | 'preco' | 'producao' | 'custos' | 'salvos' | 'comparacao';

export const SimulatorTab: React.FC<SimulatorTabProps> = ({ companyId, products, insumos, orders }) => {
  const [activeSection, setActiveSection] = useState<SimulatorSection>('vendas');

  const companyProducts = useMemo(() => products.filter(p => p.company === companyId), [products, companyId]);
  const companyOrders = useMemo(() => orders.filter(o => o.companyId === companyId), [orders, companyId]);

  // Core indicators calculation to show always globally
  const totalStockValue = insumos.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0);
  const healthStatus = totalStockValue > 1000 ? 'healthy' : 'warning';

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 lg:p-8 pt-20 lg:pt-8 w-full max-w-7xl mx-auto h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar for Sub-Tabs */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2 overflow-y-auto pb-8">
        <h2 className="text-2xl font-black text-[#2D221F] uppercase tracking-tighter mb-4">Simulador</h2>
        
        <button
          onClick={() => setActiveSection('vendas')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeSection === 'vendas' ? 'bg-[#2D221F] text-white shadow-lg' : 'bg-white text-[#5F524C] hover:bg-[#F0E6D2]'}`}
        >
          <TrendingUp size={18} />
          Vendas
        </button>
        <button
          onClick={() => setActiveSection('preco')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeSection === 'preco' ? 'bg-[#2D221F] text-white shadow-lg' : 'bg-white text-[#5F524C] hover:bg-[#F0E6D2]'}`}
        >
          <DollarSign size={18} />
          Preço
        </button>
        <button
          onClick={() => setActiveSection('producao')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeSection === 'producao' ? 'bg-[#2D221F] text-white shadow-lg' : 'bg-white text-[#5F524C] hover:bg-[#F0E6D2]'}`}
        >
          <Factory size={18} />
          Produção
        </button>
        <button
          onClick={() => setActiveSection('custos')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeSection === 'custos' ? 'bg-[#2D221F] text-white shadow-lg' : 'bg-white text-[#5F524C] hover:bg-[#F0E6D2]'}`}
        >
          <Settings2 size={18} />
          Custos
        </button>
        <div className="h-px bg-[#F0E6D2] my-2" />
        <button
          onClick={() => setActiveSection('salvos')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeSection === 'salvos' ? 'bg-[#2D221F] text-white shadow-lg' : 'bg-white text-[#5F524C] hover:bg-[#F0E6D2]'}`}
        >
          <Save size={18} />
          Cenários Salvos
        </button>
        <button
          onClick={() => setActiveSection('comparacao')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeSection === 'comparacao' ? 'bg-[#2D221F] text-white shadow-lg' : 'bg-white text-[#5F524C] hover:bg-[#F0E6D2]'}`}
        >
          <GitCompare size={18} />
          Comparação
        </button>

        {/* Global Summary Indicator */}
        <div className="mt-8 bg-white border border-[#F0E6D2] p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black tracking-widest text-[#A09088] uppercase mb-3">Saúde Atual</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span className="text-[#2D221F]">Margem Saudável</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle size={16} className="text-amber-500" />
              <span className="text-[#2D221F]">Atenção a Custos</span>
            </div>
            {healthStatus === 'warning' && (
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-red-600">Risco no Estoque</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[2rem] border border-[#F0E6D2] p-6 lg:p-8 shadow-[0_20px_40px_rgba(240,230,210,0.3)] overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeSection === 'vendas' && (
            <motion.div
              key="vendas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h3 className="text-xl font-black text-[#2D221F]">Simulador de Vendas</h3>
                <p className="text-[#A09088] text-sm">Projete resultados financeiros baseados em volume de vendas.</p>
              </div>
              <SalesSimulator products={companyProducts} insumos={insumos} />
            </motion.div>
          )}

          {activeSection === 'preco' && (
            <motion.div
              key="preco"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h3 className="text-xl font-black text-[#2D221F]">Simulador de Preços</h3>
                <p className="text-[#A09088] text-sm">Avalie o impacto no lucro e receita ao alterar os preços de seus produtos.</p>
              </div>
              <PriceSimulator products={companyProducts} insumos={insumos} />
            </motion.div>
          )}

          {activeSection === 'producao' && (
            <motion.div
              key="producao"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h3 className="text-xl font-black text-[#2D221F]">Simulador de Produção</h3>
                <p className="text-[#A09088] text-sm">Estime necessidades de materiais e custos de reposição para produção em massa.</p>
              </div>
              <ProductionSimulator products={companyProducts} insumos={insumos} />
            </motion.div>
          )}

          {activeSection === 'custos' && (
            <motion.div
              key="custos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h3 className="text-xl font-black text-[#2D221F]">Simulador de Custos</h3>
                <p className="text-[#A09088] text-sm">Identifique o impacto em margens caso os fornecedores aumentem o custo do insumo.</p>
              </div>
              <CostSimulator products={companyProducts} insumos={insumos} />
            </motion.div>
          )}

          {activeSection === 'salvos' && (
            <motion.div
              key="salvos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h3 className="text-xl font-black text-[#2D221F]">Cenários Salvos</h3>
              <p className="text-[#A09088] text-sm mt-1 mb-8">Visualize as simulações persistidas anteriormente.</p>
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#F0E6D2] rounded-3xl">
                <Save size={40} className="text-[#D88D85] mb-4" />
                <p className="text-[#5F524C] font-bold">Nenhum cenário salvo ainda.</p>
                <p className="text-sm text-[#A09088]">Faça uma simulação e clique em "Salvar Cenário" para arquivar.</p>
              </div>
            </motion.div>
          )}

          {activeSection === 'comparacao' && (
            <motion.div
              key="comparacao"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h3 className="text-xl font-black text-[#2D221F]">Comparador Estratégico</h3>
              <p className="text-[#A09088] text-sm mt-1 mb-8">Compare diferentes estratégias de negócio lado a lado.</p>
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#F0E6D2] rounded-3xl">
                <GitCompare size={40} className="text-[#D88D85] mb-4" />
                <p className="text-[#5F524C] font-bold">Para comparar é necessário salvar ao menos dois cenários.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ==========================================
// 1. SALES SIMULATOR
// ==========================================
const SalesSimulator = ({ products, insumos }: { products: Product[], insumos: Insumo[] }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(100);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Calculate generic cost from insumos
  const unitCost = useMemo(() => {
    if (!selectedProduct || !selectedProduct.insumos) return 0;
    return selectedProduct.insumos.reduce((acc, usage) => {
      const insumo = insumos.find(i => i.id === usage.insumoId);
      if (insumo) {
        return acc + (usage.quantity * (insumo.costPrice / (insumo.quantity || 1)));
      }
      return acc;
    }, 0);
  }, [selectedProduct, insumos]);

  const totalRevenue = selectedProduct ? selectedProduct.retail_price * quantity : 0;
  const totalCost = unitCost * quantity;
  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Parameters */}
      <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#F0E6D2]">
        <h4 className="text-[10px] uppercase font-black tracking-widest text-[#A09088] mb-4">Parâmetros</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-[#5F524C] mb-2">Selecione o Produto</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-white border border-[#F0E6D2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D88D85] text-[#2D221F]"
            >
              <option value="">Selecione um produto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.product_name} - {formatCurrency(p.retail_price)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#5F524C] mb-2">Quantidade de Vendas (Unid.)</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full bg-white border border-[#F0E6D2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D88D85] text-[#2D221F]"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {selectedProduct && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#F0E6D2] p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full" />
            <p className="text-xs font-bold text-[#A09088] uppercase tracking-wide">Receita Bruta</p>
            <p className="text-2xl font-black text-[#2D221F] mt-2">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-white border border-[#F0E6D2] p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-50 rounded-full" />
            <p className="text-xs font-bold text-[#A09088] uppercase tracking-wide">Custo Produção</p>
            <p className="text-2xl font-black text-red-500 mt-2">{formatCurrency(totalCost)}</p>
          </div>
          <div className="bg-white border border-[#F0E6D2] p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full" />
            <p className="text-xs font-bold text-[#A09088] uppercase tracking-wide">Lucro Líquido</p>
            <p className="text-2xl font-black text-emerald-600 mt-2">{formatCurrency(totalProfit)}</p>
          </div>
          <div className="bg-[#2D221F] p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <p className="text-xs font-bold text-white/70 uppercase tracking-wide">Margem de Lucro</p>
            <p className="text-2xl font-black text-white mt-2">{margin.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="mt-4 flex justify-end">
          <button className="flex items-center gap-2 bg-[#FAF9F6] border border-[#F0E6D2] px-6 py-3 rounded-xl font-bold text-sm text-[#5F524C] hover:bg-[#F0E6D2] transition-colors">
            <Save size={16} /> Salvar Cenário
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. PRICE SIMULATOR
// ==========================================
const PriceSimulator = ({ products, insumos }: { products: Product[], insumos: Insumo[] }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [newPrice, setNewPrice] = useState<number>(0);
  const [monthlyVolume, setMonthlyVolume] = useState<number>(50);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Initialize newPrice when a product is selected
  React.useEffect(() => {
    if (selectedProduct) {
      setNewPrice(selectedProduct.retail_price);
    }
  }, [selectedProduct]);

  const unitCost = useMemo(() => {
    if (!selectedProduct || !selectedProduct.insumos) return 0;
    return selectedProduct.insumos.reduce((acc, usage) => {
      const insumo = insumos.find(i => i.id === usage.insumoId);
      if (insumo) {
        return acc + (usage.quantity * (insumo.costPrice / (insumo.quantity || 1)));
      }
      return acc;
    }, 0);
  }, [selectedProduct, insumos]);

  if (!selectedProduct) {
    return (
      <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#F0E6D2]">
        <label className="block text-xs font-bold text-[#5F524C] mb-2">Selecione o Produto</label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full max-w-md bg-white border border-[#F0E6D2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D88D85] text-[#2D221F]"
        >
          <option value="">Selecione um produto...</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.product_name} - {formatCurrency(p.retail_price)}</option>
          ))}
        </select>
      </div>
    );
  }

  const currentProfit = selectedProduct.retail_price - unitCost;
  const newProfit = newPrice - unitCost;
  const currentMargin = (currentProfit / selectedProduct.retail_price) * 100;
  const newMargin = newPrice > 0 ? (newProfit / newPrice) * 100 : 0;
  
  const currentTotalMonthly = currentProfit * monthlyVolume;
  const newTotalMonthly = newProfit * monthlyVolume;
  const differenceMonthly = newTotalMonthly - currentTotalMonthly;

  return (
    <div className="flex flex-col gap-8">
      {/* Parameters */}
      <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#F0E6D2]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
             <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="bg-white border flex-1 border-[#F0E6D2] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#D88D85] font-bold text-[#2D221F]"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.product_name}</option>
              ))}
            </select>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-[#A09088] uppercase tracking-widest">Custo por Unidade</p>
            <p className="text-xl font-black text-red-500">{formatCurrency(unitCost)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <label className="block text-xs font-bold text-[#5F524C] mb-2">Simular Novo Preço de Venda</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-[#A09088] font-medium">R$</span>
              </div>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="w-full bg-white border border-[#F0E6D2] rounded-xl pl-12 pr-4 py-3 text-2xl font-black focus:outline-none focus:border-[#D88D85] text-emerald-600"
              />
            </div>
            <p className="text-xs text-[#A09088] mt-2">Atual: {formatCurrency(selectedProduct.retail_price)}</p>
          </div>
          <div>
             <label className="block text-xs font-bold text-[#5F524C] mb-2">Projeção Volume de Vendas/Mês</label>
             <input
              type="number"
              value={monthlyVolume}
              onChange={(e) => setMonthlyVolume(Number(e.target.value))}
              className="w-full bg-white border border-[#F0E6D2] rounded-xl px-4 py-3 text-xl font-bold focus:outline-none focus:border-[#D88D85] text-[#2D221F]"
            />
          </div>
        </div>
      </div>

      {/* Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border border-[#F0E6D2] rounded-2xl overflow-hidden shadow-sm bg-white">
          <div className="bg-[#FAF9F6] p-4 border-b border-[#F0E6D2] text-center">
            <h4 className="font-bold text-[#5F524C] uppercase text-xs tracking-wider">Cenário Atual</h4>
          </div>
          <div className="p-6 flex flex-col gap-4">
             <div className="flex justify-between items-center">
               <span className="text-sm text-[#A09088]">Margem Unitária</span>
               <span className="font-bold text-[#2D221F]">{currentMargin.toFixed(1)}%</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm text-[#A09088]">Lucro Unitário</span>
               <span className="font-bold text-emerald-600">{formatCurrency(currentProfit)}</span>
             </div>
             <div className="h-px bg-[#F0E6D2]" />
             <div className="flex justify-between items-center">
               <span className="text-sm text-[#A09088]">L. Mensal ({monthlyVolume} un)</span>
               <span className="font-black text-xl text-[#2D221F]">{formatCurrency(currentTotalMonthly)}</span>
             </div>
          </div>
        </div>

        <div className="border-2 border-[#D88D85]/20 rounded-2xl overflow-hidden shadow-sm bg-white relative">
          <div className="absolute top-0 right-0 bg-[#D88D85] text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-widest z-10">
            Simulação
          </div>
          <div className="bg-orange-50/50 p-4 border-b border-[#D88D85]/20 text-center">
            <h4 className="font-bold text-[#D88D85] uppercase text-xs tracking-wider">Cenário Projetado</h4>
          </div>
          <div className="p-6 flex flex-col gap-4">
             <div className="flex justify-between items-center">
               <span className="text-sm text-[#A09088]">Nova Margem</span>
               <span className={`font-bold ${newMargin > currentMargin ? 'text-emerald-500' : 'text-red-500'}`}>{newMargin.toFixed(1)}%</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm text-[#A09088]">Novo Lucro Unit.</span>
               <span className="font-bold text-emerald-600">{formatCurrency(newProfit)}</span>
             </div>
             <div className="h-px bg-[#D88D85]/10" />
             <div className="flex justify-between items-center">
               <span className="text-sm text-[#A09088]">Novo L. Mensal</span>
               <span className="font-black text-xl text-[#2D221F]">{formatCurrency(newTotalMonthly)}</span>
             </div>
          </div>
        </div>
      </div>

      <div className={`p-4 rounded-xl border flex items-center justify-between
          ${differenceMonthly >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}
        `}>
          <div className="flex items-center gap-3">
             {differenceMonthly >= 0 ? <TrendingUp size={24} /> : <AlertTriangle size={24} />}
             <div>
               <p className="font-bold">Impacto Financeiro Mensal</p>
               <p className="text-sm opacity-80">
                  {differenceMonthly >= 0 ? 'Sua empresa poderá gerar uma receita extra com este volume.' : 'Sua empresa terá redução de lucros com este volume.'}
               </p>
             </div>
          </div>
          <p className="font-black text-2xl">
            {differenceMonthly > 0 && '+'}
            {formatCurrency(differenceMonthly)}
          </p>
      </div>

    </div>
  );
};


// ==========================================
// 3. PRODUCTION SIMULATOR
// ==========================================
const ProductionSimulator = ({ products, insumos }: { products: Product[], insumos: Insumo[] }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productionTarget, setProductionTarget] = useState<number>(50);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  if (!selectedProduct) {
    return (
      <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#F0E6D2]">
        <label className="block text-xs font-bold text-[#5F524C] mb-2">Selecione o Produto para Produzir</label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full max-w-md bg-white border border-[#F0E6D2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D88D85] text-[#2D221F]"
        >
          <option value="">Selecione um produto...</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.product_name}</option>
          ))}
        </select>
      </div>
    );
  }

  // Calculate needed materials
  const productionNeeds = (selectedProduct.insumos || []).map(usage => {
    const rawInsumo = insumos.find(i => i.id === usage.insumoId);
    if (!rawInsumo) return null;
    const requiredTotal = usage.quantity * productionTarget;
    const currentStock = rawInsumo.quantity;
    const deficit = Math.max(0, requiredTotal - currentStock);
    const replacementCost = deficit * (rawInsumo.costPrice / (rawInsumo.quantity || 1));

    return {
      name: rawInsumo.name,
      required: requiredTotal,
      inStock: currentStock,
      unit: rawInsumo.unit,
      deficit,
      replacementCost
    };
  }).filter(Boolean) as any[];

  const totalCapitalNeeded = productionNeeds.reduce((acc, curr) => acc + curr.replacementCost, 0);

  return (
    <div className="flex flex-col gap-6">
       <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#F0E6D2]">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div>
                  <label className="block text-xs font-bold text-[#5F524C] mb-2">Produto Alvo</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-white border border-[#F0E6D2] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#D88D85] text-[#2D221F]"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.product_name}</option>
                    ))}
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-bold text-[#5F524C] mb-2">Volume de Produção Desejado</label>
                  <input
                    type="number"
                    value={productionTarget}
                    onChange={(e) => setProductionTarget(Number(e.target.value))}
                    className="w-full bg-white border border-[#F0E6D2] rounded-xl px-4 py-3 text-xl font-black focus:outline-none focus:border-[#D88D85] text-[#2D221F]"
                  />
              </div>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div className="bg-white border border-[#F0E6D2] p-6 rounded-2xl shadow-sm text-center">
            <p className="text-[10px] font-bold text-[#A09088] uppercase tracking-widest mb-2">Meta Produção</p>
            <p className="text-3xl font-black text-[#2D221F]">{productionTarget} un</p>
          </div>
          <div className="bg-white border border-[#F0E6D2] p-6 rounded-2xl shadow-sm md:col-span-2 flex items-center justify-between">
             <div>
                <p className="text-[10px] font-bold text-[#A09088] uppercase tracking-widest mb-1">Impacto de Capital (Reposição Estoque)</p>
                <p className="text-xs text-[#A09088] mb-2">Custo para cobrir insumos faltantes</p>
             </div>
             <p className={`text-3xl font-black ${totalCapitalNeeded > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
               {totalCapitalNeeded > 0 ? '-' : ''}{formatCurrency(totalCapitalNeeded)}
             </p>
          </div>
       </div>

       <div className="bg-white border border-[#F0E6D2] rounded-2xl overflow-hidden shadow-sm">
         <div className="p-4 bg-[#FAF9F6] border-b border-[#F0E6D2]">
           <h4 className="font-bold text-[#5F524C] text-sm">Necessidade de Insumos</h4>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-[#A09088] uppercase tracking-wider border-b border-[#F0E6D2]">
                  <th className="px-6 py-4">Insumo</th>
                  <th className="px-6 py-4">Requerido</th>
                  <th className="px-6 py-4">Em Estoque</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Reposição</th>
                </tr>
              </thead>
              <tbody>
                {productionNeeds.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-[#A09088]">Este produto não possui ficha técnica cadastrada.</td></tr>
                ) : productionNeeds.map((item, idx) => (
                  <tr key={idx} className="border-b border-[#F0E6D2] last:border-0 hover:bg-[#FAF9F6]/50">
                    <td className="px-6 py-4 font-bold text-[#2D221F] text-sm">{item.name}</td>
                    <td className="px-6 py-4 text-sm font-mono text-[#5F524C]">{item.required.toFixed(1)} {item.unit}</td>
                    <td className="px-6 py-4 text-sm font-mono text-[#5F524C]">{item.inStock.toFixed(1)} {item.unit}</td>
                    <td className="px-6 py-4">
                       {item.deficit > 0 ? (
                         <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded-md text-[10px] font-black uppercase">
                            <AlertCircle size={10} /> Faltam {item.deficit.toFixed(1)}
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-black uppercase">
                           <CheckCircle2 size={10} /> Suficiente
                         </span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-[#2D221F]">
                      {item.deficit > 0 ? formatCurrency(item.replacementCost) : '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
       </div>

    </div>
  );
};


// ==========================================
// 4. COST SIMULATOR
// ==========================================
const CostSimulator = ({ products, insumos }: { products: Product[], insumos: Insumo[] }) => {
  const [selectedInsumoId, setSelectedInsumoId] = useState<string>('');
  const [percentIncrease, setPercentIncrease] = useState<number>(0);

  const selectedInsumo = insumos.find(i => i.id === selectedInsumoId);

  // Find products that use this insumo and calculate impact
  const impactedProducts = useMemo(() => {
    if (!selectedInsumo) return [];
    
    const results = [];
    for (const p of products) {
      if (!p.insumos) continue;
      
      const usage = p.insumos.find(u => u.insumoId === selectedInsumo.id);
      if (usage) {
        // current total cost of this product
        const oldTotalCost = p.insumos.reduce((acc, u) => {
          const i = insumos.find(x => x.id === u.insumoId);
          if (i) return acc + (u.quantity * (i.costPrice / (i.quantity || 1)));
          return acc;
        }, 0);

        const currentInsumoUnitCost = selectedInsumo.costPrice / (selectedInsumo.quantity || 1);
        const newInsumoUnitCost = currentInsumoUnitCost * (1 + (percentIncrease / 100));
        
        // Cost of just this insumo component before and after
        const oldComponentCost = usage.quantity * currentInsumoUnitCost;
        const newComponentCost = usage.quantity * newInsumoUnitCost;
        
        const newTotalCost = oldTotalCost - oldComponentCost + newComponentCost;

        const oldProfit = p.retail_price - oldTotalCost;
        const newProfit = p.retail_price - newTotalCost;
        
        // Minimum new price to keep same profit margin %
        const oldMarginPercent = oldProfit / p.retail_price;
        // newProfit / newPrice = oldMarginPercent => (newPrice - newTotalCost) / newPrice = oldMarginPercent => 1 - newTotalCost/newPrice = margin => newPrice = newTotalCost / (1 - margin)
        let recommendedPrice = p.retail_price;
        if (oldMarginPercent < 1) {
           recommendedPrice = newTotalCost / (1 - oldMarginPercent);
        }

        results.push({
          productName: p.product_name,
          oldCost: oldTotalCost,
          newCost: newTotalCost,
          oldProfit,
          newProfit,
          recommendedPrice,
          currentPrice: p.retail_price
        });
      }
    }
    return results;
  }, [selectedInsumo, products, insumos, percentIncrease]);

  return (
    <div className="flex flex-col gap-6">
       {/* Parameters */}
      <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#F0E6D2]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <label className="block text-xs font-bold text-[#5F524C] mb-2">Simular Acréscimo em Insumo</label>
            <select
              value={selectedInsumoId}
              onChange={(e) => setSelectedInsumoId(e.target.value)}
              className="w-full bg-white border border-[#F0E6D2] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#D88D85] text-[#2D221F]"
            >
              <option value="">Selecione um insumo...</option>
              {insumos.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div>
             <label className="block text-xs font-bold text-[#5F524C] mb-2">Variação de Preço (%)</label>
             <div className="flex items-center gap-4">
               <input
                type="range"
                min="-50"
                max="100"
                value={percentIncrease}
                onChange={(e) => setPercentIncrease(Number(e.target.value))}
                className="flex-1 accent-[#D88D85]"
              />
              <div className="bg-white border text-center border-[#F0E6D2] rounded-xl px-4 py-2 w-24 text-lg font-black text-[#2D221F]">
                {percentIncrease > 0 ? '+' : ''}{percentIncrease}%
              </div>
             </div>
          </div>
        </div>
      </div>

       {/* Results */}
       {!selectedInsumo ? (
          <div className="text-center p-8 border-2 border-dashed border-[#F0E6D2] rounded-2xl">
            <p className="text-[#A09088] text-sm font-bold uppercase tracking-widest">Selecione um insumo para ver o impacto nos produtos.</p>
          </div>
       ) : impactedProducts.length === 0 ? (
          <div className="text-center p-8 border border-[#F0E6D2] rounded-2xl bg-white shadow-sm">
            <p className="text-[#5F524C] font-bold">Nenhum produto utiliza este insumo.</p>
          </div>
       ) : (
         <div className="bg-white border border-[#F0E6D2] rounded-2xl overflow-hidden shadow-sm">
           <div className="p-4 bg-[#FAF9F6] border-b border-[#F0E6D2] flex justify-between items-center">
             <h4 className="font-bold text-[#5F524C] text-sm">Produtos Impactados ({impactedProducts.length})</h4>
             <span className="text-xs bg-[#D88D85] text-white px-2 py-1 rounded-md font-bold uppercase tracking-wider">Aumento de {percentIncrease}% no insumo</span>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="text-[10px] text-[#A09088] uppercase tracking-wider border-b border-[#F0E6D2] bg-gray-50/50">
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4 border-l border-gray-200">Custo Atual</th>
                    <th className="px-6 py-4">Custo Simulado</th>
                    <th className="px-6 py-4 border-l border-gray-200">Lucro Atual</th>
                    <th className="px-6 py-4">Lucro Simulado</th>
                    <th className="px-6 py-4 bg-orange-50/50 border-l border-[#D88D85]/20 text-center">Preço Recomendado (P/ Manter Margem)</th>
                 </tr>
               </thead>
               <tbody>
                 {impactedProducts.map((p, idx) => (
                   <tr key={idx} className="border-b border-[#F0E6D2] last:border-0 hover:bg-[#FAF9F6]/50">
                     <td className="px-6 py-4 font-bold text-[#2D221F] text-sm">{p.productName}</td>
                     <td className="px-6 py-4 border-l border-gray-100 text-sm">{formatCurrency(p.oldCost)}</td>
                     <td className="px-6 py-4 text-sm font-bold text-red-500">{formatCurrency(p.newCost)}</td>
                     <td className="px-6 py-4 border-l border-gray-100 text-sm">{formatCurrency(p.oldProfit)}</td>
                     <td className="px-6 py-4 text-sm font-bold text-amber-600">{formatCurrency(p.newProfit)}</td>
                     <td className="px-6 py-4 bg-orange-50/50 border-l border-[#D88D85]/20 text-center">
                        <div className="flex flex-col items-center">
                           <span className="text-[10px] text-[#A09088] line-through mb-1">{formatCurrency(p.currentPrice)}</span>
                           <span className="text-sm font-black text-[#D88D85] bg-white px-3 py-1 rounded-full shadow-sm border border-[#D88D85]/30">
                             {formatCurrency(p.recommendedPrice)}
                           </span>
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       )}

    </div>
  );
};
