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
} from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { DynamicPricingList } from "./DynamicPricingList";
import { CompanyId, SiteSettings } from "../../types";
import {
  getSiteSettings,
  saveSiteSettings,
  saveAppConfig,
} from "../../services/firebaseService";
import { format } from "date-fns";
import { ImageWithFallback } from "../ImageWithFallback";

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
    | "marketing"
    | "whatsapp"
    | "receipt"
    | "roulette"
  >("brand");
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [tempLogo, setTempLogo] = useState<string | null>(null);
  const [editingAtelierId, setEditingAtelierId] = useState<CompanyId | null>(
    null,
  );

  // New state for multi-atelier branding
  const [allAteliers, setAllAteliers] = useState<
    Record<CompanyId, Partial<SiteSettings>>
  >({
    pallyra: {},
    guennita: {},
    mimada: {},
  });

  useEffect(() => {
    const load = async () => {
      const data = await getSiteSettings(companyId);
      if (data) setSettings(data);

      // Load others for branding overview
      const ids: CompanyId[] = ["pallyra", "guennita", "mimada"];
      const multi: Record<string, Partial<SiteSettings>> = {};
      for (const id of ids) {
        const d = await getSiteSettings(id);
        multi[id] = d || {};
      }
      setAllAteliers(multi as any);
      setLoading(false);
    };
    load();
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
        }
        if (Object.keys(configUpdate).length > 0) {
          await saveAppConfig(configUpdate);
        }
      } else if (activeSubTab === "pricing") {
        // Save pricing to all ateliers so it stays consistent globally
        for (const id in allAteliers) {
          const currentData = allAteliers[id as CompanyId] || {};
          await saveSiteSettings(id as CompanyId, {
            ...currentData,
            global_fixed_costs: settings.global_fixed_costs,
            global_labor_cost_per_hour: settings.global_labor_cost_per_hour,
            global_tax_rate: settings.global_tax_rate,
          });
        }
        // Update local settings too
        await saveSiteSettings(companyId, settings);
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

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse text-[#A09898] font-bold uppercase tracking-widest text-[9px]">
        Carregando Configurações...
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row gap-10 animate-in fade-in slide-in-from-left-4 duration-500 pb-20">
      {/* Sidebar Nav */}
      <div className="lg:w-72 space-y-2">
        {[
          { id: "brand", label: "Marca & Dados (3 Ateliês)", icon: Building2 },
          { id: "about", label: "Página Sobre Nós", icon: User },
          { id: "pix", label: "PIX & Checkout", icon: QrCode },
          {
            id: "pricing",
            label: "Precificação / Custos Globais",
            icon: Calculator,
          },
          { id: "marketing", label: "Pixel Facebook", icon: Facebook },
          { id: "whatsapp", label: "WhatsApp", icon: Phone },
          { id: "receipt", label: "Comprovantes", icon: FileText },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSubTab(item.id as any)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeSubTab === item.id ? "bg-black text-white shadow-lg" : "bg-white text-[#A09898] border border-lilac/20 hover:border-lilac hover:text-slate-900"}`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} />
              <span className="text-[10px] uppercase font-black tracking-widest">
                {item.label}
              </span>
            </div>
            {activeSubTab === item.id && <ChevronRight size={16} />}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 md:p-12 rounded-[2.5rem] bg-white border border-lilac/20 shadow-sm min-h-[600px]">
        {activeSubTab === "brand" && (
          <div className="space-y-12">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-lilac/10 text-lilac">
                <Store size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">
                Gestão de Marcas
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-12">
              {(
                [
                  { id: "pallyra", label: "La Pallyra", color: "text-sky-500" },
                  {
                    id: "guennita",
                    label: "com amor, Guennita",
                    color: "text-[#D1CACA]",
                  },
                  { id: "mimada", label: "Mimada Sim", color: "text-pink-500" },
                ] as const
              ).map((atl) => {
                const atlSettings = allAteliers[atl.id];
                return (
                  <div
                    key={atl.id}
                    className="bg-white/50 border border-lilac/10 rounded-[3rem] p-8 md:p-12 space-y-10 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Store size={120} />
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                      <div
                        className={`w-3 h-3 rounded-full bg-current ${atl.color}`}
                      />
                      <h4 className="text-lg font-black uppercase tracking-tight text-slate-900">
                        {atl.label}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 relative z-10">
                      {/* Logo & Banner Section */}
                      <div className="space-y-6">
                        <ImageUpload
                          label="Logo Principal"
                          path={`catalogos/${atl.id}`}
                          currentUrl={atlSettings.store_logo}
                          onUploadComplete={(url) =>
                            updateMultiField(atl.id, "store_logo", url)
                          }
                          onRemove={() =>
                            updateMultiField(atl.id, "store_logo", "")
                          }
                        />
                        <ImageUpload
                          label="Banner Checkout (1800x300)"
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

                      {/* Info Section */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                            Slogan / Descrição
                          </label>
                          <textarea
                            value={atlSettings.store_slogan || ""}
                            onChange={(e) =>
                              updateMultiField(
                                atl.id,
                                "store_slogan",
                                e.target.value,
                              )
                            }
                            className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-lilac transition-all h-24 resize-none shadow-sm"
                            placeholder="Ex: Transformando momentos em memórias..."
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4">
                          <div className="space-y-2">
                            <label className="text-[9px] uppercase font-black text-[#A09898]">
                              Cor Principal
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={
                                  atlSettings.theme_primary_color || "#ffffff"
                                }
                                onChange={(e) =>
                                  updateMultiField(
                                    atl.id,
                                    "theme_primary_color",
                                    e.target.value,
                                  )
                                }
                                className="w-10 h-10 rounded-lg cursor-pointer border-none"
                              />
                              <input
                                type="text"
                                value={
                                  atlSettings.theme_primary_color || "#ffffff"
                                }
                                onChange={(e) =>
                                  updateMultiField(
                                    atl.id,
                                    "theme_primary_color",
                                    e.target.value,
                                  )
                                }
                                className="min-w-0 flex-1 bg-white border border-lilac/20 rounded-lg px-2 text-[10px] font-mono outline-none"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] uppercase font-black text-[#A09898]">
                              Cor Detalhes
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={
                                  atlSettings.theme_accent_color || "#FF007F"
                                }
                                onChange={(e) =>
                                  updateMultiField(
                                    atl.id,
                                    "theme_accent_color",
                                    e.target.value,
                                  )
                                }
                                className="w-10 h-10 rounded-lg cursor-pointer border-none"
                              />
                              <input
                                type="text"
                                value={
                                  atlSettings.theme_accent_color || "#FF007F"
                                }
                                onChange={(e) =>
                                  updateMultiField(
                                    atl.id,
                                    "theme_accent_color",
                                    e.target.value,
                                  )
                                }
                                className="min-w-0 flex-1 bg-white border border-lilac/20 rounded-lg px-2 text-[10px] font-mono outline-none"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] uppercase font-black text-[#A09898]">
                              Cor Info/Texto
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={
                                  atlSettings.theme_text_color || "#000000"
                                }
                                onChange={(e) =>
                                  updateMultiField(
                                    atl.id,
                                    "theme_text_color",
                                    e.target.value,
                                  )
                                }
                                className="w-10 h-10 rounded-lg cursor-pointer border-none"
                              />
                              <input
                                type="text"
                                value={
                                  atlSettings.theme_text_color || "#000000"
                                }
                                onChange={(e) =>
                                  updateMultiField(
                                    atl.id,
                                    "theme_text_color",
                                    e.target.value,
                                  )
                                }
                                className="min-w-0 flex-1 bg-white border border-lilac/20 rounded-lg px-2 text-[10px] font-mono outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSubTab === "about" && (
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-[#D48C8C]/15 text-[#D48C8C]">
                <User size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">
                Editar Página Sobre Nós
              </h3>
            </div>

            <p className="text-[10px] uppercase font-black text-[#A09898] tracking-widest leading-relaxed">
              Personalize a apresentação de Julia Aleixo, enviando uma foto profissional e editando os textos de biografia e propósito.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Photo Upload Card */}
              <div className="space-y-4">
                <ImageUpload
                  label="Minha Foto (Perfil / Ateliê)"
                  path="sobrenos"
                  currentUrl={settings.about_me_photo}
                  onUploadComplete={(url) => updateField("about_me_photo", url)}
                  onRemove={() => updateField("about_me_photo", "")}
                />
                
                <div className="space-y-1.5 max-w-full pl-1">
                  <label className="text-[8px] font-black text-[#D1CACA] uppercase tracking-widest">
                    Link Manual da Imagem (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Link da sua foto..."
                    className="w-full bg-slate-100/50 border border-lilac/5 rounded-xl px-4 py-2 text-[10px] outline-none font-bold focus:border-lilac transition-all"
                    value={settings.about_me_photo || ""}
                    onChange={(e) => updateField("about_me_photo", e.target.value)}
                  />
                </div>
              </div>

              {/* Text Fields Editorial */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Título do Perfil / Saudação
                  </label>
                  <input
                    type="text"
                    value={settings.about_me_title || ""}
                    onChange={(e) => updateField("about_me_title", e.target.value)}
                    placeholder="Ex: Olá, sou a Julia Aleixo!"
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-lilac transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Texto Biográfico / Sua História
                  </label>
                  <textarea
                    value={settings.about_me_bio || ""}
                    onChange={(e) => updateField("about_me_bio", e.target.value)}
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-lilac transition-all h-40 resize-none shadow-sm"
                    placeholder="Conte sobre sua paixão pelo artesanato, suas origens e marcas de ateliê..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Nosso Propósito / Compromisso
                  </label>
                  <textarea
                    value={settings.about_me_purpose || ""}
                    onChange={(e) => updateField("about_me_purpose", e.target.value)}
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-lilac transition-all h-36 resize-none"
                    placeholder="Explique o diferencial de qualidade, ciclos de alteração e dedicação nos detalhes..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "pix" && (
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
                <CreditCard size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">
                Configurações de Venda
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <ImageUpload
                  label="QR Code PIX"
                  path="pix"
                  currentUrl={settings.store_qrcode}
                  onUploadComplete={(url) => updateField("store_qrcode", url)}
                  onRemove={() => updateField("store_qrcode", "")}
                />
                <div className="space-y-1.5 max-w-full pl-1">
                  <label className="text-[8px] font-black text-[#D1CACA] uppercase tracking-widest">
                    Ou insira o Link Manual
                  </label>
                  <input
                    type="text"
                    placeholder="Link da imagem..."
                    className="w-full bg-slate-100/50 border border-lilac/5 rounded-xl px-4 py-2 text-[10px] outline-none font-bold focus:border-lilac transition-all"
                    value={settings.store_qrcode || ""}
                    onChange={(e) =>
                      updateField("store_qrcode", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-4 p-6 rounded-[2rem] bg-lilac/5 border border-lilac/10 mb-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Meta de Vendas Mensal (R$)
                  </label>
                  <input
                    type="number"
                    value={settings.monthly_goal || ""}
                    onChange={(e) =>
                      updateField("monthly_goal", Number(e.target.value))
                    }
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-black outline-none focus:border-lilac transition-all shadow-sm"
                    placeholder="Ex: 10000"
                  />
                  <p className="text-[8px] text-[#A09898] font-bold uppercase tracking-widest ml-2 leading-relaxed">
                    Esta meta será usada no termômetro do dashboard.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={settings.store_pix_key || ""}
                    onChange={(e) =>
                      updateField("store_pix_key", e.target.value)
                    }
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-mono font-bold outline-none focus:border-lilac transition-all"
                    placeholder="Ex: 00.000.000/0001-00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Nome do Beneficiário
                  </label>
                  <input
                    type="text"
                    value={settings.store_pix_name || ""}
                    onChange={(e) =>
                      updateField("store_pix_name", e.target.value)
                    }
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-lilac transition-all"
                    placeholder="Ex: Ateliê Sob Medida LTDA"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "pricing" && (
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-600">
                <Calculator size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">
                Base de Precificação
              </h3>
            </div>

            <p className="text-[10px] uppercase font-black text-[#A09898] tracking-widest leading-relaxed">
              Estes valores globais serão usados pela Inteligência do Sistema na
              hora de sugerir o Preço de Venda do seus produtos baseando-se no
              tempo gasto e custo dos insumos.
            </p>

            <div className="space-y-12">
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
        )}

        {activeSubTab === "marketing" && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Facebook size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">
                Marketing Digital
              </h3>
            </div>

            <div className="p-8 rounded-3xl bg-blue-50 border border-blue-100 space-y-4">
              <p className="text-[10px] text-blue-400 uppercase font-bold leading-relaxed tracking-widest">
                Insira o ID do seu Pixel do Facebook para rastreamento.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                  Pixel ID
                </label>
                <input
                  type="text"
                  value={settings.facebook_pixel || ""}
                  onChange={(e) =>
                    updateField("facebook_pixel", e.target.value)
                  }
                  placeholder="Ex: 1234567890"
                  className="w-full bg-white border border-blue-200 rounded-2xl px-6 py-4 text-xs font-mono font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "whatsapp" && (
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
                <Phone size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">
                WhatsApp & Mensagens
              </h3>
            </div>

            <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-100 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                  Número do WhatsApp (Com DDD)
                </label>
                <input
                  type="text"
                  value={settings.store_contact || ""}
                  onChange={(e) => updateField("store_contact", e.target.value)}
                  placeholder="(44) 9 9999-9999"
                  className="w-full bg-white border border-emerald-200 rounded-2xl px-6 py-4 text-xs font-mono font-bold outline-none focus:border-emerald-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Mensagem do Botão WhatsApp (Loja)
                  </label>
                  <textarea
                    value={settings.whatsapp_main_message || ""}
                    onChange={(e) =>
                      updateField("whatsapp_main_message", e.target.value)
                    }
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-lilac transition-all h-40 resize-none"
                    placeholder="Olá! Vi a sua loja e gostaria de tirar uma dúvida..."
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Mensagem de Interesse (Produto)
                  </label>
                  <textarea
                    value={settings.whatsapp_product_message || ""}
                    onChange={(e) =>
                      updateField("whatsapp_product_message", e.target.value)
                    }
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-lilac transition-all h-40 resize-none"
                    placeholder="Olá! Tenho interesse no {product}..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "receipt" && (
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-600">
                <FileText size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">
                Textos dos Comprovantes
              </h3>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Aviso Legal (Cupom)
                  </label>
                  <textarea
                    value={settings.receipt_footer || ""}
                    onChange={(e) =>
                      updateField("receipt_footer", e.target.value)
                    }
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-lilac transition-all h-32 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Aviso Legal (Orçamento)
                  </label>
                  <textarea
                    value={settings.quote_footer || ""}
                    onChange={(e) =>
                      updateField("quote_footer", e.target.value)
                    }
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-lilac transition-all h-32 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Mensagem do Comprovante (Para todos os ateliês)
                  </label>
                  <textarea
                    value={settings.receipt_message || ""}
                    onChange={(e) =>
                      updateField("receipt_message", e.target.value)
                    }
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-lilac transition-all h-24 resize-none"
                    placeholder="Ex: Obrigado pela sua compra. Seu pedido foi registrado com sucesso."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
                    Mensagem do Cupom (Para todos os ateliês)
                  </label>
                  <textarea
                    value={settings.coupon_message || ""}
                    onChange={(e) =>
                      updateField("coupon_message", e.target.value)
                    }
                    className="w-full bg-white border border-lilac/20 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-lilac transition-all h-24 resize-none"
                    placeholder="Ex: Este não é um documento fiscal. Pedido realizado com carinho."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] uppercase font-black text-[#A09898] tracking-widest pl-2">
                  Dica de Variáveis
                </p>
                <div className="p-6 rounded-[2rem] bg-white border border-lilac/10 space-y-4">
                  <p className="text-[10px] text-[#A09898] leading-relaxed font-bold">
                    Use as tags abaixo p/ preencher os dados automaticamente:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[8px] font-black uppercase tracking-wider">
                    <span className="p-2 bg-white rounded-lg border border-lilac/5">
                      {"{ateliê}"}
                    </span>
                    <span className="p-2 bg-white rounded-lg border border-lilac/5">
                      {"{cliente}"}
                    </span>
                    <span className="p-2 bg-white rounded-lg border border-lilac/5">
                      {"{pedido}"}
                    </span>
                    <span className="p-2 bg-white rounded-lg border border-lilac/5">
                      {"{total}"}
                    </span>
                    <span className="p-2 bg-white rounded-lg border border-lilac/5">
                      {"{data}"}
                    </span>
                  </div>
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
                Configure exatamente 10 opções para a roleta. Ela será exibida
                no final de compras a partir de R$ 300,00.
              </p>

              <div className="space-y-4">
                {(
                  settings.roulette_prizes ||
                  Array.from({ length: 10 }).map((_, i) => ({
                    id: `prize-${i}`,
                    name: `Brinde ${i + 1}`,
                    active: true,
                    weight: 10,
                  }))
                ).map((prize, idx) => (
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
                        const newPrizes = [
                          ...(settings.roulette_prizes ||
                            Array.from({ length: 10 }).map((_, i) => ({
                              id: `prize-${i}`,
                              name: `Brinde ${i + 1}`,
                              active: true,
                              weight: 10,
                            }))),
                        ];
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
                          const newPrizes = [
                            ...(settings.roulette_prizes ||
                              Array.from({ length: 10 }).map((_, i) => ({
                                id: `prize-${i}`,
                                name: `Brinde ${i + 1}`,
                                active: true,
                                weight: 10,
                              }))),
                          ];
                          newPrizes[idx].weight = Number(e.target.value);
                          updateField("roulette_prizes", newPrizes);
                        }}
                        className="w-16 bg-white border border-lilac/20 rounded-xl px-2 py-3 text-xs font-bold outline-none focus:border-lilac text-center"
                      />
                    </div>

                    <button
                      onClick={() => {
                        const newPrizes = [
                          ...(settings.roulette_prizes ||
                            Array.from({ length: 10 }).map((_, i) => ({
                              id: `prize-${i}`,
                              name: `Brinde ${i + 1}`,
                              active: true,
                              weight: 10,
                            }))),
                        ];
                        newPrizes[idx].active = !newPrizes[idx].active;
                        updateField("roulette_prizes", newPrizes);
                      }}
                      className={`w-24 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${prize.active ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-rose-600"}`}
                    >
                      {prize.active ? "Ativo" : "Inativo"}
                    </button>
                  </div>
                ))}
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
