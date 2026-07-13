import { addDays, subDays, startOfMonth, nextDay, Day } from 'date-fns';

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
