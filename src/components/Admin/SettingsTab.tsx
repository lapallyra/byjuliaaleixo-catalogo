import React, { useState, useEffect } from "react";
import {
  Building2,
  Smartphone,
  CreditCard,
  FileText,
  Upload,
  Save,
  Gift,
  ChevronRight,
  Facebook,
  QrCode,
  CheckCircle,
  Store,
  MapPin,
  Phone,
  Trash2,
  Scissors,
  Maximize2,
  RotateCw,
  X as CloseIcon,
  Calculator,
  User,
  Truck,
  X,
  Bell,
} from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { DynamicPricingList } from "./DynamicPricingList";
import { CompanyId, SiteSettings } from "../../types";
import {
  getSiteSettings,
  saveSiteSettings,
  getGlobalSettings,
  saveGlobalSettings,
  saveAppConfig,
  getSystemNotificationsConfig,
  saveSystemNotificationsConfig,
  subscribeToTelegramLogs,
  performSystemReset
} from "../../services/firebaseService";
import { format } from "date-fns";
import { ImageWithFallback } from "../ImageWithFallback";
import { resendTelegramNotification } from "../../services/telegramService";

interface SettingsTabProps {
  companyId: CompanyId;
}

interface BrandSettings {
  id: CompanyId;
  name: string;
  logo: string;
  slogan: string;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ companyId }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    | "brand"
    | "about"
    | "pix"
    | "pricing"
    | "receipt"
    | "roulette"
    | "notifications"
    | "reset"
  >("brand");
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telegramConfig, setTelegramConfig] = useState<any>({
    telegram_enabled: false,
    telegram_bot_token: '',
    telegram_chat_id: '',
  });
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
  const [telegramLogs, setTelegramLogs] = useState<any[]>([]);

  const [showEditor, setShowEditor] = useState(false);
  const [tempLogo, setTempLogo] = useState<string | null>(null);
  const [editingAtelierId, setEditingAtelierId] = useState<CompanyId | null>(
    null,
  );

  const [confirmInput, setConfirmInput] = useState("");
  const [resetProgress, setResetProgress] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleResetAction = async () => {
    if (confirmInput.trim().toUpperCase() !== "RESETAR SISTEMA") return;

    if (!window.confirm("ATENÇÃO: Você confirma que deseja RESETAR COMPLETAMENTE OS DADOS operacionais? Essa ação apagará todos os Clientes, Produtos, Insumos e Pedidos em definitivo!")) {
      return;
    }

    setResetProgress("loading");
    try {
      await performSystemReset();
      setResetProgress("success");
      setConfirmInput("");
      alert("O sistema foi redefinido aos padrões iniciais de uso com sucesso!");
      setActiveSubTab("brand");
    } catch (e) {
      console.error(e);
      setResetProgress("error");
      alert("Erro ao redefinir o sistema. Consulte os logs no console.");
    } finally {
      setResetProgress("idle");
    }
  };

  // New state for multi-atelier branding
  const [allAteliers, setAllAteliers] = useState<
    Record<CompanyId, Partial<SiteSettings>>
  >({
    pallyra: {},
    guennita: {},
    mimada: {},
    tuttymimo: {},
  });

  useEffect(() => {
    const load = async () => {
      const data = await getSiteSettings(companyId);
      const globalData = await getGlobalSettings();
      if (data) {
         setSettings({ ...data, ...globalData });
      } else if (globalData) {
         setSettings(globalData);
      }

      const tgConfig = await getSystemNotificationsConfig();
      if (tgConfig) {
        setTelegramConfig({
          ...tgConfig,
          telegram_bot_token: tgConfig.telegram_bot_token ? decryptHex(tgConfig.telegram_bot_token) : ''
        });
        if (tgConfig.telegram_enabled && tgConfig.telegram_bot_token && tgConfig.telegram_chat_id) {
           setTelegramStatus('success');
        }
      }

      // Load others for branding overview
      const ids: CompanyId[] = ["pallyra", "guennita", "mimada", "tuttymimo"];
      const multi: Record<string, Partial<SiteSettings>> = {};
      for (const id of ids) {
        const d = await getSiteSettings(id);
        multi[id] = d || {};
      }
      setAllAteliers(multi as any);
      setLoading(false);
    };
    load();

    const unsubscribeTelegramLogs = subscribeToTelegramLogs((logs) => {
      setTelegramLogs(logs);
    });

    return () => {
      unsubscribeTelegramLogs();
    };
  }, [companyId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeSubTab === "brand") {
        const configUpdate: any = {};
        // Save branding for all modified
        for (const id in allAteliers) {
          const atelierData = allAteliers[id as CompanyId];
          await saveSiteSettings(id as CompanyId, atelierData);

          // Sync with AppConfig
          if (id === "pallyra")
            configUpdate.company_1_logo = atelierData.store_logo;
          if (id === "guennita")
            configUpdate.company_2_logo = atelierData.store_logo;
          if (id === "mimada")
            configUpdate.company_3_logo = atelierData.store_logo;
          if (id === "tuttymimo")
            configUpdate.company_4_logo = atelierData.store_logo;
        }
        if (settings.store_contact) {
          configUpdate.whatsapp_number = settings.store_contact;
        }
        if (Object.keys(configUpdate).length > 0) {
          await saveAppConfig(configUpdate);
        }
        await saveGlobalSettings(settings);
        await saveSiteSettings(companyId, settings);
      } else if (activeSubTab === "pricing") {
        // Save pricing and shipping globally
        await saveGlobalSettings(settings);
      } else if (['pix', 'receipt', 'roulette', 'notifications'].includes(activeSubTab)) {
        await saveGlobalSettings(settings);
      } else {
        await saveSiteSettings(companyId, settings);

        // Sync relevant global config fields
        const configUpdate: any = {};
        if (settings.store_logo) {
          if (companyId === "pallyra")
            configUpdate.company_1_logo = settings.store_logo;
          if (companyId === "guennita")
            configUpdate.company_2_logo = settings.store_logo;
          if (companyId === "mimada")
            configUpdate.company_3_logo = settings.store_logo;
          if (companyId === "tuttymimo")
            configUpdate.company_4_logo = settings.store_logo;
        }
        if (settings.store_qrcode)
          configUpdate.store_qrcode = settings.store_qrcode;
        if (settings.store_cnpj) configUpdate.store_cnpj = settings.store_cnpj;
        if (settings.store_contact)
          configUpdate.whatsapp_number = settings.store_contact;

        if (Object.keys(configUpdate).length > 0) {
          await saveAppConfig(configUpdate);
        }
      }
      alert("Configurações salvas com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof SiteSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const updateMultiField = (
    id: CompanyId,
    field: keyof SiteSettings,
    value: any,
  ) => {
    setAllAteliers((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const encryptHex = (str: string) => btoa(str).split('').reverse().join('');
  const decryptHex = (str: string) => {
    try {
       return atob(str.split('').reverse().join(''));
    } catch(e) { return "" }
  };

  const handleTelegramChange = async (key: string, value: any) => {
    const updated = { ...telegramConfig, [key]: value };
    setTelegramConfig(updated);
    
    const toSave = { ...updated };
    if (toSave.telegram_bot_token && toSave.telegram_bot_token.trim() !== '') {
        toSave.telegram_bot_token = encryptHex(toSave.telegram_bot_token);
    } else {
        toSave.telegram_bot_token = '';
    }
    await saveSystemNotificationsConfig(toSave);
  };

  const testTelegram = async () => {
    setTelegramStatus('loading');
    try {
      const token = telegramConfig.telegram_bot_token;
      if (!token) throw new Error("Sem token");

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramConfig.telegram_chat_id,
          text: "🎉 Integração Telegram configurada com sucesso!"
        })
      });
      if (res.ok) {
        setTelegramStatus('success');
      } else {
        setTelegramStatus('error');
      }
    } catch {
       setTelegramStatus('error');
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse text-[#A09898] font-bold uppercase tracking-widest text-[9px]">
        Carregando Configurações...
      </div>
    );

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-top-4 duration-500 pb-6 w-full">
      {/* Horizontal Nav */}
      <div className="w-full bg-white p-3 rounded-2xl border border-lilac/10 shadow-sm flex flex-wrap gap-2.5 items-center justify-start">
        {[
          { id: "brand", label: "Empresa", icon: Building2 },
          { id: "about", label: "Sobre Nós", icon: User },
          { id: "pix", label: "PIX & Checkout", icon: QrCode },
          { id: "pricing", label: "Precificação & Frete", icon: Calculator },
          { id: "receipt", label: "Comprovantes", icon: FileText },
          { id: "roulette", label: "Roleta de Brindes", icon: Gift },
          { id: "notifications", label: "Notificações", icon: Bell },
          { id: "reset", label: "Reset de Dados", icon: RotateCw },
        ].map((item) => (
          <button
            key={item.id}
            id={`subtab-${item.id}`}
            onClick={() => setActiveSubTab(item.id as any)}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl transition-all whitespace-nowrap border ${
              activeSubTab === item.id
                ? "bg-black text-white border-black font-extrabold shadow-md scale-[1.01]"
                : "bg-white text-slate-400 border-slate-100 hover:border-pink-300 hover:text-slate-900 shadow-sm"
            }`}
          >
            <item.icon size={14} className={activeSubTab === item.id ? "text-white" : "text-slate-400"} />
            <span className="text-[10px] uppercase font-black tracking-wider">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="w-full p-8 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 min-h-0">
        {activeSubTab === "brand" && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-pink-100/50 text-pink-700">
                <Store size={22} />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">
                Gestão de Marcas
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {(
                [
                  { id: "pallyra", label: "La Pallyra", color: "text-sky-500" },
                  {
                    id: "guennita",
                    label: "com amor, Guennita",
                    color: "text-slate-400",
                  },
                  { id: "mimada", label: "Mimada Sim", color: "text-pink-600" },
                  { id: "tuttymimo", label: "Tutty Mimo", color: "text-orange-400" },
                ] as const
              ).map((atl) => {
                const atlSettings = allAteliers[atl.id] || {};
                return (
                  <div
                    key={atl.id}
                    className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm transition-all hover:border-pink-200/50"
                  >
                    <div className="flex items-center justify-between border-b border-slate-50 pb-5 mb-8">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-current ${atl.color} shadow-sm`} />
                        <h4 className="text-base font-black uppercase tracking-tight text-slate-800">
                          {atl.label}
                        </h4>
                      </div>
                      <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">
                        ID: {atl.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                      {/* COLUNA ESQUERDA: Logos & Visual Assets */}
                      <div className="space-y-6">
                        <div className="p-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                          <ImageUpload
                            label="Logotipo Principal"
                            path={`catalogos/${atl.id}`}
                            currentUrl={atlSettings.store_logo}
                            onUploadComplete={(url) =>
                              updateMultiField(atl.id, "store_logo", url)
                            }
                            onRemove={() =>
                              updateMultiField(atl.id, "store_logo", "")
                            }
                          />
                        </div>
                        <div className="p-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                          <ImageUpload
                            label="Banner Topo Checkout"
                            path={`catalogos/${atl.id}/banner`}
                            currentUrl={atlSettings.checkout_banner}
                            onUploadComplete={(url) =>
                              updateMultiField(atl.id, "checkout_banner", url)
                            }
                            onRemove={() =>
                              updateMultiField(atl.id, "checkout_banner", "")
                            }
                          />
                        </div>
                      </div>

                      {/* COLUNA DIREITA: Identidade & Configurações */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-black text-slate-500 ml-1">
                              Nome da Marca
                            </label>
                            <input
                              type="text"
                              value={atlSettings.store_name || atl.label}
                              onChange={(e) =>
                                updateMultiField(atl.id, "store_name", e.target.value)
                              }
                              className="w-full bg-[#FAF9F6] border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-pink-500 focus:bg-white transition-all shadow-sm"
                              placeholder="Nome oficial..."
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-black text-slate-500 ml-1">
                              Slogan Curto
                            </label>
                            <input
                              type="text"
                              value={atlSettings.store_slogan || ""}
                              onChange={(e) =>
                                updateMultiField(atl.id, "store_slogan", e.target.value)
                              }
                              className="w-full bg-[#FAF9F6] border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-pink-500 focus:bg-white transition-all shadow-sm"
                              placeholder="Foco da marca..."
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-black text-slate-500 ml-1">
                            Descrição da Marca / Narrativa (About)
                          </label>
                          <textarea
                            value={atlSettings.about_me_bio || ""}
                            onChange={(e) =>
                              updateMultiField(atl.id, "about_me_bio", e.target.value)
                            }
                            className="w-full bg-[#FAF9F6] border border-slate-100 rounded-2xl px-4 py-4 text-xs font-bold outline-none focus:border-pink-500 focus:bg-white transition-all h-28 resize-none shadow-sm"
                            placeholder="Conte a história deste ateliê específico..."
                          />
                        </div>

                        <div className="pt-4 space-y-4">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-800 border-b border-slate-50 pb-2">Identidade Visual (Cores)</h5>
                          <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <label className="text-[8px] uppercase font-black text-slate-400 block text-center">Primária</label>
                              <div className="flex items-center gap-3 bg-[#FAF9F6] p-2 rounded-xl border border-slate-100 shadow-inner">
                                <input
                                  type="color"
                                  value={atlSettings.theme_primary_color || "#ffffff"}
                                  onChange={(e) =>
                                    updateMultiField(atl.id, "theme_primary_color", e.target.value)
                                  }
                                  className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                                />
                                <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">{atlSettings.theme_primary_color || "#FFF"}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[8px] uppercase font-black text-slate-400 block text-center">Destaque</label>
                              <div className="flex items-center gap-3 bg-[#FAF9F6] p-2 rounded-xl border border-slate-100 shadow-inner">
                                <input
                                  type="color"
                                  value={atlSettings.theme_accent_color || "#db2777"}
                                  onChange={(e) =>
                                    updateMultiField(atl.id, "theme_accent_color", e.target.value)
                                  }
                                  className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                                />
                                <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">{atlSettings.theme_accent_color || "#DB2777"}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[8px] uppercase font-black text-slate-400 block text-center">Texto</label>
                              <div className="flex items-center gap-3 bg-[#FAF9F6] p-2 rounded-xl border border-slate-100 shadow-inner">
                                <input
                                  type="color"
                                  value={atlSettings.theme_text_color || "#1f2937"}
                                  onChange={(e) =>
                                    updateMultiField(atl.id, "theme_text_color", e.target.value)
                                  }
                                  className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                                />
                                <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">{atlSettings.theme_text_color || "#1F2937"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* WhatsApp & Pixel Configuration */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-8 mt-10">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                <div className="p-2 bg-pink-100 rounded-lg text-pink-700">
                  <Phone size={18} />
                </div>
                <h4 className="text-base font-black uppercase tracking-tight text-slate-800">
                  Integrações de Contato & Tráfego (WhatsApp e Pixel)
                </h4>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* WhatsApp Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-emerald-500" />
                    <span className="text-[10px] uppercase font-black text-slate-600 tracking-wider">
                      Configurações do WhatsApp
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-slate-400">
                      Número Master (WhatsApp + DDD)
                    </label>
                    <input
                      type="text"
                      value={settings.store_contact || ""}
                      onChange={(e) => updateField("store_contact", e.target.value)}
                      placeholder="(00) 0 0000-0000"
                      className="w-full bg-[#FAF9F6] border border-slate-100 rounded-xl px-4 py-3 text-xs font-mono font-bold outline-none focus:border-pink-500 transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-slate-400">
                      Mensagem Automática (Geral)
                    </label>
                    <textarea
                      value={settings.whatsapp_main_message || ""}
                      onChange={(e) => updateField("whatsapp_main_message", e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-pink-500 transition-all h-24 resize-none shadow-sm"
                      placeholder="Olá! Gostaria de conversar sobre as marcas..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-slate-400">
                      Lead de Produto (Automático)
                    </label>
                    <textarea
                      value={settings.whatsapp_product_message || ""}
                      onChange={(e) => updateField("whatsapp_product_message", e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-pink-500 transition-all h-24 resize-none shadow-sm"
                      placeholder="Olá! Tenho interesse no item {product}..."
                    />
                  </div>
                </div>

                {/* Facebook Pixel Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Facebook size={16} className="text-blue-600" />
                    <span className="text-[10px] uppercase font-black text-slate-600 tracking-wider">
                      Pixel do Facebook
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 uppercase font-bold leading-relaxed tracking-widest">
                    Insira o ID do seu Pixel do Facebook para rastreamento de campanhas.
                  </p>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-slate-400">
                      Pixel ID
                    </label>
                    <input
                      type="text"
                      value={settings.facebook_pixel || ""}
                      onChange={(e) => updateField("facebook_pixel", e.target.value)}
                      placeholder="Ex: 1234567890"
                      className="w-full bg-[#FAF9F6] border border-slate-100 rounded-xl px-4 py-3 text-xs font-mono font-bold outline-none focus:border-pink-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
                {activeSubTab === "about" && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-pink-100/50 text-pink-700">
                <User size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">
                Editar Página Sobre Nós
              </h3>
            </div>

            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest leading-relaxed">
              Personalize a apresentação de Julia Aleixo, enviando uma foto profissional e editando os textos de biografia e propósito.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Photo Upload Card */}
              <div className="space-y-4">
                <div className="p-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <ImageUpload
                    label="Minha Foto (Perfil / Ateliê)"
                    path="sobrenos"
                    currentUrl={settings.about_me_photo}
                    onUploadComplete={(url) => updateField("about_me_photo", url)}
                    onRemove={() => updateField("about_me_photo", "")}
                  />
                </div>
                
                <div className="space-y-1.5 max-w-full pl-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    Link Manual da Imagem (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Link da sua foto..."
                    className="w-full bg-[#FAF9F6] border border-slate-100 rounded-xl px-4 py-2 text-[10px] outline-none font-bold focus:border-pink-500 transition-all shadow-sm"
                    value={settings.about_me_photo || ""}
                    onChange={(e) => updateField("about_me_photo", e.target.value)}
                  />
                </div>
              </div>

              {/* Text Fields Editorial */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 ml-2">
                    Título do Perfil / Saudação
                  </label>
                  <input
                    type="text"
                    value={settings.about_me_title || ""}
                    onChange={(e) => updateField("about_me_title", e.target.value)}
                    placeholder="Ex: Olá, sou a Julia Aleixo!"
                    className="w-full bg-[#FAF9F6] border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-pink-500 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 ml-2">
                    Texto Biográfico / Sua História
                  </label>
                  <textarea
                    value={settings.about_me_bio || ""}
                    onChange={(e) => updateField("about_me_bio", e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-pink-500 focus:bg-white transition-all h-32 resize-none shadow-sm"
                    placeholder="Conte sobre sua paixão pelo artesanato..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 ml-2">
                    Nosso Propósito / Compromisso
                  </label>
                  <textarea
                    value={settings.about_me_purpose || ""}
                    onChange={(e) => updateField("about_me_purpose", e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-pink-500 focus:bg-white transition-all h-32 resize-none shadow-sm"
                    placeholder="Explique o diferencial de qualidade..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "pix" && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
                <CreditCard size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">
                Configurações de Venda
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="p-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <ImageUpload
                    label="QR Code PIX Principal"
                    path="pix"
                    currentUrl={settings.store_qrcode}
                    onUploadComplete={(url) => updateField("store_qrcode", url)}
                    onRemove={() => updateField("store_qrcode", "")}
                  />
                </div>
                
                <div className="space-y-4 p-6 rounded-3xl bg-slate-50/50 border border-slate-100">
                  <label className="text-[10px] uppercase font-black text-slate-500 ml-2">
                    Meta de Vendas Mensal (R$)
                  </label>
                  <input
                    type="number"
                    value={settings.monthly_goal || ""}
                    onChange={(e) =>
                      updateField("monthly_goal", Number(e.target.value))
                    }
                    className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black outline-none focus:border-pink-500 transition-all shadow-sm"
                    placeholder="Ex: 10000"
                  />
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest ml-2 leading-relaxed">
                    Esta meta será usada no termômetro do dashboard.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 ml-2">
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      value={settings.store_pix_key || ""}
                      onChange={(e) =>
                        updateField("store_pix_key", e.target.value)
                      }
                      className="w-full bg-[#FAF9F6] border border-slate-100 rounded-2xl px-6 py-4 text-xs font-mono font-bold outline-none focus:border-pink-500 transition-all shadow-sm"
                      placeholder="Ex: 00.000.000/0001-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 ml-2">
                      Nome do Beneficiário
                    </label>
                    <input
                      type="text"
                      value={settings.store_pix_name || ""}
                      onChange={(e) =>
                        updateField("store_pix_name", e.target.value)
                      }
                      className="w-full bg-[#FAF9F6] border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-pink-500 transition-all shadow-sm"
                      placeholder="Ex: Nome Completo ou Ateliê"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                      <CreditCard size={18} />
                    </div>
                    <h4 className="text-[10px] uppercase font-black text-slate-900 tracking-widest">Pix Automático (Mercado Pago)</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-bold text-slate-400 ml-2">Access Token</label>
                      <input
                        type="password"
                        value={settings.mercadopago_token || ""}
                        onChange={(e) => updateField("mercadopago_token", e.target.value)}
                        className="w-full bg-[#FAF9F6] border border-slate-100 rounded-2xl px-5 py-3 text-[11px] font-mono outline-none focus:border-pink-500 transition-all shadow-sm"
                        placeholder="APP_USR-..."
                      />
                    </div>
                    
                    <div className="flex items-center justify-between bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                      <div>
                        <p className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">Ativar Geração Dinâmica</p>
                        <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">QR Code gerado automaticamente</p>
                      </div>
                      <button 
                        onClick={() => updateField("pix_automatico_active", !settings.pix_automatico_active)}
                        className={`w-10 h-5 rounded-full relative transition-all ${settings.pix_automatico_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings.pix_automatico_active ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                      <div className="flex items-center justify-between bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                        <div>
                          <p className="text-[10px] font-black uppercase text-amber-900 tracking-wider">Modo teste de Checkout</p>
                          <p className="text-[8px] font-bold text-amber-600 uppercase tracking-widest leading-relaxed">
                            Simula pagamentos aprovados sem Mercado Pago
                          </p>
                        </div>
                        <button 
                          onClick={() => updateField("test_mode", !settings.test_mode)}
                          className={`w-10 h-5 rounded-full relative transition-all ${settings.test_mode ? 'bg-amber-500' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings.test_mode ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {activeSubTab === "pricing" && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-100/50 text-amber-700">
                <Calculator size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">
                Base de Precificação
              </h3>
            </div>

            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest leading-relaxed max-w-2xl">
              Estes valores globais serão usados na hora de sugerir o Preço de Venda do seus produtos baseando-se no tempo gasto e custo dos insumos.
            </p>

            <div className="grid grid-cols-1 gap-12 pt-4">
              <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                <DynamicPricingList
                  title="Custos Fixos (Mensal)"
                  subtitle="Água, luz, assinaturas, aluguel..."
                  items={settings.fixed_costs_list || []}
                  onChange={(items) => {
                    const total = items.reduce(
                      (acc, curr) => acc + (Number(curr.value) || 0),
                      0,
                    );
                    setSettings((prev) => ({
                      ...prev,
                      fixed_costs_list: items,
                      global_fixed_costs: total,
                    }));
                  }}
                />
              </div>

              <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                <DynamicPricingList
                  title="Mão de Obra"
                  subtitle="Dia / Hora = Valor Cobrado"
                  items={settings.labor_list || []}
                  onChange={(items) => {
                    const total = items.reduce(
                      (acc, curr) => acc + (Number(curr.value) || 0),
                      0,
                    );
                    setSettings((prev) => ({
                      ...prev,
                      labor_list: items,
                      global_labor_cost_per_hour: total,
                    }));
                  }}
                />
              </div>

              <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                <DynamicPricingList
                  title="Taxas e Impostos"
                  subtitle="Taxas de cartão, emissão de NF, etc"
                  isPercentage
                  items={settings.taxes_list || []}
                  onChange={(items) => {
                    const total = items.reduce(
                      (acc, curr) => acc + (Number(curr.value) || 0),
                      0,
                    );
                    setSettings((prev) => ({
                      ...prev,
                      taxes_list: items,
                      global_tax_rate: total,
                    }));
                  }}
                />
              </div>
            </div>

            {/* Configuração de Frete integrada */}
            <div className="border-t border-slate-100 pt-12 mt-12 space-y-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-sky-100 text-sky-600">
                  <Truck size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">
                  Cálculo de Frete (Regiões de Entrega)
                </h3>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-lilac/10 space-y-8">
                 <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Faixas de Preço por CEP</h4>
                      <p className="text-[10px] text-[#A09898] uppercase font-bold tracking-widest mt-1">Defina valores de entrega baseados em intervalos de CEP.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const newRules = [...(settings.shipping_rules || [])];
                        newRules.push({
                          id: crypto.randomUUID(),
                          region: 'Nova Região',
                          cep_start: '',
                          cep_end: '',
                          price: 0,
                          active: true
                        });
                        updateField('shipping_rules', newRules);
                      }}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                    >
                      + Adicionar Região
                    </button>
                 </div>

                 <div className="space-y-4">
                    {(settings.shipping_rules || []).map((rule, idx) => (
                      <div key={rule.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-5 bg-[#F8F5F2] rounded-2xl border border-lilac/5 items-center">
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[8px] font-black text-[#A09898] uppercase">Nome da Região / Cidade</label>
                          <input 
                            value={rule.region}
                            onChange={(e) => {
                              const newRules = [...(settings.shipping_rules || [])];
                              newRules[idx].region = e.target.value;
                              updateField('shipping_rules', newRules);
                            }}
                            className="w-full bg-white border border-lilac/10 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-[#A09898] uppercase">CEP Inicial</label>
                          <input 
                            value={rule.cep_start}
                            onChange={(e) => {
                              const newRules = [...(settings.shipping_rules || [])];
                              newRules[idx].cep_start = e.target.value.replace(/\D/g, '');
                              updateField('shipping_rules', newRules);
                            }}
                            className="w-full bg-white border border-lilac/10 rounded-xl px-4 py-2 text-xs font-mono outline-none"
                            placeholder="00000000"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-[#A09898] uppercase">CEP Final</label>
                          <input 
                            value={rule.cep_end}
                            onChange={(e) => {
                              const newRules = [...(settings.shipping_rules || [])];
                              newRules[idx].cep_end = e.target.value.replace(/\D/g, '');
                              updateField('shipping_rules', newRules);
                            }}
                            className="w-full bg-white border border-lilac/10 rounded-xl px-4 py-2 text-xs font-mono outline-none"
                            placeholder="99999999"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-[#A09898] uppercase">Valor (R$)</label>
                          <input 
                            type="number"
                            value={rule.price}
                            onChange={(e) => {
                              const newRules = [...(settings.shipping_rules || [])];
                              newRules[idx].price = Number(e.target.value);
                              updateField('shipping_rules', newRules);
                            }}
                            className="w-full bg-white border border-lilac/10 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end pt-4 md:pt-0">
                          <button 
                            onClick={() => {
                              const newRules = [...(settings.shipping_rules || [])];
                              newRules[idx].active = !newRules[idx].active;
                              updateField('shipping_rules', newRules);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${rule.active ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}
                            title={rule.active ? 'Desativar' : 'Ativar'}
                          >
                            {rule.active ? <CheckCircle size={14} /> : <X size={14} />} {rule.active ? 'Desativar' : 'Ativar'}
                          </button>
                          <button 
                            onClick={() => {
                              const newRules = (settings.shipping_rules || []).filter(r => r.id !== rule.id);
                              updateField('shipping_rules', newRules);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest"
                            title="Remover"
                          >
                            <Trash2 size={14} /> Excluir
                          </button>
                        </div>
                      </div>
                    ))}

                    {(settings.shipping_rules || []).length === 0 && (
                      <div className="p-12 text-center border-2 border-dashed border-lilac/10 rounded-[2rem] space-y-3">
                        <Truck size={32} className="mx-auto text-lilac/20" />
                        <p className="text-[10px] text-[#A09898] uppercase font-black tracking-widest">Nenhuma regra de frete cadastrada.</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="bg-sky-50/50 rounded-3xl p-8 border border-sky-100">
                 <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Instruções de Uso</h4>
                 <ul className="text-[10px] text-[#A09898] font-bold uppercase tracking-widest space-y-2 leading-relaxed">
                    <li>• O sistema buscará o CEP do cliente no checkout e aplicará o valor da primeira regra que coincidir com o intervalo.</li>
                    <li>• Insira apenas números nos campos de CEP.</li>
                    <li>• Regras desativadas serão ignoradas.</li>
                    <li>• Se nenhum CEP coincidir, o sistema poderá exibir "Sob Consulta".</li>
                 </ul>
              </div>
            </div>
          </div>
        )}




        {activeSubTab === "receipt" && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-100/50 text-amber-700">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">
                Modelo de Comprovantes
              </h3>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 ml-2">
                    Aviso Legal (Cupom)
                  </label>
                  <textarea
                    value={settings.receipt_footer || ""}
                    onChange={(e) =>
                      updateField("receipt_footer", e.target.value)
                    }
                    className="w-full bg-[#FAF9F6] border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-pink-500 transition-all h-32 resize-none shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 ml-2">
                    Cláusulas (Orçamento)
                  </label>
                  <textarea
                    value={settings.quote_footer || ""}
                    onChange={(e) =>
                      updateField("quote_footer", e.target.value)
                    }
                    className="w-full bg-[#FAF9F6] border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-pink-500 transition-all h-32 resize-none shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 ml-2">
                    Agradecimento Geral
                  </label>
                  <textarea
                    value={settings.receipt_message || ""}
                    onChange={(e) =>
                      updateField("receipt_message", e.target.value)
                    }
                    className="w-full bg-[#FAF9F6] border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-pink-500 transition-all h-24 resize-none shadow-sm"
                    placeholder="Ex: Obrigado pela sua compra..."
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-8 rounded-[3rem] bg-slate-50 border border-slate-100 shadow-inner">
                  <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-6">
                    Tags Inteligentes
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {["{ateliê}", "{cliente}", "{pedido}", "{total}", "{data}"].map(tag => (
                      <div key={tag} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group cursor-help transition-all hover:border-pink-200">
                        <span className="text-[10px] font-mono font-black text-pink-600">{tag}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-pink-400 mt-0.5" />
                      </div>
                    ))}
                  </div>
                  <p className="mt-8 text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">As tags de ateliê e cliente são detectadas e preenchidas automaticamente em cada geração.</p>
                </div>
              </div>
            </div>
          </div>
        )}


        {activeSubTab === "roulette" && (
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                <Gift size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">
                Roleta de Brindes
              </h3>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-lilac/10">
              <p className="text-xs text-gray-500 mb-6 uppercase tracking-widest font-black">
                Configure exatamente 5 opções para a roleta. Ela será exibida
                no final de compras a partir de R$ 300,00.
              </p>

              <div className="space-y-4">
                {(() => {
                  const prizesToRender = (settings.roulette_prizes && settings.roulette_prizes.length === 5)
                    ? settings.roulette_prizes
                    : Array.from({ length: 5 }).map((_, i) => {
                        const existing = settings.roulette_prizes?.[i];
                        return {
                          id: existing?.id || `prize-${i}`,
                          name: existing?.name || `Brinde ${i + 1}`,
                          active: existing?.active !== undefined ? existing.active : true,
                          weight: existing?.weight || 20,
                        };
                      });

                  return prizesToRender.map((prize, idx) => (
                    <div
                      key={prize.id}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-lilac/20 shadow-sm"
                    >
                      <span className="w-6 font-mono font-bold text-[#A09898]">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={prize.name}
                        onChange={(e) => {
                          const newPrizes = [...prizesToRender];
                          newPrizes[idx].name = e.target.value;
                          updateField("roulette_prizes", newPrizes);
                        }}
                        className="flex-1 bg-white border border-lilac/20 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-lilac"
                        placeholder="Ex: 10% de Desconto, Brinde Surpresa..."
                      />

                      <div className="flex items-center gap-2">
                        <label className="text-[10px] uppercase font-black text-[#A09898]">
                          Peso (1 a 100):
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={prize.weight}
                          onChange={(e) => {
                            const newPrizes = [...prizesToRender];
                            newPrizes[idx].weight = Number(e.target.value);
                            updateField("roulette_prizes", newPrizes);
                          }}
                          className="w-16 bg-white border border-lilac/20 rounded-xl px-2 py-3 text-xs font-bold outline-none focus:border-lilac text-center"
                        />
                      </div>

                      <button
                        onClick={() => {
                          const newPrizes = [...prizesToRender];
                          newPrizes[idx].active = !newPrizes[idx].active;
                          updateField("roulette_prizes", newPrizes);
                        }}
                        className={`w-24 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${prize.active ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-rose-600"}`}
                      >
                        {prize.active ? "Ativo" : "Inativo"}
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}


        {activeSubTab === "notifications" && (
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-rose-100/50 text-[#D48C8C]">
                <Bell size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">
                Gerenciador de Notificações
              </h3>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-lilac/10 space-y-8">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Alertas e Efeitos Sonoros</h4>
                <p className="text-[10px] text-[#A09898] uppercase font-bold tracking-widest mt-1">Configure o comportamento das notificações do sistema.</p>
              </div>

              <div className="p-6 bg-[#F8F5F2] rounded-2xl border border-lilac/5 flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Feedback Sonoro de Sucesso</p>
                  <p className="text-[10px] text-[#A09898] font-bold uppercase tracking-widest max-w-md leading-relaxed normal-case">
                    Reproduzir automaticamente um som de recebimento de dinheiro ("cash register cha-ching") ou confirmação quando novos pedidos forem criados ou marcados como pagos e concluídos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentVal = settings.sound_notifications_active !== false;
                    updateField("sound_notifications_active", !currentVal);
                  }}
                  className={`w-14 h-8 rounded-full transition-all duration-300 relative flex items-center px-1 shrink-0 ${
                    settings.sound_notifications_active !== false ? "bg-[#D48C8C]" : "bg-slate-300"
                  }`}
                  style={{ minWidth: '56px' }}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                      settings.sound_notifications_active !== false ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const { playSuccessSound } = await import("../../utils/audio");
                    playSuccessSound();
                  }}
                  className="px-6 py-3 border border-[#F0E6D2] hover:bg-[#FAF9F6] text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                >
                  🔊 Testar Som de Sucesso
                </button>
              </div>
            </div>

            <div className="bg-lilac/5 rounded-3xl p-8 border border-lilac/10">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Compatibilidade de Áudio</h4>
              <p className="text-[10px] text-[#A09898] font-bold uppercase tracking-widest leading-relaxed">
                • Efeitos sonoros são gerados de forma limpa pelo navegador via Web Audio API, exigindo uma primeira interação na página para contornar restrições de autoplayer do navegador.
              </p>
            </div>

            {/* Configuração Telegram */}
            <div className="bg-white rounded-3xl p-8 border border-sky-100 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-black text-sky-900 uppercase tracking-wider">
                    <Smartphone size={18} />
                    Telegram
                  </h4>
                  <p className="text-[10px] text-sky-600/70 uppercase font-bold tracking-widest mt-1">
                    Receba notificações de pedidos no seu Telegram.
                  </p>
                </div>
                {telegramStatus === 'success' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Telegram Conectado
                  </div>
                )}
                {(telegramStatus === 'error' || telegramStatus === 'idle') && telegramConfig.telegram_bot_token === '' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-lg border border-rose-100 text-[10px] font-bold uppercase tracking-widest text-rose-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    Telegram Desconectado
                  </div>
                )}
                {telegramStatus === 'error' && telegramConfig.telegram_bot_token !== '' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-lg border border-rose-100 text-[10px] font-bold uppercase tracking-widest text-rose-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    Falha ao Conectar
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Ativar Notificações Telegram</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed normal-case">
                      Liga ou desliga o envio prático de alertas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTelegramChange("telegram_enabled", !telegramConfig.telegram_enabled)}
                    className={`w-14 h-8 rounded-full transition-all duration-300 relative flex items-center px-1 shrink-0 ${
                      telegramConfig.telegram_enabled ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                    style={{ minWidth: '56px' }}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                        telegramConfig.telegram_enabled ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/60">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 ml-2">
                      Bot Token
                    </label>
                    <input
                      type="password"
                      value={telegramConfig.telegram_bot_token || ""}
                      onChange={(e) => handleTelegramChange("telegram_bot_token", e.target.value)}
                      placeholder="Ex: 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                      className="w-full bg-[#FAF9F6] border border-slate-200 rounded-2xl px-6 py-4 text-xs font-mono font-bold outline-none focus:border-sky-500 transition-all shadow-sm"
                    />
                    {telegramConfig.telegram_bot_token && telegramConfig.telegram_bot_token.length > 5 && (
                      <p className="text-[9px] font-mono text-slate-400 ml-2">
                        Token Salvo: {'*'.repeat(Math.max(0, telegramConfig.telegram_bot_token.length - 4)) + telegramConfig.telegram_bot_token.slice(-4)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 ml-2">
                      Chat ID
                    </label>
                    <input
                      type="text"
                      value={telegramConfig.telegram_chat_id || ""}
                      onChange={(e) => handleTelegramChange("telegram_chat_id", e.target.value)}
                      placeholder="Ex: -1001234567890"
                      className="w-full bg-[#FAF9F6] border border-slate-200 rounded-2xl px-6 py-4 text-xs font-mono font-bold outline-none focus:border-sky-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {telegramConfig.telegram_enabled && (
                  <div className="pt-4 border-t border-slate-200/60 space-y-4">
                    <h5 className="text-[10px] uppercase font-black text-slate-500 ml-2">
                      Eventos para Notificar
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { key: "notify_new_order", label: "Novo Pedido", icon: "🛒" },
                        { key: "notify_payment_confirmed", label: "Pagamento Confirmado", icon: "💰" },
                        { key: "notify_order_canceled", label: "Pedido Cancelado", icon: "❌" },
                        { key: "notify_order_completed", label: "Pedido Finalizado", icon: "📦" },
                        { key: "notify_low_stock", label: "Estoque Baixo", icon: "⚠️" },
                        { key: "notify_new_client", label: "Novo Cliente", icon: "👤" }
                      ].map((evt) => (
                         <label key={evt.key} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-sky-300 transition-colors">
                           <input
                             type="checkbox"
                             checked={!!telegramConfig[evt.key]}
                             onChange={(e) => handleTelegramChange(evt.key, e.target.checked)}
                             className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                           />
                           <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                             <span>{evt.icon}</span> {evt.label}
                           </span>
                         </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={telegramStatus === 'loading'}
                    onClick={testTelegram}
                    className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                  >
                    {telegramStatus === 'loading' ? (
                      <>⏳ Testando...</>
                    ) : (
                      <>🤖 Testar Conexão</>
                    )}
                  </button>
                </div>

                {/* Logs de Notificações */}
                {telegramLogs.length > 0 && (
                  <div className="pt-4 border-t border-slate-200/60 space-y-4">
                    <h5 className="text-[10px] uppercase font-black text-slate-500 ml-2">Ultimas Notificações (Logs)</h5>
                    <div className="space-y-3">
                      {telegramLogs.map(log => (
                        <div key={log.id} className={`p-4 rounded-xl border ${log.status === 'error' ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-100'}`}>
                          <div className="flex justify-between items-start">
                             <div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${log.status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {log.status === 'success' ? '🟢 Enviado' : '🔴 Falha'} - {new Date(log.createdAt?.seconds * 1000).toLocaleString()}
                                </span>
                                <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap">{log.message}</p>
                                {log.status === 'error' && log.errorDetails && (
                                  <p className="text-[10px] text-red-500 mt-1 font-mono">{log.errorDetails}</p>
                                )}
                             </div>
                             <button
                               onClick={() => resendTelegramNotification(log.id, log)}
                               className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                             >
                               <RotateCw size={12} /> Reenviar
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "reset" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-rose-100/50 text-[#D48C8C]">
                <RotateCw size={24} className="animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">
                Reset Geral de Dados
              </h3>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-red-100 space-y-8 shadow-[0_10px_40px_rgba(239,68,68,0.03)]">
              <div>
                <h4 className="text-sm font-black text-rose-900 uppercase tracking-wider flex items-center gap-2">
                  <span>⚠️</span> Cuidado! Zona de Perigo Extremo
                </h4>
                <p className="text-[10px] text-[#A09898] uppercase font-bold tracking-widest mt-1">
                  Esta ação executará um reset completo dos dados cadastrados para que o sistema volte ao estado inicial de uso.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 rounded-2xl bg-red-50/50 border border-red-100/70 space-y-3">
                  <h5 className="text-[11px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-2">
                    🔴 APAGAR COMPLETAMENTE
                  </h5>
                  <ul className="text-[10px] space-y-2 text-slate-600 font-medium tracking-wide leading-relaxed">
                    <li>❌ <strong>Clientes</strong>: todos os cadastros, histórico e relacionamentos vinculados.</li>
                    <li>❌ <strong>Produtos</strong>: catálogo completo, variações, links de imagens e estoques.</li>
                    <li>❌ <strong>Insumos</strong>: inventário de materiais, movimentos e históricos de insumos.</li>
                    <li>❌ <strong>Pedidos</strong>: todas as vendas, histórico de produção e status de entrega.</li>
                    <li>❌ <strong>Histórico Financeiro</strong>: fluxo de caixa e lucros mensais originados dos pedidos.</li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100/70 space-y-3">
                  <h5 className="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                    🟢 MANTER INTACTO (NÃO SERÁ ALTERADO)
                  </h5>
                  <ul className="text-[10px] space-y-2 text-slate-600 font-medium tracking-wide leading-relaxed">
                    <li>✅ <strong>Empresas</strong>: definições de marca, WhatsApp, pixel do Facebook, contatos.</li>
                    <li>✅ <strong>Estrutura de Frete</strong>: faixas de frete estabelecidas e taxas gerais.</li>
                    <li>✅ <strong>Precificação</strong>: fórmulas, tarifas de transações, custos de mão de obra.</li>
                    <li>✅ <strong>Aparência & Layout</strong>: cores de background, slogans e layouts de páginas.</li>
                    <li>✅ <strong>Integrações</strong>: configurações gerais de bots, notificações e webhooks.</li>
                    <li>✅ <strong>Metas Financeiras</strong>: metas mensais cadastradas no painel.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex flex-col gap-2 bg-[#FAF9F6] p-4 rounded-xl border border-[#F0E6D2]">
                  <p className="text-[10px] font-black text-[#8C8273] uppercase tracking-widest leading-relaxed">
                    Para confirmar o reset operacional, digite <span className="text-red-600 font-extrabold select-all">RESETAR SISTEMA</span> no campo abaixo e logo após clique no botão de redefinição.
                  </p>
                  <input
                    type="text"
                    placeholder="Digite RESETAR SISTEMA aqui..."
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    className="w-full mt-2 px-4 py-3 rounded-lg bg-white border border-slate-200 text-xs font-bold outline-none uppercase focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetAction}
                    disabled={confirmInput.trim().toUpperCase() !== "RESETAR SISTEMA" || resetProgress === "loading"}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/15 cursor-pointer"
                  >
                    {resetProgress === "loading" ? "⏳ Redefinindo o Banco de Dados..." : "🚨 Executar Reset Geral do Sistema"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button */}
        <div className="mt-12 pt-8 border-t border-lilac/10 flex justify-end">
          <button
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-3 px-10 py-5 bg-black text-white rounded-2xl font-black font-sans text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
          >
            {saving ? (
              "Gravando..."
            ) : (
              <>
                <Save size={16} /> Salvar Alterações
              </>
            )}
          </button>
        </div>

        {/* Quick Lite Editor Modal */}
        {showEditor && tempLogo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-[#F0E6D2] flex justify-between items-center bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-black text-white">
                    <Scissors size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-widest">
                      Ajustar Logo
                    </h4>
                    <p className="text-[9px] font-bold text-[#A09898] uppercase tracking-widest mt-1">
                      Refine a posição e escala da sua marca
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditor(false);
                    setEditingAtelierId(null);
                  }}
                  className="p-3 rounded-2xl hover:bg-slate-100 transition-colors text-[#A09898]"
                >
                  <CloseIcon size={24} />
                </button>
              </div>

              {(() => {
                const currentObj =
                  activeSubTab === "brand" && editingAtelierId
                    ? allAteliers[editingAtelierId]
                    : settings;
                const updateFn = (field: keyof SiteSettings, val: any) => {
                  if (activeSubTab === "brand" && editingAtelierId)
                    updateMultiField(editingAtelierId, field, val);
                  else updateField(field, val);
                };

                return (
                  <>
                    <div className="p-12 flex flex-col items-center gap-10">
                      <div className="relative w-72 h-72 rounded-[2rem] bg-grid-slate-100 border border-[#F0E6D2] flex items-center justify-center overflow-hidden shadow-inner">
                        <ImageWithFallback
                          src={tempLogo}
                          className="max-w-[none] max-h-[none] w-64 h-64 object-contain transition-transform"
                          style={{
                            transform: `translate(${currentObj.store_logo_x || 0}px, ${currentObj.store_logo_y || 0}px) scale(${currentObj.store_logo_scale || 1}) rotate(${currentObj.store_logo_rotate || 0}deg)`,
                          }}
                          alt="Preview"
                        />
                      </div>

                      <div className="w-full space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[9px] font-black uppercase text-[#A09898] tracking-widest">
                                Posição X
                              </span>
                              <span className="text-[9px] font-mono font-black text-lilac">
                                {currentObj.store_logo_x || 0}px
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              step="1"
                              value={currentObj.store_logo_x || 0}
                              onChange={(e) =>
                                updateFn(
                                  "store_logo_x",
                                  parseInt(e.target.value),
                                )
                              }
                              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-black"
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[9px] font-black uppercase text-[#A09898] tracking-widest">
                                Posição Y
                              </span>
                              <span className="text-[9px] font-mono font-black text-lilac">
                                {currentObj.store_logo_y || 0}px
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              step="1"
                              value={currentObj.store_logo_y || 0}
                              onChange={(e) =>
                                updateFn(
                                  "store_logo_y",
                                  parseInt(e.target.value),
                                )
                              }
                              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-black"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[9px] font-black uppercase text-[#A09898] tracking-widest">
                              Escala
                            </span>
                            <span className="text-[9px] font-mono font-black text-lilac">
                              {(
                                (currentObj.store_logo_scale || 1) * 100
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.05"
                            value={currentObj.store_logo_scale || 1}
                            onChange={(e) =>
                              updateFn(
                                "store_logo_scale",
                                parseFloat(e.target.value),
                              )
                            }
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-black"
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[9px] font-black uppercase text-[#A09898] tracking-widest">
                              Rotação
                            </span>
                            <span className="text-[9px] font-mono font-black text-lilac">
                              {currentObj.store_logo_rotate || 0}°
                            </span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <button
                              onClick={() =>
                                updateFn(
                                  "store_logo_rotate",
                                  (currentObj.store_logo_rotate || 0) - 90,
                                )
                              }
                              className="p-3 rounded-xl bg-white border border-[#F0E6D2] hover:border-lilac transition-all text-slate-900 shadow-sm"
                            >
                              <RotateCw size={14} className="scale-x-[-1]" />
                            </button>
                            <input
                              type="range"
                              min="-180"
                              max="180"
                              step="1"
                              value={currentObj.store_logo_rotate || 0}
                              onChange={(e) =>
                                updateFn(
                                  "store_logo_rotate",
                                  parseInt(e.target.value),
                                )
                              }
                              className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-black"
                            />
                            <button
                              onClick={() =>
                                updateFn(
                                  "store_logo_rotate",
                                  (currentObj.store_logo_rotate || 0) + 90,
                                )
                              }
                              className="p-3 rounded-xl bg-white border border-[#F0E6D2] hover:border-lilac transition-all text-slate-900 shadow-sm"
                            >
                              <RotateCw size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 border-t border-[#F0E6D2] bg-white/50 flex gap-4">
                      <button
                        onClick={() => {
                          updateFn("store_logo_scale", 1);
                          updateFn("store_logo_rotate", 0);
                          updateFn("store_logo_x", 0);
                          updateFn("store_logo_y", 0);
                        }}
                        className="flex-1 py-5 rounded-2xl bg-white border border-slate-200 text-[#A09898] font-black text-[10px] uppercase tracking-widest hover:border-lilac hover:text-lilac transition-all"
                      >
                        Resetar
                      </button>
                      <button
                        onClick={() => {
                          setShowEditor(false);
                          setEditingAtelierId(null);
                        }}
                        className="flex-[2] py-5 rounded-2xl bg-black text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                      >
                        Aplicar Ajustes
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
