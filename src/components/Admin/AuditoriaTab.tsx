import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  TrendingUp, 
  Play, 
  Percent, 
  FileDown, 
  Plus, 
  Edit, 
  Trash2, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight,
  Package,
  Calendar,
  DollarSign,
  Briefcase,
  Search,
  Check,
  RefreshCw,
  Box,
  ClipboardList
} from 'lucide-react';
import { Product, Insumo, Order, CompanyId } from '../../types';
import { formatCurrency } from '../../lib/currencyUtils';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, serverTimestamp } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { safeFormat } from '../../lib/dateUtils';

interface AuditoriaTabProps {
  companyId: CompanyId;
  orders: Order[];
  products: Product[];
  insumos: Insumo[];
}

interface Supplier {
  id: string;
  name: string;
  type: string;
  contact: string;
  defaultDiscount: number;
  notes: string;
}

export const AuditoriaTab: React.FC<AuditoriaTabProps> = ({
  companyId: initialCompanyId,
  orders,
  products,
  insumos: rawInsumos
}) => {
  // Submenu states
  const [activeSubmenu, setActiveSubmenu] = useState<'dashboard' | 'materials' | 'suppliers' | 'formulas' | 'simulator' | 'viability' | 'reports'>('dashboard');
  
  // Filter states
  const [selectedAtelier, setSelectedAtelier] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Firebase states
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSuppliersLoading, setIsSuppliersLoading] = useState(false);
  
  // UI Selection states
  const [selectedProductIdForFormula, setSelectedProductIdForFormula] = useState<string>('');
  const [selectedProductIdForReport, setSelectedProductIdForReport] = useState<string>('');
  
  // Simulator states
  const [selectedSimProduct, setSelectedSimProduct] = useState<string>('');

  // Material form modal states
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Partial<Insumo> | null>(null);
  
  // Supplier form modal states
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

  // Operational settings for product technical sheets (stored locally/fallbacks or can edit in forms)
  const [operationalCosts, setOperationalCosts] = useState<Record<string, { labor: number; package: number; extraTax: number }>>({});

  // Brand names mapping
  const brandNames: Record<string, string> = {
    pallyra: "La Pallyra",
    guennita: "com amor, Guennita",
    mimada: "Mimada Sim",
    tuttymimo: "Tutty Mimo"
  };

  // Default fallback suppliers if Firestore is empty
  const defaultSuppliers: Supplier[] = [
    { id: 'sup1', name: 'Kalunga', type: 'Papelaria & Escritório', contact: 'sac@kalunga.com.br', defaultDiscount: 5, notes: 'Principal fornecedor de papel sulfite' },
    { id: 'sup2', name: 'Shopee Distribuidor', type: 'Embalagens & Fitas', contact: 'Via Chat App', defaultDiscount: 10, notes: 'Fitas acetinadas de baixo custo' },
    { id: 'sup3', name: 'Mercado Livre Prata', type: 'Espiral & Wire-o', contact: 'ML Chat', defaultDiscount: 0, notes: 'Entrega Full super rápida' },
    { id: 'sup4', name: 'Papelaria Local Central', type: 'Papel Fotográfico/Especiais', contact: '(11) 98888-7766', defaultDiscount: 8, notes: 'Urgências de impressão' }
  ];

  // Fetch suppliers from firestore
  const fetchSuppliers = async () => {
    setIsSuppliersLoading(true);
    try {
      const q = query(collection(db, 'suppliers'));
      const querySnapshot = await getDocs(q);
      const list: Supplier[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Supplier);
      });
      if (list.length === 0) {
        // Bootstrap defaults
        for (const s of defaultSuppliers) {
          const { id: _, ...data } = s;
          await addDoc(collection(db, 'suppliers'), data);
        }
        setSuppliers(defaultSuppliers);
      } else {
        setSuppliers(list);
      }
    } catch (e) {
      console.warn('Could not fetch suppliers from firestore, using static fallbacks:', e);
      setSuppliers(defaultSuppliers);
    } finally {
      setIsSuppliersLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Filter orders based on selected atelier & period
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Atelier filter
      if (selectedAtelier !== 'all' && o.companyId !== selectedAtelier) {
        return false;
      }
      
      // Cancelled checkout order check (ignore cancelled for general dashboard conversion)
      if (o.status === 'cancelled') return false;

      // Date parsing
      const orderDate = o.createdAt ? (o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt)) : new Date();
      const now = new Date();
      
      if (selectedPeriod === '7d') {
        const diff = now.getTime() - orderDate.getTime();
        return diff <= 7 * 24 * 60 * 60 * 1000;
      } else if (selectedPeriod === '30d') {
        const diff = now.getTime() - orderDate.getTime();
        return diff <= 30 * 24 * 60 * 60 * 1000;
      } else if (selectedPeriod === '90d') {
        const diff = now.getTime() - orderDate.getTime();
        return diff <= 90 * 24 * 60 * 60 * 1000;
      } else if (selectedPeriod === 'custom') {
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate + 'T00:00:00');
          const end = new Date(customEndDate + 'T23:59:59');
          return orderDate >= start && orderDate <= end;
        }
      }
      return true;
    });
  }, [orders, selectedAtelier, selectedPeriod, customStartDate, customEndDate]);

  // Derived dashboard analytics values
  const dashboardStats = useMemo(() => {
    // 1. Compute total invested in materials
    let totalInvestedInMaterials = 0;
    let totalCurrentStockValue = 0;
    
    rawInsumos.forEach(insumo => {
      // Valor Pago: CostPrice represents total cost or unit purchase cost
      totalInvestedInMaterials += (insumo.costPrice || 0) * (insumo.quantity || 1);
      totalCurrentStockValue += (insumo.unitValue || 0) * (insumo.quantity || 0);
    });

    // 2. Financial calculation for selected range
    let revenue = 0;
    let costOfGoodsSold = 0;
    
    filteredOrders.forEach(order => {
      revenue += (Number(order.total) || 0);
      
      // Calculate material cost of this order based on its product items
      order.items?.forEach(item => {
        // Find matching product
        const prd = products.find(p => p.id === item.productId || p.id === item.id);
        if (prd && prd.insumos) {
          prd.insumos.forEach(req => {
            const ins = rawInsumos.find(i => i.id === req.insumoId);
            if (ins) {
              costOfGoodsSold += (ins.unitValue || 0) * req.quantity * item.quantity;
            }
          });
        }
      });
    });

    // Net profit
    const fixedCostsEstimate = selectedAtelier === 'all' ? 450 : 150; // simple fallback
    const taxesEstimate = revenue * 0.06; // approximation
    const operationalCostsEstimate = costOfGoodsSold * 0.15; // approximation for labor
    
    const totalCosts = costOfGoodsSold + fixedCostsEstimate + taxesEstimate + operationalCostsEstimate;
    const netProfit = Math.max(0, revenue - totalCosts);

    // ROI computation
    const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

    // Best selling & most profitable product
    // Let's count
    const productSalesMap: Record<string, { qty: number; revenue: number; profit: number; name: string }> = {};
    const materialConsMap: Record<string, { qty: number; name: string; unit: string }> = {};

    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        const prdId = item.productId || item.id;
        const matchingProduct = products.find(p => p.id === prdId);
        const name = matchingProduct?.product_name || item.product_name;
        
        // Cost calculations
        let matCost = 0;
        if (matchingProduct?.insumos) {
          matchingProduct.insumos.forEach(req => {
            const ins = rawInsumos.find(i => i.id === req.insumoId);
            if (ins) {
              const reduction = req.quantity * item.quantity;
              matCost += (ins.unitValue || 0) * req.quantity;
              
              // track material consumption
              if (!materialConsMap[ins.id]) {
                materialConsMap[ins.id] = { qty: 0, name: ins.name, unit: ins.unit };
              }
              materialConsMap[ins.id].qty += reduction;
            }
          });
        }

        const price = item.retail_price || 0;
        const profitPerUnit = price - matCost;

        if (!productSalesMap[prdId]) {
          productSalesMap[prdId] = { qty: 0, revenue: 0, profit: 0, name };
        }
        productSalesMap[prdId].qty += item.quantity;
        productSalesMap[prdId].revenue += price * item.quantity;
        productSalesMap[prdId].profit += profitPerUnit * item.quantity;
      });
    });

    let topSellingName = "Nenhum no período";
    let topSellingQty = 0;
    let topProfitableName = "Nenhum no período";
    let topProfitableVal = 0;
    
    Object.values(productSalesMap).forEach(p => {
      if (p.qty > topSellingQty) {
        topSellingQty = p.qty;
        topSellingName = p.name;
      }
      if (p.profit > topProfitableVal) {
        topProfitableVal = p.profit;
        topProfitableName = p.name;
      }
    });

    // Most consumed material
    let topConsumedInsumoName = "Nenhum";
    let topConsumedQty = 0;
    let topConsumedUnit = "";
    Object.values(materialConsMap).forEach(m => {
      if (m.qty > topConsumedQty) {
        topConsumedQty = m.qty;
        topConsumedInsumoName = m.name;
        topConsumedUnit = m.unit;
      }
    });

    return {
      totalInvestedInMaterials,
      totalCurrentStockValue,
      revenue,
      costs: totalCosts,
      netProfit,
      roi,
      topSelling: topSellingQty > 0 ? `${topSellingName} (${topSellingQty} un)` : topSellingName,
      topProfitable: topProfitableVal > 0 ? `${topProfitableName} (${formatCurrency(topProfitableVal)})` : topProfitableName,
      topMaterial: topConsumedQty > 0 ? `${topConsumedInsumoName} (${topConsumedQty.toFixed(1)} ${topConsumedUnit})` : topConsumedInsumoName
    };
  }, [filteredOrders, rawInsumos, products, selectedAtelier, selectedPeriod]);

  // Product Viability Ranking calculation
  const viabilityRanking = useMemo(() => {
    return products.map(product => {
      // Calculate materials cost
      let materialsCost = 0;
      product.insumos?.forEach(req => {
        const ins = rawInsumos.find(i => i.id === req.insumoId);
        if (ins) {
          materialsCost += (ins.unitValue || 0) * req.quantity;
        }
      });

      // Operational, packages and taxes estimation
      const opSet = operationalCosts[product.id] || { labor: 5.0, package: 2.0, extraTax: 6.0 };
      const taxAmount = (product.retail_price || 0) * (opSet.extraTax / 100);
      const totalCost = materialsCost + opSet.labor + opSet.package + taxAmount;
      
      const salePrice = product.retail_price || 0;
      const profit = Math.max(0, salePrice - totalCost);
      const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

      let classification: '🟢 Excelente' | '🟡 Boa' | '🟠 Atenção' | '🔴 Baixa Rentabilidade' = '🟠 Atenção';
      let scoreColor = "text-amber-600 bg-amber-50 border-amber-200";
      
      if (margin >= 65) {
        classification = '🟢 Excelente';
        scoreColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
      } else if (margin >= 45) {
        classification = '🟡 Boa';
        scoreColor = "text-[#C6A664] bg-neutral-50 border-[#E5E5EA]";
      } else if (margin >= 25) {
        classification = '🟠 Atenção';
        scoreColor = "text-amber-600 bg-amber-50 border-amber-200";
      } else {
        classification = '🔴 Baixa Rentabilidade';
        scoreColor = "text-rose-600 bg-rose-50 border-rose-200";
      }

      return {
        ...product,
        materialsCost,
        totalCost,
        profit,
        margin,
        classification,
        scoreColor,
        labor: opSet.labor,
        package: opSet.package,
        taxPercent: opSet.extraTax
      };
    }).sort((a, b) => b.margin - a.margin);
  }, [products, rawInsumos, operationalCosts]);

  // Strategic Raw Materials Conversion Forecast (Potencial de Faturamento)
  const potentialProductionList = useMemo(() => {
    const list: { name: string; brand: string; maxUnits: number; potentialRevenue: number; potentialProfit: number }[] = [];
    
    // Filter to products containing technical specifications
    const specsProducts = products.filter(p => p.insumos && p.insumos.length > 0);
    
    specsProducts.forEach(product => {
      let maxUnits = Infinity;
      
      product.insumos?.forEach(req => {
        const ins = rawInsumos.find(i => i.id === req.insumoId);
        if (!ins || ins.quantity <= 0) {
          maxUnits = 0;
        } else {
          const possible = Math.floor(ins.quantity / req.quantity);
          if (possible < maxUnits) {
            maxUnits = possible;
          }
        }
      });

      if (maxUnits === Infinity) maxUnits = 0;

      // Find retail price and compute potential revenue & profit
      const price = product.retail_price || 0;
      
      // Look up margin calculation
      const rank = viabilityRanking.find(r => r.id === product.id);
      const profitPerUnit = rank ? rank.profit : price * 0.50; // fallback to 50% profit

      if (maxUnits > 0) {
        list.push({
          name: product.product_name,
          brand: brandNames[product.company] || product.company,
          maxUnits,
          potentialRevenue: maxUnits * price,
          potentialProfit: maxUnits * profitPerUnit
        });
      }
    });

    return list.sort((a, b) => b.potentialProfit - a.potentialProfit);
  }, [products, rawInsumos, viabilityRanking]);

  // Product selected data calculations for Raio-X & Fórmulas
  const selectedProduct = useMemo(() => {
    const prdId = selectedProductIdForFormula || products[0]?.id;
    if (!prdId) return null;
    return products.find(p => p.id === prdId) || null;
  }, [selectedProductIdForFormula, products]);

  // Materials of selected product
  const selectedProductFormulaDetails = useMemo(() => {
    if (!selectedProduct) return null;
    
    let totalMaterialCost = 0;
    const items = (selectedProduct.insumos || []).map(req => {
      const ins = rawInsumos.find(i => i.id === req.insumoId);
      const cost = ins ? (ins.unitValue || 0) * req.quantity : 0;
      totalMaterialCost += cost;
      return {
        id: req.insumoId,
        name: ins?.name || 'Material Desconhecido',
        unit: ins?.unit || 'unid',
        reqQty: req.quantity,
        unitCost: ins?.unitValue || 0,
        totalCost: cost,
        stockQty: ins?.quantity || 0
      };
    });

    const opSet = operationalCosts[selectedProduct.id] || { labor: 5.0, package: 2.0, extraTax: 6.0 };
    const taxAmount = (selectedProduct.retail_price || 0) * (opSet.extraTax / 100);
    const totalCost = totalMaterialCost + opSet.labor + opSet.package + taxAmount;
    
    const salePrice = selectedProduct.retail_price || 0;
    const profit = Math.max(0, salePrice - totalCost);
    const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    return {
      totalMaterialCost,
      items,
      laborCost: opSet.labor,
      packageCost: opSet.package,
      taxPercent: opSet.extraTax,
      taxCost: taxAmount,
      totalCost,
      salePrice,
      profit,
      margin,
      roi
    };
  }, [selectedProduct, rawInsumos, operationalCosts]);

  // Executive Summary of selected product
  const executiveSummaryResult = useMemo(() => {
    const prd = products.find(p => p.id === selectedSimProduct) || products[0];
    if (!prd) return null;

    // Materials cost calculation
    let materialsCost = 0;
    prd.insumos?.forEach(req => {
      const ins = rawInsumos.find(i => i.id === req.insumoId);
      if (ins) {
        materialsCost += (ins.unitValue || 0) * req.quantity;
      }
    });

    // Operational, package, tax costs
    const opSet = operationalCosts[prd.id] || { labor: 5.0, package: 2.0, extraTax: 6.0 };
    const taxAmount = (prd.retail_price || 0) * (opSet.extraTax / 100);
    const totalCost = materialsCost + opSet.labor + opSet.package + taxAmount;

    const salePrice = prd.retail_price || 0;
    const profit = Math.max(0, salePrice - totalCost);
    const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
    const productionTime = prd.productionTime || 5;

    return {
      productName: prd.product_name,
      salePrice,
      totalCost,
      profit,
      margin,
      productionTime
    };
  }, [selectedSimProduct, products, rawInsumos, operationalCosts]);

  // Handle adding materials
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial?.name) return;

    try {
      // Automatically calculate dynamic value per physical unit
      const boughtQty = Number(editingMaterial.quantity) || 1;
      const pricePaid = Number(editingMaterial.costPrice) || 0;
      const unitVal = boughtQty > 0 ? pricePaid / boughtQty : pricePaid;

      const dataToSave = {
        ...editingMaterial,
        unitValue: unitVal,
        quantity: Number(editingMaterial.quantity) || 0,
        costPrice: pricePaid,
        criticalLimit: Number(editingMaterial.criticalLimit) || 10,
        code: editingMaterial.code || 'INS' + Math.floor(Math.random() * 90000 + 10000)
      };

      if (editingMaterial.id) {
        await updateDoc(doc(db, 'insumos', editingMaterial.id), dataToSave);
      } else {
        await addDoc(collection(db, 'insumos'), dataToSave);
      }
      
      setIsMaterialModalOpen(false);
      setEditingMaterial(null);
      // Reload on snapshot is handled externally or through real-time state
      window.dispatchEvent(new Event('reload-data')); 
    } catch (saveErr) {
      console.error('Error saving insumo:', saveErr);
    }
  };

  // Handle saving suppliers
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier?.name) return;

    try {
      const dataToSave = {
        name: editingSupplier.name,
        type: editingSupplier.type || 'Geral',
        contact: editingSupplier.contact || '',
        defaultDiscount: Number(editingSupplier.defaultDiscount) || 0,
        notes: editingSupplier.notes || '',
        createdAt: new Date().toISOString()
      };

      if (editingSupplier.id) {
        await updateDoc(doc(db, 'suppliers', editingSupplier.id), dataToSave);
      } else {
        await addDoc(collection(db, 'suppliers'), dataToSave);
      }
      
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (saveErr) {
      console.error('Error saving supplier:', saveErr);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este fornecedor?')) {
      try {
        await deleteDoc(doc(db, 'suppliers', id));
        fetchSuppliers();
      } catch (err) {
        console.error('Error deleting supplier:', err);
      }
    }
  };

  // PDF Report Generator with comprehensive details and executive summary
  const handleGeneratePDF = (productId: string) => {
    const prd = products.find(p => p.id === productId);
    if (!prd) {
      alert("Selecione um produto válido para gerar o relatório.");
      return;
    }

    const rank = viabilityRanking.find(r => r.id === prd.id);
    const costDetails = selectedProductFormulaDetails;
    if (!rank || !costDetails) return;

    const doc = new jsPDF();
    let y = 20;

    // Head Accent Line
    const primaryColor = "#cca062"; 
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(1.5);
    doc.line(15, y, 195, y);
    y += 10;

    // Header branding
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text("CENTRO DE CUSTOS & ENGENHARIA", 15, y);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#7f8c8d");
    doc.text(`ATELIÊS PARCEIROS • RELATÓRIO DO PRODUTO`, 15, y + 6);

    // Right Metadata
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor("#2c3e50");
    doc.text(`CÓD: #${prd.code || prd.id.substring(0,6).toUpperCase()}`, 195, y, { align: "right" });
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Gerado em: ${safeFormat(new Date(), "dd/MM/yyyy HH:mm")}`, 195, y + 6, { align: "right" });

    y += 18;

    // Section 1: Product info
    doc.setFillColor("#faf9f6");
    doc.rect(15, y, 180, 24, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor("#4a4444");
    doc.text(`Produto: ${prd.product_name.toUpperCase()}`, 18, y + 7);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Ateliê: ${brandNames[prd.company] || prd.company}  |  Categoria: ${prd.category}`, 18, y + 14);
    doc.text(`Status de Catálogo: ${prd.activeInCatalog ? 'Ativo' : 'Oculto'}  |  Venda Sugerida: ${formatCurrency(prd.retail_price)}`, 18, y + 20);

    y += 32;

    // Section 2: Financial and Viability KPIs
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("INDICADORES DE VIABILIDADE", 15, y);
    y += 6;

    // Mini Table of values
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`Custo de Insumos: ${formatCurrency(costDetails.totalMaterialCost)}`, 18, y);
    doc.text(`Mão de Obra Operacional: ${formatCurrency(costDetails.laborCost)}`, 18, y + 6);
    doc.text(`Embalagem de Envio: ${formatCurrency(costDetails.packageCost)}`, 18, y + 12);
    doc.text(`Impostos Estimados (${costDetails.taxPercent}%): ${formatCurrency(costDetails.taxCost)}`, 18, y + 18);
    
    // Right column
    doc.text(`Custo Total Unitário: ${formatCurrency(costDetails.totalCost)}`, 110, y);
    doc.text(`Preço de Venda Praticado: ${formatCurrency(costDetails.salePrice)}`, 110, y + 6);
    doc.setFont("Helvetica", "bold");
    doc.text(`LUCRO LÍQUIDO UNITÁRIO: ${formatCurrency(costDetails.profit)}`, 110, y + 12);
    doc.setTextColor(rank.margin >= 45 ? "#10b981" : "#ef4444");
    doc.text(`MARGEM BRUTA ESTIMADA: ${costDetails.margin.toFixed(1)}%`, 110, y + 18);
    doc.setTextColor("#4a4444");

    y += 28;

    // Section 3: Product Bill of Materials (Ficha Técnica)
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DETALHAMENTO DA FICHA TÉCNICA (CONSUMO)", 15, y);
    y += 6;

    doc.setFillColor("#2c3e50");
    doc.rect(15, y, 180, 6, "F");
    doc.setFontSize(8);
    doc.setTextColor("#ffffff");
    doc.text("MATERIAL", 18, y + 4.5);
    doc.text("UNIDADE", 78, y + 4.5);
    doc.text("QTD USADA", 108, y + 4.5);
    doc.text("CUSTO UNIT.", 138, y + 4.5);
    doc.text("CUSTO DEDUZIDO", 168, y + 4.5);

    y += 6;
    doc.setTextColor("#4a4444");
    costDetails.items.forEach(item => {
      doc.text(item.name.substring(0, 30), 18, y + 4.5);
      doc.text(item.unit.toUpperCase(), 78, y + 4.5);
      doc.text(item.reqQty.toString(), 108, y + 4.5);
      doc.text(formatCurrency(item.unitCost), 138, y + 4.5);
      doc.text(formatCurrency(item.totalCost), 168, y + 4.5);
      
      doc.setDrawColor("#e5e7eb");
      doc.line(15, y + 6, 195, y + 6);
      y += 6;
    });

    y += 10;

    // Track Sales & ROI
    const ordersWithThisProduct = orders.filter(o => o.items?.some(it => it.productId === prd.id || it.id === prd.id) && o.status !== 'cancelled');
    const totalQtySold = ordersWithThisProduct.reduce((sum, o) => {
      const it = o.items.find(i => i.productId === prd.id || i.id === prd.id);
      return sum + (it?.quantity || 0);
    }, 0);
    const totalProductRevenue = totalQtySold * prd.retail_price;
    const totalProductCost = totalQtySold * costDetails.totalCost;
    const totalProductProfit = totalProductRevenue - totalProductCost;

    // Raio-X & Conversion section
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RAIO-X DO PRODUTO (PERFORMANCE HISTÓRICA)", 15, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`Unidades Vendidas (Acumulado): ${totalQtySold} unidades`, 18, y);
    doc.text(`Receita Total Gerada: ${formatCurrency(totalProductRevenue)}`, 18, y + 6);
    doc.text(`Custo Acumulado de Produção: ${formatCurrency(totalProductCost)}`, 18, y + 12);
    
    // Potencial baseado em estoque
    const maxPoss = potentialProductionList.find(p => p.name === prd.product_name)?.maxUnits || 0;
    doc.text(`Materiais Disponíveis em Estoque hoje permitem fazer: ${maxPoss} unidades`, 18, y + 18);
    doc.text(`Potencial Adicional de Faturamento: ${formatCurrency(maxPoss * prd.retail_price)}`, 18, y + 24);

    y += 34;

    // Section 5: Executive summary
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RESUMO EXECUTIVO DO ENGENHEIRO", 15, y);
    y += 6;

    // Prepare text auto-generated explanation
    const ratingText = rank.margin >= 65 ? "EXCEPCIONAL" : rank.margin >= 45 ? "EXCELENTE" : rank.margin >= 25 ? "CONVENIENTEMENTE VIÁVEL" : "CRÍTICO (BAIXA MARGEM)";
    const evaluationNote = rank.margin >= 45 
      ? `A viabilidade comercial desta engenharia de produto está classificada como ${ratingText}. Apresenta excelente rentabilidade com uma margem líquida por unidade de ${costDetails.margin.toFixed(1)}%. Com os insumos atualmente disponíveis no estoque de materiais, o ateliê possui potencial produtivo imediato para transformar matérias-primas em faturamento excedente de até ${formatCurrency(maxPoss * prd.retail_price)}, gerando lucros de ${formatCurrency(maxPoss * costDetails.profit)}. Recomenda-se continuar as campanhas de marketing focadas e monitorar constantemente o limite crítico de reposição dos materiais.`
      : `O produto está classificado com margem comercial de ${ratingText} (${costDetails.margin.toFixed(1)}%). Recomenda-se renegociar os preços de compra com fornecedores parceiros como Shopee ou Kalunga, ou reconfigurar a quantidade de consumo de insumos na ficha técnica, a fim de aumentar a margem líquida para próximo de 45-50%. Atualmente, há capacidade de produção para ${maxPoss} peças que podem render ${formatCurrency(maxPoss * prd.retail_price)} em receita bruta de saldos excedentes.`;

    doc.setFont("Helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor("#7f8c8d");
    
    // Multi line printing
    const textLines = doc.splitTextToSize(evaluationNote, 180);
    doc.text(textLines, 15, y);

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');

    // Save
    doc.save(`auditoria_${prd.product_name.toLowerCase().replace(/ /g, "_")}.pdf`);
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1C1C1E] space-y-8 ">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 backdrop-blur-md border border-[#E5E5EA] p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-medium text-slate-900 tracking-normal flex items-center gap-2">
            📂 Auditoria e Engenharia
          </h2>
          <p className="text-xs font-bold text-[#8E8E93] tracking-normal mt-1">
            Centro de Custos, Viabilidade e Aproveitamento de Materiais
          </p>
        </div>
        
        {/* Interactive Period Selector and Atelier Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Atelier Select */}
          <select 
            value={selectedAtelier}
            onChange={(e) => setSelectedAtelier(e.target.value)}
            className="bg-[#F5F5F7] border border-[#E5E5EA] text-[10px] font-medium uppercase tracking-wider rounded-xl px-4 py-2.5 text-[#1C1C1E] outline-none cursor-pointer"
          >
            <option value="all">TODOS OS ATELIÊS</option>
            <option value="pallyra">LA PALLYRA</option>
            <option value="guennita">COM AMOR, GUENNITA</option>
            <option value="mimada">MIMADA SIM</option>
            <option value="tuttymimo">TUTTY MIMO</option>
          </select>

          {/* Period selection */}
          <div className="flex items-center bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl p-1 gap-1">
            {(['7d', '30d', '90d', 'custom'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-medium uppercase tracking-wider transition-all ${selectedPeriod === p ? 'bg-[#1C1C1E] text-white shadow' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
              >
                {p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : p === '90d' ? '90 Dias' : 'Personalizado'}
              </button>
            ))}
          </div>

          {selectedPeriod === 'custom' && (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-3 duration-200">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-[#F5F5F7] border border-[#E5E5EA] text-[10px] rounded-xl px-2 py-2 outline-none font-semibold"
              />
              <span className="text-xs text-[#8E8E93] font-bold">Até</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-[#F5F5F7] border border-[#E5E5EA] text-[10px] rounded-xl px-2 py-2 outline-none font-semibold"
              />
            </div>
          )}
        </div>
      </div>

      {/* Primary auditoria submenu bar */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-[#E5E5EA]">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'materials', label: 'Materiais (Estoque)', icon: Package },
          { id: 'suppliers', label: 'Fornecedores', icon: Users },
          { id: 'formulas', label: 'Fórmulas dos Produtos', icon: Layers },
          { id: 'simulator', label: 'Resumo Executivo', icon: ClipboardList },
          { id: 'viability', label: 'Viabilidade & Margens', icon: Percent },
          { id: 'reports', label: 'Relatórios PDF', icon: FileDown }
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => {
              setActiveSubmenu(sub.id as any);
              if (sub.id === 'formulas' && products.length > 0 && !selectedProductIdForFormula) {
                setSelectedProductIdForFormula(products[0].id);
              }
              if (sub.id === 'simulator' && products.length > 0 && !selectedSimProduct) {
                setSelectedSimProduct(products[0].id);
              }
              if (sub.id === 'reports' && products.length > 0 && !selectedProductIdForReport) {
                setSelectedProductIdForReport(products[0].id);
              }
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-medium uppercase tracking-wider whitespace-nowrap transition-all border ${activeSubmenu === sub.id ? 'bg-[#1C1C1E] border-[#1C1C1E] text-white shadow-lg' : 'bg-white border-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]'}`}
          >
            <sub.icon size={14} />
            {sub.label}
          </button>
        ))}
      </div>

      {/* Render content based on sub-navigation selections */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubmenu}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeSubmenu === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Stat grid indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {[
                  { title: "Estoque Investido", value: formatCurrency(dashboardStats.totalInvestedInMaterials), desc: "Investimento total histórico em compras", icon: DollarSign, color: "text-[#C6A664] bg-[#C6A664]/5 border-[#C6A664]/20" },
                  { title: "Valor do Estoque Atual", value: formatCurrency(dashboardStats.totalCurrentStockValue), desc: "Valoração atual baseada no custo unitário", icon: Package, color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                  { title: "Receita no Período", value: formatCurrency(dashboardStats.revenue), desc: "Soma de faturamentos de pedidos ativos", icon: TrendingUp, color: "text-sky-700 bg-sky-50 border-sky-100" },
                  { title: "Custos do Período", value: formatCurrency(dashboardStats.costs), desc: "Insumos consumidos + variáveis de atelier", icon: Briefcase, color: "text-rose-700 bg-rose-50 border-rose-100" },
                  { title: "Lucro Estimado", value: formatCurrency(dashboardStats.netProfit), desc: "Diferença líquida do período", icon: CheckCircle, color: "text-indigo-700 bg-indigo-50 border-indigo-100" },
                  { title: "ROI Calculado", value: `${dashboardStats.roi.toFixed(1)}%`, desc: "Percentual de retorno sobre custos", icon: Percent, color: "text-teal-700 bg-teal-50 border-teal-100" },
                  { title: "Produto Mais Vendido", value: dashboardStats.topSelling, desc: "Maior saída de estoque", icon: Box, color: "text-amber-700 bg-amber-50 border-amber-100" },
                  { title: "Insumo Mais Consumido", value: dashboardStats.topMaterial, desc: "Maior desgaste operacional", icon: Layers, color: "text-fuchsia-700 bg-fuchsia-50 border-fuchsia-100" }
                ].map((s, idx) => (
                  <div key={idx} className={`p-6 rounded-2xl border bg-white ${s.color} hover:scale-[1.02] hover:shadow-md transition-all shadow-sm`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-medium uppercase text-[#8E8E93] tracking-widest">{s.title}</span>
                        <div className="text-xl font-medium text-slate-900 tracking-tight">{s.value}</div>
                      </div>
                      <div className="p-3 bg-white rounded-2xl border border-transparent self-center">
                        <s.icon size={16} />
                      </div>
                    </div>
                    <div className="text-[9px] font-semibold text-[#8E8E93] uppercase tracking-wide mt-3">{s.desc}</div>
                  </div>
                ))}
              </div>

              {/* Conversion Flow Diagram (Estoque Comprado -> Lucro) */}
              <div className="bg-white border border-[#E5E5EA] rounded-2xl p-8 space-y-8 shadow-sm">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 tracking-normal">🔄 Conversão e Fluxo de Produção</h3>
                  <p className="text-[10px] font-bold text-[#8E8E93] tracking-normal mt-1">Transformação física do valor focado na jornada de material a lucro</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                  {/* Flow items */}
                  {[
                    { step: "1. Estoque Comprado", title: "Investimento em Matéria Prima", val: formatCurrency(dashboardStats.totalInvestedInMaterials), dsc: "Insumos importados ou comprados sob demanda.", color: "border-amber-200 bg-amber-50/50" },
                    { step: "2. Estoque Transformado", title: "Fórmulas & Processamento", val: formatCurrency(dashboardStats.totalCurrentStockValue), dsc: "Insumos associados a fichas e convertidos em produtos.", color: "border-[#E5E5EA] bg-[#F5F5F7]" },
                    { step: "3. Faturamento de Vendas", title: "Atari de Ativos Vendidos", val: formatCurrency(dashboardStats.revenue), dsc: "Recursos adquiridos de pedidos entregues.", color: "border-sky-200 bg-sky-50/50" },
                    { step: "4. Lucro Gerado", title: "Valor Líquido Realizado", val: formatCurrency(dashboardStats.netProfit), dsc: "Sobras absolutas e saudáveis de atelier.", color: "border-emerald-200 bg-emerald-50/50" }
                  ].map((fl, fidx) => (
                    <div key={fidx} className={`p-6 rounded-2xl border ${fl.color} relative space-y-3`}>
                      <span className="text-[9px] font-medium uppercase text-[#8E8E93] tracking-wider block">{fl.step}</span>
                      <div className="text-xs font-medium text-slate-900 leading-tight">{fl.title}</div>
                      <div className="text-lg font-medium text-slate-900">{fl.val}</div>
                      <p className="text-[10px] font-semibold text-slate-500">{fl.dsc}</p>
                      
                      {fidx < 3 && (
                        <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#E5E5EA] items-center justify-center text-[#D1D1D6]">
                          <ArrowRight size={14} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Potencial de Faturamento */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Potential indicators */}
                <div className="xl:col-span-2 bg-white border border-[#E5E5EA] rounded-2xl p-8 space-y-6 shadow-sm">
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 tracking-normal">💰 Potencial de Faturamento Imediato</h3>
                    <p className="text-[10px] font-bold text-[#8E8E93] tracking-normal mt-1">Estimado baseado estritamente na matéria-prima e insumos hoje disponíveis no inventário físico</p>
                  </div>

                  <div className="overflow-x-auto max-h-[350px] scrollbar-hide border border-[#E5E5EA] rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F5F5F7] border-b border-[#E5E5EA] text-[9px] font-medium uppercase tracking-wider text-[#8E8E93]">
                        <tr>
                          <th className="px-5 py-4">Produto</th>
                          <th className="px-5 py-4">Ateliê</th>
                          <th className="px-5 py-4 text-center">Unid. Possíveis</th>
                          <th className="px-5 py-4 text-right">Potencial de Receita</th>
                          <th className="px-5 py-4 text-right">Potencial de Lucro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5EA] font-semibold">
                        {potentialProductionList.length > 0 ? (
                          potentialProductionList.map((pot, idx) => (
                            <tr key={idx} className="hover:bg-[#F5F5F7]/50 transition-colors">
                              <td className="px-5 py-4 text-slate-900 font-semibold uppercase">{pot.name}</td>
                              <td className="px-5 py-4 text-[10px] text-[#8E8E93] font-bold uppercase">{pot.brand}</td>
                              <td className="px-5 py-4 text-center text-slate-900 font-medium">{pot.maxUnits} un</td>
                              <td className="px-5 py-4 text-right text-[#C6A664] font-medium">{formatCurrency(pot.potentialRevenue)}</td>
                              <td className="px-5 py-4 text-right text-emerald-700 font-medium">{formatCurrency(pot.potentialProfit)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-[#8E8E93] font-bold tracking-normal">
                              Nenhuma ficha cadastrada com insumos suficientes para predição.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-5 flex items-center gap-4">
                    <Info size={18} className="text-[#C6A664] flex-shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-wide leading-relaxed text-[#1C1C1E]">
                      A quantidade limite de fabricação de cada item é controlada automaticamente pelo menor multiplicador de insumos hoje em estoque. Complete as fichas técnicas dos produtos para calibrações mais exatas.
                    </p>
                  </div>
                </div>

                {/* Total Strategic Summary Box */}
                <div className="bg-slate-900 text-[#F5F5F7] rounded-2xl p-8 flex flex-col justify-between shadow-xl">
                  <div className="space-y-4">
                    <div className="inline-block bg-[#C6A664] text-slate-900 text-[8px] font-medium tracking-normal px-3 py-1 rounded-full">
                      Resumo Tático de Giro
                    </div>
                    <h3 className="text-lg font-medium tracking-normal italic">VALOR TRANSFORMÁVEL</h3>
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                      Seu estoque possui materiais com alto potencial inovador e capacidade ociosa de montagem. Transformando todo o seu inventário disponível hoje no mix sugerido, você pode destravar faturamentos expressivos.
                    </p>
                  </div>

                  <div className="space-y-5 my-8">
                    <div>
                      <span className="text-[9px] uppercase font-medium text-slate-400 tracking-widest">FATURAMENTO PREVISTO ACUMULADO</span>
                      <div className="text-3xl font-medium text-[#C6A664] mt-1">
                        {formatCurrency(potentialProductionList.reduce((acc, current) => acc + current.potentialRevenue, 0))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-medium text-slate-400 tracking-widest">LUCRO ESTIMADO ACUMULADO</span>
                      <div className="text-2xl font-medium text-emerald-400 mt-1">
                        {formatCurrency(potentialProductionList.reduce((acc, current) => acc + current.potentialProfit, 0))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/15 pt-5 flex items-center justify-between text-[10px] font-medium uppercase text-slate-400 tracking-wider">
                    <span>Gargalo Crítico</span>
                    <span className="text-rose-400 font-semibold uppercase">Papel Fotográfico</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeSubmenu === 'materials' && (
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-8 space-y-6 shadow-sm animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 tracking-normal font-semibold">📌 Auditoria de Insumos & Cadastro de Custos</h3>
                  <p className="text-[10px] font-bold text-[#8E8E93] tracking-normal mt-1">Gerencie embalagens, folhas, insumos e custos agregados com cálculo autônomo por unidade operacional</p>
                </div>
                <button
                  onClick={() => {
                    setEditingMaterial({});
                    setIsMaterialModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-[#1C1C1E] text-white rounded-xl text-[10px] font-medium uppercase tracking-wider shadow hover:bg-black transition-all cursor-pointer self-start sm:self-center"
                >
                  <Plus size={14} /> Cadastrar Insumo
                </button>
              </div>

              <div className="overflow-x-auto border border-[#E5E5EA] rounded-2xl font-medium">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F5F7] border-b border-[#E5E5EA] text-[9px] font-medium uppercase tracking-wider text-[#8E8E93]">
                    <tr>
                      <th className="px-5 py-4">Código</th>
                      <th className="px-5 py-4">Material</th>
                      <th className="px-5 py-4">Unid. de Compra</th>
                      <th className="px-5 py-4 text-center">Quantidade Total</th>
                      <th className="px-5 py-4 text-right">Preço de Custo</th>
                      <th className="px-5 py-4 text-right">Custo / Unidade Real</th>
                      <th className="px-5 py-4 text-center">Status Estoque</th>
                      <th className="px-5 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA] font-semibold">
                    {rawInsumos.map((insumo, idx) => {
                      const costPerUnit = insumo.unitValue || (insumo.costPrice / (insumo.quantity || 1));
                      const isLow = insumo.quantity <= (insumo.criticalLimit || 10);
                      
                      return (
                        <tr key={insumo.id || idx} className="hover:bg-[#F5F5F7]/50 transition-colors">
                          <td className="px-5 py-4 font-mono text-[10px] text-slate-500">{insumo.code || 'INS-GP'}</td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900 uppercase">{insumo.name}</div>
                            {insumo.description && <div className="text-[10px] text-[#8E8E93] font-medium">{insumo.description}</div>}
                          </td>
                          <td className="px-5 py-4 text-[10px] text-slate-500 font-bold uppercase">{insumo.unit || 'pct'}</td>
                          <td className="px-5 py-4 text-center text-slate-900 font-semibold">{insumo.quantity}</td>
                          <td className="px-5 py-4 text-right font-bold">{formatCurrency(insumo.costPrice || 0)}</td>
                          <td className="px-5 py-4 text-right font-medium text-slate-900 hover:scale-105 transition-transform">
                            {formatCurrency(costPerUnit)} <span className="text-[8px] font-bold text-[#8E8E93] uppercase">/{insumo.unit}</span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-[8.5px] font-medium uppercase tracking-wider ${isLow ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-150'}`}>
                              {isLow ? 'Repor' : 'Estável'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingMaterial(insumo);
                                  setIsMaterialModalOpen(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] rounded-lg hover:bg-[#F5F5F7] transition-all cursor-pointer text-[9px] font-medium tracking-normal"
                              >
                                <Edit size={12} /> Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubmenu === 'suppliers' && (
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-8 space-y-6 shadow-sm animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 tracking-normal font-semibold">🤝 Diretório de Fornecedores de Papelaria</h3>
                  <p className="text-[10px] font-bold text-[#8E8E93] tracking-normal mt-1">Contato direto, canais de suporte e taxas de desconto aplicadas a insumos rústicos ou de atacado</p>
                </div>
                <button
                  onClick={() => {
                    setEditingSupplier({});
                    setIsSupplierModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-[#1C1C1E] text-white rounded-xl text-[10px] font-medium uppercase tracking-wider shadow hover:bg-black transition-all cursor-pointer self-start sm:self-center"
                >
                  <Plus size={14} /> Cadastrar Fornecedor
                </button>
              </div>

              {isSuppliersLoading ? (
                <div className="flex justify-center p-12 text-[#8E8E93]">Carregando fornecedores...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {suppliers.map((sup) => (
                    <div key={sup.id} className="p-6 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl hover:shadow-md transition-shadow relative space-y-4">
                      
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[8px] bg-[#C6A664]/10 border border-[#C6A664]/30 text-[#C6A664] px-2.5 py-1 rounded-full font-medium tracking-normal">{sup.type}</span>
                          <h4 className="text-[13px] font-medium uppercase text-slate-900 tracking-tight mt-1">{sup.name}</h4>
                          <span className="text-[10px] text-[#8E8E93] font-bold block">Contato: {sup.contact}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#4a4444]/5 text-[#4a4444] px-3 py-1.5 rounded-full border border-[#F5F5F7] text-[9.5px] font-medium">
                          {sup.defaultDiscount}% Desc.
                        </div>
                      </div>

                      <p className="text-[10.5px] text-[#1C1C1E] font-medium leading-relaxed italic">
                        "{sup.notes || 'Nenhuma observação ou histórico cadastrado'}"
                      </p>

                      <div className="flex justify-between items-center pt-2 border-t border-[#E5E5EA]/60 text-[9px] font-medium uppercase text-[#8E8E93]">
                        <span>Histórico de Compras Ativo</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingSupplier(sup);
                              setIsSupplierModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-white rounded-lg transition-colors cursor-pointer text-[9px] font-medium tracking-normal"
                          >
                            <Edit size={11} /> Editar
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(sup.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all cursor-pointer text-[9px] font-medium tracking-normal"
                          >
                            <Trash2 size={11} /> Excluir
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubmenu === 'formulas' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
              
              {/* Left Selector List */}
              <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 space-y-4 shadow-sm h-fit">
                <div>
                  <h3 className="text-xs font-medium text-slate-800 tracking-normal">📋 Engenharia de Produtos</h3>
                  <p className="text-[9px] font-bold text-[#8E8E93] tracking-normal mt-0.5">Selecione o produto de catálogo para avaliar ou reformular sua Ficha Técnica</p>
                </div>
                
                <div className="flex flex-col gap-1.5 max-h-[450px] overflow-y-auto scrollbar-hide pr-1">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProductIdForFormula(p.id)}
                      className={`flex justify-between items-center p-3 rounded-xl border text-left text-xs font-semibold uppercase tracking-tight transition-all ${selectedProductIdForFormula === p.id || (!selectedProductIdForFormula && products[0]?.id === p.id) ? 'bg-[#1C1C1E] border-[#1C1C1E] text-white shadow' : 'bg-[#F5F5F7] border-[#E5E5EA] text-[#1C1C1E] hover:bg-white'}`}
                    >
                      <span className="truncate max-w-[150px] font-semibold">{p.product_name}</span>
                      <span className="font-bold text-[10px]">{formatCurrency(p.retail_price)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Formula View & Formulate */}
              <div className="xl:col-span-2 bg-white border border-[#E5E5EA] rounded-2xl p-8 space-y-8 shadow-sm">
                {selectedProduct ? (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-5 border-b border-dashed border-[#E5E5EA]">
                      <div>
                        <span className="text-[8px] bg-[#F5F5F7] border border-[#E5E5EA] text-slate-400 font-mono tracking-widest rounded-lg px-2 py-1">ID: {selectedProduct.id.substring(0,8).toUpperCase()}</span>
                        <h4 className="text-[15px] font-medium uppercase text-slate-900 tracking-tight mt-1.5">{selectedProduct.product_name}</h4>
                        <span className="text-[9.5px] font-bold text-[#8E8E93] tracking-normal mt-0.5 block">Pertence a: {brandNames[selectedProduct.company]}</span>
                      </div>

                      {/* Financial KPI values in real-time */}
                      <div className="flex gap-4">
                        <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl text-center min-w-[90px]">
                          <span className="text-[8px] uppercase font-medium text-teal-600 tracking-widest">Margem</span>
                          <div className="text-base font-medium text-teal-700 mt-1">{selectedProductFormulaDetails?.margin.toFixed(0)}%</div>
                        </div>
                        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-center min-w-[90px]">
                          <span className="text-[8px] uppercase font-medium text-emerald-600 tracking-widest">Lucros Unit.</span>
                          <div className="text-base font-medium text-emerald-700 mt-1">{formatCurrency(selectedProductFormulaDetails?.profit || 0)}</div>
                        </div>
                        <div className="p-4 bg-[#C6A664]/10 border border-[#C6A664]/20 rounded-2xl text-center min-w-[90px]">
                          <span className="text-[8px] uppercase font-medium text-[#C6A664] tracking-widest">Custo Real</span>
                          <div className="text-base font-medium text-slate-950 mt-1">{formatCurrency(selectedProductFormulaDetails?.totalCost || 0)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[11px] font-medium uppercase text-slate-800 tracking-widest flex items-center gap-1.5">
                        📦 Lista de Materiais da Ficha Técnica (Consumo Físico)
                      </h4>

                      <div className="border border-[#E5E5EA] rounded-xl overflow-hidden font-medium">
                        <table className="w-full text-left text-xs">
                          <tbody className="divide-y divide-[#E5E5EA]">
                            {selectedProductFormulaDetails?.items.map((it, iIdx) => (
                              <tr key={iIdx} className="hover:bg-[#F5F5F7]/55 transition-colors">
                                <td className="px-5 py-3 font-semibold text-slate-900 uppercase">{it.name}</td>
                                <td className="px-5 py-3 text-[#8E8E93] font-bold uppercase">{it.unit}</td>
                                <td className="px-5 py-3 text-slate-900 font-semibold">{it.reqQty} unidades sugeridas</td>
                                <td className="px-5 py-3 text-right text-slate-600">{formatCurrency(it.unitCost)} /unid</td>
                                <td className="px-5 py-3 text-right font-medium text-slate-900">{formatCurrency(it.totalCost)}</td>
                              </tr>
                            ))}
                            {(!selectedProductFormulaDetails?.items.length) && (
                              <tr>
                                <td colSpan={5} className="px-5 py-6 text-center text-[#8E8E93] tracking-normal text-[9.5px] font-medium leading-relaxed">
                                  ⚠️ Nenhuma matéria-prima ou material foi associado a este produto no Cadastro Técnico. Vá em "Produtos", edite o item e inclua os insumos em sua Ficha Técnica!
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Operational Variables simulation adjusters */}
                    <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-6 space-y-4">
                      <h4 className="text-[10px] font-medium uppercase text-slate-800 tracking-widest">⚙️ Custos Operacionais e Margem do Produto</h4>
                      <p className="text-[10px] uppercase font-semibold text-slate-500 leading-normal mb-1">Ajuste os valores operacionais para as simulações estratégicas e viabilidades deste modelo comercial:</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Mão de obra por un. (R$)</label>
                          <input 
                            type="number" 
                            step="0.5"
                            value={operationalCosts[selectedProduct.id]?.labor ?? 5.0} 
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setOperationalCosts(prev => ({
                                ...prev,
                                [selectedProduct.id]: {
                                  labor: val,
                                  package: operationalCosts[selectedProduct.id]?.package ?? 2.0,
                                  extraTax: operationalCosts[selectedProduct.id]?.extraTax ?? 6.0
                                }
                              }));
                            }}
                            className="w-full bg-white border border-[#E5E5EA] text-xs font-bold rounded-xl px-3 py-2 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Custo de Embalagem (R$)</label>
                          <input 
                            type="number" 
                            step="0.5"
                            value={operationalCosts[selectedProduct.id]?.package ?? 2.0} 
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setOperationalCosts(prev => ({
                                ...prev,
                                [selectedProduct.id]: {
                                  labor: operationalCosts[selectedProduct.id]?.labor ?? 5.0,
                                  package: val,
                                  extraTax: operationalCosts[selectedProduct.id]?.extraTax ?? 6.0
                                }
                              }));
                            }}
                            className="w-full bg-white border border-[#E5E5EA] text-xs font-bold rounded-xl px-3 py-2 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Impostos e Taxas (%)</label>
                          <input 
                            type="number" 
                            step="0.5"
                            value={operationalCosts[selectedProduct.id]?.extraTax ?? 6.0} 
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setOperationalCosts(prev => ({
                                ...prev,
                                [selectedProduct.id]: {
                                  labor: operationalCosts[selectedProduct.id]?.labor ?? 5.0,
                                  package: operationalCosts[selectedProduct.id]?.package ?? 2.0,
                                  extraTax: val
                                }
                              }));
                            }}
                            className="w-full bg-white border border-[#E5E5EA] text-xs font-bold rounded-xl px-3 py-2 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="text-center p-12 text-[#8E8E93] uppercase font-bold tracking-wider">Nenhum produto selecionado</div>
                )}
              </div>

            </div>
          )}

          {activeSubmenu === 'simulator' && (
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-8 space-y-6 shadow-sm animate-in fade-in duration-300">
              
              {/* Header and Select Controls */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#E5E5EA]">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 tracking-normal">📋 Resumo Executivo de Viabilidade</h3>
                  <p className="text-[10px] font-bold text-[#8E8E93] tracking-normal mt-1">Visão geral unificada dos indicadores financeiros e logísticos cruciais para o produto selecionado</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Select product */}
                  <div className="space-y-1">
                    <span className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-wider block">Escolha o Produto</span>
                    <select
                      value={selectedSimProduct}
                      onChange={(e) => setSelectedSimProduct(e.target.value)}
                      className="bg-[#F5F5F7] border border-[#E5E5EA] text-xs rounded-xl px-3 py-2 outline-none font-bold uppercase"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.product_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {executiveSummaryResult ? (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 pt-2">
                  
                  {/* Preço Final */}
                  <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#8E8E93] block">Preço Final</span>
                      <div className="text-xl font-black text-slate-900 mt-2">
                        {formatCurrency(executiveSummaryResult.salePrice)}
                      </div>
                    </div>
                    <p className="text-[9px] text-[#8E8E93] uppercase font-bold tracking-wider mt-3">Valor de Venda Unitário</p>
                  </div>

                  {/* Custo Total */}
                  <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#8E8E93] block">Custo Total</span>
                      <div className="text-xl font-black text-slate-900 mt-2">
                        {formatCurrency(executiveSummaryResult.totalCost)}
                      </div>
                    </div>
                    <p className="text-[9px] text-[#8E8E93] uppercase font-bold tracking-wider mt-3">Insumos + Custos Operacionais</p>
                  </div>

                  {/* Lucro Estimado */}
                  <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 block">Lucro Estimado</span>
                      <div className="text-xl font-black text-emerald-800 mt-2">
                        {formatCurrency(executiveSummaryResult.profit)}
                      </div>
                    </div>
                    <p className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider mt-3">Margem Líquida Unitária</p>
                  </div>

                  {/* Margem de Lucro */}
                  <div className="p-6 bg-sky-50/50 border border-sky-100 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-sky-600 block">Margem de Lucro</span>
                      <div className="text-xl font-black text-sky-800 mt-2">
                        {executiveSummaryResult.margin.toFixed(1)}%
                      </div>
                    </div>
                    <p className="text-[9px] text-sky-600 uppercase font-bold tracking-wider mt-3">Rentabilidade do Item</p>
                  </div>

                  {/* Tempo de Produção */}
                  <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-amber-700 block">Tempo de Produção</span>
                      <div className="text-xl font-black text-amber-800 mt-2">
                        {executiveSummaryResult.productionTime} {executiveSummaryResult.productionTime === 1 ? 'Dia' : 'Dias'}
                      </div>
                    </div>
                    <p className="text-[9px] text-amber-700 uppercase font-bold tracking-wider mt-3">Tempo Médio Estimado</p>
                  </div>

                </div>
              ) : (
                <div className="text-center p-12 text-[#8E8E93]">Insira produtos para gerar o resumo executivo.</div>
              )}

            </div>
          )}

          {activeSubmenu === 'viability' && (
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-8 space-y-6 shadow-sm animate-in fade-in duration-300">
              <div>
                <h3 className="text-sm font-medium text-slate-900 tracking-normal font-semibold">🟢 Viabilidade Comercial e Ranking Automático</h3>
                <p className="text-[10px] font-bold text-[#8E8E93] tracking-normal mt-1">Classificação de rentabilidade por margem líquida com base em insumos vivos e cadastros operacionais</p>
              </div>

              <div className="overflow-x-auto border border-[#E5E5EA] rounded-2xl font-medium">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F5F7] border-b border-[#E5E5EA] text-[9px] font-medium uppercase tracking-wider text-[#8E8E93]">
                    <tr>
                      <th className="px-5 py-4">Ranking</th>
                      <th className="px-5 py-4">Produto</th>
                      <th className="px-5 py-4">Ateliê</th>
                      <th className="px-5 py-4 text-right">Custo Insumos</th>
                      <th className="px-5 py-4 text-right">Custo Unit. Total</th>
                      <th className="px-5 py-4 text-right">Preço de Venda</th>
                      <th className="px-5 py-4 text-right font-medium">Lucro Unitário</th>
                      <th className="px-5 py-4 text-right">Margem Líquida</th>
                      <th className="px-5 py-4 text-center">Classificação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA] font-semibold">
                    {viabilityRanking.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                        <td className="px-5 py-4 font-mono font-medium text-slate-500 text-center w-12">{idx + 1}º</td>
                        <td className="px-5 py-4 font-semibold text-slate-900 uppercase">{item.product_name}</td>
                        <td className="px-5 py-4 text-[10px] text-[#8E8E93] font-bold uppercase">{brandNames[item.company]}</td>
                        <td className="px-5 py-4 text-right">{formatCurrency(item.materialsCost)}</td>
                        <td className="px-5 py-4 text-right">{formatCurrency(item.totalCost)}</td>
                        <td className="px-5 py-4 text-right">{formatCurrency(item.retail_price)}</td>
                        <td className="px-5 py-4 text-right text-emerald-700 font-medium">{formatCurrency(item.profit)}</td>
                        <td className="px-5 py-4 text-right text-slate-900 font-semibold">{item.margin.toFixed(1)}%</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-block px-3 py-1.5 rounded-full text-[8px] font-medium tracking-normal border ${item.scoreColor}`}>
                            {item.classification}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubmenu === 'reports' && (
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-8 space-y-6 shadow-sm animate-in fade-in duration-300">
              <div>
                <h3 className="text-sm font-medium text-slate-900 tracking-normal">📝 Emissão do Relatório Administrativo Integral (PDF)</h3>
                <p className="text-[10px] font-bold text-[#8E8E93] tracking-normal mt-1">Gere relatórios gerenciais estruturados em PDF para apresentar aos ateliês e controlar os custos operacionais</p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl w-full max-w-2xl">
                <div className="space-y-1 flex-1">
                  <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block">Escolha o Modelo de Produto</label>
                  <select
                    value={selectedProductIdForReport}
                    onChange={(e) => setSelectedProductIdForReport(e.target.value)}
                    className="w-full bg-white border border-[#E5E5EA] text-xs font-bold rounded-xl px-4 py-3 outline-none uppercase cursor-pointer"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.product_name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleGeneratePDF(selectedProductIdForReport)}
                  className="flex items-center gap-2 px-6 py-4 bg-[#C6A664] text-white rounded-xl text-[10px] font-medium uppercase tracking-wider shadow-md hover:bg-[#b09054] transition-all cursor-pointer self-end w-full md:w-auto justify-center"
                >
                  <FileDown size={16} /> Emitir Relatório PDF
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* MODAL 1: Material/Insumo registration */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div onClick={() => setIsMaterialModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-white rounded-2xl border border-[#E5E5EA] shadow-2xl relative p-8 z-50 max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            <h4 className="text-sm font-medium uppercase text-slate-900 tracking-widest mb-6">
              {editingMaterial?.id ? '✏️ Editar Material' : '✨ Novo Material'}
            </h4>

            <form onSubmit={handleSaveMaterial} className="space-y-5">
              <div>
                <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Nome do Material/Insumo *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Papel 75g"
                  value={editingMaterial?.name || ''}
                  onChange={(e) => setEditingMaterial(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] text-xs rounded-xl px-4 py-3 outline-none uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Unidade de Compra *</label>
                  <select 
                    value={editingMaterial?.unit || 'pct'}
                    onChange={(e) => setEditingMaterial(prev => ({ ...prev, unit: e.target.value as any }))}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] text-xs rounded-xl px-4 py-3 outline-none font-bold uppercase"
                  >
                    <option value="pct">Pacote (pct)</option>
                    <option value="unid">Unidades (unid)</option>
                    <option value="mt">Metros (mt)</option>
                    <option value="cx">Caixa (cx)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Categoria</label>
                  <input 
                    type="text"
                    placeholder="Ex: Papéis"
                    value={editingMaterial?.category || ''}
                    onChange={(e) => setEditingMaterial(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] text-xs rounded-xl px-4 py-3 outline-none uppercase font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Preço Pago Total (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={editingMaterial?.costPrice || ''}
                    onChange={(e) => setEditingMaterial(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] text-xs rounded-xl px-4 py-3 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Quantidade de Compra</label>
                  <input 
                    type="number"
                    placeholder="500"
                    value={editingMaterial?.quantity || ''}
                    onChange={(e) => setEditingMaterial(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] text-xs rounded-xl px-4 py-3 outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Estoque Mínimo Crítico (Aviso)</label>
                <input 
                  type="number"
                  placeholder="20"
                  value={editingMaterial?.criticalLimit || ''}
                  onChange={(e) => setEditingMaterial(prev => ({ ...prev, criticalLimit: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] text-xs rounded-xl px-4 py-3 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Observações escritas</label>
                <textarea 
                  placeholder="Especifique dimensões, gramatura, etc."
                  value={editingMaterial?.description || ''}
                  onChange={(e) => setEditingMaterial(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] text-xs rounded-xl px-4 py-3 outline-none h-20"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-5 py-3 border border-[#E5E5EA] text-[#8E8E93] rounded-xl text-[10px] font-medium uppercase tracking-wider hover:bg-[#F5F5F7] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#1C1C1E] text-white rounded-xl text-[10px] font-medium uppercase tracking-wider hover:bg-black transition-all cursor-pointer"
                >
                  Salvar Material
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: Supplier registration */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div onClick={() => setIsSupplierModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-white rounded-2xl border border-[#E5E5EA] shadow-2xl relative p-8 z-50 max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            <h4 className="text-sm font-medium uppercase text-slate-900 tracking-widest mb-6">
              {editingSupplier?.id ? '✏️ Editar Fornecedor' : '✨ Novo Fornecedor'}
            </h4>

            <form onSubmit={handleSaveSupplier} className="space-y-5">
              <div>
                <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Nome do Fornecedor *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Kalunga Distribuidores"
                  value={editingSupplier?.name || ''}
                  onChange={(e) => setEditingSupplier(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] text-xs rounded-xl px-4 py-3 outline-none uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Tipo de Insumos fornecidos</label>
                  <input 
                    type="text"
                    placeholder="Ex: Papelaria"
                    value={editingSupplier?.type || ''}
                    onChange={(e) => setEditingSupplier(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] text-xs rounded-xl px-4 py-3 outline-none uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Contato do Fornecedor</label>
                  <input 
                    type="text"
                    placeholder="Ex: sac@kalunga.com"
                    value={editingSupplier?.contact || ''}
                    onChange={(e) => setEditingSupplier(prev => ({ ...prev, contact: e.target.value }))}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] text-xs rounded-xl px-4 py-3 outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Desconto Padrão Aplicado (%)</label>
                <input 
                  type="number"
                  placeholder="5"
                  value={editingSupplier?.defaultDiscount ?? ''}
                  onChange={(e) => setEditingSupplier(prev => ({ ...prev, defaultDiscount: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] text-xs rounded-xl px-4 py-3 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-[8.5px] font-medium uppercase text-[#8E8E93] tracking-widest block mb-1.5">Histórico e Observações</label>
                <textarea 
                  placeholder="Especifique canais de compra favoritos ou prazos de entrega..."
                  value={editingSupplier?.notes || ''}
                  onChange={(e) => setEditingSupplier(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] text-xs rounded-xl px-4 py-3 outline-none h-20"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-5 py-3 border border-[#E5E5EA] text-[#8E8E93] rounded-xl text-[10px] font-medium uppercase tracking-wider hover:bg-[#F5F5F7] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#1C1C1E] text-white rounded-xl text-[10px] font-medium uppercase tracking-wider hover:bg-black transition-all cursor-pointer"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
