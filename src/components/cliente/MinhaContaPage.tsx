import React, { useState, useEffect } from 'react';
import { useCustomer } from '../../hooks/useCustomer';
import { updateCustomer, saveCustomer } from '../../services/firebaseService';
import { useAuth } from '../AuthProvider';
import { 
  User, 
  Phone, 
  Mail, 
  Save, 
  X, 
  Edit2, 
  Shield, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export const MinhaContaPage: React.FC = () => {
  const { customer, loading } = useCustomer();
  const { user } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cpf: '',
    birthDate: '',
    notes: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        cpf: (customer as any).cpf || '',
        birthDate: (customer as any).birthDate || '',
        notes: customer.notes || ''
      });
    } else if (user) {
      setFormData({
        name: user.displayName || '',
        phone: user.phoneNumber || '',
        cpf: '',
        birthDate: '',
        notes: ''
      });
    }
  }, [customer, user]);

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-500 flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#8C6D37] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#2A2421]">Carregando dados da sua conta...</p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      if (customer?.id) {
        await updateCustomer(customer.id, {
          ...customer,
          name: formData.name,
          phone: formData.phone,
          cpf: formData.cpf,
          birthDate: formData.birthDate,
          notes: formData.notes
        } as any);
      } else if (user?.email) {
        await saveCustomer({
          name: formData.name || user.displayName || 'Cliente',
          email: user.email,
          phone: formData.phone,
          cpf: formData.cpf,
          birthDate: formData.birthDate,
          notes: formData.notes
        } as any);
      }
      setEditing(false);
      setSuccessMsg('Dados do perfil atualizados com sucesso!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      setErrorMsg('Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendResetPassword = async () => {
    const targetEmail = customer?.email || user?.email;
    if (!targetEmail) return;
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 6000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      alert('Erro ao solicitar e-mail de redefinição.');
    }
  };

  const activeEmail = customer?.email || user?.email || 'Sem e-mail cadastrado';

  return (
    <div className="space-y-5 pb-8 px-2 sm:px-3">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2A2421] tracking-tight">Minha Conta & Perfil</h1>
          <p className="text-xs text-[#6E645E] mt-0.5">
            Gerencie suas informações pessoais e credenciais do Ateliê.
          </p>
        </div>

        {!editing ? (
          <button 
            onClick={() => setEditing(true)} 
            className="flex items-center gap-2 text-xs font-bold bg-[#F5F1EB] hover:bg-[#2A2421] text-[#2A2421] hover:text-white px-5 py-2.5 rounded-full border border-stone-200/80 transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <Edit2 size={14} /> Editar Perfil
          </button>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button 
              onClick={() => setEditing(false)} 
              className="text-xs font-bold bg-stone-100 hover:bg-stone-200 text-[#2A2421] px-4 py-2.5 rounded-full transition-all cursor-pointer"
            >
              <X size={14} /> Cancelar
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="text-xs font-bold bg-[#2A2421] hover:bg-[#8C6D37] text-white px-5 py-2.5 rounded-full transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              {saving ? 'Salvando...' : (
                <>
                  <Save size={14} />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* FEEDBACK NOTIFICATIONS */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* MAIN PROFILE CARD */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C6D37] border-b border-stone-200/80 pb-3">
          <Sparkles size={14} />
          <span>Dados Pessoais</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* NOME COMPLETO */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#6E645E] uppercase tracking-wider">
              Nome Completo
            </label>
            {editing ? (
              <input 
                type="text"
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="w-full bg-[#F5F1EB] p-3 rounded-xl border border-stone-200/80 text-xs text-[#2A2421] focus:outline-none focus:border-[#8C6D37]" 
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-[#F5F1EB]/60 rounded-xl border border-stone-200/60 text-xs text-[#2A2421]">
                <User size={18} className="text-[#8C6D37] shrink-0" />
                <span className="font-semibold">{formData.name || 'Não informado'}</span>
              </div>
            )}
          </div>

          {/* EMAIL */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#6E645E] uppercase tracking-wider">
              E-mail de Acesso (Login)
            </label>
            <div className="flex items-center gap-3 p-3 bg-[#F5F1EB]/60 rounded-xl border border-stone-200/60 text-xs text-[#2A2421]">
              <Mail size={18} className="text-[#8C6D37] shrink-0" />
              <span className="font-semibold">{activeEmail}</span>
              <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">Verificado</span>
            </div>
          </div>

          {/* TELEFONE */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#6E645E] uppercase tracking-wider">
              WhatsApp / Telefone
            </label>
            {editing ? (
              <input 
                type="tel"
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                placeholder="(11) 99999-9999"
                className="w-full bg-[#F5F1EB] p-3 rounded-xl border border-stone-200/80 text-xs text-[#2A2421] focus:outline-none focus:border-[#8C6D37]" 
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-[#F5F1EB]/60 rounded-xl border border-stone-200/60 text-xs text-[#2A2421]">
                <Phone size={18} className="text-[#8C6D37] shrink-0" />
                <span className="font-semibold">{formData.phone || 'Não informado'}</span>
              </div>
            )}
          </div>

          {/* CPF */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#6E645E] uppercase tracking-wider">
              CPF (para Emissão de Nota Fiscal)
            </label>
            {editing ? (
              <input 
                type="text"
                value={formData.cpf} 
                onChange={(e) => setFormData({...formData, cpf: e.target.value})} 
                placeholder="000.000.000-00"
                className="w-full bg-[#F5F1EB] p-3 rounded-xl border border-stone-200/80 text-xs text-[#2A2421] focus:outline-none focus:border-[#8C6D37]" 
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-[#F5F1EB]/60 rounded-xl border border-stone-200/60 text-xs text-[#2A2421]">
                <CreditCard size={18} className="text-[#8C6D37] shrink-0" />
                <span className="font-semibold">{formData.cpf || 'Não cadastrado'}</span>
              </div>
            )}
          </div>

          {/* DATA DE NASCIMENTO */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] font-bold text-[#6E645E] uppercase tracking-wider">
              Data de Nascimento (para Mimos de Aniversário)
            </label>
            {editing ? (
              <input 
                type="date"
                value={formData.birthDate} 
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})} 
                className="w-full bg-[#F5F1EB] p-3 rounded-xl border border-stone-200/80 text-xs text-[#2A2421] focus:outline-none focus:border-[#8C6D37]" 
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-[#F5F1EB]/60 rounded-xl border border-stone-200/60 text-xs text-[#2A2421]">
                <Calendar size={18} className="text-[#8C6D37] shrink-0" />
                <span className="font-semibold">{formData.birthDate ? new Date(formData.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* SECURITY CARD */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C6D37]">
            <Shield size={16} />
            <span>Segurança da Conta</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F5F1EB]/70 border border-stone-200/80">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#2A2421] flex items-center gap-1.5">
              <Key size={14} className="text-[#8C6D37]" />
              <span>Redefinir Senha de Acesso</span>
            </h4>
            <p className="text-[11px] text-[#6E645E]">
              Enviaremos um link de segurança direto para o seu e-mail cadastrado.
            </p>
          </div>

          <button
            onClick={handleSendResetPassword}
            disabled={resetSent}
            className="px-4 py-2 rounded-full bg-[#2A2421] hover:bg-[#8C6D37] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer shrink-0"
          >
            {resetSent ? 'E-mail Enviado! ✓' : 'Enviar Link de Senha'}
          </button>
        </div>
      </div>

    </div>
  );
};

