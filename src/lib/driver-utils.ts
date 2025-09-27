import { format, isPast, differenceInMonths, differenceInDays, startOfDay, differenceInYears, addMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CnhStatus {
  status: 'valid' | 'expiring_soon' | 'expired' | 'unknown';
  message: string;
  monthsDifference: number;
  daysDifference: number;
}

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
 * Calculates the Omnilink Score status based on the registration date.
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