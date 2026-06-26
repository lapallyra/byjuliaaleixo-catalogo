
export interface Theme {
  bg: string;
  primaryColor: string;
  accentColor: string;
  accentGlow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textVeryMuted: string;
  borderLine: string;
  cardBg: string;
  cardHover: string;
  searchBg: string;
  inputPlaceholder: string;
  sidebarBg: string;
  btnPrimary: string;
  btnSecondary: string;
  btnSecondaryText: string;
  categoryActive: string;
  categoryInactive: string;
  specialText: string;
  specialHighlight: string;
  specialBg: string;
  specialBorder: string;
  specialBtn: string;
  specialAddBtn: string;
  cartBadge: string;
  gradientText: string;
  cartBtn: string;
  cartIcon: string;
  neonBorder: string;
  neonPulse: string;
  logoUrl?: string;
  whatsapp?: string;
}

export const themes: Record<string, Theme> = {
  pallyra: {
    bg: 'bg-[#F8F8F6]',
    primaryColor: '#F8F8F6',
    accentColor: '#C6A664',
    accentGlow: 'rgba(198, 166, 100, 0.2)',
    textPrimary: 'text-[#161616]',
    textSecondary: 'text-[#161616]/70',
    textMuted: 'text-[#161616]/40',
    textVeryMuted: 'text-[#161616]/20',
    borderLine: 'border-[#161616]/10',
    cardBg: 'bg-white',
    cardHover: 'hover:border-[#C6A664]/50 hover:shadow-2xl',
    searchBg: 'bg-[#D9D9D9]/20',
    inputPlaceholder: 'placeholder:text-[#161616]/30',
    sidebarBg: 'bg-white',
    btnPrimary: 'bg-[#161616] text-[#C6A664] hover:bg-[#C6A664] hover:text-[#161616]',
    btnSecondary: 'bg-transparent border-[#161616]/20 text-[#161616] hover:bg-[#161616]/5',
    btnSecondaryText: 'text-[#161616]/60 hover:text-[#161616]',
    categoryActive: 'text-[#C6A664] bg-white border-b-2 border-[#C6A664]',
    categoryInactive: 'text-[#161616]/40 hover:text-[#C6A664]',
    specialText: 'text-[#C6A664]',
    specialHighlight: 'text-[#C6A664]',
    specialBg: 'bg-[#C6A664]/5',
    specialBorder: 'border-[#C6A664]/20',
    specialBtn: 'bg-[#161616] border-[#161616] text-white hover:bg-[#161616]/90',
    specialAddBtn: 'bg-[#C6A664] border-[#C6A664] text-white hover:bg-[#C6A664]/90',
    cartBadge: 'bg-[#161616] text-white border-none',
    gradientText: 'text-[#C6A664]',
    cartBtn: 'bg-[#161616] text-white shadow-lg',
    cartIcon: 'text-white',
    neonBorder: 'border-[#C6A664]/30 shadow-sm',
    neonPulse: 'shadow-none'
  },
  guennita: {
    bg: 'bg-[#56070c]', // Borgonha escuro
    primaryColor: '#56070c',
    accentColor: '#D4AF37',
    accentGlow: 'rgba(212, 175, 55, 0.4)',
    textPrimary: 'text-white',
    textSecondary: 'text-white/50',
    textMuted: 'text-white/40',
    textVeryMuted: 'text-white/30',
    borderLine: 'border-[#D4AF37]/20',
    cardBg: 'bg-white/5',
    cardHover: 'hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5',
    searchBg: 'bg-white/5',
    inputPlaceholder: 'placeholder:text-white/30',
    sidebarBg: 'bg-[#7a141a]',
    btnPrimary: 'bg-[#D4AF37] text-[#56070c] hover:bg-[#D4AF37]/90 shadow-[#D4AF37]/20',
    btnSecondary: 'bg-white/5 border-white/20 text-white hover:bg-white/10',
    btnSecondaryText: 'text-white/50 hover:text-white',
    categoryActive: 'text-[#D4AF37] bg-[#D4AF37]/10',
    categoryInactive: 'text-white/40 hover:text-[#D4AF37]/80 hover:bg-[#D4AF37]/5',
    specialText: 'text-[#D4AF37]',
    specialHighlight: 'text-[#D4AF37]',
    specialBg: 'bg-[#D4AF37]/10',
    specialBorder: 'border-[#D4AF37]/30',
    specialBtn: 'bg-[#D4AF37] border-[#D4AF37] text-[#56070c] hover:bg-[#D4AF37]/90',
    specialAddBtn: 'bg-white/10 border-[#D4AF37]/30 text-white hover:bg-white/20',
    cartBadge: 'bg-[#D4AF37] text-[#56070c] border-[#56070c]',
    gradientText: 'text-[#D4AF37]',
    cartBtn: 'bg-[#56070c] text-[#D4AF37] shadow-[#56070c]/40',
    cartIcon: 'text-[#D4AF37]',
    neonBorder: 'border-[#D4AF37]/40 shadow-md',
    neonPulse: 'shadow-none'
  },
  mimada: {
    bg: 'bg-[#FFFFFF]',
    primaryColor: '#FFFFFF',
    accentColor: '#FF007F',
    accentGlow: 'rgba(255, 0, 127, 0.3)',
    textPrimary: 'text-[#161616]',
    textSecondary: 'text-[#161616]/70',
    textMuted: 'text-[#161616]/40',
    textVeryMuted: 'text-[#161616]/20',
    borderLine: 'border-[#161616]/10',
    cardBg: 'bg-white',
    cardHover: 'hover:border-[#FF007F]/40 hover:bg-[#FF007F]/5',
    searchBg: 'bg-white border-[#161616]/20',
    inputPlaceholder: 'placeholder:text-[#161616]/30',
    sidebarBg: 'bg-white',
    btnPrimary: 'bg-[#FF007F] text-white shadow-[#FF007F]/20 hover:bg-[#FF007F]/90',
    btnSecondary: 'bg-[#161616]/5 border-[#161616]/10 text-[#161616] hover:bg-[#161616]/10',
    btnSecondaryText: 'text-[#161616]/70 hover:text-[#161616]',
    categoryActive: 'text-white bg-[#FF007F]',
    categoryInactive: 'text-[#161616]/60 hover:text-[#FF007F]',
    specialText: 'text-[#FF007F]',
    specialHighlight: 'text-[#FF007F]',
    specialBg: 'bg-[#FF007F]/10',
    specialBorder: 'border-[#FF007F]/30',
    specialBtn: 'bg-white border-[#FF007F] text-[#FF007F] hover:bg-[#FF007F]/10',
    specialAddBtn: 'bg-[#FF007F] text-[#FFFFFF] hover:bg-[#FF007F]/80',
    cartBadge: 'bg-[#161616] text-[#FF007F] border-none',
    gradientText: 'text-[#FF007F]',
    cartBtn: 'bg-[#FF007F] text-[#FFFFFF] shadow-[#FF007F]/40',
    cartIcon: 'text-white',
    neonBorder: 'border-[#FF007F]/40 shadow-md',
    neonPulse: 'shadow-none'
  },
  tuttymimo: {
    bg: 'bg-[#FFFFFF]',
    primaryColor: '#FFFFFF',
    accentColor: '#C8A2C8',
    accentGlow: 'rgba(200, 162, 200, 0.3)',
    textPrimary: 'text-[#333333]',
    textSecondary: 'text-[#333333]/70',
    textMuted: 'text-[#333333]/40',
    textVeryMuted: 'text-[#333333]/20',
    borderLine: 'border-gray-200',
    cardBg: 'bg-white',
    cardHover: 'hover:border-[#C8A2C8]/50 hover:shadow-lg',
    searchBg: 'bg-gray-50',
    inputPlaceholder: 'placeholder:text-gray-400',
    sidebarBg: 'bg-white',
    btnPrimary: 'bg-[#C8A2C8] text-white hover:bg-[#C8A2C8]/80',
    btnSecondary: 'bg-white border-[#F4C2C2] text-[#333333] hover:bg-[#F4C2C2]/10',
    btnSecondaryText: 'text-[#333333]/70 hover:text-[#333333]',
    categoryActive: 'text-[#C8A2C8] bg-[#C8A2C8]/20',
    categoryInactive: 'text-gray-500 hover:text-[#C8A2C8]',
    specialText: 'text-[#F4C2C2]',
    specialHighlight: 'text-[#C8A2C8]',
    specialBg: 'bg-[#C8A2C8]/10',
    specialBorder: 'border-[#F4C2C2]',
    specialBtn: 'bg-[#F4C2C2] text-white hover:bg-[#F4C2C2]/90',
    specialAddBtn: 'bg-[#C8A2C8] text-white hover:bg-[#C8A2C8]/90',
    cartBadge: 'bg-[#C8A2C8] text-white',
    gradientText: 'text-[#C8A2C8]',
    cartBtn: 'bg-[#F4C2C2] text-white shadow-lg',
    cartIcon: 'text-white',
    neonBorder: 'border-[#F4C2C2]/50',
    neonPulse: 'shadow-none'
  },
  tuttyMimo: {
    bg: 'bg-[#FFFFFF]',
    primaryColor: '#FFFFFF',
    accentColor: '#C8A2C8',
    accentGlow: 'rgba(200, 162, 200, 0.3)',
    textPrimary: 'text-[#333333]',
    textSecondary: 'text-[#333333]/70',
    textMuted: 'text-[#333333]/40',
    textVeryMuted: 'text-[#333333]/20',
    borderLine: 'border-gray-200',
    cardBg: 'bg-white',
    cardHover: 'hover:border-[#C8A2C8]/50 hover:shadow-lg',
    searchBg: 'bg-gray-50',
    inputPlaceholder: 'placeholder:text-gray-400',
    sidebarBg: 'bg-white',
    btnPrimary: 'bg-[#C8A2C8] text-white hover:bg-[#C8A2C8]/80',
    btnSecondary: 'bg-white border-[#F4C2C2] text-[#333333] hover:bg-[#F4C2C2]/10',
    btnSecondaryText: 'text-[#333333]/70 hover:text-[#333333]',
    categoryActive: 'text-[#C8A2C8] bg-[#C8A2C8]/20',
    categoryInactive: 'text-gray-500 hover:text-[#C8A2C8]',
    specialText: 'text-[#F4C2C2]',
    specialHighlight: 'text-[#C8A2C8]',
    specialBg: 'bg-[#C8A2C8]/10',
    specialBorder: 'border-[#F4C2C2]',
    specialBtn: 'bg-[#F4C2C2] text-white hover:bg-[#F4C2C2]/90',
    specialAddBtn: 'bg-[#C8A2C8] text-white hover:bg-[#C8A2C8]/90',
    cartBadge: 'bg-[#C8A2C8] text-white',
    gradientText: 'text-[#C8A2C8]',
    cartBtn: 'bg-[#F4C2C2] text-white shadow-lg',
    cartIcon: 'text-white',
    neonBorder: 'border-[#F4C2C2]/50',
    neonPulse: 'shadow-none'
  },
  mimadaSim: {
    bg: 'bg-[#FAF9F6]',
    primaryColor: '#FAF9F6',
    accentColor: '#FF69B4',
    accentGlow: 'rgba(255, 105, 180, 0.3)',
    textPrimary: 'text-[#333333]',
    textSecondary: 'text-[#333333]/70',
    textMuted: 'text-[#333333]/40',
    textVeryMuted: 'text-[#333333]/20',
    borderLine: 'border-[#FF69B4]/20',
    cardBg: 'bg-white',
    cardHover: 'hover:border-[#FF69B4]/50 hover:shadow-lg',
    searchBg: 'bg-white',
    inputPlaceholder: 'placeholder:text-gray-400',
    sidebarBg: 'bg-white',
    btnPrimary: 'bg-[#FF69B4] text-white hover:bg-[#FF69B4]/90',
    btnSecondary: 'bg-white border-[#FF69B4] text-[#333333] hover:bg-[#FF69B4]/10',
    btnSecondaryText: 'text-[#333333]/80 hover:text-[#333333]',
    categoryActive: 'text-[#FF69B4] bg-[#FF69B4]/10',
    categoryInactive: 'text-gray-500 hover:text-[#FF69B4]',
    specialText: 'text-[#FF69B4]',
    specialHighlight: 'text-[#FF69B4]',
    specialBg: 'bg-[#FF69B4]/10',
    specialBorder: 'border-[#FF69B4]',
    specialBtn: 'bg-[#FF69B4] text-white hover:bg-[#FF69B4]/90',
    specialAddBtn: 'bg-[#FF69B4] text-white hover:bg-[#FF69B4]/90',
    cartBadge: 'bg-[#FF69B4] text-white',
    gradientText: 'text-[#FF69B4]',
    cartBtn: 'bg-[#FF69B4] text-white shadow-lg',
    cartIcon: 'text-white',
    neonBorder: 'border-[#FF69B4]/30',
    neonPulse: 'shadow-none'
  },
  comAmorGuennita: {
    bg: 'bg-[#FAF9F6]',
    primaryColor: '#800020',
    accentColor: '#800020',
    accentGlow: 'rgba(128, 0, 32, 0.2)',
    textPrimary: 'text-[#2D1B1B]',
    textSecondary: 'text-[#2D1B1B]/70',
    textMuted: 'text-[#2D1B1B]/40',
    textVeryMuted: 'text-[#2D1B1B]/20',
    borderLine: 'border-[#800020]/20',
    cardBg: 'bg-white',
    cardHover: 'hover:border-[#800020]/50 hover:shadow-lg',
    searchBg: 'bg-white',
    inputPlaceholder: 'placeholder:text-gray-400',
    sidebarBg: 'bg-white',
    btnPrimary: 'bg-[#800020] text-white hover:bg-[#800020]/90',
    btnSecondary: 'bg-white border-[#800020] text-[#2D1B1B] hover:bg-[#800020]/10',
    btnSecondaryText: 'text-[#2D1B1B]/80 hover:text-[#2D1B1B]',
    categoryActive: 'text-[#800020] bg-[#800020]/10',
    categoryInactive: 'text-gray-500 hover:text-[#800020]',
    specialText: 'text-[#800020]',
    specialHighlight: 'text-[#800020]',
    specialBg: 'bg-[#800020]/10',
    specialBorder: 'border-[#800020]',
    specialBtn: 'bg-[#800020] text-white hover:bg-[#800020]/90',
    specialAddBtn: 'bg-[#800020] text-white hover:bg-[#800020]/90',
    cartBadge: 'bg-[#800020] text-white',
    gradientText: 'text-[#800020]',
    cartBtn: 'bg-[#800020] text-white shadow-lg',
    cartIcon: 'text-white',
    neonBorder: 'border-[#800020]/30',
    neonPulse: 'shadow-none'
  },
  laPallyra: {
    bg: 'bg-[#FAF9F6]',
    primaryColor: '#FAF9F6',
    accentColor: '#FFD700',
    accentGlow: 'rgba(255, 215, 0, 0.3)',
    textPrimary: 'text-[#1A1A1A]',
    textSecondary: 'text-[#1A1A1A]/70',
    textMuted: 'text-[#1A1A1A]/40',
    textVeryMuted: 'text-[#1A1A1A]/20',
    borderLine: 'border-[#FFD700]/30',
    cardBg: 'bg-white',
    cardHover: 'hover:border-[#FFD700]/50 hover:shadow-lg',
    searchBg: 'bg-white',
    inputPlaceholder: 'placeholder:text-gray-400',
    sidebarBg: 'bg-white',
    btnPrimary: 'bg-[#1A1A1A] text-[#FFD700] hover:bg-black',
    btnSecondary: 'bg-white border-[#FFD700] text-[#1A1A1A] hover:bg-[#FFD700]/10',
    btnSecondaryText: 'text-[#1A1A1A]/80 hover:text-[#1A1A1A]',
    categoryActive: 'text-[#FFD700] bg-[#1A1A1A]',
    categoryInactive: 'text-gray-500 hover:text-[#FFD700]',
    specialText: 'text-[#FFD700]',
    specialHighlight: 'text-[#FFD700]',
    specialBg: 'bg-[#1A1A1A]/10',
    specialBorder: 'border-[#FFD700]',
    specialBtn: 'bg-[#FFD700] text-[#1A1A1A] hover:bg-[#FFD700]/90',
    specialAddBtn: 'bg-[#1A1A1A] text-[#FFD700] hover:bg-black',
    cartBadge: 'bg-[#1A1A1A] text-[#FFD700]',
    gradientText: 'text-[#FFD700]',
    cartBtn: 'bg-[#1A1A1A] text-[#FFD700] shadow-lg',
    cartIcon: 'text-[#FFD700]',
    neonBorder: 'border-[#FFD700]/40',
    neonPulse: 'shadow-none'
  }

};

export const getTheme = (companyId?: string): Theme => {
  if (!companyId) return themes.pallyra;
  return themes[companyId] || themes.pallyra;
};
