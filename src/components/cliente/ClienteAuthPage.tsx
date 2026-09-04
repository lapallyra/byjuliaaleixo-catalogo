import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  Heart, 
  Gift, 
  Eye, 
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Store,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { saveCustomer } from '../../services/firebaseService';

interface ClienteAuthPageProps {
  initialMode?: 'login' | 'cadastro';
  onSuccess?: () => void;
}

export const ClienteAuthPage: React.FC<ClienteAuthPageProps> = ({ 
  initialMode = 'login',
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'cadastro'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Handle Login with Email & Password
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Por favor, preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const inputEmailClean = loginEmail.trim().toLowerCase();
    const isSpecialUser = inputEmailClean === 'byjuliaaleixo' || 
                          inputEmailClean === 'byjuliaaleixo@gmail.com' ||
                          inputEmailClean === 'byjuliaaleixo@atelie.com' ||
                          inputEmailClean.startsWith('byjuliaaleixo@');

    // Liberated direct login for master credential "byjuliaaleixo" / "admin"
    if (isSpecialUser) {
      if (loginPassword !== 'admin' && loginPassword !== 'admin123') {
        setErrorMsg('Senha incorreta para a conta por Julia Aleixo.');
        setLoading(false);
        return;
      }

      const targetEmail = 'byjuliaaleixo@gmail.com';
      
      // Store local master session & notify listeners
      localStorage.setItem('byjuliaaleixo_master_logged', 'true');
      window.dispatchEvent(new Event('auth-state-change'));

      // Non-blocking attempt to sync with Firebase Auth / Firestore in background
      signInWithEmailAndPassword(auth, targetEmail, 'admin123')
        .catch(() => createUserWithEmailAndPassword(auth, targetEmail, 'admin123'))
        .catch(() => signInAnonymously(auth))
        .then(() => {
          if (auth.currentUser) {
            updateProfile(auth.currentUser, { displayName: 'Júlia Aleixo' }).catch(() => {});
          }
        })
        .catch((e) => console.log('[SpecialAuth] Background auth note:', e));

      saveCustomer({
        name: 'Júlia Aleixo',
        email: targetEmail,
        phone: '',
        contacts: [{ id: '1', phone: '', email: targetEmail, type: 'Principal', isMain: true }]
      }, { bypassCpfCheck: true }).catch(() => {});

      setSuccessMsg('Acesso liberado com sucesso! Redirecionando...');
      setLoading(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/minha-experiencia');
      }
      return;
    }

    // Standard email verification login for all other users
    try {
      const emailToSignIn = inputEmailClean;
      if (!emailToSignIn.includes('@')) {
        setErrorMsg('Por favor, informe um endereço de e-mail válido com @ (ex: seu.email@exemplo.com).');
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, emailToSignIn, loginPassword);
      setSuccessMsg('Bem-vindo(a) de volta! Acessando sua conta...');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Email login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('E-mail ou senha incorretos. Verifique seus dados.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('Por favor, informe um e-mail válido com @.');
      } else {
        setErrorMsg(err.message || 'Erro ao realizar login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!registerName.trim()) {
      setErrorMsg('Informe seu nome completo.');
      return;
    }
    if (!registerEmail.trim()) {
      setErrorMsg('Informe seu e-mail.');
      return;
    }
    if (!registerPassword) {
      setErrorMsg('Crie uma senha de acesso.');
      return;
    }
    if (registerPassword.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }
    if (!acceptTerms) {
      setErrorMsg('Você precisa aceitar os termos de privacidade.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail.trim(), registerPassword);
      const user = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: registerName.trim()
      });

      // Save Customer record in Firestore
      await saveCustomer({
        name: registerName.trim(),
        email: registerEmail.trim().toLowerCase(),
        phone: registerPhone.trim(),
        contacts: [
          { id: '1', phone: registerPhone.trim(), email: registerEmail.trim().toLowerCase(), type: 'Principal', isMain: true }
        ],
        notes: 'Cadastro criado via Portal de Clientes'
      });

      setSuccessMsg('Conta criada com sucesso! Redirecionando...');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já possui cadastro. Faça login ou recupere sua senha.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('E-mail em formato inválido.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Escolha uma senha mais forte (mínimo 6 caracteres).');
      } else {
        setErrorMsg(err.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset Email
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) {
      alert('Por favor, digite seu e-mail registrado.');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotPasswordEmail.trim());
      alert(`Enviamos um link de redefinição de senha para: ${forgotPasswordEmail}`);
      setIsResetModalOpen(false);
      setForgotPasswordEmail('');
    } catch (err: any) {
      console.error('Password reset error:', err);
      alert('Não foi possível enviar o e-mail de redefinição. Verifique se o e-mail está correto.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFA] flex flex-col justify-center pt-8 sm:pt-12 pb-10 px-2 sm:px-3 md:px-4">
      <div className="w-full max-w-6xl mx-auto mb-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF6F0] text-[#8C6D37] hover:text-[#2C1810] border border-[#E8DFC8] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft size={14} />
          <span>Voltar para a Loja</span>
        </button>
      </div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* LEFT PANEL: BENEFITS & AESTHETIC INFOGRAPHIC */}
        <div className="lg:col-span-5 space-y-6 text-[#2C1810]">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF0E6] border border-[#E8DFC8] text-[#8C6D37] text-xs font-bold uppercase tracking-[0.2em] shadow-xs">
            <Sparkles size={14} className="text-[#B38F4D]" />
            <span>Área Exclusiva do Cliente</span>
          </div>

          <div>
            <h1 className="font-mea-culpa text-5xl sm:text-6xl text-[#2C1810] leading-none mb-3">
              Ateliê do Afeto
            </h1>
            <p className="text-sm text-[#593E32] font-light leading-relaxed">
              Sua experiência personalizada reunida em um só lugar. Acompanhe seus pedidos, gerencie presentes e guarde memórias inesquecíveis.
            </p>
          </div>

          {/* Benefits list */}
          <div className="space-y-3 pt-2">
            {[
              {
                title: 'Acompanhamento em Tempo Real',
                desc: 'Acompanhe a produção artesanal e rastreamento da entrega.',
                icon: ShieldCheck
              },
              {
                title: 'Histórico & Memórias Afetivas',
                desc: 'Guarde os detalhes de cada presente e evento especial.',
                icon: Heart
              },
              {
                title: 'Listas de Presentes & Favoritos',
                desc: 'Monte seu enxoval, lista de casamento ou presentes de aniversário.',
                icon: Gift
              }
            ].map((benefit, bIdx) => {
              const Icon = benefit.icon;
              return (
                <div key={bIdx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-[#E8DFC8]/70 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF0E6] text-[#8C6D37] flex items-center justify-center shrink-0 border border-[#E8DFC8]">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#2C1810] uppercase tracking-wider">
                      {benefit.title}
                    </h3>
                    <p className="text-[11px] text-[#6D5443] font-light leading-snug mt-0.5">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2C1810] to-[#3A2A20] text-white shadow-md flex items-center justify-between border border-[#8C6D37]/40">
            <div className="flex items-center gap-2.5">
              <Sparkles className="text-[#CCA062]" size={18} />
              <span className="text-xs font-medium text-amber-100">Atendimento Humanizado via WhatsApp</span>
            </div>
            <a 
              href="https://wa.me/5511999999999?text=Olá,%20preciso%20de%20ajuda%20no%20meu%20cadastro" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-bold uppercase tracking-wider bg-[#CCA062] hover:bg-[#b58c4f] text-[#2C1810] px-3 py-1.5 rounded-full transition-all"
            >
              Suporte
            </a>
          </div>
        </div>

        {/* RIGHT PANEL: AUTH CARD FORM */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#E8DFC8] shadow-xl relative overflow-hidden">
          
          {/* Top Switcher Tabs */}
          <div className="flex bg-[#FAF6F0] p-1.5 rounded-full border border-[#E8DFC8] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#2C1810] text-white shadow-md'
                  : 'text-[#6D5443] hover:text-[#2C1810]'
              }`}
            >
              Entrar na Minha Conta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('cadastro');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                mode === 'cadastro'
                  ? 'bg-[#2C1810] text-white shadow-md'
                  : 'text-[#6D5443] hover:text-[#2C1810]'
              }`}
            >
              Criar Nova Conta
            </button>
          </div>

          {/* Notifications */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 animate-shake">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6D5443] mb-1.5">
                  Endereço de E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6D37]">
                    <Mail size={16} />
                  </div>
                  <input
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com ou usuário"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF6F0]/50 text-xs text-[#2C1810] focus:outline-none focus:border-[#8C6D37] focus:bg-white transition-all placeholder-[#8C6D37]/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6D5443]">
                    Sua Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordEmail(loginEmail);
                      setIsResetModalOpen(true);
                    }}
                    className="text-[11px] font-semibold text-[#8C6D37] hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6D37]">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF6F0]/50 text-xs text-[#2C1810] focus:outline-none focus:border-[#8C6D37] focus:bg-white transition-all placeholder-[#8C6D37]/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8C6D37] hover:text-[#2C1810]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#2C1810] hover:bg-[#8C6D37] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <span>Acessando conta...</span>
                ) : (
                  <>
                    <span>Entrar no Meu Painel</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6D5443] mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6D37]">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Sua Maria ou João da Silva"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF6F0]/50 text-xs text-[#2C1810] focus:outline-none focus:border-[#8C6D37] focus:bg-white transition-all placeholder-[#8C6D37]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6D5443] mb-1.5">
                    E-mail Principal
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6D37]">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF6F0]/50 text-xs text-[#2C1810] focus:outline-none focus:border-[#8C6D37] focus:bg-white transition-all placeholder-[#8C6D37]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6D5443] mb-1.5">
                    WhatsApp / Celular
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6D37]">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF6F0]/50 text-xs text-[#2C1810] focus:outline-none focus:border-[#8C6D37] focus:bg-white transition-all placeholder-[#8C6D37]/50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6D5443] mb-1.5">
                    Crie uma Senha (mín. 6 chars)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6D37]">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF6F0]/50 text-xs text-[#2C1810] focus:outline-none focus:border-[#8C6D37] focus:bg-white transition-all placeholder-[#8C6D37]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6D5443] mb-1.5">
                    Confirme a Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6D37]">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF6F0]/50 text-xs text-[#2C1810] focus:outline-none focus:border-[#8C6D37] focus:bg-white transition-all placeholder-[#8C6D37]/50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="rounded border-[#E8DFC8] text-[#8C6D37] focus:ring-[#8C6D37] accent-[#8C6D37]"
                />
                <label htmlFor="acceptTerms" className="text-[11px] text-[#593E32]">
                  Concordo em guardar minhas informações com segurança no Ateliê.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#2C1810] hover:bg-[#8C6D37] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <span>Criando seu cadastro...</span>
                ) : (
                  <>
                    <span>Finalizar Meu Cadastro</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>

      {/* RESET PASSWORD MODAL */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E8DFC8] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#E8DFC8] pb-3">
                <h3 className="font-serif text-lg text-[#2C1810] font-bold">
                  Redefinir Senha
                </h3>
                <button 
                  onClick={() => setIsResetModalOpen(false)}
                  className="text-xs text-[#8C6D37] hover:text-[#2C1810] font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#593E32]">
                Digite o e-mail cadastrado na sua conta. Enviaremos as instruções para você redefinir sua senha com segurança.
              </p>

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#6D5443] mb-1">
                    E-mail da Conta
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF6F0]/50 text-xs text-[#2C1810] focus:outline-none focus:border-[#8C6D37]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-4 py-2 rounded-full border border-[#E8DFC8] text-xs font-semibold text-[#593E32]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-5 py-2 rounded-full bg-[#2C1810] text-white text-xs font-bold uppercase tracking-wider"
                  >
                    {resetLoading ? 'Enviando...' : 'Enviar E-mail'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
