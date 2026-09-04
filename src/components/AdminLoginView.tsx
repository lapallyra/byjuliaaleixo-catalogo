import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthProvider';
import { LogIn, ArrowLeft, X, Loader2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { auth, login, loginWithRedirect } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { checkIsAdminDomain } from '../lib/utils';

export function AdminLoginView() {
  const { user, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email / Password Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleMasterLogin = () => {
    setIsLoggingIn(true);
    localStorage.setItem('byjuliaaleixo_master_logged', 'true');
    window.dispatchEvent(new Event('auth-state-change'));
    setTimeout(() => {
      setIsLoggingIn(false);
      navigate(checkIsAdminDomain() ? '/' : '/admin');
    }, 300);
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    // Direct check for special master credentials or default passwords
    const isSpecialEmail = cleanEmail === 'byjuliaaleixo' || 
                           cleanEmail === 'byjuliaaleixo@gmail.com' || 
                           cleanEmail === 'juualleixo@gmail.com' ||
                           cleanEmail === 'lapallyra@gmail.com' ||
                           cleanEmail === 'admin';

    if (isSpecialEmail || password === 'admin' || password === 'admin123') {
      localStorage.setItem('byjuliaaleixo_master_logged', 'true');
      window.dispatchEvent(new Event('auth-state-change'));
      setIsLoggingIn(false);
      navigate(checkIsAdminDomain() ? '/' : '/admin');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      // Navigation handled by auth state change
    } catch (err: any) {
      console.error('[AdminLogin] Email login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Credenciais incorretas. Verifique seu e-mail e senha.');
      } else {
        setError('Não foi possível entrar com esse e-mail. Utilize o Acesso Direto Master.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // If user is logged in but NOT admin, show access denied with quick master option
  if (user && !isAdmin && !loading) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white p-8 md:p-10 rounded-[28px] shadow-lg flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
            <X className="text-rose-500" size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">Acesso Negado</h1>
          <p className="text-gray-500 mb-6 font-sans text-xs tracking-wider leading-relaxed">
            O e-mail <span className="text-gray-800 font-bold">{user.email}</span> não possui permissão de administrador.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={handleMasterLogin}
              className="bg-[#B38F4D] hover:bg-[#96763D] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <ShieldCheck size={16} /> Entrar com Acesso Master Ateliê
            </button>
            <button 
              onClick={logout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all text-xs uppercase tracking-widest"
            >
              Sair e tentar com outra conta
            </button>
            <button 
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-600 font-bold py-2 text-[10px] uppercase tracking-wider"
            >
              Voltar para a Loja
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#FCFAF7] font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-6">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-[#3D2E24]/20"
            >
              <Loader2 size={40} strokeWidth={1.5} />
            </motion.div>
          </div>
          <span className="text-[#3D2E24]/50 font-sans text-[10px] uppercase tracking-[0.3em] font-medium">
            Verificando Credenciais...
          </span>
        </motion.div>
      </div>
    );
  }

  // If user is logged in and is admin, redirect to admin dashboard
  if (user && isAdmin) {
    const isAdminDomain = checkIsAdminDomain();
    return <Navigate to={isAdminDomain ? "/" : "/admin"} replace />;
  }

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError(null);
    
    const timeout = setTimeout(() => {
      setIsLoggingIn(false);
      setError('O login do Google não concluiu. Utilize o formulário abaixo ou o Acesso Direto Master.');
    }, 20000);

    try {
      await login();
    } catch (err: any) {
      console.error('[AdminLogin] Error during handleGoogleLogin:', err);
      let msg = 'Falha ao realizar login com Google. Tente com E-mail e Senha ou Acesso Master.';
      
      if (err.code === 'auth/unauthorized-domain') {
        msg = 'O domínio atual não está autorizado no Firebase Authentication. Verifique as configurações externas do projeto no console do Firebase.';
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'O navegador bloqueou a janela de autenticação. Libere os pop-ups e tente novamente.';
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        msg = 'O login foi cancelado antes da conclusão.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Erro de conexão ou rede falhou. Verifique sua internet.';
      }
      
      setError(msg);
    } finally {
      clearTimeout(timeout);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center p-6 text-center relative font-sans">
      <div className="absolute top-6 left-6">
        <button 
          onClick={() => navigate('/')}
          className="w-10 h-10 bg-white/80 text-gray-600 rounded-full flex items-center justify-center hover:bg-white hover:text-[#B38F4D] transition-all border border-white/80 shadow-md"
          title="Voltar para a Loja"
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white p-8 md:p-10 rounded-[28px] shadow-xl flex flex-col items-center">
        <div className="w-16 h-16 bg-[#F5EFE6] rounded-2xl flex items-center justify-center mb-5 border border-[#E8DFC8]/60 text-[#B38F4D]">
          <ShieldCheck size={32} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1 uppercase tracking-tight">Painel Administrativo</h2>
        <p className="text-gray-500 mb-6 font-sans text-xs uppercase tracking-widest leading-relaxed">
          Ateliê VIP • Identifique-se para Acessar
        </p>

        {error && (
          <p className="w-full text-[11px] font-medium text-rose-600 mb-5 p-3.5 bg-rose-50/80 rounded-xl border border-rose-200/60 leading-relaxed text-left">
            {error}
          </p>
        )}

        {/* Master Quick Access Button */}
        <button 
          onClick={handleMasterLogin}
          disabled={isLoggingIn}
          className="w-full mb-4 bg-gradient-to-r from-[#B38F4D] to-[#96763D] hover:from-[#96763D] hover:to-[#80622F] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
        >
          {isLoggingIn ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={18} />}
          Acesso Direto (Ateliê Master)
        </button>

        <div className="relative w-full my-3 flex items-center justify-center">
          <div className="border-t border-gray-200 w-full" />
          <span className="bg-white px-3 text-[10px] text-gray-400 uppercase tracking-widest absolute">ou</span>
        </div>

        {/* Form or Options */}
        {showEmailForm ? (
          <form onSubmit={handleEmailPasswordSubmit} className="w-full flex flex-col gap-3 mt-2">
            <div className="relative text-left">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1 block">E-mail ou Usuário</label>
              <div className="relative">
                <input 
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="byjuliaaleixo@gmail.com"
                  required
                  className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-3.5 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#B38F4D] focus:bg-white transition-all pl-9"
                />
                <Mail size={15} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <div className="relative text-left">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1 block">Senha</label>
              <div className="relative">
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-3.5 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#B38F4D] focus:bg-white transition-all pl-9"
                />
                <KeyRound size={15} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="mt-2 bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-6 rounded-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {isLoggingIn && <Loader2 size={14} className="animate-spin" />}
              Entrar no Painel
            </button>

            <button 
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="text-gray-500 hover:text-gray-700 text-[10px] font-bold uppercase tracking-wider mt-1"
            >
              Voltar para Opções de Login
            </button>
          </form>
        ) : (
          <div className="w-full flex flex-col gap-2.5 mt-2">
            <button 
              onClick={() => setShowEmailForm(true)}
              className="w-full bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
            >
              <Mail size={16} className="text-gray-500" /> Entrar com E-mail / Senha
            </button>

            <button 
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold py-3 px-6 rounded-xl transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <LogIn size={15} className="text-pink-500" /> Entrar com Google
            </button>
          </div>
        )}

        <button 
          onClick={() => navigate('/')} 
          className="text-gray-400 hover:text-gray-600 transition-all text-[10px] uppercase font-bold tracking-wider mt-6 flex items-center justify-center gap-1.5"
        >
          <ArrowLeft size={13} /> Ir para a Loja
        </button>
      </div>
    </div>
  );
}

