import React from "react";

function PremiumCheckout() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-10 max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-4">
          Checkout Premium ✨
        </h1>

        <p className="text-gray-600 mb-8">
          Seu novo checkout está funcionando.
        </p>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl border">
            1. Personalização
          </div>

          <div className="p-4 rounded-2xl border">
            2. Entrega
          </div>

          <div className="p-4 rounded-2xl border">
            3. Pagamento
          </div>

          <div className="p-4 rounded-2xl border">
            4. Confirmação
          </div>
        </div>

        <button className="mt-8 w-full bg-black text-white py-4 rounded-2xl font-semibold hover:opacity-90 transition">
          Finalizar pedido
        </button>
      </div>
    </div>
  );
}

export default PremiumCheckout;