const fs = require('fs');

const content = fs.readFileSync('src/components/Admin/ProductsTab.tsx', 'utf8');
const lines = content.split('\n');

// 1. Add missing lucide icons to import
const importIdx = lines.findIndex(l => l.includes('import {'));
const endImportIdx = lines.findIndex((l, i) => i > importIdx && l.includes('} from "lucide-react"'));
if (endImportIdx !== -1) {
    const importLines = lines.slice(importIdx, endImportIdx + 1).join('\n');
    const newImports = ["LayoutGrid", "List as ListIcon", "Archive", "Tag", "Filter", "ChevronDown", "ChevronUp", "AlertTriangle", "Copy"];
    let injected = importLines.replace('} from "lucide-react";', '');
    newImports.forEach(i => {
        if (!injected.includes(i)) injected += `, ${i}`;
    });
    injected += '\n} from "lucide-react";';
    lines.splice(importIdx, endImportIdx - importIdx + 1, injected);
}

// 2. Replace ProductsTab
const startIdx = lines.findIndex(l => l.includes('export const ProductsTab: React.FC<ProductsTabProps> ='));
const endIdx = lines.findIndex(l => l.includes('interface ProductFormModalProps {'));

const newComponent = `
export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  insumos,
  companyId,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterCollection, setFilterCollection] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all"); 
  const [filterFeatured, setFilterFeatured] = useState<string>("all");
  const [filterExclusive, setFilterExclusive] = useState<string>("all");
  
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const saved = localStorage.getItem("productsViewMode");
    if (saved === "grid" || saved === "list") setViewMode(saved);
  }, []);

  const handleViewMode = (mode: "grid"|"list") => {
    setViewMode(mode);
    localStorage.setItem("productsViewMode", mode);
  };

  const categories = React.useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))), [products]);
  const collections = React.useMemo(() => Array.from(new Set(products.map(p => p.subcategory).filter(Boolean))), [products]);

  const filteredProducts = React.useMemo(() => {
    let result = products.filter((p) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = !s || 
        (p.product_name || "").toLowerCase().includes(s) ||
        (p.code || "").toLowerCase().includes(s) ||
        (p.category || "").toLowerCase().includes(s) ||
        (p.subcategory || "").toLowerCase().includes(s);
      
      const matchesCategory = filterCategory === "all" || p.category === filterCategory;
      const matchesCollection = filterCollection === "all" || p.subcategory === filterCollection;
      const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? p.isVisible !== false : p.isVisible === false);
      const matchesFeatured = filterFeatured === "all" || (filterFeatured === "yes" ? p.isFeatured : !p.isFeatured);
      const matchesExclusive = filterExclusive === "all" || (filterExclusive === "yes" ? (p as any).isExclusive : !(p as any).isExclusive);
      
      return matchesSearch && matchesCategory && matchesCollection && matchesStatus && matchesFeatured && matchesExclusive;
    });

    result.sort((a, b) => {
      switch(sortBy) {
        case "name_asc": return (a.product_name||"").localeCompare(b.product_name||"");
        case "name_desc": return (b.product_name||"").localeCompare(a.product_name||"");
        case "price_asc": return (a.retail_price||0) - (b.retail_price||0);
        case "price_desc": return (b.retail_price||0) - (a.retail_price||0);
        case "stock_asc": return (a.stock||0) - (b.stock||0);
        case "stock_desc": return (b.stock||0) - (a.stock||0);
        case "best_sellers": return ((b as any).soldCount||0) - ((a as any).soldCount||0);
        case "date_asc": {
          const tA = (a as any).createdAt?.toMillis?.() || new Date((a as any).createdAt).getTime() || 0;
          const tB = (b as any).createdAt?.toMillis?.() || new Date((b as any).createdAt).getTime() || 0;
          return tA - tB;
        }
        case "newest":
        default: {
          const tA = (a as any).createdAt?.toMillis?.() || new Date((a as any).createdAt).getTime() || 0;
          const tB = (b as any).createdAt?.toMillis?.() || new Date((b as any).createdAt).getTime() || 0;
          return tB - tA;
        }
      }
    });

    return result;
  }, [products, searchTerm, filterCategory, filterCollection, filterStatus, filterFeatured, filterExclusive, sortBy]);

  const confirmDelete = async () => {
    if (productToDelete) {
      await onDeleteProduct(productToDelete);
      setProductToDelete(null);
    }
  };

  const isNewProduct = (p: any) => {
      if (!p.createdAt) return false;
      const t = p.createdAt.toMillis?.() || new Date(p.createdAt).getTime();
      return (Date.now() - t) < 7 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[1.5rem] border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">Produtos</h1>
          <p className="text-sm font-medium text-[#8E8E93] mt-1">{filteredProducts.length} itens no catálogo</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64 xl:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] w-4 h-4" />
            <input
              type="text"
              placeholder="Nome, SKU, Categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:border-[#E5E5EA] focus:bg-white transition-all text-[#1C1C1E]"
            />
          </div>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1C1C1E] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#2C2C2E] transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus size={16} /> Novo Produto
          </button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="bg-white p-5 rounded-[1.5rem] border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="flex items-center gap-2 bg-[#F5F5F7] px-3 py-1.5 rounded-lg border border-[#E5E5EA]">
            <Filter size={14} className="text-[#8E8E93]" />
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Filtros</span>
          </div>

          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2 text-[11px] font-medium text-[#1C1C1E] outline-none hover:border-[#D1D1D6] transition-all cursor-pointer">
             <option value="all">Todas as Categorias</option>
             {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filterCollection} onChange={e => setFilterCollection(e.target.value)} className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2 text-[11px] font-medium text-[#1C1C1E] outline-none hover:border-[#D1D1D6] transition-all cursor-pointer">
             <option value="all">Todas as Coleções</option>
             {collections.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2 text-[11px] font-medium text-[#1C1C1E] outline-none hover:border-[#D1D1D6] transition-all cursor-pointer">
             <option value="all">Qualquer Status</option>
             <option value="active">Ativos</option>
             <option value="inactive">Inativos</option>
          </select>

          <select value={filterFeatured} onChange={e => setFilterFeatured(e.target.value)} className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2 text-[11px] font-medium text-[#1C1C1E] outline-none hover:border-[#D1D1D6] transition-all cursor-pointer">
             <option value="all">Destaque: Todos</option>
             <option value="yes">Sim</option>
             <option value="no">Não</option>
          </select>

          <select value={filterExclusive} onChange={e => setFilterExclusive(e.target.value)} className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2 text-[11px] font-medium text-[#1C1C1E] outline-none hover:border-[#D1D1D6] transition-all cursor-pointer">
             <option value="all">Exclusivo: Todos</option>
             <option value="yes">Sim</option>
             <option value="no">Não</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-white border border-[#E5E5EA] rounded-xl px-4 py-2 text-[11px] font-bold text-[#1C1C1E] outline-none hover:border-[#D1D1D6] transition-all cursor-pointer">
             <option value="newest">Mais recentes</option>
             <option value="best_sellers">Mais vendidos</option>
             <option value="name_asc">Nome (A-Z)</option>
             <option value="name_desc">Nome (Z-A)</option>
             <option value="price_asc">Menor Preço</option>
             <option value="price_desc">Maior Preço</option>
             <option value="stock_asc">Menor Estoque</option>
             <option value="stock_desc">Maior Estoque</option>
          </select>
          
          <div className="flex bg-[#F5F5F7] p-1 rounded-xl border border-[#E5E5EA]">
            <button onClick={() => handleViewMode('grid')} className={\`p-1.5 rounded-lg transition-all \${viewMode === 'grid' ? 'bg-white shadow-sm text-[#1C1C1E]' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}\`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => handleViewMode('list')} className={\`p-1.5 rounded-lg transition-all \${viewMode === 'list' ? 'bg-white shadow-sm text-[#1C1C1E]' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}\`}>
              <ListIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCTS DISPLAY */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[1.5rem] border border-[#E5E5EA] shadow-sm">
          <div className="w-16 h-16 bg-[#F5F5F7] rounded-full flex items-center justify-center text-[#8E8E93] mb-4">
             <Box size={32} />
          </div>
          <p className="text-[#1C1C1E] font-semibold text-lg">Nenhum produto encontrado</p>
          <p className="text-[#8E8E93] text-sm mt-1">Tente ajustar seus filtros ou termos de pesquisa.</p>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filteredProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-[1.25rem] border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden hover:shadow-lg transition-all group flex flex-col relative h-[360px]">
                {/* Indicators Layer */}
                <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 pointer-events-none">
                  {isNewProduct(p) && <span className="bg-blue-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Novo</span>}
                  {p.isFeatured && <span className="bg-amber-400 text-amber-900 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Destaque</span>}
                  {(p as any).isExclusive && <span className="bg-purple-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Exclusivo</span>}
                  {p.stock !== undefined && p.stock <= 5 && <span className="bg-rose-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Estoque Baixo</span>}
                  {p.isVisible === false && <span className="bg-[#1C1C1E] text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Inativo</span>}
                </div>

                <div className="relative w-full h-44 bg-[#F5F5F7] shrink-0 border-b border-[#E5E5EA]">
                  {p.image ? (
                    <img src={p.image} alt={p.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#D1D1D6]">
                      <Camera size={32} />
                      <span className="text-[9px] font-semibold uppercase tracking-wider mt-2">Sem Imagem</span>
                    </div>
                  )}
                  {/* Quick Actions overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                     <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="w-10 h-10 bg-white text-[#1C1C1E] rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md" title="Editar">
                       <Edit size={16} />
                     </button>
                     <button onClick={() => setViewingProduct(p)} className="w-10 h-10 bg-white text-[#1C1C1E] rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md" title="Visualizar">
                       <Eye size={16} />
                     </button>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="text-[8px] font-bold text-[#8E8E93] bg-[#F5F5F7] px-1.5 py-0.5 rounded uppercase tracking-widest truncate max-w-[80px]">{p.category || "Sem Cat."}</span>
                    <span className="text-[8px] font-bold text-[#8E8E93] bg-[#F5F5F7] px-1.5 py-0.5 rounded uppercase tracking-widest truncate max-w-[80px]">{p.subcategory || "Sem Col."}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#1C1C1E] leading-snug line-clamp-2" title={p.product_name}>{p.product_name}</h3>
                  <p className="text-[10px] font-mono text-[#8E8E93] mt-1">REF: {p.code}</p>
                  
                  <div className="mt-auto pt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-widest">Preço</p>
                      <p className="text-base font-bold text-[#1C1C1E] font-mono tracking-tight">{formatCurrency(p.retail_price || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-widest">Estoque</p>
                      <p className={\`text-sm font-bold font-mono \${(p.stock||0) <= 5 ? 'text-rose-500' : 'text-[#1C1C1E]'}\`}>{p.stock || 0} un</p>
                    </div>
                  </div>
                </div>

                {/* Footer Quick Actions */}
                <div className="px-3 py-2 bg-[#F5F5F7] border-t border-[#E5E5EA] flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex gap-1">
                      <button onClick={async () => {
                         const dup = {...p, id: undefined, product_name: p.product_name + " (Cópia)", code: p.code + "-COP"};
                         setEditingProduct(dup);
                         setIsModalOpen(true);
                      }} className="p-1.5 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#E5E5EA] rounded-md transition-colors" title="Duplicar"><Copy size={14} /></button>
                      <button onClick={() => onSaveProduct({...p, isVisible: !p.isVisible})} className="p-1.5 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#E5E5EA] rounded-md transition-colors" title={p.isVisible !== false ? "Arquivar" : "Desarquivar"}><Archive size={14} /></button>
                   </div>
                   <button onClick={() => setProductToDelete(p.id)} className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500 rounded-md transition-colors" title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[1.5rem] border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F5F7] border-b border-[#E5E5EA]">
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest w-16">Foto</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Produto</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Categoria / Coleção</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest text-right">Preço</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest text-center">Estoque</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest text-center">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F7]">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors group">
                    <td className="px-5 py-3">
                      <div className="w-12 h-12 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] overflow-hidden flex items-center justify-center shrink-0">
                        {p.image ? <img src={p.image} alt="Produto" className="w-full h-full object-cover" /> : <Camera size={16} className="text-[#D1D1D6]" />}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#1C1C1E]">{p.product_name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-[#8E8E93]">REF: {p.code}</span>
                          {p.isFeatured && <span className="text-[8px] font-bold bg-amber-100 text-amber-700 px-1 rounded uppercase">Destaque</span>}
                          {isNewProduct(p) && <span className="text-[8px] font-bold bg-blue-100 text-blue-700 px-1 rounded uppercase">Novo</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                       <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-[#1C1C1E]">{p.category || "-"}</span>
                          <span className="text-[10px] text-[#8E8E93]">{p.subcategory || "-"}</span>
                       </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                       <div className="flex flex-col items-end">
                         <span className="text-sm font-bold text-[#1C1C1E] font-mono">{formatCurrency(p.retail_price || 0)}</span>
                         <span className="text-[10px] text-[#8E8E93] font-mono">Custo: {formatCurrency((p as any).estimatedCost || 0)}</span>
                       </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                       <span className={\`text-xs font-bold font-mono px-2 py-1 rounded-lg border \${(p.stock||0) <= 5 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}\`}>
                         {p.stock || 0} un
                       </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                       <span className={\`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border \${p.isVisible !== false ? 'bg-white text-[#1C1C1E] border-[#1C1C1E]' : 'bg-[#F5F5F7] text-[#8E8E93] border-[#E5E5EA]'}\`}>
                         {p.isVisible !== false ? 'Ativo' : 'Inativo'}
                       </span>
                    </td>
                    <td className="px-5 py-3">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => setViewingProduct(p)} className="p-2 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-lg transition-colors" title="Visualizar"><Eye size={16} /></button>
                         <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-2 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-lg transition-colors" title="Editar"><Edit size={16} /></button>
                         <button onClick={async () => {
                             const dup = {...p, id: undefined, product_name: p.product_name + " (Cópia)", code: p.code + "-COP"};
                             setEditingProduct(dup);
                             setIsModalOpen(true);
                          }} className="p-2 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-lg transition-colors" title="Duplicar"><Copy size={16} /></button>
                         <button onClick={() => onSaveProduct({...p, isVisible: !p.isVisible})} className="p-2 text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-lg transition-colors" title={p.isVisible !== false ? "Arquivar" : "Desarquivar"}><Archive size={16} /></button>
                         <button onClick={() => setProductToDelete(p.id)} className="p-2 text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full p-8 text-center rounded-3xl border border-[#E5E5EA] shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-[#1C1C1E] mb-2 tracking-tight">Excluir Produto?</h3>
            <p className="text-sm text-[#8E8E93] mb-8 font-medium">Esta ação é permanente e removerá o item de todos os catálogos.</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full py-4 bg-rose-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-md active:scale-[0.98] transition-all">Sim, Excluir</button>
              <button onClick={() => setProductToDelete(null)} className="w-full py-4 bg-[#F5F5F7] text-[#1C1C1E] rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-[#E5E5EA] transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] border border-[#E5E5EA] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="px-8 py-6 border-b border-[#F5F5F7] flex justify-between items-center bg-[#FAFAFA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center">
                  <Box size={20} />
                </div>
                <h3 className="text-lg font-bold text-[#1C1C1E] tracking-tight">Detalhes do Produto</h3>
              </div>
              <button onClick={() => setViewingProduct(null)} className="p-2.5 rounded-full hover:bg-[#F5F5F7] text-[#8E8E93] hover:text-[#1C1C1E] transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 flex-1">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-72 aspect-square rounded-[1.5rem] overflow-hidden bg-[#F5F5F7] border border-[#E5E5EA] shrink-0">
                  {viewingProduct.image ? (
                    <img src={viewingProduct.image} alt={viewingProduct.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#D1D1D6]"><Camera size={48} /></div>
                  )}
                </div>
                
                <div className="flex-1 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                       <span className="px-2.5 py-1 bg-[#1C1C1E] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg">{viewingProduct.category || "Sem Categoria"}</span>
                       <span className="px-2.5 py-1 bg-[#F5F5F7] text-[#8E8E93] text-[10px] font-bold uppercase tracking-widest rounded-lg">{viewingProduct.subcategory || "Sem Coleção"}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-[#1C1C1E] tracking-tight leading-tight mb-2">{viewingProduct.product_name}</h2>
                    <p className="text-sm font-mono font-medium text-[#8E8E93]">SKU: {viewingProduct.code}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-[#F5F5F7] rounded-[1.25rem] border border-[#E5E5EA]">
                      <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-1">Preço Varejo</p>
                      <p className="text-2xl font-mono font-bold text-[#1C1C1E]">{formatCurrency(viewingProduct.retail_price || 0)}</p>
                    </div>
                    <div className="p-5 bg-[#F5F5F7] rounded-[1.25rem] border border-[#E5E5EA]">
                      <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-1">Preço Atacado</p>
                      <p className="text-2xl font-mono font-bold text-[#1C1C1E]">{formatCurrency(viewingProduct.wholesale_price || 0)}</p>
                    </div>
                  </div>

                  <div className="p-5 bg-emerald-50 rounded-[1.25rem] border border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Lucro Estimado</p>
                      <p className="text-xl font-mono font-bold text-emerald-700">
                        {formatCurrency((viewingProduct.retail_price || 0) - ((viewingProduct as any).estimatedCost || 0))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Margem</p>
                      <p className="text-xl font-bold text-emerald-700">
                        {viewingProduct.retail_price ? Math.round(((viewingProduct.retail_price - ((viewingProduct as any).estimatedCost || 0)) / viewingProduct.retail_price) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Estoque", value: \`\${viewingProduct.stock || 0} un\`, color: "bg-[#F5F5F7]" },
                  { label: "Vendidos", value: (viewingProduct as any).soldCount || 0, color: "bg-[#F5F5F7]" },
                  { label: "Destaque", value: viewingProduct.isFeatured ? "Sim" : "Não", color: "bg-[#F5F5F7]" },
                  { label: "Status", value: viewingProduct.isVisible !== false ? "Ativo" : "Inativo", color: "bg-[#F5F5F7]" }
                ].map((stat, i) => (
                  <div key={i} className={\`\${stat.color} p-4 rounded-2xl border border-[#E5E5EA]\`}>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-[#8E8E93] mb-1">{stat.label}</p>
                    <p className="text-lg font-bold text-[#1C1C1E] tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => {
                    setEditingProduct(viewingProduct);
                    setViewingProduct(null);
                    setIsModalOpen(true);
                  }}
                  className="flex-[2] py-4 bg-[#1C1C1E] text-white rounded-xl font-bold uppercase text-[11px] tracking-wider shadow-md hover:bg-[#2C2C2E] transition-all flex items-center justify-center gap-2"
                >
                  <Edit size={16} /> Editar Produto
                </button>
                <button 
                  onClick={() => setViewingProduct(null)}
                  className="flex-1 py-4 bg-[#F5F5F7] text-[#1C1C1E] border border-[#E5E5EA] rounded-xl font-bold uppercase text-[11px] tracking-wider hover:bg-[#E5E5EA] transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal (Integration) */}
      {isModalOpen && (
        <ProductFormModal
          editingProduct={editingProduct}
          existingProducts={products}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data) => {
            const prefix = "LP"; // Simplified prefix logic
            await onSaveProduct({
              ...data,
              code: editingProduct?.id
                ? editingProduct.code
                : \`\${prefix}-\${String(Math.floor(Math.random() * 9000) + 1000)}\`,
            });
            setIsModalOpen(false);
          }}
          companyId={companyId}
          atelieres={[{ id: "pallyra", name: "La Pallyra", prefix: "LP" }]}
          insumos={insumos}
        />
      )}
    </div>
  );
};
`;

const newLines = [...lines.slice(0, startIdx), newComponent, ...lines.slice(endIdx)];
fs.writeFileSync('src/components/Admin/ProductsTab.tsx', newLines.join('\n'), 'utf8');
console.log("Successfully replaced ProductsTab!");
