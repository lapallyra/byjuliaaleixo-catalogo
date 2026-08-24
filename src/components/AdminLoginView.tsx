import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthProvider';
import { LogIn, ArrowLeft, X, Loader2 } from 'lucide-react';
import { login, loginWithRedirect } from '../lib/firebase';
import { checkIsAdminDomain } from '../lib/utils';

export function AdminLoginView() {
  const { user, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // If user is logged in but NOT admin, show access denied
  if (user && !isAdmin && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-8 text-center">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
          <X className="text-rose-500" size={40} />
        </div>
        <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Acesso Negado</h1>
        <p className="text-slate-400 mb-8 max-w-sm font-sans text-xs uppercase tracking-widest leading-loose">
          O e-mail <span className="text-white font-bold">{user.email}</span> não possui permissões administrativas.
        </p>
        <button 
          onClick={logout}
          className="bg-white text-black font-bold py-4 px-10 rounded-2xl hover:scale-105 transition-all uppercase tracking-widest text-[10px]"
        >
          Sair e Voltar
        </button>
      </div>
    );
  }  if (loading) {
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
              className="text-[#3D2E24]/10"
            >
              <Loader2 size={40} strokeWidth={1} />
            </motion.div>
          </div>
          <span className="text-[#3D2E24]/40 font-sans text-[9px] uppercase tracking-[0.4em] font-medium">
            Verificando Credenciais
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

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError(null);
    
    // Safety timeout to prevent stuck loading state
    const timeout = setTimeout(() => {
      setIsLoggingIn(false);
      setError('A autenticação está demorando muito. Verifique se a janela de login não está aberta em outra aba ou se o bloqueador de pop-ups impediu a abertura.');
    }, 60000); // 60 seconds

    try {
      await login();
    } catch (err: any) {
      console.error('[AdminLogin] Error during handleLogin:', err);
      let msg = 'Houve um erro ao tentar entrar.';
      if (err.code === 'auth/popup-blocked') {
        msg = 'O bloqueador de pop-ups impediu o login. Por favor, autorize pop-ups para este site e tente novamente.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Erro de rede. Verifique sua conexão.';
      }
      setError(msg);
    } finally {
      clearTimeout(timeout);
      setIsLoggingIn(false);
    }
  };

  const handleRedirectLogin = () => {
    setIsLoggingIn(true);
    loginWithRedirect();
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center p-6 text-center relative font-sans">
      <div className="absolute top-6 left-6">
        <button 
          onClick={() => window.history.back()}
          className="w-10 h-10 bg-white/80 text-gray-600 rounded-full flex items-center justify-center hover:bg-white hover:text-pink-600 transition-all border border-white/80 shadow-md"
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      <div className="max-w-md w-full bg-white/75 backdrop-blur-xl border border-white/80 p-8 md:p-12 rounded-[28px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05),_inset_0_1px_2px_rgba(255,255,255,0.9)] flex flex-col items-center">
        {user && !isAdmin ? (
          <>
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
              <span className="text-3xl">🚫</span>
            </div>
            <h1 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">Acesso Negado</h1>
            <p className="text-gray-500 mb-8 font-sans text-xs uppercase tracking-widest leading-loose">
              Sua conta ({user.email}) não possui permissões administrativas. Entre em contato com o suporte se isso for um erro.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={logout}
                className="bg-gradient-to-b from-pink-400 to-pink-500 text-white font-bold py-4 px-10 rounded-[14px] hover:from-pink-500 hover:to-pink-600 transition-all shadow-[0_10px_20px_rgba(255,20,147,0.15)] uppercase tracking-widest text-[10px]"
              >
                Sair e tentar com outra conta
              </button>
              <button 
                onClick={() => navigate('/')}
                className="text-gray-700 bg-white border border-gray-200 font-bold py-4 px-10 rounded-[14px] hover:bg-gray-50 transition-all uppercase tracking-widest text-[10px]"
              >
                Voltar para Loja
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-pink-50/50 rounded-2xl flex items-center justify-center mb-6 border border-pink-100/80 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9)]">
              <LogIn className="text-pink-500" size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 uppercase tracking-tight">Painel Restrito</h2>
            <p className="text-gray-500 mb-8 font-sans text-xs uppercase tracking-widest leading-relaxed">
              Acesso exclusivo para administração. Identifique-se.
            </p>
            <div className="flex flex-col gap-3 w-full">
              {error && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-4 p-4 bg-rose-50/50 rounded-2xl border border-rose-100 leading-relaxed">
                  {error}
                </p>
              )}
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className={`${isLoggingIn ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'} bg-gradient-to-b from-pink-500 to-pink-600 text-white font-bold py-4 px-10 rounded-[14px] transition-all shadow-[0_10px_25px_rgba(255,20,147,0.18)] uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 w-full`}
              >
                {isLoggingIn && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isLoggingIn ? 'Carregando...' : 'Entrar com Google'}
              </button>

              {!isLoggingIn && (
                <button 
                  onClick={handleRedirectLogin}
                  className="text-pink-500 hover:text-pink-600 transition-all text-[8px] uppercase font-bold tracking-widest mt-2"
                >
                  Problemas com o popup? Tente aqui
                </button>
              )}
              <button 
                onClick={() => navigate('/')} 
                className="text-gray-400 hover:text-gray-600 transition-all text-[9px] uppercase font-bold tracking-wider mt-4 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={12} strokeWidth={1.5} /> Sair da Área Restrita
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
