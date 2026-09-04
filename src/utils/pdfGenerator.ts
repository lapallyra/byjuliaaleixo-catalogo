import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Order, SiteSettings } from "../types";
import { formatCurrency } from "../lib/currencyUtils";
import { safeFormat, safeFormatISO } from "../lib/dateUtils";

/**
 * Interface para a configuração do relatório genérico
 */
export interface GenericReportConfig {
  title: string;
  columns: string[];
  rows: any[][];
  userName?: string;
  filters?: string;
}

/**
 * Gera um PDF genérico em formato retrato ou paisagem dependendo do número de colunas.
 */
export const exportGenericReportPDF = (config: GenericReportConfig, settings?: Partial<SiteSettings>) => {
  const isLandscape = config.columns.length > 5;
  const doc = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4"
  });

  const primaryColor = settings?.theme_primary_color || "#cca062";
  const studioName = settings?.store_name || "Sistema de Gestão Ateliê";
  
  // Pegar data atual
  const dateStr = safeFormat(new Date(), "dd/MM/yyyy HH:mm");
  const user = config.userName || "Usuário Admin";
  
  // Header
  let y = 15;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor("#1e293b");
  doc.text(studioName.toUpperCase(), 15, y);
  
  y += 8;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(primaryColor);
  doc.text(config.title.toUpperCase(), 15, y);
  
  // Metadata Info
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#64748b");
  
  y += 6;
  doc.text(`Gerado em: ${dateStr}`, 15, y);
  doc.text(`Responsável: ${user}`, 15, y + 5);
  if (config.filters) {
    doc.text(`Filtros: ${config.filters}`, 15, y + 10);
    y += 10;
  } else {
    y += 5;
  }
  
  y += 8;
  doc.setDrawColor("#e2e8f0");
  doc.setLineWidth(0.5);
  doc.line(15, y, isLandscape ? 282 : 195, y);
  y += 6;

  // Render da tabela auto-paginada
  (doc as any).autoTable({
    startY: y,
    head: [config.columns],
    body: config.rows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: '#ffffff',
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      textColor: '#334155',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: '#f8fafc'
    },
    margin: { left: 15, right: 15 },
    didDrawPage: function (data: any) {
      // Rodapé institucional e paginação
      const str = 'Página ' + (doc as any).getNumberOfPages();
      doc.setFontSize(8);
      
      const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
      
      doc.setDrawColor("#e2e8f0");
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 15, isLandscape ? 282 : 195, pageHeight - 15);
      
      doc.setFont("Helvetica", "italic");
      doc.setTextColor("#94a3b8");
      doc.text("Documento gerado eletronicamente.", 15, pageHeight - 10);
      
      doc.setFont("Helvetica", "normal");
      doc.text(str, isLandscape ? 282 : 195, pageHeight - 10, { align: "right" });
    }
  });

  // Abrir o PDF em nova aba no navegador (e tbm pode chamar .save, ou retornar Blob url)
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};

/**
 * Exports an elegant, portrait print A4 format receipt for an individual order.
 */
export const exportOrderReceiptPDF = (order: Order, settings: Partial<SiteSettings>) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const primaryColor = settings.theme_primary_color || "#cca062";
  const atelierNames: Record<string, string> = {
    pallyra: "La Pallyra",
    guennita: "com amor, Guennita",
    mimada: "Mimada Sim",
    tuttymimo: "Tutty Mimo",
    madrinha: "Madrinha",
  };
  const studioName = settings.store_name || atelierNames[order.companyId] || "Ateliê";

  let y = 20;
  
  // Header line accent
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(1);
  doc.line(15, y, 195, y); 
  y += 10;

  // Title branding
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(primaryColor);
  doc.text(studioName.toUpperCase(), 15, y);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#7f8c8d");
  doc.text("COMPROVANTE DE COMPRA FORMATADO", 15, y + 6);

  // General Metadata right side
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor("#2c3e50");
  doc.text(`PEDIDO: #${order.code}`, 195, y, { align: "right" });
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#7f8c8d");
  doc.text(`Emissão: ${safeFormat(new Date(), "dd/MM/yyyy HH:mm")}`, 195, y + 6, { align: "right" });

  y += 20;

  doc.setDrawColor("#f3f4f6");
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  y += 8;

  // Customer Profile & Delivery Details
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor("#1e293b");
  doc.text("INFOS DO CLIENTE", 15, y);
  doc.text("DETALHES DA LOGÍSTICA", 110, y);
  y += 6;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#334155");
  doc.text(`Nome: ${order.customerName}`, 15, y);
  doc.text(`Tipo Entrega: ${order.deliveryType === "retirada" ? "Retirada no Ateliê" : order.deliveryType === "delivery" ? "Delivery Local" : "Correios/Transportadora"}`, 110, y);
  y += 5;

  doc.text(`Contato: ${order.contact || "Não informado"}`, 15, y);
  const deliveryDateFormatted = order.deliveryDate ? safeFormatISO(order.deliveryDate, "dd/MM/yyyy") : "A combinar";
  doc.text(`Previsão Delivery: ${deliveryDateFormatted}`, 110, y);
  y += 5;

  doc.text(`Documento: ${order.customerCpfCnpj || "Não informado"}`, 15, y);
  doc.text(`Status Pedido: ${order.status.toUpperCase()}`, 110, y);
  y += 5;

  if (order.address) {
    doc.text(`Endereço: ${order.address}`, 15, y, { maxWidth: 85 });
  }
  y += 12;

  doc.setDrawColor("#e2e8f0");
  doc.line(15, y, 195, y);
  y += 8;

  // Specific Order Items Table
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor);
  doc.text("ITENS SELECIONADOS NO MIMO", 15, y);
  y += 8;

  // Headers
  doc.setFillColor("#f8fafc");
  doc.rect(15, y - 5, 180, 7, "F");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor("#475569");
  doc.text("PRODUTO", 17, y);
  doc.text("QTD", 120, y, { align: "center" });
  doc.text("VALOR UNIT.", 155, y, { align: "right" });
  doc.text("TOTAL", 192, y, { align: "right" });
  y += 5;

  doc.setDrawColor("#e2e8f0");
  doc.line(15, y, 195, y);
  y += 5;

  // Body list
  doc.setFont("Helvetica", "normal");
  doc.setTextColor("#1e293b");

  order.items?.forEach((item) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
      doc.setFillColor("#f8fafc");
      doc.rect(15, y - 5, 180, 7, "F");
      doc.setFont("Helvetica", "bold");
      doc.text("PRODUTO", 17, y);
      doc.text("QTD", 120, y, { align: "center" });
      doc.text("VALOR UNIT.", 155, y, { align: "right" });
      doc.text("TOTAL", 192, y, { align: "right" });
      y += 5;
      doc.line(15, y, 195, y);
      y += 5;
      doc.setFont("Helvetica", "normal");
    }

    const price = item.retail_price || 0;
    const qty = item.quantity || 1;
    doc.text(item.product_name, 17, y, { maxWidth: 90 });
    doc.text(qty.toString(), 119, y, { align: "center" });
    doc.text(formatCurrency(price), 155, y, { align: "right" });
    doc.text(formatCurrency(price * qty), 192, y, { align: "right" });
    y += 8;
  });

  y += 4;
  doc.line(15, y, 195, y);
  y += 8;

  // Totals Summary Block
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  const subtotalVal = order.items?.reduce((sum, item) => sum + (item.retail_price * (item.quantity || 1)), 0) || 0;
  const shippingVal = order.shippingCost || 0;

  doc.setFont("Helvetica", "normal");
  doc.text("Subtotal:", 145, y, { align: "right" });
  doc.text(formatCurrency(subtotalVal), 192, y, { align: "right" });
  y += 6;

  doc.text("Adicional de Frete:", 145, y, { align: "right" });
  doc.text(formatCurrency(shippingVal), 192, y, { align: "right" });
  y += 6;

  if (order.hasSignal) {
    const signalPaid = typeof order.signalValue === 'number' ? order.signalValue : (order.total * 0.5);
    const balanceDue = Math.max(0, order.total - signalPaid);
    
    doc.setFont("Helvetica", "bold");
    doc.setTextColor("#16a34a");
    doc.text("Sinal Pago:", 145, y, { align: "right" });
    doc.text(`- ${formatCurrency(signalPaid)}`, 192, y, { align: "right" });
    y += 6;

    doc.setFont("Helvetica", "bold");
    doc.setTextColor("#e11d48");
    doc.text("Saldo Pendente:", 145, y, { align: "right" });
    doc.text(formatCurrency(balanceDue), 192, y, { align: "right" });
    y += 6;
  }

  doc.setLineWidth(0.5);
  doc.setDrawColor("#cbd5e1");
  doc.line(130, y - 2, 195, y - 2);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor("#0f172a");
  doc.text("Valor Faturado:", 145, y, { align: "right" });
  doc.text(formatCurrency(order.total), 192, y, { align: "right" });
  y += 15;

  // Observations
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor("#475569");
  doc.text("OBSERVAÇÕES ADICIONAIS DO CLIENTE / PERSONALIZAÇÕES:", 15, y);
  y += 5;

  doc.setFont("Helvetica", "normal");
  doc.setTextColor("#64748b");
  doc.text(order.observations || "Nenhuma observação cadastrada no fluxo.", 15, y, { maxWidth: 180 });
  y += 20;

  // Custom Legal disclaimer or Footer
  if (settings.receipt_footer) {
    y += 5;
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor("#94a3b8");
    doc.text(settings.receipt_footer, 15, y, { maxWidth: 180 });
    y += 10;
  }

  // Footer Signatures
  if (y > 250) {
    doc.addPage();
    y = 40;
  }
  doc.setDrawColor("#94a3b8");
  doc.line(20, y + 10, 85, y + 10);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Assinatura do Responsável", 52.5, y + 15, { align: "center" });

  doc.line(125, y + 10, 190, y + 10);
  doc.text("Assinatura do Cliente", 157.5, y + 15, { align: "center" });

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');

  doc.save(`Recibo_Pedido_${order.code}.pdf`);
};

/**
 * Exports a PDF report summarizing the list of orders currently displayed on the table.
 */
export const exportOrdersReportPDF = (orders: Order[], companyId: string) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  let y = 18;
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor("#0f172a");
  doc.text("RELATÓRIO DE PEDIDOS CADASTRADOS", 15, y);
  y += 6;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#475569");
  const compLabel = companyId === 'all' ? 'Todos os Ateliês' : companyId.toUpperCase();
  doc.text(`Ateliê: ${compLabel} | Filtro Ativo: ${orders.length} pedidos listados`, 15, y);
  doc.text(`Data Relatório: ${safeFormat(new Date(), "dd/MM/yyyy HH:mm")}`, 195, y, { align: "right" });
  y += 10;

  doc.setDrawColor("#e2e8f0");
  doc.line(15, y, 195, y);
  y += 10;

  // Table header
  doc.setFillColor("#f1f5f9");
  doc.rect(15, y - 5, 180, 7, "F");
  
  doc.setFont("Helvetica", "bold");
  doc.setTextColor("#334155");
  doc.text("CÓDIGO", 17, y);
  doc.text("CLIENTE", 40, y);
  doc.text("MIMO ATELIÊ", 95, y);
  doc.text("STATUS", 125, y);
  doc.text("LOGÍSTICA", 155, y);
  doc.text("TOTAL", 192, y, { align: "right" });
  y += 5;
  doc.line(15, y, 195, y);
  y += 6;

  doc.setFont("Helvetica", "normal");
  doc.setTextColor("#1e293b");

  let totalRevenue = 0;

  orders.forEach((o) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
      doc.setFillColor("#f1f5f9");
      doc.rect(15, y - 5, 180, 7, "F");
      doc.setFont("Helvetica", "bold");
      doc.text("CÓDIGO", 17, y);
      doc.text("CLIENTE", 40, y);
      doc.text("MIMO ATELIÊ", 95, y);
      doc.text("STATUS", 125, y);
      doc.text("LOGÍSTICA", 155, y);
      doc.text("TOTAL", 192, y, { align: "right" });
      y += 5;
      doc.line(15, y, 195, y);
      y += 6;
      doc.setFont("Helvetica", "normal");
    }

    const code = o.code || o.id.slice(0, 6);
    const client = o.customerName || "Anônimo";
    const shop = o.companyId || "Ateliê";
    const statusVal = o.status;
    const dateStr = o.deliveryDate ? safeFormatISO(o.deliveryDate, "dd/MM/yy") : "--/--/--";
    const val = o.total || 0;
    
    if (o.status !== 'cancelled') {
      totalRevenue += val;
    }

    doc.text(code, 17, y);
    doc.text(client, 40, y, { maxWidth: 50 });
    doc.text(shop.toUpperCase(), 95, y);
    doc.text(statusVal.toUpperCase(), 125, y, { maxWidth: 28 });
    doc.text(dateStr, 155, y);
    doc.text(formatCurrency(val), 192, y, { align: "right" });
    
    y += 8;
  });

  y += 4;
  doc.line(15, y, 195, y);
  y += 8;

  // Cumulative
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor("#0f172a");
  doc.text("VALOR TOTAL DOS PEDIDOS ATIVOS (EXCLUINDO CANCELADOS):", 15, y);
  doc.text(formatCurrency(totalRevenue), 192, y, { align: "right" });

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');

  doc.save(`Relatorio_Pedidos_${companyId || "Geral"}.pdf`);
};

/**
 * Exports an exhaustive financial report in formatted A4 format with all statistics.
 */
export const exportFinanceReportPDF = (data: {
  companyId: string;
  filterMonth: Date;
  grossRevenue: number;
  netProfit: number;
  totalExpenses: number;
  history: any[];
  currentMonthOrders: Order[];
  fixedCosts: number;
  taxesRate: number;
  variableTaxes: number;
  cogsEstimate: number;
  totalManualInflows: number;
  totalManualOutflows: number;
  monthEntries: any[];
}) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  let y = 20;

  // Header Title block
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor("#1e293b");
  doc.text("RELATÓRIO FINANCEIRO DE DESEMPENHO", 15, y);
  y += 6;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#64748b");
  const monthLabel = data.filterMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();
  doc.text(`Ateliê: ${data.companyId.toUpperCase()} | Competência Fiscal: ${monthLabel}`, 15, y);
  doc.text(`Gerado em: ${safeFormat(new Date(), "dd/MM/yyyy HH:mm")}`, 195, y, { align: "right" });
  y += 10;

  doc.setDrawColor("#cbd5e1");
  doc.line(15, y, 195, y);
  y += 10;

  // Graphic KPIs Rectangles layout
  // 1. Gross Revenue
  doc.setFillColor("#f0fdf4");
  doc.setDrawColor("#bbf7d0");
  doc.rect(15, y, 55, 25, "FD");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor("#166534");
  doc.text("FATURAMENTO BRUTO", 18, y + 6);
  doc.setFontSize(13);
  doc.text(formatCurrency(data.grossRevenue), 18, y + 17);

  // 2. Cost Estimate Box
  doc.setFillColor("#fef2f2");
  doc.setDrawColor("#fecaca");
  doc.rect(75, y, 55, 25, "FD");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor("#991b1b");
  doc.text("DESPESAS OPERACIONAIS", 78, y + 6);
  doc.setFontSize(13);
  doc.text(`- ${formatCurrency(data.totalExpenses)}`, 78, y + 17);

  // 3. Estimated Net Profit Box
  doc.setFillColor("#faf5ff");
  doc.setDrawColor("#e9d5ff");
  doc.rect(135, y, 60, 25, "FD");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor("#6b21a8");
  doc.text("LUCRO LÍQUIDO PRESTADO", 138, y + 6);
  doc.setFontSize(13);
  doc.text(formatCurrency(data.netProfit), 138, y + 17);

  y += 35;

  // Cost break downs
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor("#334155");
  doc.text("DETALHAMENTO DE DESPESAS DA EMPRESA", 15, y);
  y += 6;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#1e293b");

  const expensesTable = [
    { desc: "Custos Fixos Globais (Aluguel, Luz, Plataformas, etc.)", val: data.fixedCosts },
    { desc: `Impostos sobre Faturamento (${data.taxesRate}% do Faturamento Bruto)`, val: data.variableTaxes },
    { desc: "CMV Estimado (Projetado ~ 35% do Faturamento)", val: data.cogsEstimate },
    { desc: "Outras despesas suplementares cadastradas", val: data.totalManualOutflows },
  ];

  expensesTable.forEach((item) => {
    doc.text(item.desc, 15, y, { maxWidth: 140 });
    doc.text(`- ${formatCurrency(item.val)}`, 192, y, { align: "right" });
    y += 6;
  });

  y += 5;
  doc.setDrawColor("#e2e8f0");
  doc.line(15, y, 195, y);
  y += 10;

  // Monthly Sales listing summary
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor("#334155");
  doc.text(`HISTÓRICO DE VENDAS COMPILADO (${data.currentMonthOrders.length} PEDIDOS)`, 15, y);
  y += 6;

  // Small Header for Orders
  doc.setFillColor("#f8fafc");
  doc.rect(15, y - 5, 180, 7, "F");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor("#475569");
  doc.text("CÓDIGO", 17, y);
  doc.text("CLIENTE", 40, y);
  doc.text("LOGÍSTICA", 110, y);
  doc.text("PAGAMENTO", 145, y);
  doc.text("TOTAL DO PEDIDO", 192, y, { align: "right" });
  y += 4;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor("#334155");

  if (data.currentMonthOrders.length === 0) {
    doc.text("Nenhum pedido faturado para a competência de referência.", 17, y + 4);
    y += 10;
  } else {
    data.currentMonthOrders.forEach((o) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        doc.setFillColor("#f8fafc");
        doc.rect(15, y - 5, 180, 7, "F");
        doc.setFont("Helvetica", "bold");
        doc.text("CÓDIGO", 17, y);
        doc.text("CLIENTE", 40, y);
        doc.text("LOGÍSTICA", 110, y);
        doc.text("PAGAMENTO", 145, y);
        doc.text("TOTAL DO PEDIDO", 192, y, { align: "right" });
        y += 4;
        doc.setFont("Helvetica", "normal");
      }
      doc.text(o.code || o.id.slice(0, 6), 17, y);
      doc.text(o.customerName || "Cliente", 40, y, { maxWidth: 65 });
      const delOpt = o.deliveryDate ? safeFormatISO(o.deliveryDate, "dd/MM/yyyy") : "A Combinar";
      doc.text(delOpt, 110, y);
      doc.text(o.paymentStatus.toUpperCase(), 145, y);
      doc.text(formatCurrency(o.total || 0), 192, y, { align: "right" });
      y += 6.5;
    });
  }

  y += 5;
  doc.line(15, y, 195, y);
  y += 8;

  // History performance
  if (data.history && data.history.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor("#334155");
    doc.text("HISTÓRICO RECENTE DE FECHAMENTOS", 15, y);
    y += 6;

    let xOffset = 15;
    data.history.slice(0, 5).forEach((h) => {
      doc.setFillColor("#f8fafc");
      doc.setDrawColor("#e2e8f0");
      doc.rect(xOffset, y, 32, 14, "FD");
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor("#64748b");
      doc.text(h.month, xOffset + 16, y + 5, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor("#0f172a");
      doc.text(formatCurrency(h.netProfit), xOffset + 16, y + 11, { align: "center" });
      
      xOffset += 36;
    });
    y += 20;
  }

  if (y > 265) {
    doc.addPage();
    y = 20;
  }
  doc.line(15, y, 195, y);
  y += 6;
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor("#94a3b8");
  doc.text("Este balanço financeiro corporativo é gerido eletronicamente pela interface de Admin do Ateliê.", 15, y);
  doc.text("La Pallyra • com amor, Guennita • Mimada Sim • Tutty Mimo — Gestão Unificada Premium.", 15, y + 4);

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');

  doc.save(`Performance_Financeira_${data.companyId}_${monthLabel.replace(/\s+/g, '_')}.pdf`);
};

/**
 * ERP-130 — Generates a Landscape A4 verification PDF for active orders in a 3x2 grid layout.
 * Cards are styled as premium horizontal labels with delicate grey dividers and vector barcodes.
 */
export const exportActiveOrdersVerificationPDF = (orders: Order[], companyId: string) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // If there are no orders, output an elegant message page
  if (!orders || orders.length === 0) {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor("#3a312d");
    doc.text("NENHUM PEDIDO SELECIONADO OU ATIVO PARA CONFERÊNCIA", pageWidth / 2, pageHeight / 2, { align: "center" });
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    return;
  }

  // Card Grid Layout Configuration: 3 columns x 2 rows (6 cards per A4 Landscape page)
  const cols = 3;
  const rows = 2;
  const cardsPerPage = cols * rows;

  const cardWidth = 88;
  const cardHeight = 80;
  
  const leftMargin = 10;
  const rightMargin = 10;
  const topMargin = 22; // leaving room for clean, minimal page header
  const bottomMargin = 10;

  // Horizontal gaps
  const colGap = (pageWidth - leftMargin - rightMargin - (cols * cardWidth)) / (cols - 1); // (277 - 264) / 2 = 6.5 mm
  
  // Status Color Mapping
  const getStatusHexColor = (status: string): string => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "orçamento":
      case "quote":
        return "#7FFF00";
      case "novo pedido":
      case "novo_pedido":
      case "novo-pedido":
        return "#22c55e"; // adjusted to a solid elegant green
      case "aguardando sinal":
      case "waiting_deposit":
        return "#0080FF";
      case "aguardando aprovação cliente":
      case "approval":
      case "adjustments_requested":
        return "#FBBD04";
      case "em produção":
      case "production":
        return "#FFD100";
      case "montagem":
      case "assembly":
        return "#BD02FC";
      case "pronto para entregar":
      case "ready":
        return "#C7EA46";
      case "enviado":
      case "delivery":
        return "#9ca3af";
      case "recebido":
      case "delivered":
      case "fully_paid":
      case "concluído (pagamento completo)":
        return "#10B981";
      case "cancelled":
        return "#EC7216";
      case "pending":
        return "#0080FF";
      default:
        return "#64748b";
    }
  };

  // Status Label Format
  const getStatusLabel = (status: string): string => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "orçamento":
      case "quote":
        return "Orçamento";
      case "novo pedido":
        return "Novo Pedido";
      case "waiting_deposit":
      case "aguardando sinal":
        return "Aguardando Sinal";
      case "approval":
      case "aguardando aprovação cliente":
        return "Aprovação de Arte";
      case "production":
      case "em produção":
        return "Em Produção";
      case "assembly":
      case "montagem":
        return "Montagem";
      case "ready":
      case "pronto para entregar":
        return "Pronto";
      case "delivery":
      case "enviado":
        return "Enviado";
      case "delivered":
      case "recebido":
      case "concluído (pagamento completo)":
      case "fully_paid":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      case "pending":
        return "Pendente";
      case "adjustments_requested":
        return "Ajustes";
      default:
        return status.toUpperCase();
    }
  };

  // Helper to draw clean vector barcode
  const drawBarcode = (docInstance: typeof doc, code: string, x: number, y: number, width: number, height: number) => {
    const cleanCode = (code || "12345").toUpperCase();
    const str = `*${cleanCode}*`;
    
    let curX = x + (width - 45) / 2;
    if (curX < x + 2) curX = x + 2;
    
    docInstance.setFillColor("#000000");
    
    const drawBar = (w: number) => {
      docInstance.rect(curX, y, w, height, "F");
      curX += w;
    };
    const drawSpace = (w: number) => {
      curX += w;
    };
    
    // Start guards
    drawBar(0.4); drawSpace(0.4); drawBar(0.4); drawSpace(0.5);
    
    // Character loops
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      const b1 = (charCode & 1) ? 0.7 : 0.25;
      const s1 = (charCode & 2) ? 0.6 : 0.25;
      const b2 = (charCode & 4) ? 0.7 : 0.25;
      const s2 = (charCode & 8) ? 0.6 : 0.25;
      const b3 = (charCode & 16) ? 0.7 : 0.25;
      const s3 = (charCode & 32) ? 0.6 : 0.25;
      const b4 = (charCode & 64) ? 0.7 : 0.25;
      
      drawBar(b1); drawSpace(s1);
      drawBar(b2); drawSpace(s2);
      drawBar(b3); drawSpace(s3);
      drawBar(b4); drawSpace(0.3);
    }
    
    // End guards
    drawBar(0.4); drawSpace(0.4); drawBar(0.4);
  };

  const totalPages = Math.ceil(orders.length / cardsPerPage);

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) {
      doc.addPage();
    }

    // Elegant minimal header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor("#3a312d");
    doc.text("CONFERÊNCIA DE PEDIDOS ATIVOS — OPERACIONAL", 10, 11);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor("#8e8e93");
    const atelieLabel = companyId === 'all' ? 'TODOS OS ATELIÊS' : (companyId === 'mimada' ? 'MIMADA SIM' : (companyId === 'tuttymimo' ? 'TUTTY MIMO' : companyId.toUpperCase()));
    doc.text(`ATELIÊ: ${atelieLabel} | DATA: ${safeFormat(new Date(), "dd/MM/yyyy HH:mm")}`, 10, 15);
    doc.text(`PÁGINA ${p + 1} DE ${totalPages}`, pageWidth - 10, 13, { align: "right" });

    // Subtle 35% opacity/very light grey line separator
    doc.setDrawColor("#e5e7eb");
    doc.setLineWidth(0.15);
    doc.line(10, 17, pageWidth - 10, 17);

    const pageOrders = orders.slice(p * cardsPerPage, (p + 1) * cardsPerPage);

    pageOrders.forEach((order, index) => {
      const colIndex = index % cols;
      const rowIndex = Math.floor(index / cols);

      const cx = leftMargin + colIndex * (cardWidth + colGap);
      const cy = topMargin + rowIndex * (cardHeight + 10);

      // Card outer frame with semi-rounded corners
      doc.setDrawColor("#e5e7eb");
      doc.setLineWidth(0.15);
      doc.setFillColor("#ffffff");
      doc.roundedRect(cx, cy, cardWidth, cardHeight, 3.5, 3.5, "FD");

      // 1. Header of the label (Ateliê title and exact status color tag)
      const labelAtelie = order.companyId === 'mimada' ? 'Mimada Sim' : (order.companyId === 'tuttymimo' ? 'Tutty Mimo' : order.companyId.toUpperCase());
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor("#8e8e93");
      doc.text(labelAtelie.toUpperCase(), cx + 4.5, cy + 5.5);

      // Status Tag
      const statusColor = getStatusHexColor(order.status);
      const statusText = getStatusLabel(order.status).toUpperCase();
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(6);
      const textW = doc.getTextWidth(statusText);
      const tagW = textW + 4;
      const tagH = 4.5;
      const tagX = cx + cardWidth - tagW - 4.5;
      const tagY = cy + 2.2;

      // Outer frame of tag styled with the exact status color
      doc.setDrawColor(statusColor);
      doc.setLineWidth(0.1);
      doc.setFillColor("#ffffff");
      doc.roundedRect(tagX, tagY, tagW, tagH, 1, 1, "FD");

      doc.setTextColor(statusColor);
      doc.text(statusText, tagX + 2, tagY + 3.2);

      // Delicate horizontal line
      doc.setDrawColor("#f3f4f6");
      doc.setLineWidth(0.15);
      doc.line(cx + 4.5, cy + 9.5, cx + cardWidth - 4.5, cy + 9.5);

      // 2. Order code & delivery date
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor("#1c1c1e");
      doc.text(`#${order.code || "S/N"}`, cx + 4.5, cy + 14);

      // RED Delivery Date
      const delDate = order.deliveryDate ? safeFormatISO(order.deliveryDate, "dd/MM/yyyy") : "A COMBINAR";
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor("#ef4444"); // Intense red highlight for delivery
      doc.text(`ENTREGA: ${delDate}`, cx + cardWidth - 4.5, cy + 13.8, { align: "right" });

      // Delicate separator
      doc.setDrawColor("#f3f4f6");
      doc.line(cx + 4.5, cy + 18, cx + cardWidth - 4.5, cy + 18);

      // 3. Customer Info & Items
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor("#3a312d");
      const clientRaw = (order.customerName || "CLIENTE NÃO INFORMADO").toUpperCase();
      const clientTrunc = clientRaw.length > 25 ? clientRaw.slice(0, 23) + "..." : clientRaw;
      doc.text(clientTrunc, cx + 4.5, cy + 22.5);

      const totalQty = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor("#8e8e93");
      doc.text(`Qtd: ${totalQty} ${totalQty === 1 ? 'item' : 'itens'}`, cx + cardWidth - 4.5, cy + 22.2, { align: "right" });

      // List details/customizations
      let itemY = cy + 28;
      const itemsToDisplay = (order.items || []).slice(0, 3);

      itemsToDisplay.forEach((item) => {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor("#48484a");
        const qtyStr = `${item.quantity}x `;
        doc.text(qtyStr, cx + 4.5, itemY);

        doc.setFont("Helvetica", "normal");
        const nameX = cx + 4.5 + doc.getTextWidth(qtyStr);
        const nameTrunc = item.product_name.length > 25 ? item.product_name.slice(0, 23) + "..." : item.product_name;
        doc.text(nameTrunc, nameX, itemY);

        // Capture customization / item observations if present
        let customParts: string[] = [];
        if (item.observations && item.observations.trim().length > 0) {
          customParts.push(`Obs: ${item.observations.trim()}`);
        }

        if (item.personalizationValues) {
          const vals = Object.entries(item.personalizationValues)
            .filter(([_, val]) => val && val.trim().length > 0)
            .map(([k, v]) => `${k}: ${v}`);
          if (vals.length > 0) {
            customParts.push(`Pers: ${vals.join(", ")}`);
          }
        } else if (item.customization) {
          const pieces = [];
          if (item.customization.name) pieces.push(`Nome: ${item.customization.name}`);
          if (item.customization.text) pieces.push(`Texto: ${item.customization.text}`);
          if (item.customization.notes) pieces.push(`Notas: ${item.customization.notes}`);
          if (pieces.length > 0) {
            customParts.push(`Pers: ${pieces.join(" | ")}`);
          }
        }

        if (customParts.length > 0) {
          itemY += 3.2;
          doc.setFont("Helvetica", "italic");
          doc.setFontSize(6);
          doc.setTextColor("#8a8a8f");
          const customCombined = customParts.join(" • ");
          const customTrunc = customCombined.length > 48 ? customCombined.slice(0, 45) + "..." : customCombined;
          doc.text(customTrunc, cx + 7, itemY);
        }

        itemY += 4.5;
      });

      // Extra items indicator
      if ((order.items || []).length > 3) {
        doc.setFont("Helvetica", "italic");
        doc.setFontSize(6.5);
        doc.setTextColor("#cca062");
        doc.text(`+ ${(order.items || []).length - 3} itens adicionais...`, cx + 4.5, cy + 47.5);
      }

      // Add general observations if space allows
      if (order.observations && order.observations.trim().length > 0 && (order.items || []).length <= 2) {
        doc.setFont("Helvetica", "italic");
        doc.setFontSize(6.5);
        doc.setTextColor("#8a8a8f");
        const mainObs = `Obs: ${order.observations}`;
        const obsTrunc = mainObs.length > 44 ? mainObs.slice(0, 41) + "..." : mainObs;
        doc.text(obsTrunc, cx + 4.5, cy + 45.5);
      }

      // Delicate separator
      doc.setDrawColor("#f3f4f6");
      doc.line(cx + 4.5, cy + 52, cx + cardWidth - 4.5, cy + 52);

      // 4. Barcode footer
      const bH = 12;
      const bY = cy + 55;
      drawBarcode(doc, order.code || "12345", cx, bY, cardWidth, bH);

      // Text below barcode
      doc.setFont("Courier", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor("#1c1c1e");
      doc.text(order.code || "S/N", cx + cardWidth / 2, cy + 74.5, { align: "center" });
    });
  }

  // Open & Save Actions
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');

  doc.save(`Conferencia_Pedidos_Ativos_${companyId || "Geral"}.pdf`);
};
