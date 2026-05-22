import { format } from 'date-fns';

export const safeFormat = (date: any, formatStr: string, options?: any) => {
  try {
    if (!date) return '---';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '---';
    return format(d, formatStr, options);
  } catch (error) {
    console.error('Date formatting error:', error, date);
    return '---';
  }
};

export const safeFormatISO = (dateStr: string, formatStr: string, options?: any) => {
  try {
    if (!dateStr) return '---';
    
    let d: Date;
    if (dateStr.includes('/')) {
        // Handle dd/mm/yyyy
        const [day, month, year] = dateStr.split('/');
        d = new Date(`${year}-${month}-${day}T12:00:00`);
    } else {
        // Append time if only date is provided to avoid timezone shifts
        d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
    }

    if (isNaN(d.getTime())) return '---';
    return format(d, formatStr, options);
  } catch (error) {
    console.error('ISO Date formatting error:', error, dateStr);
    return '---';
  }
};
