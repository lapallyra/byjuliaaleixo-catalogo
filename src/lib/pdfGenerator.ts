import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

export const generatePremiumThermalReceipt = async (order: any, settings: any) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [58, 280],
  });

  doc.setFont('courier', 'normal');

  // Header
  doc.setFontSize(10);
  doc.text('COMPROVANTE DE COMPRA', 29, 10, { align: 'center' });
  doc.text('DOCUMENTO NÃO FISCAL', 29, 15, { align: 'center' });
  doc.text('--------------------------', 29, 20, { align: 'center' });

  // Company / Order ID
  doc.setFontSize(8);
  doc.text(settings?.store_name || 'Ateliê', 29, 25, { align: 'center' });
  doc.text(`Nº de Série: ${order.code}`, 2, 35);
  doc.text(`Data: ${new Date(order.createdAt?.toDate?.() || order.createdAt).toLocaleString()}`, 2, 40);
  doc.text('--------------------------', 29, 45, { align: 'center' });

  // Customer / Delivery
  doc.text(`Cliente: ${order.customerName}`, 2, 50);
  doc.text(`Contato: ${order.contact}`, 2, 55);
  doc.text(`Entrega: ${order.deliveryType || 'N/A'}`, 2, 60);
  doc.text('--------------------------', 29, 65, { align: 'center' });

  // Table
  let y = 75;
  order.items.forEach((item: any) => {
    doc.text(`${item.name} (${item.quantity} un)`, 2, y);
    doc.text(`R$ ${(item.price * item.quantity).toFixed(2)}`, 56, y, { align: 'right' });
    y += 5;
  });

  doc.text('--------------------------', 29, y, { align: 'center' });
  y += 5;
  doc.text(`Subtotal: R$ ${order.total.toFixed(2)}`, 56, y, { align: 'right' });
  y += 5;
  doc.text(`Total: R$ ${order.total.toFixed(2)}`, 56, y, { align: 'right' });
  
  // Footer QR
  y += 15;
  const qrDataUrl = await QRCode.toDataURL(`https://www.byjuliaaleixo.online/rastreamento?code=${order.code}`);
  doc.addImage(qrDataUrl, 'PNG', 14, y, 30, 30);
  
  return doc;
};

export const generateA4ProductionOrder = async (order: any, settings: any) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('ORDEM DE PRODUÇÃO', 105, 10, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Pedido: ${order.code}`, 20, 30);
    // ... add more A4 layout details based on requirements
    return doc;
};

export const generatePremiumA4Receipt = async (order: any, settings: any) => {
  const doc = new jsPDF();
  const themeColor = settings?.theme_primary_color || '#000000';

  // HELPER: Convert hex to rgb
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  const rgb = hexToRgb(themeColor);

  // TOPO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("COMPROVANTE DE COMPRA", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("DOCUMENTO NÃO FISCAL", 105, 26, { align: "center" });

  doc.setDrawColor(200, 200, 200);
  doc.line(15, 32, 195, 32);

  // HEADER (Logo + Marca)
  let y = 42;
  // If logo loading is required, it can be added here if available as base64 string
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.text(settings?.store_name || "ATELIÊ", 105, y, { align: "center" });
  
  y += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, 195, y);
  y += 10;

  // BLOCO 01 - DADOS DA EMPRESA vs IDENTIFICAÇÃO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text("DADOS DA EMPRESA", 15, y);
  doc.text("IDENTIFICAÇÃO", 110, y);
  
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Razão Social: ${settings?.store_name || "63.348.579 JULIA GABRIELA SILVA ALEIXO"}`, 15, y);
  doc.text(`Nº DE SÉRIE: ${order.code}`, 110, y);
  
  y += 5;
  doc.text(`CNPJ: ${settings?.store_cnpj || "63.348.579/0001-06"}`, 15, y);
  const dateStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : new Date(order.createdAt).toLocaleString();
  doc.text(`Data de Emissão: ${dateStr}`, 110, y);
  
  y += 5;
  doc.text(`Telefone: ${settings?.store_contact || "(44) 97400-2857"}`, 15, y);
  
  y += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, 195, y);
  y += 10;

  // BLOCO 02 - DADOS DO CLIENTE vs DADOS DO PEDIDO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DADOS DO CLIENTE", 15, y);
  doc.text("DADOS DO PEDIDO", 110, y);
  
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nome: ${order.customerName}`, 15, y);
  doc.text(`Código do Pedido: ${order.code}`, 110, y);
  
  y += 5;
  doc.text(`Contato: ${order.contact}`, 15, y);
  doc.text(`Pedido feito em: ${dateStr}`, 110, y);
  
  y += 5;
  doc.text(`Entrega em: ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'A combinar'}`, 110, y);
  
  y += 10;

  // BLOCO 03 - FAIXA ÚNICA DADOS DE ENTREGA
  doc.setFillColor(245, 245, 245);
  doc.rect(15, y, 180, 25, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DE ENTREGA", 20, y + 6);
  doc.setFont("helvetica", "normal");
  const deliveryTypeStr = order.deliveryType === 'retirada' ? 'Retirada' : order.deliveryType === 'shipping' ? 'Envio / Correios' : 'Delivery';
  doc.text(`Método de entrega: ${deliveryTypeStr}`, 20, y + 12);
  doc.text(`Taxa: R$ ${(order.shippingCost || 0).toFixed(2).replace('.', ',')}`, 80, y + 12);
  doc.text(`Endereço: ${order.address || 'N/A'}`, 20, y + 18);
  
  y += 35;

  // BLOCO 04 - TABELA DE PRODUTOS
  const tableData = order.items.map((item: any) => [
    item.product_name || item.name,
    order.isWholesale ? 'Atacado' : 'Varejo',
    item.quantity.toString(),
    'un',
    `R$ ${item.price.toFixed(2).replace('.', ',')}`,
    `R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`
  ]);

  (doc as any).autoTable({
    startY: y,
    head: [['Descrição Produto / Serviço', 'Tipo', 'Quantidade', 'Unidade', 'Valor Unitário', 'Valor Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [rgb.r, rgb.g, rgb.b], textColor: 255 },
    margin: { left: 15, right: 15 },
    styles: { font: 'helvetica', fontSize: 9 }
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // BLOCO 05 - RESUMO FINANCEIRO
  const subtotal = order.items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
  const discount = (subtotal + (order.shippingCost || 0)) - order.total;
  
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", 130, y);
  doc.text(`R$ ${subtotal.toFixed(2).replace('.', ',')}`, 170, y, { align: "right" });
  y += 6;
  doc.text("Desconto", 130, y);
  doc.text(`- R$ ${discount > 0 ? discount.toFixed(2).replace('.', ',') : '0,00'}`, 170, y, { align: "right" });
  y += 6;
  doc.text("Taxa de Entrega", 130, y);
  doc.text(`R$ ${(order.shippingCost || 0).toFixed(2).replace('.', ',')}`, 170, y, { align: "right" });
  y += 8;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.text("TOTAL", 130, y);
  doc.text(`R$ ${order.total.toFixed(2).replace('.', ',')}`, 170, y, { align: "right" });
  
  y += 15;

  // BLOCO 06 - Mensagem da Marca
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100);
  const msg = settings?.receipt_message || "Obrigada por confiar em nosso trabalho.\nCada detalhe foi produzido com carinho especialmente para você.";
  const splitMsg = doc.splitTextToSize(msg, 180);
  doc.text(splitMsg, 105, y, { align: "center" });

  // RODAPÉ FIXO
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, pageHeight - 45, 195, pageHeight - 45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100);
  
  // Left
  doc.text("Documento não fiscal, emitido por MEI.", 15, pageHeight - 35);
  doc.text("Não gera direito a crédito fiscal de IPI.", 15, pageHeight - 30);
  
  // Center
  doc.setFont("helvetica", "bold");
  doc.text("Este comprovante é apenas", 105, pageHeight - 35, { align: "center" });
  doc.text("para conferência do pedido", 105, pageHeight - 30, { align: "center" });
  doc.text("e NÃO substitui nota fiscal.", 105, pageHeight - 25, { align: "center" });
  
  // Right QR
  try {
    const qrDataUrl = await QRCode.toDataURL(`https://www.byjuliaaleixo.online/rastreamento?code=${order.code}`);
    doc.addImage(qrDataUrl, 'PNG', 170, pageHeight - 40, 20, 20);
  } catch(e) {}
  
  // Abaixo do Rodapé
  doc.setFillColor(rgb.r, rgb.g, rgb.b);
  doc.rect(0, pageHeight - 15, 210, 15, 'F');
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("Presentes Personalizados para todos os seus momentos ❤", 105, pageHeight - 9, { align: "center" });
  doc.text((settings?.store_contact || "(44) 97400-2857"), 15, pageHeight - 9);
  doc.text("www.byjuliaaleixo.online", 195, pageHeight - 9, { align: "right" });

  return doc;
};
