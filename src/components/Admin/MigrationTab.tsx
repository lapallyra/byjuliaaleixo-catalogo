import React, { useState } from "react";
import { Play, AlertCircle, CheckCircle2, Shield, Users, RefreshCw } from "lucide-react";
import { collection, getDocs, doc, writeBatch, query, where, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { createAuditLog } from "../../services/auditService";
import { useAuth } from "../AuthProvider";
import { Customer, Order } from "../../types";
import { normalizePhone, resolveOrderCustomer } from "../../utils/customerUtils";

export const MigrationTab: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dupLoading, setDupLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const handleMigration = async () => {
    if (!window.confirm("Iniciar migração de pedidos sem customerId?")) return;
    setLoading(true);
    setLogs([]);
    
    try {
      addLog("Iniciando carregamento de clientes...");
      const customersSnap = await getDocs(collection(db, "customers"));
      const customers = customersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
      addLog(`Encontrados ${customers.length} clientes no sistema.`);

      addLog("Buscando pedidos...");
      const ordersSnap = await getDocs(collection(db, "orders"));
      const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      
      const ordersWithoutId = allOrders.filter(o => !o.customerId);
      addLog(`Encontrados ${ordersWithoutId.length} pedidos sem customerId.`);

      let processed = 0;
      let updated = 0;
      let notFound = 0;
      
      // Lotes de 500 (limite do batch no Firestore)
      const batchSize = 400; 
      for (let i = 0; i < ordersWithoutId.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = ordersWithoutId.slice(i, i + batchSize);
        let chunkUpdates = 0;

        for (const order of chunk) {
          processed++;
          const matchedCustomer = resolveOrderCustomer(order, customers);
          
          if (matchedCustomer && matchedCustomer.id) {
            batch.update(doc(db, "orders", order.id!), { customerId: matchedCustomer.id });
            updated++;
            chunkUpdates++;
          } else {
            notFound++;
          }
        }

        if (chunkUpdates > 0) {
          addLog(`Salvando lote de ${chunkUpdates} alterações...`);
          await batch.commit();
        }
      }

      const summary = `Migração finalizada. Processados: ${processed}, Atualizados: ${updated}, Sem correspondência: ${notFound}.`;
      addLog(summary);

      await createAuditLog(
        "Configurações",
        "Alteração",
        "migration",
        "Saneamento de Dados",
        { details: summary },
        "pallyra" as any
      );

    } catch (err: any) {
      addLog(`ERRO: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicates = async () => {
    setDupLoading(true);
    setDuplicates([]);
    try {
      const customersSnap = await getDocs(collection(db, "customers"));
      const customers = customersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
      
      const byEmail = new Map<string, Customer[]>();
      const byPhone = new Map<string, Customer[]>();
      const byCpf = new Map<string, Customer[]>();

      for (const c of customers) {
        if (c.email) {
          const e = c.email.toLowerCase().trim();
          if (e) {
             if (!byEmail.has(e)) byEmail.set(e, []);
             byEmail.get(e)!.push(c);
          }
        }
        
        const phone = normalizePhone(c.contact);
        if (phone) {
          if (!byPhone.has(phone)) byPhone.set(phone, []);
          byPhone.get(phone)!.push(c);
        }

        const cpf = normalizePhone(c.cpfCnpj);
        if (cpf) {
          if (!byCpf.has(cpf)) byCpf.set(cpf, []);
          byCpf.get(cpf)!.push(c);
        }
      }

      const dupes: any[] = [];
      const addDupe = (type: string, value: string, group: Customer[]) => {
        if (group.length > 1) {
          dupes.push({ type, value, group });
        }
      };

      byEmail.forEach((group, val) => addDupe("Email", val, group));
      byPhone.forEach((group, val) => addDupe("Telefone", val, group));
      byCpf.forEach((group, val) => addDupe("CPF/CNPJ", val, group));

      setDuplicates(dupes);
    } catch (err) {
      console.error(err);
    } finally {
      setDupLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#3D2E24] mb-2 font-display tracking-tight">Saneamento de Dados</h2>
        <p className="text-[#3D2E24]/60 text-sm">
          Execute rotinas de migração progressiva e auditoria de relacionamentos do CRM.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 border border-[#3D2E24]/10 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#cca062]/20 flex items-center justify-center text-[#cca062]">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#3D2E24]">Migração Progressiva</h3>
              <p className="text-xs text-[#3D2E24]/60">Vincular pedidos legados ao customerId correto.</p>
            </div>
          </div>
          <button
            onClick={handleMigration}
            disabled={loading}
            className="w-full bg-[#3D2E24] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#3D2E24]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? "Processando..." : "Iniciar Migração de Pedidos"}
          </button>

          {logs.length > 0 && (
            <div className="mt-4 bg-[#F8F7F5] rounded-xl p-4 h-64 overflow-y-auto border border-[#3D2E24]/5">
              <ul className="space-y-2 font-mono text-[10px] text-[#3D2E24]/70">
                {logs.map((log, i) => (
                  <li key={i}>{log}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#3D2E24]/10 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#3D2E24]/10 flex items-center justify-center text-[#3D2E24]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#3D2E24]">Auditoria de Duplicados</h3>
              <p className="text-xs text-[#3D2E24]/60">Identificar clientes com informações repetidas.</p>
            </div>
          </div>
          <button
            onClick={checkDuplicates}
            disabled={dupLoading}
            className="w-full bg-white border border-[#3D2E24]/20 text-[#3D2E24] py-3 rounded-lg text-sm font-semibold hover:bg-[#F8F7F5] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {dupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
            {dupLoading ? "Analisando..." : "Verificar Duplicidades"}
          </button>

          {duplicates.length > 0 && (
            <div className="mt-4 bg-[#F8F7F5] rounded-xl p-4 max-h-64 overflow-y-auto border border-[#3D2E24]/5 space-y-4">
              <p className="text-xs font-bold text-[#3D2E24]">Grupos Duplicados Encontrados ({duplicates.length})</p>
              {duplicates.map((d, i) => (
                <div key={i} className="bg-white p-3 rounded-lg border border-[#3D2E24]/10 shadow-sm">
                  <p className="text-[10px] font-bold text-[#cca062] mb-2">{d.type}: {d.value}</p>
                  <div className="space-y-1">
                    {d.group.map((c: Customer) => (
                      <div key={c.id} className="text-[10px] text-[#3D2E24]/70 flex justify-between">
                        <span>{c.name || 'Sem nome'}</span>
                        <span className="opacity-50">{c.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!dupLoading && duplicates.length === 0 && logs.length === 0 && (
             <div className="mt-4 flex flex-col items-center justify-center h-48 bg-[#F8F7F5] rounded-xl border border-[#3D2E24]/5">
               <Shield className="w-8 h-8 text-[#3D2E24]/20 mb-2" />
               <p className="text-xs font-medium text-[#3D2E24]/40">Relatório de auditoria limpo</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
