import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const safeFormat = (date: any, formatStr: string, options?: any) => {
  try {
    if (!date) return '---';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '---';
    return format(d, formatStr, { locale: ptBR, ...options });
  } catch (error) {
    console.error('Date formatting error:', error, date);
    return '---';
  }
};

export const safeFormatISO = (dateStr: any, formatStr: string, options?: any) => {
  try {
    if (!dateStr) return '---';
    
    let d: Date;
    if (dateStr instanceof Date) {
      d = dateStr;
    } else if (typeof dateStr === 'object' && typeof (dateStr as any).toDate === 'function') {
      d = (dateStr as any).toDate();
    } else {
      const str = String(dateStr);
      if (str.includes('/')) {
          // Handle dd/mm/yyyy
          const [day, month, year] = str.split('/');
          d = new Date(`${year}-${month}-${day}T12:00:00`);
      } else {
          // Append time if only date is provided to avoid timezone shifts
          d = new Date(str.includes('T') ? str : `${str}T12:00:00`);
      }
    }

    if (isNaN(d.getTime())) return '---';
    return format(d, formatStr, { locale: ptBR, ...options });
  } catch (error) {
    console.error('ISO Date formatting error:', error, dateStr);
    return '---';
  }
};
