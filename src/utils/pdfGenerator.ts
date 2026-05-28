import { jsPDF } from "jspdf";
import { Order, SiteSettings } from "../types";
import { formatCurrency } from "../lib/currencyUtils";
import { safeFormat, safeFormatISO } from "../lib/dateUtils";

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
  doc.text(`Tipo Entrega: ${order.deliveryType === "pickup" ? "Retirada no Ateliê" : "Entrega em Domicílio/Frete"}`, 110, y);
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
    const signalPaid = order.signalValue || (order.total * 0.5);
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
  doc.text("La Pallyra • com amor, Guennita • Mimada Sim — Gestão Unificada Premium.", 15, y + 4);

  doc.save(`Performance_Financeira_${data.companyId}_${monthLabel.replace(/\s+/g, '_')}.pdf`);
};
