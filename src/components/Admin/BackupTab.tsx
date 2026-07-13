import React, { useState } from "react";
import { Download, Upload, AlertTriangle, CheckCircle2, Shield, Database, FileJson, Clock } from "lucide-react";
import { collection, getDocs, doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { createAuditLog } from "../../services/auditService";
import { useAuth } from "../AuthProvider";

export const BackupTab: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(localStorage.getItem('last_backup_date'));
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const COLLECTIONS = [
    "customers",
    "orders",
    "products",
    "insumos",
    "insumo_movements",
    "finance",
    "settings",
    "admin_users",
    "product_collections",
    "product_campaigns",
    "datas_comemorativas",
    "giftLists",
    "prizes",
    "coupons"
  ];

  const handleExport = async () => {
    if (!window.confirm("Iniciar backup completo do banco de dados? Isso pode levar alguns instantes.")) return;
    
    setLoading(true);
    try {
      const backupData: Record<string, any> = {};
      
      for (const colName of COLLECTIONS) {
        const querySnapshot = await getDocs(collection(db, colName));
        backupData[colName] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      const backupJSON = JSON.stringify(backupData, null, 2);
      const blob = new Blob([backupJSON], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `erp_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const now = new Date().toLocaleString('pt-BR');
      setLastBackupDate(now);
      localStorage.setItem('last_backup_date', now);

      await createAuditLog('Configurações', 'Exportação', 'backup_full', 'Backup do Sistema', { 
        details: `Backup completo realizado. Coleções: ${COLLECTIONS.join(', ')}` 
      });

      alert("Backup realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao realizar backup:", error);
      alert("Erro ao realizar backup. Consulte o console para mais detalhes.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      alert("Selecione um arquivo de backup (.json) primeiro.");
      return;
    }

    if (!window.confirm("⚠️ ATENÇÃO EXTREMA ⚠️\n\nIsso irá SOBRESCREVER os dados atuais com o conteúdo do arquivo de backup.\nTem certeza absoluta que deseja prosseguir?")) {
      return;
    }

    if (prompt("Digite 'RESTAURAR' para confirmar:") !== "RESTAURAR") {
      alert("Operação cancelada.");
      return;
    }

    setRestoreLoading(true);
    try {
      const text = await restoreFile.text();
      const backupData = JSON.parse(text);

      // We process collection by collection in chunks of 500 (Firestore batch limit)
      for (const colName of Object.keys(backupData)) {
        if (!COLLECTIONS.includes(colName)) continue; // security check
        
        const docs = backupData[colName];
        if (!Array.isArray(docs)) continue;

        let batch = writeBatch(db);
        let count = 0;

        for (const docData of docs) {
          const { id, ...data } = docData;
          if (!id) continue;

          const docRef = doc(db, colName, id);
          batch.set(docRef, data); // Overwrite or create
          count++;

          if (count === 490) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
        
        if (count > 0) {
          await batch.commit();
        }
      }

      await createAuditLog('Configurações', 'Restauração', 'restore_full', 'Restauração do Sistema', { 
        details: `Restauração realizada a partir do arquivo: ${restoreFile.name}` 
      });

      alert("Restauração concluída com sucesso!");
      setRestoreFile(null);
    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      alert("Erro ao restaurar backup. Verifique se o arquivo é válido.");
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Backup e Recuperação</h2>
        <p className="text-sm text-slate-500 mt-1">Gerencie a segurança dos dados e continuidade da operação</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EXPORT SECTION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Exportar Backup</h3>
              <p className="text-xs text-slate-500">Baixar cópia local do banco de dados</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-start gap-3">
                <Shield className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Dados incluídos no backup:</p>
                  <p className="text-xs text-slate-500 mt-1">Clientes, Pedidos, Produtos, Estoque, Financeiro, Configurações, Usuários, Campanhas, Cupons e Auditoria.</p>
                </div>
              </div>
            </div>

            {lastBackupDate && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock size={14} />
                <span>Último backup realizado em: <strong>{lastBackupDate}</strong></span>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Gerando Backup...</span>
              ) : (
                <>
                  <Download size={18} />
                  Fazer Download do Backup (JSON)
                </>
              )}
            </button>
          </div>
        </div>

        {/* IMPORT SECTION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Restaurar Sistema</h3>
              <p className="text-xs text-slate-500">Recuperar dados de um backup anterior</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-800">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1">Atenção Crítica</p>
              <p className="text-xs">
                A restauração irá <strong>sobrescrever</strong> os dados atuais pelas informações contidas no arquivo de backup. Esta operação não pode ser desfeita.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Arquivo de Backup (.json)</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleRestore}
              disabled={!restoreFile || restoreLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {restoreLoading ? (
                <span>Restaurando Dados...</span>
              ) : (
                <>
                  <Upload size={18} />
                  Restaurar Banco de Dados
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
