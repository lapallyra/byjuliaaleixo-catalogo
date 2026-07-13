import React, { useState, useEffect } from "react";
import { Plus, User, Shield, CheckCircle2, XCircle, Search, Edit2 } from "lucide-react";
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { AdminUser, UserRole } from "../../types";

export const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("ATENDIMENTO");
  const [active, setActive] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "admin_users"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser?.id) {
        await updateDoc(doc(db, "admin_users", editingUser.id), {
          name,
          email: email.toLowerCase(),
          role,
          active
        });
      } else {
        const id = email.toLowerCase();
        await setDoc(doc(db, "admin_users", id), {
          name,
          email: email.toLowerCase(),
          role,
          active,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Erro ao salvar usuário");
    }
  };

  const openEdit = (u: AdminUser) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setActive(u.active);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setRole("ATENDIMENTO");
    setActive(true);
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Usuários e Permissões</h2>
          <p className="text-sm text-slate-500 mt-1">Gerencie os acessos ao painel administrativo</p>
        </div>
        <button
          onClick={openNew}
          className="bg-pink-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-pink-600 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 text-sm">Carregando usuários...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perfil de Acesso</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500 text-sm">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 border border-blue-100">
                          <Shield size={12} />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.active ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 text-[11px] font-semibold">
                            <CheckCircle2 size={14} /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                            <XCircle size={14} /> Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 text-slate-400 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
                          title="Editar usuário"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all text-slate-800 font-medium"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">E-mail de Acesso (Google)</label>
                <input
                  type="email"
                  required
                  value={email}
                  disabled={!!editingUser}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all text-slate-800 font-medium disabled:bg-slate-50 disabled:text-slate-500"
                />
                {!editingUser && <p className="text-[10px] text-slate-400">O usuário precisará usar este e-mail do Google para fazer login.</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Perfil de Acesso</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all text-slate-800 font-medium"
                >
                  <option value="ADMINISTRADOR">Administrador (Acesso Total)</option>
                  <option value="ATENDIMENTO">Atendimento (Clientes, Pedidos, Orçamentos)</option>
                  <option value="PRODUCAO">Produção (Pedidos em Produção, Estoque)</option>
                  <option value="FINANCEIRO">Financeiro (Pagamentos, Relatórios)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Usuário Ativo</span>
                  <input type="checkbox" className="hidden" checked={active} onChange={e => setActive(e.target.checked)} />
                </label>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
