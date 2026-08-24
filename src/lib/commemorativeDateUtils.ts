import { addDays, subDays, startOfMonth, nextDay, isBefore, startOfToday, isToday, format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CommemorativeDate } from '../types';

/**
 * Calculates Easter Sunday for a given year.
 */
export function calculateEaster(year: number): Date {
  const f = Math.floor;
  const G = year % 19;
  const C = f(year / 100);
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7;
  const L = I - J;
  const month = 3 + f((L + 40) / 44);
  const day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
}

/**
 * Calculates Carnival Saturday (official start feeling, usually taken as 47 days before Easter).
 */
export function calculateCarnival(year: number): Date {
  return subDays(calculateEaster(year), 47);
}

/**
 * Calculates Corpus Christi (60 days after Easter).
 */
export function calculateCorpusChristi(year: number): Date {
  return addDays(calculateEaster(year), 60);
}

/**
 * Calculates Mother's Day (2nd Sunday of May).
 */
export function calculateMothersDay(year: number): Date {
  const may1st = new Date(year, 4, 1);
  const firstSunday = nextDay(subDays(may1st, 1), 0);
  return addDays(firstSunday, 7);
}

/**
 * Calculates Father's Day (2nd Sunday of August).
 */
export function calculateFathersDay(year: number): Date {
  const aug1st = new Date(year, 7, 1);
  const firstSunday = nextDay(subDays(aug1st, 1), 0);
  return addDays(firstSunday, 7);
}

/**
 * Calculates Black Friday (Friday after Thanksgiving, 4th Friday of November).
 */
export function calculateBlackFriday(year: number): Date {
  const nov1st = new Date(year, 10, 1);
  const firstFriday = nextDay(subDays(nov1st, 1), 5); // 5 = Friday
  return addDays(firstFriday, 21); // 4th Friday
}

export function getMobileDateOccurrence(mobileId: string, year: number): { day: number, month: number } {
  let date: Date;
  switch (mobileId) {
    case 'pascoa': date = calculateEaster(year); break;
    case 'carnaval': date = calculateCarnival(year); break;
    case 'corpus_christi': date = calculateCorpusChristi(year); break;
    case 'mothers_day': date = calculateMothersDay(year); break;
    case 'fathers_day': date = calculateFathersDay(year); break;
    case 'black_friday': date = calculateBlackFriday(year); break;
    default: return { day: 0, month: 0 };
  }
  return { day: date.getDate(), month: date.getMonth() + 1 };
}

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // separate accents from characters
    .replace(/[\u0300-\u036f]/g, '') // remove accent symbols
    .replace(/[^\w\s-]/g, '') // remove all non-word chars
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-') // replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Computes the exact Date object for a commemorative date in the closest upcoming year
 */
export function getFullCommemorativeDate(d: CommemorativeDate, fromDate: Date = new Date()): Date {
  const year = fromDate.getFullYear();
  let dateObj: Date;

  if (d.year_fixed) {
    dateObj = new Date(year, d.month - 1, d.day, 23, 59, 59);
  } else if (d.mobile_id) {
    const occurrence = getMobileDateOccurrence(d.mobile_id, year);
    dateObj = new Date(year, occurrence.month - 1, occurrence.day, 23, 59, 59);
  } else {
    dateObj = new Date(year, d.month - 1, d.day, 23, 59, 59);
  }

  // If recurrent and the date has already passed for this year, count down to next year's occurrence!
  const today = startOfToday();
  if (d.recurrent !== false && isBefore(dateObj, today) && !isToday(dateObj)) {
    if (d.year_fixed) {
      return new Date(year + 1, d.month - 1, d.day, 23, 59, 59);
    } else if (d.mobile_id) {
      const occurrence = getMobileDateOccurrence(d.mobile_id, year + 1);
      return new Date(year + 1, occurrence.month - 1, occurrence.day, 23, 59, 59);
    } else {
      return new Date(year + 1, d.month - 1, d.day, 23, 59, 59);
    }
  }

  return dateObj;
}

/**
 * Calculates remaining days, formatted title and target date for any CommemorativeDate
 */
export function getCommemorativeDateCountdown(d: CommemorativeDate, fromDate: Date = new Date()) {
  const targetDate = getFullCommemorativeDate(d, fromDate);
  const today = startOfToday();
  const daysLeft = Math.max(0, differenceInDays(targetDate, today));
  const formattedDayMonth = format(targetDate, "dd 'de' MMMM", { locale: ptBR });

  return {
    daysLeft,
    targetDate,
    formattedDayMonth,
    isToday: isToday(targetDate),
    isWithin60D: daysLeft <= 60,
  };
}

/**
 * Rich base catalog of Commemorative Dates organized by Scope (Nacional, Mundial, Regional)
 */
export const DEFAULT_COMMEMORATIVE_DATES: CommemorativeDate[] = [
  // --- NACIONAL ---
  {
    id: 'nacional-dia-das-maes',
    name: 'Dia das Mães',
    description: 'A data mais nobre do ano para celebrar o amor maternal com kits afetivos e encadernações artesanais.',
    category: 'emocional',
    day: 10,
    month: 5,
    year_fixed: false,
    recurrent: true,
    active: true,
    theme_color: '#B38F4D',
    icon: 'Heart',
    scope: 'nacional',
    is_national: true,
    hashtags: ['diadasmaes', 'maes', 'presenteafetivo', 'lapallyra'],
    marketing_phrase: 'Eternize o amor de quem sempre esteve ao seu lado.',
    priority: 100,
    mobile_id: 'mothers_day',
    createdAt: null,
    updatedAt: null
  },
  {
    id: 'nacional-dia-dos-namorados',
    name: 'Dia dos Namorados',
    description: 'Celebração do romance e união com caixas personalizadas, cartas perfumadas e relicários gravados.',
    category: 'emocional',
    day: 12,
    month: 6,
    year_fixed: true,
    recurrent: true,
    active: true,
    theme_color: '#9C3A3A',
    icon: 'Heart',
    scope: 'nacional',
    is_national: true,
    hashtags: ['diadosnamorados', 'amor', 'casal', 'mimadasim'],
    marketing_phrase: 'Presentes únicos para histórias de amor inesquecíveis.',
    priority: 95,
    createdAt: null,
    updatedAt: null
  },
  {
    id: 'nacional-dia-dos-pais',
    name: 'Dia dos Pais',
    description: 'Homenagem aos pais com presentes nobres, organizadores em cartonagem e detalhes em couro.',
    category: 'masculina',
    day: 10,
    month: 8,
    year_fixed: false,
    recurrent: true,
    active: true,
    theme_color: '#4A5568',
    icon: 'Briefcase',
    scope: 'nacional',
    is_national: true,
    hashtags: ['diadospais', 'pais', 'homenagem', 'pallyra'],
    marketing_phrase: 'Celebre o carinho e o exemplo do seu maior herói.',
    priority: 90,
    mobile_id: 'fathers_day',
    createdAt: null,
    updatedAt: null
  },
  {
    id: 'nacional-pascoa',
    name: 'Páscoa Imperial',
    description: 'Embalagens cartonadas para ovos de colher, laços nobres e mimos de chocolate afetivos.',
    category: 'sazonal',
    day: 20,
    month: 4,
    year_fixed: false,
    recurrent: true,
    active: true,
    theme_color: '#C5A880',
    icon: 'Sparkles',
    scope: 'nacional',
    is_national: true,
    hashtags: ['pascoa', 'pascoagourmet', 'chocolatesafetivos'],
    marketing_phrase: 'A doçura da Páscoa em embalagens que encantam à primeira vista.',
    priority: 85,
    mobile_id: 'pascoa',
    createdAt: null,
    updatedAt: null
  },
  {
    id: 'nacional-natal',
    name: 'Natal Afetivo',
    description: 'A época mais esperada do ano para presentear famílias, padrinhos e clientes com luxo e delicadeza.',
    category: 'sazonal',
    day: 25,
    month: 12,
    year_fixed: true,
    recurrent: true,
    active: true,
    theme_color: '#8C2E2E',
    icon: 'Gift',
    scope: 'nacional',
    is_national: true,
    hashtags: ['natal', 'presentesdenatal', 'fimdeano', 'papelariadeluxo'],
    marketing_phrase: 'Espalhe magia e gratidão com criações artesanais personalizadas.',
    priority: 100,
    createdAt: null,
    updatedAt: null
  },
  {
    id: 'nacional-dia-dos-avos',
    name: 'Dia dos Avós',
    description: 'Recordações fotográficas, relicários com fotos dos netos e caixas de memórias preciosas.',
    category: 'emocional',
    day: 26,
    month: 7,
    year_fixed: true,
    recurrent: true,
    active: true,
    theme_color: '#A27B5C',
    icon: 'Heart',
    scope: 'nacional',
    is_national: true,
    hashtags: ['diadosavos', 'vovo', 'memoriasafetivas'],
    marketing_phrase: 'Amor que atravessa gerações guardado em peças nobres.',
    priority: 80,
    createdAt: null,
    updatedAt: null
  },
  {
    id: 'nacional-dia-dos-professores',
    name: 'Dia dos Professores',
    description: 'Lembranças sofisticadas de gratidão e carinho para quem dedica a vida a ensinar.',
    category: 'escolar',
    day: 15,
    month: 10,
    year_fixed: true,
    recurrent: true,
    active: true,
    theme_color: '#5C3D2E',
    icon: 'Briefcase',
    scope: 'nacional',
    is_national: true,
    hashtags: ['diadosprofessores', 'gratidao', 'professores'],
    marketing_phrase: 'Reconhecimento sincero em lembranças que marcam o coração.',
    priority: 80,
    createdAt: null,
    updatedAt: null
  },

  // --- MUNDIAL ---
  {
    id: 'mundial-dia-das-mulheres',
    name: 'Dia Internacional da Mulher',
    description: 'Celebração mundial da força, sensibilidade e protagonismo feminino com mimos refinados.',
    category: 'feminina',
    day: 8,
    month: 3,
    year_fixed: true,
    recurrent: true,
    active: true,
    theme_color: '#D48197',
    icon: 'Sparkles',
    scope: 'mundial',
    is_national: false,
    hashtags: ['diadamulher', 'mulheres', 'empoderamento', 'delicadeza'],
    marketing_phrase: 'Uma homenagem delicada à essência de cada mulher.',
    priority: 95,
    createdAt: null,
    updatedAt: null
  },
  {
    id: 'mundial-dia-da-familia',
    name: 'Dia Internacional da Família',
    description: 'Homenagem aos laços de sangue e coração que formam a nossa história mais preciosa.',
    category: 'emocional',
    day: 15,
    month: 5,
    year_fixed: true,
    recurrent: true,
    active: true,
    theme_color: '#6A8E7F',
    icon: 'Heart',
    scope: 'mundial',
    is_national: false,
    hashtags: ['diadafamilia', 'familia', 'memorias', 'guennita'],
    marketing_phrase: 'O aconchego do lar eternizado em detalhes artesanais.',
    priority: 75,
    createdAt: null,
    updatedAt: null
  },
  {
    id: 'mundial-dia-da-amizade',
    name: 'Dia Internacional da Amizade',
    description: 'Presenteie conexões verdadeiras com semi-joias gravadas e caixas de doces momentos.',
    category: 'social',
    day: 30,
    month: 7,
    year_fixed: true,
    recurrent: true,
    active: true,
    theme_color: '#C38D9E',
    icon: 'Heart',
    scope: 'mundial',
    is_national: false,
    hashtags: ['amizade', 'amigos', 'mimadasim', 'afeto'],
    marketing_phrase: 'Amizades que valem ouro merecem lembranças à altura.',
    priority: 70,
    createdAt: null,
    updatedAt: null
  },
  {
    id: 'mundial-dia-da-gentileza',
    name: 'Dia Mundial da Gentileza',
    description: 'Pequenos gestos de amor que transformam o dia a dia de quem você ama.',
    category: 'emocional',
    day: 13,
    month: 11,
    year_fixed: true,
    recurrent: true,
    active: true,
    theme_color: '#8C6D37',
    icon: 'Sparkles',
    scope: 'mundial',
    is_national: false,
    hashtags: ['gentileza', 'amor', 'mimos', 'tuttymimo'],
    marketing_phrase: 'A delicadeza do afeto em cada gesto e embalagem.',
    priority: 65,
    createdAt: null,
    updatedAt: null
  },

  // --- REGIONAL ---
  {
    id: 'regional-festas-juninas',
    name: 'Festas Juninas & Celebrações',
    description: 'Caixas temáticas elegantes para lembranças festivas e confraternizações acolhedoras.',
    category: 'sazonal',
    day: 24,
    month: 6,
    year_fixed: true,
    recurrent: true,
    active: true,
    theme_color: '#D97706',
    icon: 'Sun',
    scope: 'regional',
    is_national: false,
    hashtags: ['festajunina', 'saojoao', 'arraiaafetivo'],
    marketing_phrase: 'A tradição e o calor das comemorações regionais com toque nobre.',
    priority: 75,
    createdAt: null,
    updatedAt: null
  },
  {
    id: 'regional-temporada-casamentos',
    name: 'Temporada Nobre de Casamentos',
    description: 'Convites com lacre de cera, caixas de padrinhos em cartonagem e papelaria de mesa.',
    category: 'casamento',
    day: 20,
    month: 9,
    year_fixed: true,
    recurrent: true,
    active: true,
    theme_color: '#B38F4D',
    icon: 'Crown',
    scope: 'regional',
    is_national: false,
    hashtags: ['casamento', 'convitesdeluxo', 'padrinhos', 'lapallyra'],
    marketing_phrase: 'A sofisticação do grande dia planejada com antecedência impecável.',
    priority: 85,
    createdAt: null,
    updatedAt: null
  },
  {
    id: 'regional-temporada-maternidade',
    name: 'Temporada de Maternidade & Batizados',
    description: 'Enxovais afetivos, porta-maternidade bordado e lembranças de batismo personalizadas.',
    category: 'maternidade',
    day: 15,
    month: 4,
    year_fixed: true,
    recurrent: true,
    active: true,
    theme_color: '#E0A96D',
    icon: 'Heart',
    scope: 'regional',
    is_national: false,
    hashtags: ['maternidade', 'batizado', 'enxoval', 'comamorguennita'],
    marketing_phrase: 'Acolha as primeiras memórias com ternura e tecidos nobres.',
    priority: 85,
    createdAt: null,
    updatedAt: null
  }
];
