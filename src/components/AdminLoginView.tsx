import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LogIn, ArrowLeft, X } from 'lucide-react';
import { login, loginWithRedirect } from '../lib/firebase';

export function AdminLoginView() {
  const { user, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
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
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950">
        <div className="w-12 h-12 border-4 border-lilac border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-lilac">Verificando Credenciais...</p>
      </div>
    );
  }

  // If user is logged in and is admin, redirect to admin dashboard
  if (user && isAdmin) {
    return <Navigate to="/admin" replace />;
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
    <div className="feminine-admin min-h-screen bg-[#0b0507] flex flex-col items-center justify-center p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed" style={{backgroundBlendMode: 'overlay'}}>
      <div className="absolute top-6 left-6">
        <button 
          onClick={() => window.history.back()}
          className="w-10 h-10 bg-[#140b0e] text-rose-300 rounded-full flex items-center justify-center hover:bg-[#2b141e] hover:text-rose-100 transition-all border border-rose-900/30 shadow-lg"
        >
          <ArrowLeft size={16} />
        </button>
      </div>
      {user && !isAdmin ? (
        <>
          <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mb-6 border border-rose-500/20">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-3xl font-black text-rose-100 mb-4 uppercase tracking-tighter italic">Acesso Negado</h1>
          <p className="text-rose-300 mb-8 max-w-sm font-sans text-xs uppercase tracking-widest leading-loose">
            Sua conta ({user.email}) não possui permissões administrativas. Entre em contato com o suporte se isso for um erro.
          </p>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={logout}
              className="bg-[#C6A664] text-[#0b0507] font-bold py-4 px-10 rounded-2xl hover:scale-105 transition-all shadow-[0_20px_60px_rgba(198,166,100,0.2)] uppercase tracking-widest text-[10px]"
            >
              Sair e tentar com outra conta
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="text-white hover:text-[#C6A664] font-bold py-4 px-10 border border-white/20 rounded-2xl hover:bg-white/5 transition-all uppercase tracking-widest text-[10px]"
            >
              Voltar para Loja
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="w-24 h-24 bg-[#C6A664]/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-[#C6A664]/20 shadow-[0_0_30px_rgba(198,166,100,0.1)]">
            <LogIn className="text-[#C6A664]" size={40} />
          </div>
          <h2 className="text-3xl font-black text-rose-50 mb-4 uppercase tracking-tighter italic">Painel Restrito</h2>
          <p className="text-rose-300 mb-8 max-w-sm font-sans text-xs uppercase tracking-widest leading-loose opacity-80">
            Acesso exclusivo para administração. Identifique-se.
          </p>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            {error && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-4 p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 leading-relaxed">
                {error}
              </p>
            )}
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className={`${isLoggingIn ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} bg-[#C6A664] text-[#0b0507] font-bold py-4 px-10 rounded-2xl transition-all shadow-[0_20px_60px_rgba(198,166,100,0.25)] uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 w-full`}
            >
              {isLoggingIn && <div className="w-3 h-3 border-2 border-[#0b0507] border-t-transparent rounded-full animate-spin" />}
              {isLoggingIn ? 'Carregando...' : 'Entrar com Google'}
            </button>

            {!isLoggingIn && (
              <button 
                onClick={handleRedirectLogin}
                className="text-rose-400 hover:text-white transition-all text-[8px] uppercase font-black tracking-widest mt-2 opacity-60 hover:opacity-100"
              >
                Problemas com o popup? Tente aqui
              </button>
            )}
            <button 
              onClick={() => window.location.href = '/'} 
              className="text-rose-300 hover:text-white transition-all text-[9px] uppercase font-black tracking-[0.3em] mt-4 flex items-center justify-center gap-2 opacity-50 hover:opacity-100"
            >
              <ArrowLeft size={12} /> Sair da Área Restrita
            </button>
          </div>
        </>
      )}
    </div>
  );
}
