import React from "react";
import { useParams, Navigate } from "react-router-dom";

/**
 * ClientCheckout (Compatibilidade Legada)
 * Redireciona de forma transparente para a rota oficial unificada de Checkout (/checkout/:code).
 * Preserva compatibilidade com links antigos gerados no passado.
 */
export const ClientCheckout: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  if (!code) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to={`/checkout/${code}`} replace />;
};

