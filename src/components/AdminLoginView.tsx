import React, { useState, useRef, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from './AuthProvider';
import { LogIn, ArrowLeft, X, Loader2, ShieldCheck, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { login } from '../lib/firebase';
import { checkIsAdminDomain } from '../lib/utils';

const BOX_COUNT = 6;

export function AdminLoginView() {
  const { user, isAdmin, isPinVerified, verifyAdminPin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinDigits, setPinDigits] = useState<string[]>(Array(BOX_COUNT).fill(''));
  const [showPin, setShowPin] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!loading && !isPinVerified) {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, isPinVerified]);

  const enteredCode = pinDigits.join('');

  const handleDigitChange = (index: number, rawValue: string) => {
    setError(null);
    const sanitized = rawValue.replace(/\D/g, '');
    if (!sanitized) {
      const next = [...pinDigits];
      next[index] = '';
      setPinDigits(next);
      return;
    }

    // Handle multi-character paste/autofill
    if (sanitized.length > 1) {
      const next = [...pinDigits];
      const chars = sanitized.slice(0, BOX_COUNT - index).split('');
      chars.forEach((ch, offset) => {
        next[index + offset] = ch;
      });
      setPinDigits(next);
      const nextFocus = Math.min(BOX_COUNT - 1, index + chars.length);
      inputRefs.current[nextFocus]?.focus();

      const combined = next.join('');
      if (verifyAdminPin(combined)) {
        if (user && isAdmin) {
          navigate(checkIsAdminDomain() ? '/' : '/admin', { replace: true });
        }
      }
      return;
    }

    const next = [...pinDigits];
    next[index] = sanitized;
    setPinDigits(next);

    if (index < BOX_COUNT - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const combined = next.join('');
    if (verifyAdminPin(combined)) {
      if (user && isAdmin) {
        navigate(checkIsAdminDomain() ? '/' : '/admin', { replace: true });
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (pinDigits[index]) {
        const next = [...pinDigits];
        next[index] = '';
        setPinDigits(next);
      } else if (index > 0) {
        const next = [...pinDigits];
        next[index - 1] = '';
        setPinDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < BOX_COUNT - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (user && isAdmin) {
        handleVerifyOnly();
      } else {
        handleGoogleLogin();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, BOX_COUNT);
    if (!pasted) return;
    setError(null);
    const next = Array(BOX_COUNT).fill('');
    pasted.split('').forEach((ch, idx) => {
      next[idx] = ch;
    });
    setPinDigits(next);
    const focusIdx = Math.min(BOX_COUNT - 1, pasted.length);
    inputRefs.current[focusIdx]?.focus();

    if (verifyAdminPin(next.join('')) && user && isAdmin) {
      navigate(checkIsAdminDomain() ? '/' : '/admin', { replace: true });
    }
  };

  const ensurePinValid = (): boolean => {
    if (isPinVerified) return true;
    const isValid = verifyAdminPin(enteredCode);
    if (!isValid) {
      setError('Código único inválido. Preencha os dígitos do código secreto de liberação.');
      setPinDigits(Array(BOX_COUNT).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
      return false;
    }
    return true;
  };

  const handleVerifyOnly = () => {
    setError(null);
    if (ensurePinValid() && user && isAdmin) {
      navigate(checkIsAdminDomain() ? '/' : '/admin', { replace: true });
    }
  };

  // If user is logged in but NOT admin, show access denied
  if (user && !isAdmin && !loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 sm:p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white border border-[#D4AF37]/30 p-8 md:p-10 rounded-[28px] shadow-lg flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
            <X className="text-rose-500" size={32} />
          </div>
          <h1 className="whitespace-nowrap text-[clamp(1.35rem,3vw,1.65rem)] font-bold text-[#0F2C59] mb-2 uppercase tracking-tight">
            Acesso Negado
          </h1>
          <p className="text-[#1B2537]/70 mb-6 font-sans text-xs tracking-wider leading-relaxed">
            O e-mail <span className="text-[#0F2C59] font-bold">{user.email}</span> não possui permissão de administrador.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={logout}
              className="bg-[#0F2C59] hover:bg-[#1B3F7A] text-white font-bold py-3 px-6 rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer"
            >
              Sair e tentar com outra conta
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-[#1B2537]/60 hover:text-[#0F2C59] font-bold py-2 text-[10px] uppercase tracking-wider cursor-pointer"
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
      <div className="flex flex-col items-center justify-center h-screen bg-[#FAF8F5] font-sans">
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
              className="text-[#D4AF37]/60"
            >
              <Loader2 size={40} strokeWidth={1.5} />
            </motion.div>
          </div>
          <span className="text-[#0F2C59]/70 font-sans text-[10px] uppercase tracking-[0.3em] font-medium">
            Verificando Credenciais...
          </span>
        </motion.div>
      </div>
    );
  }

  // If user is logged in, is admin AND PIN is verified, redirect to admin dashboard
  if (user && isAdmin && isPinVerified) {
    const isAdminDomain = checkIsAdminDomain();
    return <Navigate to={isAdminDomain ? "/" : "/admin"} replace />;
  }

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    if (!ensurePinValid()) return;

    setIsLoggingIn(true);
    setError(null);

    const timeout = setTimeout(() => {
      setIsLoggingIn(false);
      setError('O login do Google não concluiu. Tente novamente.');
    }, 20000);

    try {
      await login();
    } catch (err: any) {
      console.error('[AdminLogin] Error during handleGoogleLogin:', err);
      let msg = 'Falha ao realizar login com Google. Tente novamente.';

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

  const renderCodeBoxes = () => (
    <div className="w-full mb-5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0F2C59]">
          <KeyRound size={12} className="text-[#D4AF37]" />
          Código Único de Acesso
        </span>
        <button
          type="button"
          onClick={() => setShowPin((prev) => !prev)}
          className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#1B2537]/60 hover:text-[#0F2C59] transition-colors cursor-pointer"
        >
          {showPin ? <EyeOff size={12} /> : <Eye size={12} />}
          <span>{showPin ? 'Ocultar' : 'Mostrar'}</span>
        </button>
      </div>

      <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
        {pinDigits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            aria-label={`Dígito ${index + 1} do código de acesso`}
            className={`w-full h-12 sm:h-13 text-center text-lg font-bold rounded-xl border transition-all outline-none bg-[#FAF8F5] text-[#0F2C59] ${
              isPinVerified
                ? 'border-[#D4AF37] bg-[#F3ECDF]/60'
                : digit
                ? 'border-[#0F2C59] bg-white shadow-xs'
                : 'border-[#D4AF37]/40 focus:border-[#0F2C59] focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/25'
            }`}
          />
        ))}
      </div>

      {isPinVerified ? (
        <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#0F2C59]">
          <CheckCircle2 size={13} className="text-[#D4AF37]" />
          <span>Código secreto validado</span>
        </div>
      ) : (
        <p className="mt-2 text-[10px] text-[#1B2537]/55 font-medium tracking-wide">
          Digite o código secreto de liberação nos campos acima
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 sm:p-6 text-center relative font-sans">
      <div className="absolute top-6 left-6">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 bg-white text-[#0F2C59] rounded-full flex items-center justify-center hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all border border-[#D4AF37]/30 shadow-md cursor-pointer"
          title="Voltar para a Loja"
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      <div className="max-w-md w-full bg-white border border-[#D4AF37]/30 p-7 sm:p-9 rounded-[28px] shadow-xl flex flex-col items-center">
        <div className="w-16 h-16 bg-[#F3ECDF] rounded-2xl flex items-center justify-center mb-5 border border-[#D4AF37]/40 text-[#D4AF37]">
          <ShieldCheck size={32} strokeWidth={1.5} />
        </div>
        <h2 className="whitespace-nowrap text-[clamp(1.25rem,3vw,1.5rem)] font-bold text-[#0F2C59] mb-1 uppercase tracking-tight">
          Painel Administrativo
        </h2>
        <p className="text-[#1B2537]/65 mb-6 font-sans text-xs uppercase tracking-widest leading-relaxed">
          {user && isAdmin
            ? `Conta autenticada: ${user.email}`
            : 'Ateliê VIP • Identifique-se para Acessar'}
        </p>

        {error && (
          <p className="w-full text-[11px] font-medium text-rose-600 mb-5 p-3.5 bg-rose-50/80 rounded-xl border border-rose-200/60 leading-relaxed text-left">
            {error}
          </p>
        )}

        {renderCodeBoxes()}

        {user && isAdmin ? (
          <div className="w-full flex flex-col gap-2.5 mt-1">
            <button
              onClick={handleVerifyOnly}
              className="w-full bg-[#0F2C59] hover:bg-[#1B3F7A] text-white font-bold py-3.5 px-6 rounded-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm cursor-pointer border border-[#D4AF37]/40"
            >
              <ShieldCheck size={16} className="text-[#D4AF37]" />
              <span>Liberar Painel</span>
            </button>
            <button
              onClick={logout}
              className="text-[#1B2537]/60 hover:text-[#0F2C59] transition-all text-[10px] uppercase font-bold tracking-wider mt-1 cursor-pointer"
            >
              Sair e trocar conta Google
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3 mt-1">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full bg-white border border-[#D4AF37]/45 hover:border-[#0F2C59] hover:bg-[#FAF8F5] text-[#0F2C59] font-bold py-3.5 px-6 rounded-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-60"
            >
              {isLoggingIn ? (
                <Loader2 size={16} className="animate-spin text-[#D4AF37]" />
              ) : (
                <LogIn size={16} className="text-[#D4AF37]" />
              )}
              <span>Entrar com Google</span>
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="text-[#1B2537]/60 hover:text-[#0F2C59] transition-all text-[10px] uppercase font-bold tracking-wider mt-6 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={13} /> Ir para a Loja
        </button>
      </div>
    </div>
  );
}
