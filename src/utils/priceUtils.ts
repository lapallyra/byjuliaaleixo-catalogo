export const cleanOptionName = (name: string): string => {
  if (!name) return '';
  // Removes "+ R$ 8,00", "+R$8", "(+ R$ 8)", etc.
  return name.replace(/\s*\+?\s*\(?\s*R\$\s*\d+(?:[.,]\d+)?\s*\)?\s*/gi, '').trim();
};

export const extractPriceFromOption = (name: string): number => {
  if (!name) return 0;
  const match = name.match(/\s*\+?\s*\(?\s*R\$\s*(\d+(?:[.,]\d+)?)\s*\)?\s*/i);
  if (match && match[1]) {
    return parseFloat(match[1].replace(',', '.'));
  }
  return 0;
};
