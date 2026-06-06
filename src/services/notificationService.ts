import { AppConfig, CartItem, CheckoutData } from '../types';

export const sendNotifications = async (
  config: AppConfig,
  cart: CartItem[],
  checkoutData: CheckoutData,
  total: number,
  selectedCompany: string
) => {
  const itemsSummary = cart
    .map(item => {
      let line = `*${item.product_name}* (x${item.quantity}) - R$ ${(item.retail_price * item.quantity).toFixed(2)}`;
      if (item.giftInfo) {
        line += `\n   Brinde: ${item.giftInfo}`;
      }
      return line;
    })
    .join('\n');

  const deliveryInfo = checkoutData.deliveryType === 'pickup'
    ? 'Retirada em Loja'
    : checkoutData.deliveryType === 'delivery'
    ? `Entrega em: ${checkoutData.address}, ${checkoutData.city} - ${checkoutData.state}`
    : 'Envio Postal';

  const paymentInfo = checkoutData.paymentMethod === 'pix'
    ? `Pagamento via PIX\nCNPJ: ${config.store_cnpj}\nValor: R$ ${total.toFixed(2)}`
    : checkoutData.paymentMethod === 'credit_card'
    ? `Pagamento via Cartão de Crédito (${checkoutData.installments}x)`
    : checkoutData.paymentMethod === 'pix_parcelado'
    ? `Pagamento via PIX Parcelado (${checkoutData.installments}x)`
    : `Pagamento em Dinheiro${checkoutData.needsChange === 'SIM' ? ` (Troco para R$ ${checkoutData.changeAmount})` : ''}`;

  let phoneNumber = (config.whatsapp_number || "5500999999999").replace(/\D/g, "");
  if (phoneNumber.length === 11 && phoneNumber.startsWith("00")) {
    phoneNumber = "55" + phoneNumber;
  }

  const message = `Olá, vim pelo Catálogo ${selectedCompany.toUpperCase()} e gostaria de finalizar meu pedido:\n\n` +
    `DETALHES DO PEDIDO\n` +
    `---------------------------\n\n` +
    `CLIENTE\n` +
    `Nome: ${checkoutData.name}\n` +
    `Contato: ${checkoutData.contact}\n\n` +
    `PRODUTOS\n${itemsSummary}\n` +
    (checkoutData.roulettePrize || checkoutData.wonPrize ? `🎁 Brinde ganho na roleta: ${checkoutData.roulettePrize || checkoutData.wonPrize}\n` : '') +
    `\nTOTAL DO PEDIDO: R$ ${total.toFixed(2)}\n\n` +
    `FORMA DE ENTREGA\n${deliveryInfo}\n\n` +
    `FORMA DE PAGAMENTO\n${paymentInfo}\n\n` +
    `OBSERVAÇÕES\n${checkoutData.observations || 'Nenhuma'}\n\n` +
    `Pedido gerado via sistema em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;

  // Log for debugging
  console.log('✅ Notification ready for WhatsApp:', phoneNumber);

  // Return WhatsApp URL for the client to open
  const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  return waUrl;
};
