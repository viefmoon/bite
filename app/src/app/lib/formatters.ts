/**
 * Formatea un número como moneda
 * @param amount - Cantidad a formatear
 * @param currency - Código de moneda (por defecto MXN)
 * @returns String formateado como moneda
 */
export function formatCurrency(amount: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea una fecha a un string legible
 * @param date - Fecha a formatear
 * @param options - Opciones de formato
 * @returns String formateado
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-MX', options).format(dateObj);
}

/**
 * Formatea un número de teléfono
 * @param phoneNumber - Número de teléfono
 * @returns String formateado
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remover todo excepto números
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Formato mexicano: +52 55 1234 5678
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('52')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
  }

  return phoneNumber;
}
