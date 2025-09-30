import { format, isPast, differenceInMonths, differenceInDays, startOfDay, differenceInYears, addMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CnhStatus {
  status: 'valid' | 'expiring_soon' | 'expired' | 'unknown';
  message: string;
  monthsDifference: number;
  daysDifference: number;
}

export interface OmnilinkDetailedStatus {
  status: 'em_dia' | 'prest_vencer' | 'vencido' | 'unknown';
  message: string;
  monthsDifference: number;
  daysDifference: number;
  expiryDate: Date | null;
}

/**
 * Formats a date value (Date object, string, or null) into a 'dd/MM/yyyy' string.
 * Returns '-' if the value is null/undefined or 'Data Inválida' if parsing fails.
 * @param dateValue The date value to format (Date object, string in 'yyyy-MM-dd' format, or null).
 * @returns The formatted date string or '-'.
 */
export const formatDate = (dateValue: Date | string | null): string => {
  if (!dateValue) return '-';
  try {
    const dateObj = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
    if (isNaN(dateObj.getTime())) {
      return 'Data Inválida';
    }
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch (e) {
    console.error("Error formatting date:", dateValue, e);
    return 'Erro de Formatação';
  }
};

/**
 * Formats a time value (Date object, string, or null) into an 'HH:mm' string.
 * Returns '-' if the value is null/undefined or 'Hora Inválida' if parsing fails.
 * @param timeValue The time value to format (Date object, string in 'HH:mm' or ISO format, or null).
 * @returns The formatted time string or '-'.
 */
export const formatTime = (timeValue: Date | string | null): string => {
  if (!timeValue) return '-';
  try {
    let dateObj: Date;
    if (typeof timeValue === 'string') {
      // If it's just a time string like "HH:mm", create a dummy date to parse it
      if (timeValue.match(/^\d{2}:\d{2}$/)) {
        dateObj = parseISO(`2000-01-01T${timeValue}`);
      } else {
        dateObj = parseISO(timeValue);
      }
    } else {
      dateObj = timeValue;
    }

    if (isNaN(dateObj.getTime())) {
      return 'Hora Inválida';
    }
    return format(dateObj, 'HH:mm', { locale: ptBR });
  } catch (e) {
    console.error("Error formatting time:", timeValue, e);
    return 'Erro de Formatação';
  }
};

/**
 * Calculates the CNH status based on the expiry date.
 * @param licenseExpiryDateString The CNH expiry date in 'yyyy-MM-dd' format.
 * @returns An object containing the status, a descriptive message, and differences in months/days.
 */
export const getCnhStatus = (licenseExpiryDateString: string | null): CnhStatus => {
  if (!licenseExpiryDateString) {
    return { status: 'unknown', message: 'Data de validade da CNH não informada.', monthsDifference: 0, daysDifference: 0 };
  }

  const [year, month, day] = licenseExpiryDateString.split('-').map(Number);
  const expiryDate = startOfDay(new Date(year, month - 1, day)); // Local date for expiry
  const today = startOfDay(new Date()); // Local date for today

  if (isNaN(expiryDate.getTime())) { // Robust check for invalid date
    return { status: 'unknown', message: 'Data de validade da CNH inválida.', monthsDifference: 0, daysDifference: 0 };
  }

  // Calculate difference: today - expiryDate
  const daysDiff = differenceInDays(today, expiryDate); // Positive if expiry is in the past, negative if expiry is in the future
  const monthsDiff = differenceInMonths(today, expiryDate);
  const yearsDiff = differenceInYears(today, expiryDate);

  let status: CnhStatus['status'];
  let message: string;

  if (daysDiff === 0) { // CNH vence hoje
    status = 'expiring_soon';
    message = 'CNH válida, mas vence hoje.';
  } else if (daysDiff < 0) { // CNH ainda válida (expiryDate is in the future relative to today)
    status = 'valid';
    const absDaysDiff = Math.abs(daysDiff);
    const absMonthsDiff = Math.abs(monthsDiff);
    const absYearsDiff = Math.abs(yearsDiff);

    if (absDaysDiff <= 90) { // Within 3 months (approx 90 days)
      status = 'expiring_soon';
    }

    message = 'CNH válida. Vence em ';
    if (absYearsDiff > 0) {
      message += `${absYearsDiff} ano${absYearsDiff > 1 ? 's' : ''}.`;
    } else if (absMonthsDiff > 0) {
      message += `${absMonthsDiff} mês${absMonthsDiff > 1 ? 'es' : ''}.`;
    } else {
      message += `${absDaysDiff} dia${absDaysDiff > 1 ? 's' : ''}.`;
    }
  } else { // CNH já vencida (daysDiff > 0) (expiryDate is in the past relative to today)
    status = 'expired';
    const absDaysDiff = Math.abs(daysDiff);
    const absMonthsDiff = Math.abs(monthsDiff);
    const absYearsDiff = Math.abs(yearsDiff);

    message = 'CNH vencida há ';
    if (absYearsDiff > 0) {
      message += `${absYearsDiff} ano${absYearsDiff > 1 ? 's' : ''}.`;
    } else if (absMonthsDiff > 0) {
      message += `${absMonthsDiff} mês${absMonthsDiff > 1 ? 'es' : ''}.`;
    } else {
      message += `${absDaysDiff} dia${absDaysDiff > 1 ? 's' : ''}.`;
    }
    message += ' - Gravíssimo';
  }

  return {
    status,
    message,
    daysDifference: daysDiff,
    monthsDifference: monthsDiff,
  };
};

/**
 * Calculates the Omnilink Score expiry date based on the registration date.
 * @param registrationDateString The Omnilink Score registration date in 'yyyy-MM-dd' format.
 * @returns The expiry date in 'yyyy-MM-dd' format, or null if date is invalid/missing.
 */
export const calculateOmnilinkScoreExpiry = (registrationDateString: string | null) => {
  if (!registrationDateString) return null;
  try {
    const parsedRegDate = parseISO(registrationDateString);
    if (isNaN(parsedRegDate.getTime())) return null;
    const expiryDate = addMonths(parsedRegDate, 6);
    return format(expiryDate, 'yyyy-MM-dd');
  } catch {
    return null;
  }
};

/**
 * Calculates the Omnilink Score status for database storage ('em_dia' or 'inapto').
 * @param registrationDateString The Omnilink Score registration date in 'yyyy-MM-dd' format.
 * @returns 'em_dia' if within 6 months, 'inapto' if expired, or null if date is invalid/missing.
 */
export const calculateOmnilinkScoreStatus = (registrationDateString: string | null) => {
  if (!registrationDateString) return null;
  try {
    const parsedRegDate = parseISO(registrationDateString);
    if (isNaN(parsedRegDate.getTime())) return null;
    const expiryDate = addMonths(parsedRegDate, 6);
    return isAfter(expiryDate, new Date()) ? 'em_dia' : 'inapto';
  } catch {
    return null;
  }
};

/**
 * Calculates the detailed Omnilink Score status for UI display.
 * @param registrationDateString The Omnilink Score registration date in 'yyyy-MM-dd' format.
 * @returns An object containing the detailed status, a descriptive message, and differences in months/days.
 */
export const getDetailedOmnilinkStatus = (registrationDateString: string | null): OmnilinkDetailedStatus => {
  if (!registrationDateString) {
    return { status: 'unknown', message: 'Data de cadastro Omnilink não informada.', monthsDifference: 0, daysDifference: 0, expiryDate: null };
  }

  const parsedRegDate = parseISO(registrationDateString);
  if (isNaN(parsedRegDate.getTime())) {
    return { status: 'unknown', message: 'Data de cadastro Omnilink inválida.', monthsDifference: 0, daysDifference: 0, expiryDate: null };
  }

  const expiryDate = addMonths(parsedRegDate, 6);
  const today = startOfDay(new Date());

  const daysDiff = differenceInDays(expiryDate, today); // Positive if expiry is in the future, negative if in the past
  const monthsDiff = differenceInMonths(expiryDate, today);

  let status: OmnilinkDetailedStatus['status'];
  let message: string;

  if (daysDiff < 0) { // Expiry date is in the past
    status = 'vencido';
    const absDaysDiff = Math.abs(daysDiff);
    const absMonthsDiff = Math.abs(monthsDiff);
    message = 'Cadastro Omnilink vencido há ';
    if (absMonthsDiff > 0) {
      message += `${absMonthsDiff} mês${absMonthsDiff > 1 ? 'es' : ''}.`;
    } else {
      message += `${absDaysDiff} dia${absDaysDiff > 1 ? 's' : ''}.`;
    }
  } else if (daysDiff >= 0 && daysDiff <= 90) { // Expiry is today or within the next 3 months (approx 90 days)
    status = 'prest_vencer';
    message = 'Cadastro Omnilink em dia, prestes a vencer em ';
    if (monthsDiff > 0) {
      message += `${monthsDiff} mês${monthsDiff > 1 ? 'es' : ''}.`;
    } else if (daysDiff >= 0) {
      message += `${daysDiff} dia${daysDiff > 1 ? 's' : ''}.`;
    }
  } else { // Expiry is more than 3 months away
    status = 'em_dia';
    message = 'Cadastro Omnilink em dia. Vence em ';
    if (monthsDiff > 0) {
      message += `${monthsDiff} mês${monthsDiff > 1 ? 'es' : ''}.`;
    } else {
      message += `${daysDiff} dia${daysDiff > 1 ? 's' : ''}.`;
    }
  }

  return {
    status,
    message,
    daysDifference: daysDiff,
    monthsDifference: monthsDiff,
    expiryDate: expiryDate,
  };
};