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

// HELPER: Load image as base64
const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
};

export const generatePremiumA4Receipt = async (order: any, settings: any) => {
  const doc = new jsPDF();
  const themeColor = settings?.theme_primary_color || '#D48C8C';

  // HELPER: Convert hex to rgb
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 212, g: 140, b: 140 };
  };
  const rgb = hexToRgb(themeColor);

  // TOPO - Logo & Marca
  let y = 15;
  try {
    if (settings?.store_logo) {
      const logoBase64 = await loadImage(settings.store_logo);
      doc.addImage(logoBase64, 'PNG', 15, y, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(settings?.store_name?.toUpperCase() || "ATELIÊ", 50, y + 20);
      y += 35;
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(settings?.store_name?.toUpperCase() || "ATELIÊ", 105, y + 10, { align: "center" });
      y += 25;
    }
  } catch (e) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(settings?.store_name?.toUpperCase() || "ATELIÊ", 105, y + 10, { align: "center" });
    y += 25;
  }

  doc.setDrawColor(rgb.r, rgb.g, rgb.b);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  y += 10;

  // BLOCO 01 - LADO ESQUERDO (DADOS DA EMPRESA) e DIREITO (DADOS DO PEDIDO)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text("DADOS DA EMPRESA", 15, y);
  doc.text("DADOS DO PEDIDO", 110, y);
  
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(`Razão Social: ${settings?.store_legal_name || "63.348.579 JULIA GABRIELA SILVA ALEIXO"}`, 15, y);
  doc.text(`Código do Pedido: ${order.code}`, 110, y);
  
  y += 5;
  doc.text(`CNPJ: ${settings?.store_cnpj || "63.348.579/0001-06"}`, 15, y);
  const orderDate = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : new Date(order.createdAt).toLocaleString();
  doc.text(`Data do Pedido: ${orderDate}`, 110, y);
  
  y += 5;
  doc.text(`Telefone: ${settings?.store_contact || "(44) 97400-2857"}`, 15, y);
  const deliveryDateStr = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'A combinar';
  doc.text(`Data de Entrega: ${deliveryDateStr}`, 110, y);
  
  y += 5;
  doc.text(`Instagram: ${settings?.instagram || "@byjuliaaleixo.online"}`, 15, y);
  const emissionDate = new Date().toLocaleString();
  doc.text(`Data de Emissão: ${emissionDate}`, 110, y);
  
  y += 10;
  doc.setDrawColor(230);
  doc.setLineWidth(0.1);
  doc.line(15, y, 195, y);
  y += 10;

  // BLOCO 02 - DADOS DO CLIENTE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text("DADOS DO CLIENTE", 15, y);
  
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(`${order.customerName}`, 15, y);
  if (order.customerCpfCnpj) {
    y += 5;
    doc.text(`CPF/CNPJ: ${order.customerCpfCnpj}`, 15, y);
  }
  y += 5;
  doc.text(`Contato: ${order.contact || "N/A"}`, 15, y);
  if (order.address) {
    y += 5;
    const splitAddr = doc.splitTextToSize(`Endereço: ${order.address}`, 180);
    doc.text(splitAddr, 15, y);
    y += (splitAddr.length - 1) * 5;
  }
  
  y += 12;

  // BLOCO 03 - TABELA DE PRODUTOS
  const tableData = order.items.map((item: any) => [
    item.product_name || item.name,
    order.isWholesale ? 'Atacado' : 'Varejo',
    item.quantity.toString(),
    item.unit || 'un',
    `R$ ${item.price.toFixed(2).replace('.', ',')}`,
    `R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`
  ]);

  (doc as any).autoTable({
    startY: y,
    head: [['Descrição Produto / Serviço', 'Tipo', 'Quantidade', 'Unidade', 'Valor Unitário', 'Valor Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [rgb.r, rgb.g, rgb.b], textColor: 255, fontStyle: 'bold' },
    margin: { left: 15, right: 15 },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 }
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // BLOCO 04 - RESUMO FINANCEIRO
  const subtotal = order.items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
  const discount = (subtotal + (order.shippingCost || 0)) - order.total;
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  doc.text("Subtotal", 130, y);
  doc.text(`R$ ${subtotal.toFixed(2).replace('.', ',')}`, 185, y, { align: "right" });
  y += 7;
  doc.text("Desconto", 130, y);
  doc.text(`- R$ ${discount > 0 ? discount.toFixed(2).replace('.', ',') : '0,00'}`, 185, y, { align: "right" });
  y += 7;
  doc.text("Taxa de Entrega", 130, y);
  doc.text(`R$ ${(order.shippingCost || 0).toFixed(2).replace('.', ',')}`, 185, y, { align: "right" });
  y += 10;
  
  doc.setFillColor(rgb.r, rgb.g, rgb.b);
  doc.rect(130, y - 6, 65, 12, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255);
  doc.text("TOTAL", 135, y + 2);
  doc.text(`R$ ${order.total.toFixed(2).replace('.', ',')}`, 190, y + 2, { align: "right" });
  
  // RODAPÉ
  const pageHeight = doc.internal.pageSize.height;
  y = pageHeight - 35;

  doc.setDrawColor(rgb.r, rgb.g, rgb.b);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.text("Presentes Personalizados para todos os seus momentos ❤", 105, y, { align: "center" });
  
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text((settings?.store_contact || "(44) 97400-2857"), 50, y, { align: "center" });
  doc.text("www.byjuliaaleixo.online", 150, y, { align: "center" });

  return doc;
};

export const sharePDF = async (doc: jsPDF, fileName: string, whatsappNumber?: string) => {
  const blob = doc.output('blob');
  const file = new File([blob], `${fileName}.pdf`, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: fileName,
        text: 'Olá! Segue o resumo do seu pedido elegante e profissional.',
      });
    } catch (error) {
      console.error('Error sharing', error);
      doc.save(`${fileName}.pdf`);
    }
  } else {
    // Download first
    doc.save(`${fileName}.pdf`);
    // Then open WhatsApp if number provided
    if (whatsappNumber) {
      const cleanPhone = whatsappNumber.replace(/\D/g, '');
      const text = encodeURIComponent(`Olá! Acabei de gerar o resumo elegante do seu pedido. O arquivo foi baixado e você pode enviá-lo agora.`);
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    }
  }
};

