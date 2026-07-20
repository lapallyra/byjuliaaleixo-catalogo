import { Product } from "../types";

export const startProductProduction = async (
  orderId: string,
  product: Product,
  userId: string
) => {
  try {
    const res = await fetch('/api/production/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, userId })
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      return { 
        success: false, 
        error: result.error || "Erro ao iniciar produção no servidor.", 
        warnings: result.warnings || [] 
      };
    }
    return { success: true, warnings: [] };
  } catch (error: any) {
    console.error("Error starting production via API:", error);
    return { success: false, error: error.message || "Erro de conexão ao iniciar produção." };
  }
};

export const startProductionAPI = async (payload: { orderId?: string; batchId?: string; userId: string }) => {
  try {
    const res = await fetch('/api/production/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      const err = new Error(result.error || "Erro ao iniciar produção via API.") as any;
      err.warnings = result.warnings || [];
      throw err;
    }
    return result;
  } catch (error) {
    console.error("Error in startProductionAPI:", error);
    throw error;
  }
};

export const cancelProductionAPI = async (payload: { orderId?: string; batchId?: string; userId: string }) => {
  try {
    const res = await fetch('/api/production/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      const err = new Error(result.error || "Erro ao cancelar produção via API.") as any;
      err.warnings = result.warnings || [];
      throw err;
    }
    return result;
  } catch (error) {
    console.error("Error in cancelProductionAPI:", error);
    throw error;
  }
};
