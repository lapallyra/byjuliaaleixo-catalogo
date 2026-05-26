import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

import {
  CartItem,
  AppConfig,
  CheckoutData,
  CompanyId,
  SiteSettings
} from '../types';

import { saveSale } from '../services/firebaseService';
import { sendNotifications } from '../services/notificationService';
import { themes } from '../lib/theme';

interface CheckoutModalProps {
  cart: CartItem[];
  config: AppConfig;
  onClose: () => void;
  onSubmit: () => void;
  companyName: string;
  companyId: CompanyId;
  siteSettings: SiteSettings | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cart,
  config,
  onClose,
  onSubmit,
  companyName,
  companyId
}) => {

  const theme =
    themes[companyId as keyof typeof themes] || themes.pallyra;

  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] =
    useState<CheckoutData>({
      name: "",
      birthDate: "",
      cpfCnpj: "",
      contact: "",
      deliveryType: "pickup",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      paymentMethod: "mercadopago",
      installments: 1,
      needsChange: "NÃO",
      changeAmount: "",
      observations: "",
      isEmergency: false
    });

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + (item.retail_price * item.quantity),
    0
  );

  const total = subtotal;

  const maskCpfCnpj = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 14);
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setIsLoading(true);

    try {

      // =========================
      // SALVA PEDIDO
      // =========================

      const docId = await saveSale({
        customerName: formData.name,
        customerCpfCnpj: formData.cpfCnpj,
        contact: formData.contact,
        total,
        companyId,

        items: cart.map(item => ({
          ...item,
          productId: item.id || '',
          product_name: item.product_name || '',
          quantity: item.quantity || 1,
          retail_price: item.retail_price || 0,
          insumos: item.insumos || []
        })),

        deliveryType: formData.deliveryType,
        paymentMethod: formData.paymentMethod,
        source: 'catalog',
        observations: formData.observations
      });

      const savedOrderCode = docId || '';

      // =========================
      // MERCADO PAGO
      // =========================

      const mpItems = cart.map(item => ({
        title: item.product_name || "Item",
        quantity: item.quantity || 1,
        unit_price: item.retail_price || 0,
        currency_id: "BRL"
      }));

      const preferencePayload = {
        orderId: savedOrderCode,
        companyId,

        items: mpItems,

        payer: {
          name: formData.name,

          email: "cliente@naoinformado.com",

          identification: {
            type: "CPF",
            number: formData.cpfCnpj
          }
        },

        back_urls: {
          success:
            `${window.location.origin}?payment_status=approved&order_id=${savedOrderCode}`,

          failure:
            `${window.location.origin}?payment_status=failed&order_id=${savedOrderCode}`,

          pending:
            `${window.location.origin}?payment_status=pending&order_id=${savedOrderCode}`
        },

        auto_return: "approved"
      };

      // =========================
      // FETCH CORRIGIDO
      // =========================

     const response = await fetch("/api/createPreference", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.error || "Erro ao criar pagamento");
}

if (!data.init_point) {
  throw new Error("init_point não retornado.");
}

window.location.href = data.init_point;

      // =========================
      // SALVA PENDÊNCIA
      // =========================

      localStorage.setItem(
        "mp_pending_order",

        JSON.stringify({
          orderId: savedOrderCode,
          formData,
          cart,
          total,
          companyName
        })
      );

      // =========================
      // REDIRECIONA
      // =========================

    } catch (error) {

      console.error(
        "Erro checkout:",
        error
      );

      alert(
        "Erro ao finalizar pedido."
      );

    } finally {

      setIsLoading(false);
    }
  };

  return (

    <div
      className="
        fixed inset-0
        flex items-center justify-center
        z-[3000]
        p-4
      "
    >

      <motion.div
        className="
          fixed inset-0
          bg-black/90
        "
        onClick={onClose}
      />

      <motion.div
        className="
          bg-white
          rounded-2xl
          w-full
          max-w-xl
          z-10
          p-6
          relative
        "
      >

        <button
          onClick={onClose}
          className="
            absolute
            top-4
            right-4
          "
        >
          <X />
        </button>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <h2
            className="
              text-2xl
              font-bold
            "
          >
            Finalizar Pedido
          </h2>

          <input
            className="
              w-full
              border
              p-3
              rounded-xl
            "

            placeholder="Nome"

            value={formData.name}

            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value
              })
            }
          />

          <input
            className="
              w-full
              border
              p-3
              rounded-xl
            "

            placeholder="CPF"

            value={formData.cpfCnpj}

            onChange={(e) =>
              setFormData({
                ...formData,
                cpfCnpj: maskCpfCnpj(
                  e.target.value
                )
              })
            }
          />

          <button
            type="submit"

            disabled={isLoading}

            className="
              w-full
              bg-black
              text-white
              py-3
              rounded-xl
            "
          >

            {isLoading
              ? "Processando..."
              : "Finalizar Pedido"}

          </button>

        </form>

      </motion.div>

    </div>
  );
};