import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(dateStr?: string | null, formatStr = 'yyyy-MM-dd') {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, formatStr, { locale: ko });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string | null) {
  return formatDate(dateStr, 'yyyy-MM-dd HH:mm:ss');
}
