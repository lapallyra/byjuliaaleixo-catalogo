/**
 * Utility functions for automatic and consistent data masking
 */

export const formatCPF = (value: string): string => {
  const clean = value.replace(/\D/g, "");
  if (!clean) return "";
  let formatted = clean;
  if (clean.length > 3) formatted = `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length > 6) formatted = `${formatted.slice(0, 7)}.${formatted.slice(7)}`;
  if (clean.length > 9) formatted = `${formatted.slice(0, 11)}-${formatted.slice(11, 13)}`;
  return formatted.slice(0, 14);
};

export const formatCNPJ = (value: string): string => {
  const clean = value.replace(/\D/g, "");
  if (!clean) return "";
  let formatted = clean;
  if (clean.length > 2) formatted = `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length > 5) formatted = `${formatted.slice(0, 6)}.${formatted.slice(6)}`;
  if (clean.length > 8) formatted = `${formatted.slice(0, 10)}/${formatted.slice(10)}`;
  if (clean.length > 12) formatted = `${formatted.slice(0, 15)}-${formatted.slice(15, 17)}`;
  return formatted.slice(0, 18);
};

export const formatCPFOrCNPJ = (value: string): string => {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 11) {
    return formatCPF(clean);
  } else {
    return formatCNPJ(clean);
  }
};

export const formatPhone = (value: string): string => {
  const clean = value.replace(/\D/g, "");
  if (!clean) return "";
  
  if (clean.length <= 2) {
    return `(${clean}`;
  }
  if (clean.length <= 6) {
    const ddd = clean.slice(0, 2);
    const rest = clean.slice(2);
    if (rest.length > 1) {
      return `(${ddd}) ${rest.slice(0, 1)} ${rest.slice(1)}`;
    }
    return `(${ddd}) ${rest}`;
  }
  if (clean.length <= 10) {
    const ddd = clean.slice(0, 2);
    const main = clean.slice(2, 6);
    const suffix = clean.slice(6);
    return `(${ddd}) ${main}-${suffix}`;
  }
  const ddd = clean.slice(0, 2);
  const nine = clean.slice(2, 3);
  const part1 = clean.slice(3, 7);
  const part2 = clean.slice(7, 11);
  return `(${ddd}) ${nine} ${part1}-${part2}`;
};
