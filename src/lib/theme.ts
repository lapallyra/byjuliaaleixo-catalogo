
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
    textPrimary: 'text-[#FF007F]',
    textSecondary: 'text-[#FF007F]/70',
    textMuted: 'text-[#FF007F]/40',
    textVeryMuted: 'text-[#FF007F]/20',
    borderLine: 'border-[#FF007F]/30',
    cardBg: 'bg-white',
    cardHover: 'hover:border-[#C8B8E6] hover:bg-[#C8B8E6]/5',
    searchBg: 'bg-white border-[#FF007F]/20',
    inputPlaceholder: 'placeholder:text-[#FF007F]/30',
    sidebarBg: 'bg-white',
    btnPrimary: 'bg-[#FF007F] text-white shadow-[#FF007F]/20 hover:bg-[#FF007F]/90',
    btnSecondary: 'bg-[#C8B8E6]/10 border-[#C8B8E6]/30 text-[#FF007F] hover:bg-[#C8B8E6]/20',
    btnSecondaryText: 'text-[#FF007F]/70 hover:text-[#FF007F]',
    categoryActive: 'text-[#FFFFFF] bg-[#C8B8E6]',
    categoryInactive: 'text-[#FF007F]/60 hover:text-[#FF007F] hover:bg-[#C8B8E6]/10',
    specialText: 'text-[#FF007F]',
    specialHighlight: 'text-[#FF007F]',
    specialBg: 'bg-[#FF007F]/10',
    specialBorder: 'border-[#FF007F]/30',
    specialBtn: 'bg-white border-[#C8B8E6] text-[#FF007F] hover:bg-[#C8B8E6]/20',
    specialAddBtn: 'bg-[#C8B8E6] text-[#FFFFFF] hover:bg-[#C8B8E6]/80',
    cartBadge: 'bg-white text-[#FF007F] border-[#FF007F]',
    gradientText: 'text-[#FF007F]',
    cartBtn: 'bg-[#FF007F] text-[#FFFFFF] shadow-[#FF007F]/40',
    cartIcon: 'text-white',
    neonBorder: 'border-[#FF007F]/40 shadow-md',
    neonPulse: 'shadow-none'
  }
};
