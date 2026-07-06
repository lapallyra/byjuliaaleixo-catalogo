import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Order } from "../../types";

interface OrderProductionLabelProps {
  order: Order;
}

export const OrderProductionLabel: React.FC<OrderProductionLabelProps> = ({ order }) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && order.code) {
      JsBarcode(barcodeRef.current, order.code, {
        format: "CODE128",
        width: 2,
        height: 40,
        displayValue: false,
        margin: 0,
      });
    }
  }, [order.code]);

  // Block 1: Get first product name
  const productName = order.items?.[0]?.product_name || "Produto Sem Nome";

  return (
    <div className="w-[80mm] h-[40mm] p-[2mm] bg-white text-black font-sans flex flex-col justify-between box-border overflow-hidden print:m-0">
      {/* HEADER */}
      <div className="text-[10px] font-bold">
        {order.code}
      </div>

      {/* BLOCO 1: Product Name */}
      <div className="font-bold text-[14px] truncate" title={productName}>
        {productName}
      </div>

      {/* BLOCO 2: PEDIDO & Number */}
      <div className="flex flex-col">
        <div className="text-[8px] font-bold text-gray-500 uppercase">PEDIDO</div>
        <div className="text-[20px] font-black leading-none">{order.code}</div>
      </div>

      {/* RODAPÉ: Barcode */}
      <div className="mt-auto">
        <svg ref={barcodeRef} className="w-full h-[10mm]"></svg>
        <div className="text-center text-[10px] font-bold mt-[-2px]">{order.code}</div>
      </div>
    </div>
  );
};
