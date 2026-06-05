import React, { useState } from "react";
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Database, 
  Share2, 
  TrendingUp, 
  ArrowUpRight 
} from "lucide-react";
import { motion } from "motion/react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export const ExportacoesTab: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const simulateExport = (type: string, filename: string, contentArray: any[]) => {
    setExportingType(type);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Initiate browser file download (CSV structure)
            const headers = Object.keys(contentArray[0] || {}).join(",");
            const rows = contentArray.map(obj => 
              Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
            );
            const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setExportingType(null);
            setSuccessMsg(`${filename} baixado com sucesso!`);
            setTimeout(() => setSuccessMsg(null), 3500);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  const handleExportOrders = async () => {
    try {
      setExportingType("orders");
      const snap = await getDocs(collection(db, "sales"));
      const ordersList: any[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        ordersList.push({
          "Código": d.code || doc.id,
          "Cliente": d.customerName || "Vazio",
          "Status": d.status || "Pendente",
          "Total": d.total || 0,
          "Data Entrega": d.deliveryDate || "",
          "Criado Em": d.createdAt?.seconds ? new Date(d.createdAt.seconds * 1000).toLocaleDateString() : ""
        });
      });

      if (ordersList.length === 0) {
        ordersList.push({ "Status": "Nenhum pedido encontrado no servidor" });
      }

      simulateExport("orders", "relatorio_pedidos_ateliere_pallyra.csv", ordersList);
    } catch (e) {
      console.error(e);
      setExportingType(null);
    }
  };

  const handleExportProducts = async () => {
    try {
      setExportingType("products");
      const snap = await getDocs(collection(db, "products"));
      const productsList: any[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        productsList.push({
          "Código": d.code || doc.id,
          "Nome": d.product_name,
          "Preço Varejo": d.retail_price || 0,
          "Preço Atacado": d.wholesale_price || 0,
          "Estoque": d.stock || 0,
          "Ativo no Catálogo": d.isVisible ? "Sim" : "Não"
        });
      });

      if (productsList.length === 0) {
        productsList.push({ "Status": "Nenhum produto cadastrado no servidor" });
      }

      simulateExport("products", "relatorio_produtos_ateliere.csv", productsList);
    } catch (e) {
      console.error(e);
      setExportingType(null);
    }
  };

  const handleExportInsumos = async () => {
    try {
      setExportingType("insumos");
      const snap = await getDocs(collection(db, "insumos"));
      const insumosList: any[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        insumosList.push({
          "Código": d.code || doc.id,
          "Insumo": d.name,
          "Estoque Atual": d.quantity || 0,
          "Preço Custo": d.costPrice || 0,
          "Valor Unitário": d.unitValue || 0,
          "Unidade": d.unit || "unid"
        });
      });

      if (insumosList.length === 0) {
        insumosList.push({ "Status": "Nenhum insumo cadastrado no servidor" });
      }

      simulateExport("insumos", "relatorio_estoque_insumos.csv", insumosList);
    } catch (e) {
      console.error(e);
      setExportingType(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 lg:p-10 rounded-[2rem] border border-[#F0E6D2] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#F5E6CA]/10 to-transparent rounded-full pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 bg-[#FAF6F0] border border-[#E9DFCB] px-3 py-1 rounded-full text-[8px] font-black uppercase text-[#B49E7C] tracking-widest">
            <Database size={10} /> Exportador de Bancos
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight text-[#2D221F]">
            Central de Exportações <span className="text-[#C5A880] font-sans font-light">HD</span>
          </h1>
          <p className="text-xs text-[#A09088] font-sans max-w-xl">
            Extraia planilhas em alta definição das suas bases de dados de produtos, estoque ou relatórios financeiros com integridade garantida de dados.
          </p>
        </div>
      </div>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-xs"
        >
          <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-50 shrink-0" />
          <span className="font-semibold uppercase tracking-wider text-[10px]">{successMsg}</span>
        </motion.div>
      )}

      {/* Main Exports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Export Card 1: Orders */}
        <div className="bg-white border border-[#F0E6D2] p-6 lg:p-8 rounded-[2rem] shadow-sm flex flex-col justify-between h-80 relative group hover:shadow-lg transition-all">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#D88D85]">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#2D221F]">Relatório de Pedidos</h3>
              <p className="text-[10px] text-[#A09088] mt-1 line-clamp-3">
                Planilha completa contendo canais de vendas, nomes de clientes, telefones, status, formas de pagamentos e totais acumulados.
              </p>
            </div>
          </div>

          <div>
            {exportingType === "orders" ? (
              <div className="space-y-2">
                <div className="w-full bg-[#FAF9F6] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#C5A880] h-full transition-all duration-100" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-[8px] text-[#C5A880] font-black uppercase tracking-wider">Compilando {progress}%...</div>
              </div>
            ) : (
              <button
                onClick={handleExportOrders}
                className="w-full py-3 bg-[#2D221F] hover:bg-black text-[9px] text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={12} /> Descarregar .CSV
              </button>
            )}
          </div>
        </div>

        {/* Export Card 2: Products Catalogue */}
        <div className="bg-white border border-[#F0E6D2] p-6 lg:p-8 rounded-[2rem] shadow-sm flex flex-col justify-between h-80 relative group hover:shadow-lg transition-all">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF6F0] border border-[#E9DFCB] flex items-center justify-center text-[#C5A880]">
              <Database size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#2D221F]">Catálogo de Produtos</h3>
              <p className="text-[10px] text-[#A09088] mt-1 line-clamp-3">
                Relação geral de produtos do ateliê com os respectivos preços de varejo e atacado, códigos de referência do ERP e status na vitrine.
              </p>
            </div>
          </div>

          <div>
            {exportingType === "products" ? (
              <div className="space-y-2">
                <div className="w-full bg-[#FAF9F6] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#C5A880] h-full transition-all duration-100" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-[8px] text-[#C5A880] font-black uppercase tracking-wider">Compilando {progress}%...</div>
              </div>
            ) : (
              <button
                onClick={handleExportProducts}
                className="w-full py-3 bg-[#2D221F] hover:bg-black text-[9px] text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={12} /> Descarregar .CSV
              </button>
            )}
          </div>
        </div>

        {/* Export Card 3: Inventory */}
        <div className="bg-white border border-[#F0E6D2] p-6 lg:p-8 rounded-[2rem] shadow-sm flex flex-col justify-between h-80 relative group hover:shadow-lg transition-all">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#2D221F]">Controle de Insumos</h3>
              <p className="text-[10px] text-[#A09088] mt-1 line-clamp-3">
                Inventário analítico de insumos, matérias-primas e fitas de cetim do ateliê com preços de custo, limites críticos e saldos atuais.
              </p>
            </div>
          </div>

          <div>
            {exportingType === "insumos" ? (
              <div className="space-y-2">
                <div className="w-full bg-[#FAF9F6] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#C5A880] h-full transition-all duration-100" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-[8px] text-[#C5A880] font-black uppercase tracking-wider">Compilando {progress}%...</div>
              </div>
            ) : (
              <button
                onClick={handleExportInsumos}
                className="w-full py-3 bg-[#2D221F] hover:bg-black text-[9px] text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={12} /> Descarregar .CSV
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Bonus Stats Panel */}
      <div className="bg-[#FAF9F6] border border-[#F0E6D2] p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white border border-[#F0E6D2] rounded-2xl flex items-center justify-center shadow-sm">
            <TrendingUp className="text-[#C5A880]" size={26} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase text-[#2D221F] tracking-wide">Relatórios em Nuvem Criptografados</h4>
            <p className="text-[10px] text-[#A09088] mt-1 font-sans">
              Estes geradores de banco de dados compilam diretamente das coleções autenticadas no Firebase Firestore de forma imediata.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black text-[#C5A880] uppercase tracking-wider bg-white border border-[#F0E6D2] px-4 py-2 rounded-xl">
          Visualizar Analytics <ArrowUpRight size={12} />
        </div>
      </div>

    </div>
  );
};
