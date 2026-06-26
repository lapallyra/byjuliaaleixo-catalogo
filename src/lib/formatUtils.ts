export const formatMoney = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0,00';
  }
  return value.toFixed(2).replace('.', ',');
};
