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

export const addBusinessDays = (startDate: Date | string = new Date(), daysToAdd: number = 10): string => {
  try {
    let current = new Date(startDate);
    if (isNaN(current.getTime())) current = new Date();
    let added = 0;
    while (added < daysToAdd) {
      current.setDate(current.getDate() + 1);
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        added++;
      }
    }
    return format(current, 'yyyy-MM-dd');
  } catch (err) {
    return format(new Date(), 'yyyy-MM-dd');
  }
};

